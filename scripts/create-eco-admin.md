# Creating Your First Eco Admin User

This guide explains how to create the first Eco Admin user to access the Platform Administration Portal.

## Prerequisites

- Access to the PostgreSQL database
- `psql` command-line tool
- `bcryptjs` or `bcrypt` to hash passwords

## Step 1: Generate Password Hash

First, generate a bcrypt hash for your desired password. You can use Node.js:

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourSecurePassword123!', 10));"
```

This will output something like:
```
$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJK
```

## Step 2: Update the SQL Script

Edit `scripts/create-eco-admin-user.sql` and update these values:

```sql
\set admin_email '''your.email@company.com'''
\set admin_first_name '''Your'''
\set admin_last_name '''Name'''
\set admin_password_hash '''$2b$10$YourActualHashFromStep1'''
```

## Step 3: Run the Script

Execute the SQL script:

```bash
psql $DATABASE_URL -f scripts/create-eco-admin-user.sql
```

Or if you prefer a one-liner using execute_sql_tool:

```sql
INSERT INTO users (email, "firstName", "lastName", role, "passwordHash", "orgId")
VALUES (
  'admin@plegit.com',
  'Platform',
  'Admin',
  'eco_admin',
  '$2b$10$YourHashedPasswordHere',
  NULL
)
ON CONFLICT (email) DO UPDATE
SET role = 'eco_admin'
RETURNING id, email, "firstName", "lastName", role;
```

## Step 4: Access the Admin Portal

1. Navigate to: `https://your-domain.replit.app/eco-admin/login`
2. Sign in with your eco admin credentials
3. You'll be redirected to the Eco Admin Dashboard

## Adding More Eco Admin Users

Once logged in as an eco_admin, you can add more team members:

1. Go to Eco Admin Dashboard → Team
2. Click "Add Team Member"
3. Fill in their details and select "Eco Admin" role
4. They'll receive an email to set up their password

## Security Notes

- **Never commit** the SQL script with real credentials to version control
- Change the default password immediately after first login
- Use strong, unique passwords for all admin accounts
- Enable two-factor authentication when available (future feature)
- Regularly audit eco_admin access logs

## Troubleshooting

**Issue**: "Email already exists" error
- **Solution**: The script uses `ON CONFLICT DO UPDATE` to convert existing users to eco_admin role

**Issue**: Cannot login after creating user
- **Solution**: Verify the password hash is correct and matches the bcrypt format

**Issue**: Wrong portal error when logging in
- **Solution**: Make sure you're using `/eco-admin/login`, not `/login`

## Portal Separation

Plegit has two separate login portals:

1. **Organization Portal** (`/login`): For charity/organization administrators
2. **Eco Admin Portal** (`/eco-admin/login`): For platform staff only

Each portal enforces role-based access:
- Organization users (`org_admin` role) can only access `/dashboard` and organization features
- Eco Admin users (`eco_admin` role) can only access `/eco-admin` and platform features

Sessions are tagged with the portal audience to prevent cross-portal access.
