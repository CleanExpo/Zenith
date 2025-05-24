# 🔍 VERCEL ENVIRONMENT VARIABLES DIAGNOSTIC CHECKLIST

## 📋 REQUIRED VARIABLES CHECKLIST

Based on your local .env.local file, here's what should be configured in Vercel:

### ✅ CONFIRMED VALUES (from your .env.local):

1. **NEXT_PUBLIC_SUPABASE_URL**
   - ✅ Value: `https://uqfgdezadpkiadugufbs.supabase.co`

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - ✅ Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZmdkZXphZHBraWFkdWd1ZmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzOTkzMTYsImV4cCI6MjA2MTk3NTMxNn0.SbBq0HA4HxD6DPMbCwU5Klx0M2FoZx-d9RE-YtQloOs`

3. **NEXTAUTH_URL**
   - ✅ Value: `https://zenith-saas.vercel.app` (change from localhost)

4. **NEXT_PUBLIC_APP_NAME**
   - ✅ Value: `Zenith`

### ❌ MISSING/EMPTY VALUES (need to be added):

5. **SUPABASE_SERVICE_ROLE_KEY**
   - ❌ Currently empty in your .env.local
   - 🔍 Get from: Supabase → Settings → API → service_role key

6. **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
   - ❌ Currently empty in your .env.local
   - 🔍 Get from: Stripe → Developers → API keys

7. **STRIPE_SECRET_KEY**
   - ❌ Currently empty in your .env.local
   - 🔍 Get from: Stripe → Developers → API keys

8. **STRIPE_WEBHOOK_SECRET**
   - ❌ Currently empty in your .env.local
   - 🔍 Get from: Stripe → Developers → Webhooks

9. **NEXTAUTH_SECRET**
   - ❌ Currently empty in your .env.local
   - 🔍 Generate with: `openssl rand -base64 32`

10. **NODE_ENV**
    - ❌ Not in your .env.local
    - ✅ Value: `production`

### 🔧 OPTIONAL (for full functionality):

11. **REDIS_URL**
    - 📝 Currently set to localhost
    - 🔍 For production: Get Redis URL from Upstash or other provider

## 🚨 MOST LIKELY MISSING VARIABLES

Based on the 404 error, these are probably missing or incorrect in Vercel:

1. **SUPABASE_SERVICE_ROLE_KEY** - Critical for server-side operations
2. **STRIPE_SECRET_KEY** - Required for payment processing
3. **NEXTAUTH_SECRET** - Required for authentication
4. **NODE_ENV** - Should be set to `production`

## 🔍 HOW TO CHECK YOUR VERCEL VARIABLES

1. Go to Vercel Dashboard → zenith-saas project → Settings → Environment Variables
2. Compare with this list:

**Should have these 10 variables:**
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
❓ SUPABASE_SERVICE_ROLE_KEY
❓ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
❓ STRIPE_SECRET_KEY
❓ STRIPE_WEBHOOK_SECRET
❓ NEXTAUTH_SECRET
❓ NEXTAUTH_URL
❓ NODE_ENV
❓ NEXT_PUBLIC_APP_NAME
```

## 🎯 QUICK FIX STEPS

### Step 1: Add Missing Stripe Variables
If Stripe variables are empty, the payment system won't work:
1. Go to stripe.com → Developers → API keys
2. Copy Publishable key → Add to NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
3. Copy Secret key → Add to STRIPE_SECRET_KEY

### Step 2: Add Supabase Service Role Key
1. Go to supabase.com → your project → Settings → API
2. Copy service_role key → Add to SUPABASE_SERVICE_ROLE_KEY

### Step 3: Generate NEXTAUTH_SECRET
Run in terminal:
```bash
openssl rand -base64 32
```
Add result to NEXTAUTH_SECRET

### Step 4: Set Production Variables
- NEXTAUTH_URL: `https://zenith-saas.vercel.app`
- NODE_ENV: `production`

### Step 5: Redeploy
After adding missing variables → Deployments → Redeploy

## 🔧 TROUBLESHOOTING

### If still getting 404 after adding variables:
1. **Check variable names** - must match exactly (case-sensitive)
2. **Verify all values** - no extra spaces or quotes
3. **Ensure Production environment** - variables should be set for "Production"
4. **Wait for redeploy** - changes only take effect after redeployment

### Common Issues:
- **NEXTAUTH_URL** pointing to localhost instead of production URL
- **Missing NODE_ENV=production**
- **Empty Stripe keys** causing payment initialization to fail
- **Missing SUPABASE_SERVICE_ROLE_KEY** causing server-side auth to fail

---

**NEXT STEP:** Check your Vercel dashboard against this list and add any missing variables, then redeploy.
