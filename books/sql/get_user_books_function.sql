CREATE OR REPLACE FUNCTION get_user_books(p_user_id INTEGER)
RETURNS TABLE(
    book_id BIGINT,
    book_name VARCHAR(80),
    authors_list TEXT,  -- Все авторы через запятую
    book_year VARCHAR(4),
    place_name VARCHAR(80)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id AS book_id,
        b.name AS book_name,
        -- Собираем всех авторов через запятую
        string_agg(
            CASE 
                WHEN a.middle_name != '' THEN 
                    substring(a.first_name, 1, 1) || '.' || 
                    substring(a.middle_name, 1, 1) || '. ' || 
                    a.last_name
                ELSE 
                    substring(a.first_name, 1, 1) || '. ' || 
                    a.last_name
            END,
            ', '
            ORDER BY a.last_name
        ) AS authors_list,
        b.year AS book_year,
        pp.place_name
    FROM user_books ub
    JOIN books b ON ub.book_id = b.id
    JOIN book_authors ba ON b.id = ba.book_id
    JOIN authors a ON ba.author_id = a.id
    JOIN place_publishing pp ON b.place_publishing_id = pp.id
    WHERE ub.user_id = p_user_id
    GROUP BY b.id, b.name, b.year, pp.place_name
    ORDER BY b.id DESC;
END;
$$ LANGUAGE plpgsql;