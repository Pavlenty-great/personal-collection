CREATE OR REPLACE FUNCTION log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INTEGER;
    v_operation_type VARCHAR(50);
BEGIN
    -- Определяем тип операции
    v_operation_type := TG_OP; -- INSERT, UPDATE или DELETE
    
    -- Определяем пользователя из контекста
    -- Используем временную таблицу для передачи user_id
    IF EXISTS (SELECT 1 FROM pg_temp.temp_current_user LIMIT 1) THEN
        SELECT user_id INTO v_user_id FROM pg_temp.temp_current_user LIMIT 1;
    ELSE
        -- Если пользователь не определен, используем системного пользователя (0)
        -- Убедитесь, что у вас есть пользователь с id=0 в таблице users
        v_user_id := 0;
    END IF;
    
    -- Вставляем запись в лог (только обязательные поля)
    INSERT INTO audit_log (
        operation_type,
        user_id
    ) VALUES (
        v_operation_type,
        v_user_id
    );
    
    -- Для INSERT и UPDATE возвращаем NEW, для DELETE возвращаем OLD
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- В случае ошибки логирования, не прерываем основную операцию
        RAISE WARNING 'Ошибка при логировании: %', SQLERRM;
        IF TG_OP = 'DELETE' THEN
            RETURN OLD;
        ELSE
            RETURN NEW;
        END IF;
END;
$$ LANGUAGE plpgsql;