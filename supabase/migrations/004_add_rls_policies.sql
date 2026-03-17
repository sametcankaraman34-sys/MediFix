-- Add Row Level Security (RLS) policies for service_requests, appointments, and reports
-- This ensures users can only access their own records

-- Service Requests RLS Policies
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own service requests" ON service_requests;
DROP POLICY IF EXISTS "Users can create their own service requests" ON service_requests;
DROP POLICY IF EXISTS "Users can update their own service requests" ON service_requests;
DROP POLICY IF EXISTS "Users can delete their own service requests" ON service_requests;
DROP POLICY IF EXISTS "Admins can view all service requests" ON service_requests;

-- Create policies for service_requests
CREATE POLICY "Users can view their own service requests"
ON service_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own service requests"
ON service_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service requests"
ON service_requests FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service requests"
ON service_requests FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Admin users can view all service requests
CREATE POLICY "Admins can view all service requests"
ON service_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Appointments RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;

-- Create policies for appointments
CREATE POLICY "Users can view their own appointments"
ON appointments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own appointments"
ON appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own appointments"
ON appointments FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Admin users can view all appointments
CREATE POLICY "Admins can view all appointments"
ON appointments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- Reports RLS Policies
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Users can create their own reports" ON reports;
DROP POLICY IF EXISTS "Users can update their own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete their own reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;

-- Create policies for reports
CREATE POLICY "Users can view their own reports"
ON reports FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reports"
ON reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reports"
ON reports FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reports"
ON reports FOR DELETE
USING (auth.uid() = user_id);

-- Optional: Admin users can view all reports
CREATE POLICY "Admins can view all reports"
ON reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);
