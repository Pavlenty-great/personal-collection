CREATE OR REPLACE FUNCTION audit_users_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('INSERT', NEW.id, 'users');
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('UPDATE', NEW.id, 'users');
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('DELETE', OLD.id, 'users');
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_users ON users;
CREATE TRIGGER audit_users
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_users_trigger();