CREATE OR REPLACE FUNCTION audit_notes_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('ADD_NOTE', NEW.user_id, 'notes');
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('UPDATE_NOTE', NEW.user_id, 'notes');
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (operation_type, user_id, table_name)
        VALUES ('DELETE_NOTE', OLD.user_id, 'notes');
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_notes ON notes;
CREATE TRIGGER audit_notes
AFTER INSERT OR UPDATE OR DELETE ON notes
FOR EACH ROW EXECUTE FUNCTION audit_notes_trigger();