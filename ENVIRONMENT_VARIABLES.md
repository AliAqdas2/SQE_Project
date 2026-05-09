# Environment Variables Required

This document lists all environment variables required for the Plegit application.

## Required Environment Variables

### Database
- **`DATABASE_URL`** (Required)
  - PostgreSQL connection string
  - Format: `postgresql://username:password@host:port/database`
  - Example: `postgresql://postgres:password@localhost:5432/plegit`

### Email Service (Resend)
- **`RESEND_API_KEY`** (Required)
  - Resend API key for sending emails
  - Get from: https://resend.com/api-keys
- **`RESEND_FROM_EMAIL`** (Optional)
  - Default sender email address
  - Default: `noreply@plegit.app`
  - Must be a verified domain in Resend

### AI Services (OpenAI)
- **`OPENAI_API_KEY`** (Required)
  - OpenAI API key for AI features (GPT-5)
  - Get from: https://platform.openai.com/api-keys

### Payment Processing (Stripe)
- **`STRIPE_SECRET_KEY`** (Required)
  - Stripe secret key for server-side operations
  - Get from: https://dashboard.stripe.com/apikeys
  - Use test key for development, live key for production
- **`STRIPE_CLIENT_ID`** (Required for Stripe Connect)
  - Stripe Connect client ID
  - Get from: https://dashboard.stripe.com/settings/applications
- **`STRIPE_WEBHOOK_SECRET`** (Required for webhooks)
  - Stripe webhook signing secret
  - Get from: Stripe Dashboard > Developers > Webhooks
  - Create webhook endpoint: `/api/stripe/webhook`

### Frontend Stripe Keys (Vite Environment Variables)
These must be prefixed with `VITE_` to be accessible in the frontend:
- **`VITE_STRIPE_PUBLIC_KEY`** (Required)
  - Stripe publishable key for client-side
  - Get from: https://dashboard.stripe.com/apikeys
- **`TESTING_VITE_STRIPE_PUBLIC_KEY`** (Optional, for testing)
  - Test mode publishable key
- **`TESTING_STRIPE_SECRET_KEY`** (Optional, for testing)
  - Test mode secret key (falls back to STRIPE_SECRET_KEY)

### Local File Storage
- **`STORAGE_DIR`** or **`LOCAL_STORAGE_DIR`** (Optional)
  - Local directory path for storing files
  - Default: `./storage`
  - Files are stored in subdirectories:
    - `storage/private/` - Private files (with ACL)
    - `storage/public/` - Public files (optional, for direct serving)
    - `storage/metadata/` - ACL metadata files
  - Example: `./storage` or `/var/www/plegit/storage`

### Application Configuration
- **`BASE_URL`** or **`APP_URL`** (Required for production)
  - Base URL of the application
  - Used for email links, webhooks, etc.
  - Example: `https://plegit.app`
  - Defaults to `http://localhost:5000` in development
- **`PORT`** (Optional)
  - Server port number
  - Default: `5000`
- **`NODE_ENV`** (Optional)
  - Environment mode: `development` or `production`
  - Default: `development`
- **`SESSION_SECRET`** (Required for production)
  - Secret key for session encryption
  - Should be a long, random string
  - Default: `plegit-secret-key-change-in-production` (change in production!)

### Admin Configuration
- **`ECO_ADMIN_EMAIL`** (Optional)
  - Email address for eco admin notifications
  - Default: `admin@plegit.app`

### Optional Configuration

## Environment File Setup

Create a `.env` file in the root directory with the following structure:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/plegit

# Email Service
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@plegit.app

# AI Services
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_CLIENT_ID=ca_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
VITE_STRIPE_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx

# Local File Storage
STORAGE_DIR=./storage

# Application
BASE_URL=https://plegit.app
PORT=5000
NODE_ENV=production
SESSION_SECRET=your-long-random-secret-key-here

# Admin
ECO_ADMIN_EMAIL=admin@plegit.app
```

## Notes

1. **Frontend Variables**: Variables prefixed with `VITE_` are exposed to the frontend. Never put secrets in `VITE_` variables.

2. **Stripe Keys**: Use test keys (`sk_test_`, `pk_test_`) for development and live keys (`sk_live_`, `pk_live_`) for production.

3. **Session Secret**: Generate a strong random string for `SESSION_SECRET` in production. You can use:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Database URL**: For local PostgreSQL, ensure the database exists before starting the application.

5. **Local File Storage**: Files are stored locally in the `storage` directory (or path specified by `STORAGE_DIR`). Make sure the directory is writable and has sufficient disk space. For production, consider using a dedicated storage volume or network-attached storage.

6. **Environment Loading**: The application uses `dotenv` to load variables from `.env` file. Make sure `.env` is in `.gitignore` and never commit it to version control.

