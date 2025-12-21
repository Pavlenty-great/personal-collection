CREATE OR REPLACE FUNCTION add_note(
    p_user_id INTEGER,
    p_book_id INTEGER,
    p_note_text TEXT,
    p_note_type_id INTEGER DEFAULT 1
) 
RETURNS INTEGER AS $$
DECLARE
    v_note_id INTEGER;
    v_has_access BOOLEAN;
BEGIN
    -- 1. Проверяем, что книга принадлежит пользователю
    SELECT EXISTS (
        SELECT 1 FROM user_books 
        WHERE user_id = p_user_id AND book_id = p_book_id
    ) INTO v_has_access;
    
    IF NOT v_has_access THEN
        RAISE EXCEPTION 'Книга не найдена в коллекции пользователя';
    END IF;
    
    -- 2. Проверяем существование типа заметки
    IF NOT EXISTS (SELECT 1 FROM note_types WHERE id = p_note_type_id) THEN
        -- Если тип не существует, создаём "Общая заметка" (id=1)
        INSERT INTO note_types (type) 
        VALUES ('Общая заметка') 
        ON CONFLICT DO NOTHING
        RETURNING id INTO p_note_type_id;
        
        IF p_note_type_id IS NULL THEN
            SELECT id INTO p_note_type_id FROM note_types WHERE type = 'Общая заметка' LIMIT 1;
        END IF;
    END IF;
    
    -- 3. Создаём заметку
    INSERT INTO notes (note, type_id, user_id, book_id, date_created)
    VALUES (
        p_note_text,
        p_note_type_id,
        p_user_id,
        p_book_id,
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_note_id;
    
    RAISE NOTICE 'Добавлена заметка ID: % для книги ID: % пользователя ID: %', 
                 v_note_id, p_book_id, p_user_id;
    
    RETURN v_note_id;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ошибка при добавлении заметки: %', SQLERRM;
        RETURN -1;
END;
$$ LANGUAGE plpgsql;