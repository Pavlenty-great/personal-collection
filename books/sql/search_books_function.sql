CREATE OR REPLACE FUNCTION search_user_books(
    p_user_id INTEGER,
    p_search_query VARCHAR(255) DEFAULT NULL
) 
RETURNS TABLE(
    book_id BIGINT,
    book_name VARCHAR(80),
    authors_list TEXT,
    book_year VARCHAR(4),
    place_name VARCHAR(80)
) AS $$
DECLARE
    v_search_terms TEXT[];
    v_term TEXT;
BEGIN
    -- Если поисковый запрос пустой, возвращаем все книги
    IF p_search_query IS NULL OR TRIM(p_search_query) = '' THEN
        RETURN QUERY
        SELECT * FROM get_user_books(p_user_id);
        RETURN;
    END IF;
    
    -- Очищаем и приводим к нижнему регистру
    p_search_query := LOWER(TRIM(p_search_query));
    
    -- Разбиваем запрос на отдельные слова
    v_search_terms := STRING_TO_ARRAY(p_search_query, ' ');
    
    RETURN QUERY
    SELECT 
        b.id AS book_id,
        b.name AS book_name,
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
      AND (
          -- 1. Поиск по полному запросу (точная фраза)
          LOWER(b.name) LIKE '%' || p_search_query || '%'
          OR
          -- 2. Поиск по отдельным словам (каждое слово должно быть в названии)
          (
              SELECT COUNT(*) = array_length(v_search_terms, 1)
              FROM unnest(v_search_terms) AS term
              WHERE LOWER(b.name) LIKE '%' || term || '%'
          )
          OR
          -- 3. Поиск по автору (полный запрос)
          LOWER(a.last_name) LIKE '%' || p_search_query || '%'
          OR LOWER(a.first_name) LIKE '%' || p_search_query || '%'
          OR LOWER(a.middle_name) LIKE '%' || p_search_query || '%'
          OR
          -- 4. Поиск по формату имени автора
          LOWER(
              CASE 
                  WHEN a.middle_name != '' THEN 
                      substring(a.first_name, 1, 1) || '.' || 
                      substring(a.middle_name, 1, 1) || '. ' || 
                      a.last_name
                  ELSE 
                      substring(a.first_name, 1, 1) || '. ' || 
                      a.last_name
              END
          ) LIKE '%' || p_search_query || '%'
      )
    GROUP BY b.id, b.name, b.year, pp.place_name
    ORDER BY 
        -- Приоритет 1: Точное совпадение названия
        CASE WHEN LOWER(b.name) = p_search_query THEN 1
             WHEN LOWER(b.name) LIKE p_search_query || '%' THEN 2
             WHEN LOWER(b.name) LIKE '%' || p_search_query || '%' THEN 3
             ELSE 4
        END,
        b.id DESC;
END;
$$ LANGUAGE plpgsql;