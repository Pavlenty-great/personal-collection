CREATE OR REPLACE FUNCTION add_book(
    p_user_id INTEGER,
    p_book_name VARCHAR(80),
    p_book_year VARCHAR(4),
    p_place_name VARCHAR(80),
    p_author_last_name VARCHAR(80),
    p_author_first_name VARCHAR(80),
    p_author_middle_name VARCHAR(80) DEFAULT ''
) 
RETURNS INTEGER AS $$
DECLARE
    v_place_id INTEGER;
    v_book_id INTEGER;
    v_author_id INTEGER;
BEGIN
    SELECT id INTO v_place_id 
    FROM place_publishing 
    WHERE place_name = p_place_name;
    
    IF v_place_id IS NULL THEN
        INSERT INTO place_publishing (place_name)
        VALUES (p_place_name)
        RETURNING id INTO v_place_id;
    END IF;

    INSERT INTO books (name, year, place_publishing_id)
    VALUES (p_book_name, p_book_year, v_place_id)
    RETURNING id INTO v_book_id;

    SELECT id INTO v_author_id 
    FROM authors 
    WHERE last_name = p_author_last_name 
      AND first_name = p_author_first_name 
      AND middle_name = COALESCE(NULLIF(p_author_middle_name, ''), '');
    
    IF v_author_id IS NULL THEN
        INSERT INTO authors (last_name, first_name, middle_name)
        VALUES (p_author_last_name, p_author_first_name, 
                COALESCE(NULLIF(p_author_middle_name, ''), ''))
        RETURNING id INTO v_author_id;
    END IF;
    
    INSERT INTO user_books (user_id, book_id)
    VALUES (p_user_id, v_book_id);
    
    INSERT INTO book_authors (book_id, author_id)
    VALUES (v_book_id, v_author_id);
    
    RETURN v_book_id;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Книга уже существует в вашей коллекции';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Ошибка при добавлении книги: %', SQLERRM;
        RETURN -1;
END;
$$ LANGUAGE plpgsql;