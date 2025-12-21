CREATE OR REPLACE FUNCTION update_user_note(
    p_user_id INTEGER,
    p_note_id INTEGER,
    p_note_text TEXT,
    p_note_type_id INTEGER DEFAULT NULL
) 
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
    v_updated_count INTEGER := 0;
    v_current_type_id INTEGER;
BEGIN
    -- Устанавливаем текущего пользователя для аудита
    PERFORM set_current_user(p_user_id);
    
    -- 1. Проверяем, что заметка принадлежит пользователю
    -- (через связь с книгой пользователя)
    SELECT EXISTS (
        SELECT 1 
        FROM notes n
        JOIN user_books ub ON n.book_id = ub.book_id AND n.user_id = ub.user_id
        WHERE n.id = p_note_id 
          AND n.user_id = p_user_id
          AND ub.user_id = p_user_id
    ) INTO v_has_access;
    
    IF NOT v_has_access THEN
        RAISE NOTICE 'Заметка ID: % не найдена или не принадлежит пользователю ID: %', 
                     p_note_id, p_user_id;
        RETURN FALSE;
    END IF;
    
    -- 2. Если передан тип заметки, проверяем его существование
    IF p_note_type_id IS NOT NULL THEN
        -- Проверяем существование типа заметки
        IF NOT EXISTS (SELECT 1 FROM note_types WHERE id = p_note_type_id) THEN
            RAISE NOTICE 'Тип заметки ID: % не существует', p_note_type_id;
            RETURN FALSE;
        END IF;
        
        -- Получаем текущий тип заметки для логирования
        SELECT type_id INTO v_current_type_id 
        FROM notes 
        WHERE id = p_note_id;
        
        -- Обновляем заметку с новым типом
        UPDATE notes 
        SET 
            note = p_note_text,
            type_id = p_note_type_id,
            date_created = CURRENT_TIMESTAMP  -- Обновляем дату изменения
        WHERE id = p_note_id 
          AND user_id = p_user_id;
    ELSE
        -- Обновляем только текст заметки (тип остается прежним)
        UPDATE notes 
        SET 
            note = p_note_text,
            date_created = CURRENT_TIMESTAMP  -- Обновляем дату изменения
        WHERE id = p_note_id 
          AND user_id = p_user_id;
    END IF;
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    
    IF v_updated_count = 1 THEN
        RAISE NOTICE 'Обновлена заметка ID: % пользователя ID: %', p_note_id, p_user_id;
        RETURN TRUE;
    ELSE
        RAISE NOTICE 'Не удалось обновить заметку ID: %', p_note_id;
        RETURN FALSE;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ошибка при обновлении заметки: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;