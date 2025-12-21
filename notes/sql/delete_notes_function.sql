CREATE OR REPLACE FUNCTION delete_user_notes(
    p_user_id INTEGER,
    p_note_ids INTEGER[]
) 
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_note_id INTEGER;
    v_has_access BOOLEAN;
BEGIN
    -- Проверяем входные данные
    IF p_note_ids IS NULL OR array_length(p_note_ids, 1) = 0 THEN
        RAISE NOTICE 'Массив ID заметок пуст';
        RETURN 0;
    END IF;
    
    FOREACH v_note_id IN ARRAY p_note_ids
    LOOP
        -- Проверяем доступ к заметке
        SELECT EXISTS (
            SELECT 1 
            FROM notes n
            JOIN user_books ub ON n.book_id = ub.book_id AND n.user_id = ub.user_id
            WHERE n.id = v_note_id 
              AND n.user_id = p_user_id
              AND ub.user_id = p_user_id
        ) INTO v_has_access;
        
        IF v_has_access THEN
            -- Удаляем заметку
            DELETE FROM notes 
            WHERE id = v_note_id 
              AND user_id = p_user_id;
            
            IF FOUND THEN
                v_deleted_count := v_deleted_count + 1;
                RAISE NOTICE 'Удалена заметка ID: % для пользователя %', v_note_id, p_user_id;
            END IF;
        ELSE
            RAISE NOTICE 'Заметка ID: % не найдена у пользователя %', v_note_id, p_user_id;
        END IF;
    END LOOP;
    
    RETURN v_deleted_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ошибка при удалении заметок: %', SQLERRM;
        RETURN -1;
END;
$$ LANGUAGE plpgsql;