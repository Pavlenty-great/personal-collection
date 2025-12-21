CREATE OR REPLACE FUNCTION set_current_user(p_user_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Создаем временную таблицу для хранения ID текущего пользователя
    CREATE TEMP TABLE IF NOT EXISTS temp_current_user (
        user_id INTEGER
    ) ON COMMIT DELETE ROW;
    
    -- Очищаем таблицу и вставляем нового пользователя
    DELETE FROM temp_current_user;
    INSERT INTO temp_current_user (user_id) VALUES (p_user_id);
END;
$$ LANGUAGE plpgsql;