-- ==============================================================
-- ADMIN ACCOUNT SETUP FOR ABELOV TECHNICAL RECORDS
-- ==============================================================
-- This SQL file contains queries to create and manage admin accounts
-- Copy and paste these queries into Supabase SQL Editor

-- ==============================================================
-- STEP 1: Find Your User UUID
-- ==============================================================
-- Go to Supabase Dashboard → Authentication → Users
-- Find your user account and copy the UID (this is your UUID)
-- Replace 'your-user-uuid' in the queries below with your actual UUID

-- ==============================================================
-- STEP 2: Create User Profile (if not already created)
-- ==============================================================
-- Execute this query with your UUID and email

INSERT INTO public.user_profiles (
  id,
  email,
  full_name,
  phone_number,
  company_name,
  is_active
) VALUES (
  '',
  'admin@gmail.com',
  'Admin User',
  '+234-000-0000',
  'Abelov Technical Records',
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  is_active = TRUE;

-- ==============================================================
-- STEP 3: Assign ADMIN Role
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
)
ON CONFLICT (user_id, role) DO NOTHING;

-- ==============================================================
-- STEP 4: Create User Settings (Optional)
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
)
ON CONFLICT (user_id) DO UPDATE SET
  notifications_enabled = TRUE;

-- ==============================================================
-- VERIFY ADMIN ACCOUNT WAS CREATED
-- ==============================================================
-- Run this query to confirm admin setup was successful

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.is_active,
  ARRAY_AGG(r.role) as roles,
  p.created_at
FROM public.user_profiles p
LEFT JOIN public.user_roles r ON p.id = r.user_id
WHERE p.id = 'your-user-uuid'
GROUP BY p.id, p.email, p.full_name, p.is_active, p.created_at;

-- ==============================================================
-- LIST ALL ADMIN USERS
-- ==============================================================
-- See all accounts with admin access

SELECT 
  p.id,
  p.email,
  p.full_name,
  p.company_name,
  p.is_active,
  r.assigned_at as admin_since,
  p.created_at
FROM public.user_profiles p
JOIN public.user_roles r ON p.id = r.user_id
WHERE r.role = 'admin'
ORDER BY r.assigned_at DESC;

-- ==============================================================
-- GRANT ADMIN ACCESS TO ANOTHER USER
-- ==============================================================
-- Replace 'another-user-uuid' with the target user's UUID

INSERT INTO public.user_roles (user_id, role, assigned_at)
VALUES ('another-user-uuid', 'admin', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role) DO NOTHING;

-- ==============================================================
-- REVOKE ADMIN ACCESS FROM USER
-- ==============================================================
-- Replace 'user-uuid' with the target user's UUID

DELETE FROM public.user_roles
WHERE user_id = 'user-uuid' AND role = 'admin';

-- ==============================================================
-- DISABLE USER ACCOUNT
-- ==============================================================
-- Replace 'user-uuid' to deactivate an account

UPDATE public.user_profiles
SET is_active = FALSE
WHERE id = 'user-uuid';

-- ==============================================================
-- RE-ENABLE USER ACCOUNT
-- ==============================================================
-- Replace 'user-uuid' to reactivate an account

UPDATE public.user_profiles
SET is_active = TRUE
WHERE id = 'user-uuid';

-- ==============================================================
-- GET ADMIN ACTIVITY SUMMARY
-- ==============================================================
-- View recent activity from all users (for audit trail)

SELECT 
  ual.user_id,
  up.email,
  up.full_name,
  COUNT(*) as action_count,
  MAX(ual.created_at) as last_activity,
  STRING_AGG(DISTINCT ual.action, ', ') as actions_performed
FROM public.user_activity_logs ual
LEFT JOIN public.user_profiles up ON ual.user_id = up.id
WHERE ual.created_at >= NOW() - INTERVAL '30 days'
GROUP BY ual.user_id, up.email, up.full_name
ORDER BY last_activity DESC;

-- ==============================================================
-- GET TOTAL REVENUE (PAID ONLY)
-- ==============================================================
-- View only completed payments (not partial payments)

SELECT 
  COUNT(*) as paid_tickets,
  SUM(sr.total_cost) as total_paid_revenue,
  AVG(sr.total_cost) as avg_ticket_value
FROM public.service_requests sr
WHERE sr.payment_completed = TRUE;

-- ==============================================================
-- GET ADMIN DASHBOARD STATS
-- ==============================================================
-- Complete overview of system statistics

SELECT 
  (SELECT COUNT(DISTINCT id) FROM public.user_profiles) as total_users,
  (SELECT COUNT(*) FROM public.service_requests) as total_tickets,
  (SELECT COUNT(*) FROM public.service_requests WHERE status = 'Pending') as pending_tickets,
  (SELECT COUNT(*) FROM public.service_requests WHERE status = 'Completed') as completed_tickets,
  (SELECT COUNT(*) FROM public.service_requests WHERE status = 'In-Progress') as in_progress_tickets,
  (SELECT SUM(total_cost) FROM public.service_requests WHERE payment_completed = TRUE) as total_revenue_paid;

-- ==============================================================
-- QUICK SETUP SCRIPT (ALL IN ONE)
-- ==============================================================
-- Copy your UUID below and uncomment this entire block to run at once

/*
-- Replace 'PASTE_YOUR_UUID_HERE' with your actual UUID
BEGIN;

INSERT INTO public.user_profiles (id, email, full_name, phone_number, company_name, is_active)
VALUES ('PASTE_YOUR_UUID_HERE', 'admin@abelov.ng', 'Admin User', '+234-000-0000', 'Abelov Technical Records', TRUE)
ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, is_active = TRUE;

INSERT INTO public.user_roles (user_id, role, assigned_at)
VALUES ('PASTE_YOUR_UUID_HERE', 'admin', CURRENT_TIMESTAMP)
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_settings (user_id, theme, notifications_enabled, email_notifications)
VALUES ('PASTE_YOUR_UUID_HERE', 'light', TRUE, TRUE)
ON CONFLICT (user_id) DO UPDATE SET notifications_enabled = TRUE;

COMMIT;

-- Verify:
SELECT p.email, ARRAY_AGG(r.role) as roles FROM public.user_profiles p
LEFT JOIN public.user_roles r ON p.id = r.user_id
WHERE p.id = 'PASTE_YOUR_UUID_HERE'
GROUP BY p.email;
*/
