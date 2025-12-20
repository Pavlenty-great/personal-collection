CREATE OR REPLACE FUNCTION add_book(
    p_user_id INTEGER,
    p_book_name VARCHAR(80),
    p_book_year VARCHAR(4),
    p_place_name VARCHAR(80),
    p_author_last_name VARCHAR(80),
    p_author_first_name VARCHAR(80),
    p_author_middle_name VARCHAR(80) DEFAULT ''
) 
RETURNS INTEGER AS $$
DECLARE
    v_place_id INTEGER;
    v_book_id INTEGER;
    v_author_id INTEGER;
    v_existing_book_id INTEGER;
BEGIN
    -- 0. ПРОВЕРЯЕМ: Может книга уже есть у пользователя?
    SELECT b.id INTO v_existing_book_id
    FROM books b
    JOIN user_books ub ON b.id = ub.book_id
    WHERE ub.user_id = p_user_id
      AND b.name = p_book_name
      AND b.year = p_book_year
      AND b.place_publishing_id = (
          SELECT id FROM place_publishing WHERE place_name = p_place_name
      );
    
    -- Если книга уже есть у пользователя, возвращаем её ID
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
    
    -- 2. Проверяем: может книга уже существует в таблице books (но у другого пользователя)?
    SELECT id INTO v_book_id
    FROM books
    WHERE name = p_book_name
      AND year = p_book_year
      AND place_publishing_id = v_place_id;
    
    -- Если книга уже существует в БД, используем её
    IF v_book_id IS NOT NULL THEN
        RAISE NOTICE 'Книга найдена в БД, ID: %', v_book_id;
    ELSE
        -- Создаём новую книгу
        INSERT INTO books (name, year, place_publishing_id)
        VALUES (p_book_name, p_book_year, v_place_id)
        RETURNING id INTO v_book_id;
    END IF;
    
    -- 3. Автор
    SELECT id INTO v_author_id 
    FROM authors 
    WHERE last_name = p_author_last_name 
      AND first_name = p_author_first_name 
      AND middle_name = COALESCE(NULLIF(p_author_middle_name, ''), '');
    
    IF v_author_id IS NULL THEN
        INSERT INTO authors (last_name, first_name, middle_name)
        VALUES (p_author_last_name, p_author_first_name, 
                COALESCE(NULLIF(p_author_middle_name, ''), ''))
        RETURNING id INTO v_author_id;
    END IF;
    
    -- 4. Связь пользователь-книга (ИГНОРИРУЕМ если уже есть)
    INSERT INTO user_books (user_id, book_id)
    VALUES (p_user_id, v_book_id)
    ON CONFLICT (user_id, book_id) DO NOTHING;
    
    -- 5. Связь книга-автор (ИГНОРИРУЕМ если уже есть)
    INSERT INTO book_authors (book_id, author_id)
    VALUES (v_book_id, v_author_id)
    ON CONFLICT (book_id, author_id) DO NOTHING;
    
    RETURN v_book_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ошибка при добавлении книги: %', SQLERRM;
        RETURN -1;
END;
$$ LANGUAGE plpgsql;