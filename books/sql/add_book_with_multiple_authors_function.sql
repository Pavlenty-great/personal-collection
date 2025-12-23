CREATE OR REPLACE FUNCTION add_book_with_multiple_authors(
    p_user_id INTEGER,
    p_book_name VARCHAR(80),
    p_book_year VARCHAR(4),
    p_place_name VARCHAR(80),
    p_authors_json TEXT  -- JSON массив авторов: [{"last_name": "Иванов", "first_name": "Иван", "middle_name": "Иванович"}, ...]
) 
RETURNS INTEGER AS $$
DECLARE
    v_place_id INTEGER;
    v_book_id INTEGER;
    v_author_id INTEGER;
    v_existing_book_id INTEGER;
    v_author_record RECORD;
    v_authors JSON;
    v_author_count INTEGER := 0;
BEGIN
    -- Парсим JSON с авторами
    BEGIN
        v_authors := p_authors_json::JSON;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Некорректный JSON формат авторов';
    END;
    
    -- Проверяем, что есть хотя бы один автор
    IF json_array_length(v_authors) = 0 THEN
        RAISE EXCEPTION 'Необходимо указать хотя бы одного автора';
    END IF;
    
    -- 0. Проверяем: может книга уже есть у пользователя?
    SELECT b.id INTO v_existing_book_id
    FROM books b
    JOIN user_books ub ON b.id = ub.book_id
    WHERE ub.user_id = p_user_id
      AND b.name = p_book_name
      AND b.year = p_book_year
      AND b.place_publishing_id = (
          SELECT id FROM place_publishing WHERE place_name = p_place_name
      );
    
    IF v_existing_book_id IS NOT NULL THEN
        RAISE NOTICE 'Книга уже есть у пользователя ID: %', v_existing_book_id;
        RETURN v_existing_book_id;
    END IF;
    
    -- 1. Место издания
    SELECT id INTO v_place_id 
    FROM place_publishing 
    WHERE place_name = p_place_name;
    
    IF v_place_id IS NULL THEN
        INSERT INTO place_publishing (place_name)
        VALUES (p_place_name)
        RETURNING id INTO v_place_id;
    END IF;
    
    -- 2. Проверяем: может книга уже существует в таблице books?
    SELECT id INTO v_book_id
    FROM books
    WHERE name = p_book_name
      AND year = p_book_year
      AND place_publishing_id = v_place_id;
    
    IF v_book_id IS NOT NULL THEN
        RAISE NOTICE 'Книга найдена в БД, ID: %', v_book_id;
    ELSE
        INSERT INTO books (name, year, place_publishing_id)
        VALUES (p_book_name, p_book_year, v_place_id)
        RETURNING id INTO v_book_id;
    END IF;
    
    -- 3. Обрабатываем всех авторов
    FOR v_author_record IN 
        SELECT * FROM json_to_recordset(v_authors) AS x(
            last_name VARCHAR(80), 
            first_name VARCHAR(80), 
            middle_name VARCHAR(80)
        )
    LOOP
        -- Проверяем обязательные поля
        IF v_author_record.last_name IS NULL OR v_author_record.last_name = '' OR
           v_author_record.first_name IS NULL OR v_author_record.first_name = '' THEN
            CONTINUE; -- Пропускаем авторов без фамилии или имени
        END IF;
        
        -- Находим или создаем автора
        SELECT id INTO v_author_id 
        FROM authors 
        WHERE last_name = v_author_record.last_name 
          AND first_name = v_author_record.first_name 
          AND middle_name = COALESCE(NULLIF(v_author_record.middle_name, ''), '');
        
        IF v_author_id IS NULL THEN
            INSERT INTO authors (last_name, first_name, middle_name)
            VALUES (
                v_author_record.last_name, 
                v_author_record.first_name, 
                COALESCE(NULLIF(v_author_record.middle_name, ''), '')
            )
            RETURNING id INTO v_author_id;
        END IF;
        
        -- Связь книга-автор
        INSERT INTO book_authors (book_id, author_id)
        VALUES (v_book_id, v_author_id)
        ON CONFLICT (book_id, author_id) DO NOTHING;
        
        v_author_count := v_author_count + 1;
    END LOOP;
    
    -- 4. Связь пользователь-книга
    INSERT INTO user_books (user_id, book_id)
    VALUES (p_user_id, v_book_id)
    ON CONFLICT (user_id, book_id) DO NOTHING;
    
    -- Логируем операцию
    INSERT INTO audit_log (operation_type, user_id, table_name)
    VALUES ('ADD_BOOK_WITH_AUTHORS', p_user_id, 'books');
    
    RAISE NOTICE 'Добавлена книга ID: % с % авторами для пользователя ID: %', 
                 v_book_id, v_author_count, p_user_id;
    
    RETURN v_book_id;
    
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('ADD_BOOK_ERROR', p_user_id, 'books');
        RAISE EXCEPTION 'Ошибка при добавлении книги: %', SQLERRM;
        RETURN -1;
END;
$$ LANGUAGE plpgsql;