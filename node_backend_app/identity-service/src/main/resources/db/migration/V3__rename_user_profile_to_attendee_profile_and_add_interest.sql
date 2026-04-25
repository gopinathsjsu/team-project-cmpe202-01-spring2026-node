DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'user_profile'
    ) THEN
        ALTER TABLE user_profile RENAME TO attendee_profile;
    END IF;
END $$;

ALTER TABLE attendee_profile
    ADD COLUMN IF NOT EXISTS interest TEXT;
