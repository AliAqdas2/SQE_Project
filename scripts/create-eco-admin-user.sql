-- Script to create the first Eco Admin user
-- This script creates an eco_admin user for accessing the Eco Admin Portal
-- 
-- IMPORTANT: Run this script ONCE to create your first admin user
-- After creation, you can use the Eco Admin Portal to add more team members
--
-- To use this script:
-- 1. Update the values below with your desired admin credentials
-- 2. Run: psql $DATABASE_URL -f scripts/create-eco-admin-user.sql

-- Configuration (UPDATE THESE VALUES)
\set admin_email '''admin@plegit.com'''
\set admin_first_name '''Platform'''
\set admin_last_name '''Admin'''
\set admin_password_hash '''$2b$10$YourHashedPasswordHere'''  -- Use bcrypt to hash your password

-- DO NOT MODIFY BELOW THIS LINE
INSERT INTO users (email, "firstName", "lastName", role, "passwordHash", "orgId")
VALUES (
  :admin_email,
  :admin_first_name,
  :admin_last_name,
  'eco_admin',
  :admin_password_hash,
  NULL  -- Eco Admin users don't belong to any organization
)
ON CONFLICT (email) DO UPDATE
SET role = 'eco_admin'
RETURNING id, email, "firstName", "lastName", role;

-- Success message
\echo ''
\echo '========================================'
\echo 'Eco Admin user created successfully!'
\echo ''
\echo 'Access the admin portal at:'
\echo '  https://your-domain.replit.app/eco-admin/login'
\echo ''
\echo 'Login credentials:'
\echo '  Email: ' :admin_email
\echo ''
\echo 'IMPORTANT: Change the password after first login'
\echo '========================================'
