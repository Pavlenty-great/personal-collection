CREATE OR REPLACE FUNCTION audit_note_types_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (operation_type, user_id, table_name)
    VALUES (TG_OP, 0, 'note_types'); -- user_id = 0 для системных операций
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_note_types ON note_types;
CREATE TRIGGER audit_note_types
AFTER INSERT OR UPDATE OR DELETE ON note_types
FOR EACH ROW EXECUTE FUNCTION audit_note_types_trigger();