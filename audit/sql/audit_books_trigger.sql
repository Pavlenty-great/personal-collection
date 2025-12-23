CREATE OR REPLACE FUNCTION audit_books_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Для книг определяем пользователя через связь user_books
    IF TG_OP = 'INSERT' THEN
        -- Для INSERT: ищем пользователя, который добавил книгу
        -- (обратите внимание: при INSERT в books связь user_books еще не создана)
        -- Поэтому используем специальный флаг или логируем без user_id
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('INSERT', 0, 'books'); -- user_id = 0 для системных операций
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- Для UPDATE: ищем пользователя, которому принадлежит книга
        SELECT user_id INTO v_user_id 
        FROM user_books 
        WHERE book_id = NEW.id 
        LIMIT 1;
        
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('UPDATE', COALESCE(v_user_id, 0), 'books');
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- Для DELETE: ищем пользователя, которому принадлежала книга
        SELECT user_id INTO v_user_id 
        FROM user_books 
        WHERE book_id = OLD.id 
        LIMIT 1;
        
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('DELETE', COALESCE(v_user_id, 0), 'books');
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_books ON books;
CREATE TRIGGER audit_books
AFTER INSERT OR UPDATE OR DELETE ON books
FOR EACH ROW EXECUTE FUNCTION audit_books_trigger();