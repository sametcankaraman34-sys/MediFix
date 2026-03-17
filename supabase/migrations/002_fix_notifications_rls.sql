-- Fix Notifications RLS Policy Security Issue
-- Remove insecure INSERT policy and create secure one

-- Drop existing insecure INSERT policy if exists
DROP POLICY IF EXISTS "Allow insert for all" ON notifications;
DROP POLICY IF EXISTS "Enable insert for all users" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;

-- Drop the existing secure policy if it exists (to recreate it with correct settings)
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;

-- Create secure INSERT policy
-- Users can only insert notifications for themselves
CREATE POLICY "Users can insert their own notifications"
ON notifications FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Ensure RLS is enabled on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
