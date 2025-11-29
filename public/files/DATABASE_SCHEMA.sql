-- Abelov Technical Records - Supabase Database Schema

-- Create service_requests table
CREATE TABLE IF NOT EXISTS public.service_requests (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Technician Information
  technician_name TEXT NOT NULL,
  request_date DATE NOT NULL,
  
  -- Customer Information
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  customer_address TEXT,
  
  -- Device Information
  device_model TEXT NOT NULL,
  device_brand TEXT NOT NULL,
  serial_number TEXT NOT NULL,
  operating_system TEXT NOT NULL,
  accessories_received TEXT,
  
  -- Problem Description
  problem_description TEXT NOT NULL,
  
  -- Diagnosis & Repair
  diagnosis_date DATE NOT NULL,
  diagnosis_technician TEXT NOT NULL,
  fault_found TEXT NOT NULL,
  parts_used TEXT NOT NULL,
  repair_action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'In-Progress', 'Completed', 'On-Hold')),
  
  -- Costs (in Nigerian Naira - ₦)
  service_charge DECIMAL(10, 2) NOT NULL DEFAULT 0,
  parts_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
  deposit_paid DECIMAL(10, 2) NOT NULL DEFAULT 0,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  payment_completed BOOLEAN DEFAULT FALSE,
  
  -- Repair Timeline (stored as JSON)
  repair_timeline JSONB DEFAULT '[]'::jsonb,
  
  -- Customer Confirmation (stored as JSON)
  customer_confirmation JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  UNIQUE(id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_name ON public.service_requests USING gin(customer_name gin_trgm_ops);

-- Enable Row Level Security (RLS)
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own service requests
CREATE POLICY "Users can view their own service requests"
  ON public.service_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own service requests
CREATE POLICY "Users can insert their own service requests"
  ON public.service_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own service requests
CREATE POLICY "Users can update their own service requests"
  ON public.service_requests
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own service requests
CREATE POLICY "Users can delete their own service requests"
  ON public.service_requests
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_service_requests_customer_phone ON public.service_requests USING gin(customer_phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_service_requests_device_brand ON public.service_requests USING gin(device_brand gin_trgm_ops);

CREATE POLICY "Admins can view all service requests"
  ON public.service_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update service requests"
  ON public.service_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete service requests"
  ON public.service_requests
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','user')),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON public.user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.user_profiles
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.user_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins manage roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own activity logs"
  ON public.user_activity_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity logs"
  ON public.user_activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "System can insert activity logs"
  ON public.user_activity_logs
  FOR INSERT
  WITH CHECK (TRUE);

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

SELECT storage.create_bucket('attachments', public := FALSE);

CREATE POLICY "Users can read own objects"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'attachments' AND (
      owner = auth.uid() OR EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
      )
    )
  );

CREATE POLICY "Users can insert own objects"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'attachments' AND owner = auth.uid());

CREATE POLICY "Users can update own objects"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'attachments' AND owner = auth.uid());

CREATE POLICY "Users can delete own objects"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'attachments' AND owner = auth.uid());

-- Instructions for use:
-- 1. Copy all SQL commands above
-- 2. Go to Supabase SQL Editor
-- 3. Create a new query and paste the SQL
-- 4. Execute the query
-- 5. Your database is now ready!
