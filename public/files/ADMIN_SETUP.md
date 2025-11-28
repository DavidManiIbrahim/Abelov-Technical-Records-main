-- ==============================================================
-- ADMIN ACCOUNT SETUP FOR ABELOV TECHNICAL RECORDS
-- ==============================================================

-- IMPORTANT: This script sets up admin accounts. Follow these steps:
-- 1. Go to the signup page in the app (/login)
-- 2. Click "Don't have an account? Sign up"
-- 3. Select "Admin" as your account type during signup
-- 4. Create your account with email and password
-- 5. Note the user UUID from the Supabase Auth tab
-- 6. Run the queries below with your actual UUID to complete admin setup

-- ==============================================================
-- SIGNUP FLOW (NEW)
-- ==============================================================
-- The signup page now includes an "Account Type" selector:
-- - Regular User (Technician): Access your own service requests
-- - Admin: Monitor all users and tickets system-wide
--
-- After selecting "Admin" and creating your account, you MUST
-- run the SQL queries below to assign the admin role in the database.

-- ==============================================================
-- STEP 1: Create a user profile (if not already created)
-- ==============================================================
-- Replace 'your-user-uuid' with your actual UUID from Supabase Auth

INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  phone_number,
  company_name,
  is_active
) VALUES (
  'your-user-uuid',
  'admin@gmail.com',
  'Admin User',
  '+234-000-0000',
  'Abelov Technical Records',
  TRUE
);

-- ==============================================================
-- STEP 2: Assign ADMIN role
-- ==============================================================
-- This grants admin permissions to access the Admin Dashboard

INSERT INTO public.user_roles (
  user_id,
  role,
  assigned_at
) VALUES (
  'your-user-uuid',
  'admin',
  CURRENT_TIMESTAMP
);

-- ==============================================================
-- STEP 3: Create user settings (optional)
-- ==============================================================

INSERT INTO public.user_settings (
  user_id,
  theme,
  notifications_enabled,
  email_notifications
) VALUES (
  'your-user-uuid',
  'light',
  TRUE,
  TRUE
);

-- ==============================================================
-- VERIFY ADMIN ACCOUNT WAS CREATED
-- ==============================================================

-- Run this query to check if admin was created successfully:
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.is_active,
  ARRAY_AGG(r.role) as roles,
  p.created_at
FROM public.user_profiles p
LEFT JOIN public.user_roles r ON p.id = r.user_id
WHERE p.email = 'admin@abelov.ng'
GROUP BY p.id, p.email, p.full_name, p.is_active, p.created_at;

-- ==============================================================
-- ADDITIONAL ADMIN OPERATIONS
-- ==============================================================

-- Get all admin users:
SELECT p.email, p.full_name, r.role
FROM public.user_profiles p
JOIN public.user_roles r ON p.id = r.user_id
WHERE r.role = 'admin'
ORDER BY p.created_at DESC;

-- Give another user admin access:
-- (Replace 'another-user-uuid' with actual UUID)
INSERT INTO public.user_roles (user_id, role)
VALUES ('another-user-uuid', 'admin');

-- Remove admin access from user:
-- (Replace 'user-uuid' with actual UUID)
DELETE FROM public.user_roles
WHERE user_id = 'user-uuid' AND role = 'admin';

-- Disable a user account:
UPDATE public.user_profiles
SET is_active = FALSE
WHERE id = 'user-uuid';

-- Re-enable a user account:
UPDATE public.user_profiles
SET is_active = TRUE
WHERE id = 'user-uuid';

-- ==============================================================
-- HOW TO FIND YOUR USER UUID
-- ==============================================================
/*
1. Go to your Supabase dashboard
2. Select your project
3. Go to "Authentication" → "Users"
4. Find your user account in the list
5. Click on it to open the user details
6. Copy the "UID" field (this is your UUID)
7. Use this UUID in the queries above (replace 'your-user-uuid')
*/

-- ==============================================================
-- ADMIN DASHBOARD FEATURES
-- ==============================================================
/*
Once logged in as admin, you can access:

1. Admin Dashboard (/admin)
   - Global statistics (total users, tickets, revenue)
   - View all service requests across all users
   - Monitor ticket status breakdown
   - Search requests globally
   - Filter by status (Pending, In Progress, Completed, On Hold)

2. User Management
   - View all users with their ticket counts
   - Monitor user revenue
   - Check user status (active/inactive)
   - View join dates and last activity

3. Request Monitoring
   - See all tickets in the system
   - Click on any ticket to view full details
   - Track financial metrics (total revenue by ticket)
   - Identify pending high-value tickets

4. Analytics
   - Global ticket distribution
   - User performance metrics
   - Revenue tracking
*/

-- ==============================================================
-- ROW LEVEL SECURITY (RLS) - Already Configured
-- ==============================================================
/*
The database is already set up with RLS policies that:
- Allow admins to view all service requests and users
- Only allow users to view their own data
- Prevent unauthorized access to sensitive data
- Log all admin activities

Admin-specific RLS policies are already in place in:
- service_requests (admins can view all)
- user_profiles (admins can view all)
- user_activity_logs (admins can view all)
*/

-- ==============================================================
-- SECURITY NOTES
-- ==============================================================
/*
IMPORTANT SECURITY GUIDELINES:

1. Admin Access Control
   - Limit admin role to trusted personnel only
   - Regularly audit who has admin access
   - Remove admin access when no longer needed

2. Data Protection
   - Admin passwords must be strong
   - Consider enabling 2FA on admin accounts
   - Never share admin credentials

3. Activity Logging
   - All admin actions are logged
   - Check user_activity_logs for suspicious activity
   - Regularly review access patterns

4. Best Practices
   - Use different email for admin account
   - Keep admin account separate from regular technician account
   - Document who has admin access and why
   - Implement a change log for admin assignments
*/
