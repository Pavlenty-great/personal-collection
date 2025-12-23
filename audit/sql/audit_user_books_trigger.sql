CREATE OR REPLACE FUNCTION audit_user_books_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('ADD_BOOK', NEW.user_id, 'user_books');
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('REMOVE_BOOK', OLD.user_id, 'user_books');
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_user_books ON user_books;
CREATE TRIGGER audit_user_books
AFTER INSERT OR DELETE ON user_books
FOR EACH ROW EXECUTE FUNCTION audit_user_books_trigger();