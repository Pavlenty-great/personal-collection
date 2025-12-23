CREATE OR REPLACE FUNCTION update_book_with_authors(
    p_user_id INTEGER,
    p_book_id INTEGER,
    p_book_name VARCHAR(80) DEFAULT NULL,
    p_book_year VARCHAR(4) DEFAULT NULL,
    p_place_name VARCHAR(80) DEFAULT NULL,
    p_authors_json TEXT DEFAULT NULL  -- JSON массив авторов
) 
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_place_id INTEGER;
    v_current_place_id INTEGER;
    v_updated_count INTEGER := 0;
    v_book_exists BOOLEAN;
    v_author_record RECORD;
    v_author_id INTEGER;
    v_authors JSON;
    v_author_count INTEGER := 0;
BEGIN
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
    
    -- 2. ОБРАБОТКА МЕСТА ИЗДАНИЯ
    IF p_place_name IS NOT NULL AND p_place_name != '' THEN
        SELECT id INTO v_place_id 
        FROM place_publishing 
        WHERE place_name = p_place_name;
        
        IF v_place_id IS NULL THEN
            INSERT INTO place_publishing (place_name)
            VALUES (p_place_name)
            RETURNING id INTO v_place_id;
        END IF;
    ELSE
        SELECT place_publishing_id INTO v_current_place_id
        FROM books WHERE id = p_book_id;
        v_place_id := v_current_place_id;
    END IF;
    
    -- 3. ОБНОВЛЕНИЕ КНИГИ
    UPDATE books 
    SET 
        name = COALESCE(NULLIF(p_book_name, ''), name),
        year = COALESCE(NULLIF(p_book_year, ''), year),
        place_publishing_id = v_place_id
    WHERE id = p_book_id;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    -- 4. ОБРАБОТКА АВТОРОВ (если передан JSON)
    IF p_authors_json IS NOT NULL AND p_authors_json != '' THEN
        BEGIN
            v_authors := p_authors_json::JSON;
            
            -- Удаляем старых авторов книги
            DELETE FROM book_authors WHERE book_id = p_book_id;
            
            -- Добавляем новых авторов
            FOR v_author_record IN 
                SELECT * FROM json_to_recordset(v_authors) AS x(
                    last_name VARCHAR(80), 
                    first_name VARCHAR(80), 
                    middle_name VARCHAR(80)
                )
            LOOP
                -- Пропускаем пустых авторов
                IF v_author_record.last_name IS NULL OR v_author_record.last_name = '' OR
                   v_author_record.first_name IS NULL OR v_author_record.first_name = '' THEN
                    CONTINUE;
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
                VALUES (p_book_id, v_author_id)
                ON CONFLICT (book_id, author_id) DO NOTHING;
                
                v_author_count := v_author_count + 1;
            END LOOP;
            
            RAISE NOTICE 'Обновлено % авторов для книги ID: %', v_author_count, p_book_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Ошибка при обработке авторов: %', SQLERRM;
        END;
    END IF;
    
    IF v_updated_count = 1 OR v_author_count > 0 THEN
        RAISE NOTICE 'Книга ID: % успешно обновлена', p_book_id;
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