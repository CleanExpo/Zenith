# 🔧 VERCEL ENVIRONMENT VARIABLES - COPY & PASTE LIST

## 📋 REQUIRED ENVIRONMENT VARIABLES FOR VERCEL

Copy and paste each variable name and value into your Vercel dashboard:

### 1. NEXT_PUBLIC_SUPABASE_URL
```
NEXT_PUBLIC_SUPABASE_URL
```
**Value:** `[Your Supabase Project URL - get from supabase.com → your project → Settings → API]`

### 2. NEXT_PUBLIC_SUPABASE_ANON_KEY
```
NEXT_PUBLIC_SUPABASE_ANON_KEY
```
**Value:** `[Your Supabase Anon Key - get from supabase.com → your project → Settings → API]`

### 3. SUPABASE_SERVICE_ROLE_KEY
```
SUPABASE_SERVICE_ROLE_KEY
```
**Value:** `[Your Supabase Service Role Key - get from supabase.com → your project → Settings → API]`

### 4. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```
**Value:** `[Your Stripe Publishable Key - get from stripe.com → Developers → API keys]`

### 5. STRIPE_SECRET_KEY
```
STRIPE_SECRET_KEY
```
**Value:** `[Your Stripe Secret Key - get from stripe.com → Developers → API keys]`

### 6. STRIPE_WEBHOOK_SECRET
```
STRIPE_WEBHOOK_SECRET
```
**Value:** `[Your Stripe Webhook Secret - get from stripe.com → Developers → Webhooks]`

### 7. NEXTAUTH_SECRET
```
NEXTAUTH_SECRET
```
**Value:** `[Generate a 32-character random string - use: openssl rand -base64 32]`

### 8. NEXTAUTH_URL
```
NEXTAUTH_URL
```
**Value:** `https://zenith-saas.vercel.app`

### 9. NODE_ENV
```
NODE_ENV
```
**Value:** `production`

## 🚀 QUICK SETUP INSTRUCTIONS

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com](https://vercel.com)
   - Sign in and find your "zenith-saas" project
   - Click on the project name

2. **Access Environment Variables:**
   - Click "Settings" tab
   - Click "Environment Variables" in sidebar

3. **Add Each Variable:**
   - Click "Add New"
   - Copy variable name from above
   - Paste your actual value
   - Select "Production" environment
   - Click "Save"

4. **Redeploy:**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

## 🔍 WHERE TO FIND YOUR VALUES

### Supabase Values:
1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Go to Settings → API
4. Copy:
   - Project URL (for NEXT_PUBLIC_SUPABASE_URL)
   - anon public key (for NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - service_role secret key (for SUPABASE_SERVICE_ROLE_KEY)

### Stripe Values:
1. Go to [stripe.com](https://stripe.com)
2. Go to Developers → API keys
3. Copy:
   - Publishable key (for NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   - Secret key (for STRIPE_SECRET_KEY)
4. For webhook secret: Go to Developers → Webhooks → Your webhook → Signing secret

### Generate NEXTAUTH_SECRET:
Run this command in terminal:
```bash
openssl rand -base64 32
```
Or use an online generator for a 32-character random string.

## ✅ VERIFICATION

After adding all variables and redeploying:
- Visit https://zenith-saas.vercel.app
- Application should load with proper CSS styling
- No more 404 errors
- Authentication should work

---

**CRITICAL:** All 9 variables must be added for the application to work properly.
