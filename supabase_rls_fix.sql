-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 1. Allow users to view their own notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Allow users to update their own notifications (e.g. mark as read)
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 3. Allow users to delete/dismiss their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 4. Allow admins (service role) to insert/manage all notifications
-- Note: Service role bypasses RLS automatically, but having a policy for admin users can be useful
DROP POLICY IF EXISTS "Admins can everything" ON notifications;
CREATE POLICY "Admins can everything"
ON notifications
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Fix for Users table (to allow seeing names of people who sent transfer)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all public profiles" ON users;
CREATE POLICY "Users can view all public profiles"
ON users FOR SELECT
TO authenticated
USING (true);
