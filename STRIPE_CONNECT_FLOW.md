# Stripe Connect Technical Flow

## 📊 Database Storage

### What Gets Stored in `organizations` Table

```sql
-- After successful OAuth connection, these fields are populated:
stripe_account_id        TEXT UNIQUE      -- "acct_1ABC123xyz" (Connected account ID)
stripe_access_token      TEXT             -- "sk_live_xxx..." (OAuth access token)
stripe_refresh_token      TEXT             -- "rt_xxx..." (OAuth refresh token)
stripe_scope             TEXT             -- "read_write" (Permissions granted)
stripe_account_status    TEXT             -- "active" | "pending" | "restricted"
```

**Security Note:** Access tokens are sensitive and should be encrypted at rest. Consider using encryption for `stripe_access_token` and `stripe_refresh_token` columns.

---

## 🔄 Complete OAuth Flow

### Step 1: User Initiates Connection
```
Frontend: User clicks "Connect Stripe Account"
  ↓
POST /api/org/:orgId/stripe/connect
```

### Step 2: Backend Generates OAuth URL
**File:** `server/routes.ts:1147-1241`

```typescript
// 1. Generate CSRF protection state
const state = randomBytes(32).toString('hex'); // e.g., "a1b2c3d4..."

// 2. Store in SESSION (temporary, not in DB)
req.session.stripeConnectState = state;
req.session.stripeConnectOrgId = orgId;

// 3. Build OAuth URL
const oauthUrl = `https://connect.stripe.com/oauth/authorize?
  client_id=${STRIPE_CLIENT_ID}&
  state=${state}&
  scope=read_write&
  redirect_uri=http://devportal.plegit.ai/api/stripe/callback`;

// 4. Return to frontend
res.json({ url: oauthUrl });
```

**Why state?** CSRF protection - ensures the callback is from a legitimate OAuth flow.

### Step 3: User Redirected to Stripe
```
Frontend receives: { url: "https://connect.stripe.com/oauth/authorize?..." }
  ↓
window.location.href = data.url
  ↓
User → Stripe OAuth Page
  ↓
User logs into Stripe
  ↓
User authorizes application
```

### Step 4: Stripe Redirects Back
```
Stripe → GET /api/stripe/callback?
  code=ac_xxx...&
  state=a1b2c3d4...
```

### Step 5: Backend Validates & Exchanges Code
**File:** `server/routes.ts:1252-1348`

```typescript
// 1. Validate state (CSRF check)
const sessionState = req.session.stripeConnectState;
if (state !== sessionState) {
  return res.redirect('/dashboard/settings?stripe_error=Security validation failed');
}

// 2. Exchange authorization code for tokens
const tokenResponse = await stripe.oauth.token({
  grant_type: 'authorization_code',
  code: code, // From query param
});

// tokenResponse structure:
// {
//   stripe_user_id: "acct_1ABC123xyz",  // Connected account ID
//   access_token: "sk_live_xxx...",     // OAuth access token
//   refresh_token: "rt_xxx...",         // OAuth refresh token (optional)
//   scope: "read_write"                 // Permissions granted
// }
```

### Step 6: Store in Database
**File:** `server/routes.ts:1330-1336`

```typescript
await storage.updateOrganization(orgId, {
  stripeAccountId: tokenResponse.stripe_user_id,    // → stripe_account_id
  stripeAccessToken: tokenResponse.access_token,    // → stripe_access_token
  stripeRefreshToken: tokenResponse.refresh_token,  // → stripe_refresh_token
  stripeScope: tokenResponse.scope,                  // → stripe_scope
  stripeAccountStatus: 'active',                   // → stripe_account_status
});
```

**SQL Equivalent:**
```sql
UPDATE organizations 
SET 
  stripe_account_id = 'acct_1ABC123xyz',
  stripe_access_token = 'sk_live_xxx...',
  stripe_refresh_token = 'rt_xxx...',
  stripe_scope = 'read_write',
  stripe_account_status = 'active'
WHERE id = 'org-id-here';
```

### Step 7: Redirect to Success Page
```typescript
res.redirect('/dashboard/settings?stripe_connected=true');
```

---

## 💰 Payment Flow - Using Stored Data

### When Donation is Made

**File:** `server/routes.ts:4915-4990`

```typescript
// 1. Get campaign to find organization
const campaign = await storage.getCampaign(campaignId);
// campaign.orgId = "01e4046b-d9b7-4951-8a4a-b9d7814ac4e7"

// 2. Get organization from database
const org = await storage.getOrganization(campaign.orgId);
// org.stripeAccountId = "acct_1ABC123xyz" (from DB)
// org.stripeAccountStatus = "active" (from DB)

// 3. Create payment intent
const paymentIntentParams = {
  amount: 5000, // $50.00 in cents
  currency: "usd",
  // ... other params
};

// 4. If connected account exists, use on_behalf_of
if (org.stripeAccountId && org.stripeAccountStatus === 'active') {
  paymentIntentParams.on_behalf_of = org.stripeAccountId;
  // This makes payment directly on connected account
  // Funds go DIRECTLY to their Stripe account
}

// 5. Create payment intent with Stripe API
const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
```

**What `on_behalf_of` does:**
- Payment is processed **on behalf of** the connected account
- Funds go **directly** to `acct_1ABC123xyz` (organization's Stripe account)
- Funds **never touch** your platform account
- Organization can withdraw funds immediately from their Stripe dashboard

---

## 🔐 Security & Token Management

### Access Token Usage

**Current Implementation:**
- Access tokens are stored in database (plain text - consider encryption)
- Used to make API calls on behalf of connected account
- Tokens can expire or be revoked

**Token Refresh (Future Enhancement):**
```typescript
// If access token expires, use refresh token:
const newTokens = await stripe.oauth.token({
  grant_type: 'refresh_token',
  refresh_token: org.stripeRefreshToken,
});

// Update database with new tokens
await storage.updateOrganization(orgId, {
  stripeAccessToken: newTokens.access_token,
  stripeRefreshToken: newTokens.refresh_token,
});
```

### What Each Token Does

1. **`stripeAccountId` (acct_xxx)**
   - Public identifier for connected account
   - Used in `on_behalf_of` parameter
   - Safe to log/expose (not sensitive)

2. **`stripeAccessToken` (sk_live_xxx)**
   - Secret token for API calls
   - **NEVER expose to frontend**
   - Used server-side only
   - Can expire (use refresh token)

3. **`stripeRefreshToken` (rt_xxx)**
   - Used to get new access tokens
   - **NEVER expose to frontend**
   - Long-lived (doesn't expire)

4. **`stripeScope` (read_write)**
   - Permissions granted
   - `read_write` = can read and write on behalf of account

---

## 📋 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "CONNECT STRIPE"                             │
└────────────────────┬────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND: Generate OAuth URL                              │
│    - Generate state (CSRF token)                            │
│    - Store state + orgId in SESSION                         │
│    - Return OAuth URL to frontend                           │
└────────────────────┬────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. FRONTEND: Redirect to Stripe                              │
│    window.location.href = oauthUrl                          │
└────────────────────┬────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. STRIPE: User authorizes                                  │
│    - User logs in                                            │
│    - User grants permissions                                 │
└────────────────────┬────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. STRIPE: Redirects back with code                           │
│    GET /api/stripe/callback?code=xxx&state=yyy               │
└────────────────────┬────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. BACKEND: Validate & Exchange                             │
│    - Validate state (CSRF check)                            │
│    - Exchange code for tokens                               │
│    - Receive: stripe_user_id, access_token, refresh_token  │
└────────────────────┬────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. BACKEND: Store in DATABASE                               │
│    UPDATE organizations SET                                 │
│      stripe_account_id = 'acct_xxx',                       │
│      stripe_access_token = 'sk_live_xxx',                  │
│      stripe_refresh_token = 'rt_xxx',                      │
│      stripe_scope = 'read_write',                          │
│      stripe_account_status = 'active'                      │
└────────────────────┬────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. REDIRECT: Success page                                   │
│    /dashboard/settings?stripe_connected=true                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ WHEN DONATION IS MADE:                                      │
└────────────────────┬────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. GET campaign → Get orgId                                  │
│ 2. GET organization from DB → Get stripeAccountId            │
│ 3. Create PaymentIntent with on_behalf_of = stripeAccountId  │
│ 4. Funds go DIRECTLY to connected account                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔍 Key Technical Points

1. **State Parameter (CSRF Protection)**
   - Stored in session (temporary)
   - Validated on callback
   - Prevents CSRF attacks

2. **Authorization Code Exchange**
   - Code is single-use
   - Exchanged for long-lived tokens
   - Happens server-side only

3. **Database Storage**
   - Tokens stored in `organizations` table
   - One record per organization
   - Used for all future payments

4. **Direct Transfers**
   - `on_behalf_of` parameter routes funds directly
   - No platform intermediary
   - Organization receives funds immediately

5. **Token Security**
   - Access tokens are secret
   - Never exposed to frontend
   - Consider encryption at rest

---

## 🛠️ Implementation Files

- **OAuth Initiation:** `server/routes.ts:1147-1241`
- **OAuth Callback:** `server/routes.ts:1252-1348`
- **Payment Intent:** `server/routes.ts:4915-4990`
- **Database Schema:** `shared/schema.ts:29-33`
- **Storage Layer:** `server/storage.ts:1945-1948`
- **Frontend:** `client/src/pages/dashboard/settings/stripe-connection.tsx`
