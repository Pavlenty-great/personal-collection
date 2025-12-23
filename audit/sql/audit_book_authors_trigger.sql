CREATE OR REPLACE FUNCTION audit_book_authors_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Для book_authors определяем пользователя через связь user_books
    IF TG_OP = 'INSERT' THEN
        SELECT user_id INTO v_user_id 
        FROM user_books 
        WHERE book_id = NEW.book_id 
        LIMIT 1;
        
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('LINK_AUTHOR', COALESCE(v_user_id, 0), 'book_authors');
    ELSIF TG_OP = 'DELETE' THEN
        SELECT user_id INTO v_user_id 
        FROM user_books 
        WHERE book_id = OLD.book_id 
        LIMIT 1;
        
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('UNLINK_AUTHOR', COALESCE(v_user_id, 0), 'book_authors');
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_book_authors ON book_authors;
CREATE TRIGGER audit_book_authors
AFTER INSERT OR DELETE ON book_authors
FOR EACH ROW EXECUTE FUNCTION audit_book_authors_trigger();