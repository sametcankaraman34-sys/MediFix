-- Add user_id columns to service_requests, appointments, and reports tables
-- This enables proper authorization control

-- Add user_id to service_requests table
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create indexes for user_id columns (for better query performance)
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);

-- Create indexes for payment_cards, billing_history, and notifications if tables exist
-- These indexes are mentioned in the report but may not exist yet
DO $$
BEGIN
  -- Check if payment_cards table exists and create index
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_cards') THEN
    CREATE INDEX IF NOT EXISTS idx_payment_cards_user_id ON payment_cards(user_id);
  END IF;

  -- Check if billing_history table exists and create index
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_history') THEN
    CREATE INDEX IF NOT EXISTS idx_billing_history_user_id ON billing_history(user_id);
  END IF;

  -- Check if notifications table exists and create indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
  END IF;
END $$;

-- Update existing records: Set user_id based on created_at (if needed)
-- Note: This is a placeholder - you may need to adjust based on your data
-- For now, we'll leave existing records with NULL user_id
-- You can manually update them or create a separate data migration script

-- Add comments for documentation
COMMENT ON COLUMN service_requests.user_id IS 'User who created this service request';
COMMENT ON COLUMN appointments.user_id IS 'User who created this appointment';
COMMENT ON COLUMN reports.user_id IS 'User who created this report';
