CREATE OR REPLACE FUNCTION update_user_book(
    p_user_id INTEGER,
    p_book_id INTEGER,
    p_book_name VARCHAR(80) DEFAULT NULL,
    p_book_year VARCHAR(4) DEFAULT NULL,
    p_place_name VARCHAR(80) DEFAULT NULL,
    p_author_last_name VARCHAR(80) DEFAULT NULL,
    p_author_first_name VARCHAR(80) DEFAULT NULL,
    p_author_middle_name VARCHAR(80) DEFAULT NULL
) 
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_place_id INTEGER;
    v_author_id INTEGER;
    v_current_author_id INTEGER;
    v_current_place_id INTEGER;
    v_updated_count INTEGER := 0;
    v_book_exists BOOLEAN;
BEGIN
    -- Устанавливаем текущего пользователя для аудита
    PERFORM set_current_user(p_user_id);
    
    -- 1. Проверяем, что книга принадлежит пользователю
    SELECT EXISTS (
        SELECT 1 
        FROM user_books 
        WHERE user_id = p_user_id 
          AND book_id = p_book_id
    ) INTO v_has_access;
    
    IF NOT v_has_access THEN
        RAISE NOTICE 'Книга ID: % не найдена в коллекции пользователя ID: %', 
                     p_book_id, p_user_id;
        RETURN FALSE;
    END IF;
    
    -- 2. Проверяем существование книги
    SELECT EXISTS (
        SELECT 1 
        FROM books 
        WHERE id = p_book_id
    ) INTO v_book_exists;
    
    IF NOT v_book_exists THEN
        RAISE NOTICE 'Книга ID: % не существует', p_book_id;
        RETURN FALSE;
    END IF;
    
    -- 3. ОБРАБОТКА МЕСТА ИЗДАНИЯ (если указано новое место)
    IF p_place_name IS NOT NULL AND p_place_name != '' THEN
        -- Ищем или создаем новое место издания
        SELECT id INTO v_place_id 
        FROM place_publishing 
        WHERE place_name = p_place_name;
        
        IF v_place_id IS NULL THEN
            INSERT INTO place_publishing (place_name)
            VALUES (p_place_name)
            RETURNING id INTO v_place_id;
            
            RAISE NOTICE 'Создано новое место издания: "%" (ID: %)', p_place_name, v_place_id;
        END IF;
    ELSE
        -- Получаем текущее место издания книги
        SELECT place_publishing_id INTO v_current_place_id
        FROM books WHERE id = p_book_id;
        v_place_id := v_current_place_id;
    END IF;
    
    -- 4. ОБРАБОТКА АВТОРА (если указаны новые данные автора)
    IF p_author_last_name IS NOT NULL AND p_author_last_name != '' 
       AND p_author_first_name IS NOT NULL AND p_author_first_name != '' THEN
        
        -- Ищем или создаем нового автора
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
            
            RAISE NOTICE 'Создан новый автор: % % % (ID: %)', 
                         p_author_last_name, p_author_first_name, 
                         COALESCE(p_author_middle_name, ''), v_author_id;
        END IF;
    ELSE
        -- Получаем текущего автора книги
        SELECT a.id INTO v_current_author_id
        FROM authors a
        JOIN book_authors ba ON a.id = ba.author_id
        WHERE ba.book_id = p_book_id
        LIMIT 1;
        v_author_id := v_current_author_id;
    END IF;
    
    -- 5. ОБНОВЛЕНИЕ КНИГИ
    UPDATE books 
    SET 
        name = COALESCE(NULLIF(p_book_name, ''), name),
        year = COALESCE(NULLIF(p_book_year, ''), year),
        place_publishing_id = v_place_id
    WHERE id = p_book_id
    RETURNING id INTO p_book_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count = 1 THEN
        -- 6. ОБНОВЛЕНИЕ СВЯЗИ КНИГА-АВТОР (если изменился автор)
        IF p_author_last_name IS NOT NULL AND p_author_last_name != '' 
           AND p_author_first_name IS NOT NULL AND p_author_first_name != '' THEN
            
            -- Удаляем старые связи книга-автор для этой книги
            DELETE FROM book_authors 
            WHERE book_id = p_book_id;
            
            -- Создаем новую связь с автором
            INSERT INTO book_authors (book_id, author_id)
            VALUES (p_book_id, v_author_id)
            ON CONFLICT (book_id, author_id) DO NOTHING;
        END IF;
        
        RAISE NOTICE 'Обновлена книга ID: % для пользователя ID: %', p_book_id, p_user_id;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'Не удалось обновить книгу ID: %', p_book_id;
        RETURN FALSE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ошибка при обновлении книги: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;