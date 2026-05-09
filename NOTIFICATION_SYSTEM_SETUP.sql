-- =====================================================
-- COMPLETE NOTIFICATION SYSTEM SETUP (FIXED v2)
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. First, check the existing table structure and add missing columns
-- Add is_read column if it doesn't exist (the table might use 'read' instead)
DO $$
BEGIN
    -- Try to add is_read column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'is_read') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
            -- Rename 'read' to 'is_read' if it exists
            ALTER TABLE notifications RENAME COLUMN "read" TO is_read;
        ELSE
            -- Add new column
            ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT FALSE;
        END IF;
    END IF;
    
    -- Add from_admin if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'from_admin') THEN
        ALTER TABLE notifications ADD COLUMN from_admin BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add type if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'type') THEN
        ALTER TABLE notifications ADD COLUMN type TEXT DEFAULT 'info';
    END IF;
END $$;

-- 2. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- 5. Create RLS policies
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- 6. Enable Realtime (with error handling)
DO $$
BEGIN
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE trade_sessions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE credit_transfers;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE users;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
END $$;

-- 7. Set replica identity
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE trade_sessions REPLICA IDENTITY FULL;
ALTER TABLE users REPLICA IDENTITY FULL;

-- 8. Add missing columns to other tables
ALTER TABLE trade_sessions ADD COLUMN IF NOT EXISTS profit_percentage INTEGER DEFAULT 80;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_score INTEGER DEFAULT 100;

-- 9. Insert welcome notification (using column check)
INSERT INTO notifications (user_id, title, message, type)
SELECT 
    id as user_id,
    '👋 Welcome to Quantum Trading!' as title,
    'Your notification system is working! You will receive real-time updates for trades, transfers, and more.' as message,
    'success' as type
FROM users
WHERE id NOT IN (SELECT DISTINCT user_id FROM notifications WHERE title = '👋 Welcome to Quantum Trading!');

-- 10. Show current data
SELECT 'Setup Complete!' as status;
SELECT 'notifications' as table_name, count(*) as row_count FROM notifications
UNION ALL
SELECT 'trade_sessions', count(*) FROM trade_sessions
UNION ALL
SELECT 'users', count(*) FROM users;

-- Show notifications columns for verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
