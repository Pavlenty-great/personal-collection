CREATE OR REPLACE FUNCTION audit_authors_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INTEGER := 0; -- По умолчанию системная операция
BEGIN
    -- Для авторов сложно определить пользователя, используем 0
    INSERT INTO audit_log (operation_type, user_id, table_name)
    VALUES (TG_OP, v_user_id, 'authors');
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_authors ON authors;
CREATE TRIGGER audit_authors
AFTER INSERT OR UPDATE OR DELETE ON authors
FOR EACH ROW EXECUTE FUNCTION audit_authors_trigger();