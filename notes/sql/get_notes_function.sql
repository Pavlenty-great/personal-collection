CREATE OR REPLACE FUNCTION get_user_notes_for_book(
    p_user_id INTEGER,
    p_book_id INTEGER
) 
RETURNS TABLE(
    note_id BIGINT,
    note_text TEXT,
    note_type TEXT,
    date_created TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    -- Проверяем, что книга принадлежит пользователю
    IF NOT EXISTS (
        SELECT 1 FROM user_books 
        WHERE user_id = p_user_id AND book_id = p_book_id
    ) THEN
        RAISE EXCEPTION 'Книга не найдена в коллекции пользователя';
    END IF;
    
    RETURN QUERY
    SELECT 
        n.id AS note_id,
        n.note AS note_text,
        nt.type AS note_type,
        n.date_created
    FROM notes n
    JOIN note_types nt ON n.type_id = nt.id
    WHERE n.user_id = p_user_id 
      AND n.book_id = p_book_id
    ORDER BY n.date_created DESC;
END;
$$ LANGUAGE plpgsql;