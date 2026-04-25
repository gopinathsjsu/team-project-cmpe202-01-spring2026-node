DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'attendee_profile'
    ) THEN
        EXECUTE 'DROP VIEW IF EXISTS user_profile';
        EXECUTE '
            CREATE VIEW user_profile AS
            SELECT
                user_id,
                first_name,
                last_name,
                phone,
                avatar_url,
                timezone
            FROM attendee_profile
        ';
    END IF;
END $$;
