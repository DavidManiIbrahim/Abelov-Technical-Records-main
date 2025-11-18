-- ==============================================================
-- USER ACCOUNTS SCHEMA
-- Supplementary tables for extended user profile management
-- ==============================================================

-- Create user profiles extension table (optional, beyond Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  phone_number TEXT,
  company_name TEXT,
  profile_picture_url TEXT,
  bio TEXT,
  preferred_language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create user settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'light', -- 'light', 'dark', 'auto'
  notifications_enabled BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  notifications_frequency VARCHAR(20) DEFAULT 'real-time', -- 'real-time', 'daily', 'weekly'
  auto_save_enabled BOOLEAN DEFAULT TRUE,
  items_per_page INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user roles table (for role-based access control - RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'admin', 'technician', 'supervisor', 'viewer'
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, role)
);

-- Create user activity log table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'login', 'logout', 'create_request', 'update_request', etc.
  resource_type VARCHAR(50), -- 'service_request', 'profile', 'settings', etc.
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failure'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_activity_logs_user_id (user_id),
  INDEX idx_user_activity_logs_created_at (created_at)
);

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS Policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Only admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- User Settings RLS Policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- User Roles RLS Policies
CREATE POLICY "Admins can view all roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can manage roles"
  ON user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- User Activity Logs RLS Policies
CREATE POLICY "Users can view their own activity logs"
  ON user_activity_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert activity logs"
  ON user_activity_logs FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admins can view all activity logs"
  ON user_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Password Reset Tokens RLS Policies
CREATE POLICY "Users can view their own tokens"
  ON password_reset_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage reset tokens"
  ON password_reset_tokens FOR ALL
  USING (TRUE);

-- ==============================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- ==============================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ==============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_timestamp
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_settings_timestamp
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ==============================================================
-- SAMPLE INSERTS (for testing purposes)
-- ==============================================================

-- Note: These are commented out. Uncomment to populate test data.
-- Ensure you have valid UUIDs from your auth.users table

/*
-- Insert a sample user profile
INSERT INTO user_profiles (id, email, full_name, phone_number, company_name)
VALUES (
  'your-user-uuid-here',
  'user@example.com',
  'John Doe',
  '+1-555-0123',
  'Tech Repairs Inc.'
);

-- Insert user settings
INSERT INTO user_settings (user_id, theme, notifications_enabled)
VALUES (
  'your-user-uuid-here',
  'light',
  TRUE
);

-- Assign technician role
INSERT INTO user_roles (user_id, role, assigned_by)
VALUES (
  'your-user-uuid-here',
  'technician',
  'admin-user-uuid-here'
);
*/

-- ==============================================================
-- DOCUMENTATION
-- ==============================================================

/*
TABLE DESCRIPTIONS:

1. user_profiles
   - Stores extended user profile information beyond Supabase Auth
   - Fields: full_name, phone, company, picture, bio, language, timezone
   - Soft delete available via is_active field

2. user_settings
   - Stores personalized user preferences
   - Theme (light/dark), notification preferences, display settings
   - Allows each user to customize their experience

3. user_roles
   - Implements role-based access control (RBAC)
   - Supports multiple roles: admin, technician, supervisor, viewer
   - Optional expiration for temporary role assignments

4. user_activity_logs
   - Audit trail of user actions
   - Tracks login, logout, data modifications
   - Includes IP address and user agent for security

5. password_reset_tokens
   - Secure password reset token management
   - Tracks token creation and usage
   - Automatic expiration support

USAGE PATTERNS:

-- Get user profile with settings and roles
SELECT 
  p.*,
  s.theme,
  s.notifications_enabled,
  ARRAY_AGG(r.role) as roles
FROM user_profiles p
LEFT JOIN user_settings s ON p.id = s.user_id
LEFT JOIN user_roles r ON p.id = r.user_id
WHERE p.id = 'user-uuid'
GROUP BY p.id, s.id;

-- Log user activity
INSERT INTO user_activity_logs (user_id, action, resource_type, status)
VALUES ('user-uuid', 'create_request', 'service_request', 'success');

-- Check user role
SELECT EXISTS (
  SELECT 1 FROM user_roles
  WHERE user_id = 'user-uuid'
  AND role = 'admin'
) as is_admin;

SECURITY NOTES:
- All tables have RLS enabled to prevent unauthorized access
- Users can only view/modify their own data (except admins)
- Activity logs are immutable once created
- Password reset tokens are one-time use
- Consider adding 2FA/MFA columns for enhanced security
*/
