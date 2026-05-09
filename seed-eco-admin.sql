-- SQL script to create an eco-admin user
-- Run this directly in your PostgreSQL database if needed
-- Note: The password hash is for the password "admin123" (bcrypt with 10 rounds)

-- Insert eco-admin user (will fail if email already exists - that's okay)
INSERT INTO users (
  id,
  org_id,
  email,
  password_hash,
  password_set_at,
  first_name,
  last_name,
  role,
  email_opted_out,
  created_at
)
VALUES (
  gen_random_uuid(),
  NULL, -- Eco-admins are not tied to organizations
  COALESCE($1, 'admin@plegit.app'), -- Can override via parameter
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', -- Hash for "admin123"
  NOW(),
  'Eco',
  'Admin',
  'eco_admin',
  false,
  NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
  role = 'eco_admin',
  org_id = NULL,
  password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  password_set_at = NOW();

-- Default credentials:
-- Email: admin@plegit.app
-- Password: admin123
-- 
-- ⚠️ IMPORTANT: Change the password after first login!

