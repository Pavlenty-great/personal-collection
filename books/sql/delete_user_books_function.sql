CREATE OR REPLACE FUNCTION delete_user_books(
    p_user_id BIGINT,
    p_book_ids BIGINT[]
) 
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER := 0;
    v_book_id BIGINT;
BEGIN
    -- Устанавливаем текущего пользователя для аудита
    PERFORM set_current_user(p_user_id);
    
    -- Проверяем входные данные
    IF p_book_ids IS NULL OR array_length(p_book_ids, 1) = 0 THEN
        RAISE NOTICE 'Массив ID книг пуст';
        RETURN 0;
    END IF;
    
    FOREACH v_book_id IN ARRAY p_book_ids
    LOOP
        -- Удаляем связь пользователь-книга (только для текущего пользователя!)
        DELETE FROM user_books 
        WHERE user_id = p_user_id AND book_id = v_book_id;
        
        IF FOUND THEN
            v_deleted_count := v_deleted_count + 1;
            RAISE NOTICE 'Удалена книга ID: % для пользователя %', v_book_id, p_user_id;
        ELSE
            RAISE NOTICE 'Книга ID: % не найдена у пользователя %', v_book_id, p_user_id;
        END IF;
    END LOOP;
    
    RETURN v_deleted_count;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ошибка при удалении книг: %', SQLERRM;
        RETURN -1;
END;
$$ LANGUAGE plpgsql;