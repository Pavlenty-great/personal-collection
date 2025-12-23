CREATE OR REPLACE FUNCTION audit_place_publishing_trigger()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_log (operation_type, user_id, table_name)
    VALUES (TG_OP, 0, 'place_publishing'); -- user_id = 0 для системных операций
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_place_publishing ON place_publishing;
CREATE TRIGGER audit_place_publishing
AFTER INSERT OR UPDATE OR DELETE ON place_publishing
FOR EACH ROW EXECUTE FUNCTION audit_place_publishing_trigger();