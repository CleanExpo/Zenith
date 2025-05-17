-- Create stripe schema and tables
CREATE SCHEMA IF NOT EXISTS stripe;

-- Stripe customers table
CREATE TABLE IF NOT EXISTS stripe.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe products table
CREATE TABLE IF NOT EXISTS stripe.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_product_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe prices table
CREATE TABLE IF NOT EXISTS stripe.prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_price_id TEXT NOT NULL UNIQUE,
    product_id UUID NOT NULL REFERENCES stripe.products(id) ON DELETE CASCADE,
    currency TEXT NOT NULL,
    unit_amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring')),
    interval TEXT CHECK (type = 'recurring' AND interval IN ('day', 'week', 'month', 'year')),
    interval_count INTEGER,
    active BOOLEAN DEFAULT TRUE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe subscriptions table
CREATE TABLE IF NOT EXISTS stripe.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES stripe.customers(id) ON DELETE CASCADE,
    price_id UUID NOT NULL REFERENCES stripe.prices(id) ON DELETE RESTRICT,
    status TEXT NOT NULL CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe invoices table
CREATE TABLE IF NOT EXISTS stripe.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_invoice_id TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES stripe.customers(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES stripe.subscriptions(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
    amount_due INTEGER NOT NULL,
    amount_paid INTEGER NOT NULL,
    amount_remaining INTEGER NOT NULL,
    currency TEXT NOT NULL,
    invoice_pdf TEXT,
    hosted_invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe payment methods table
CREATE TABLE IF NOT EXISTS stripe.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_payment_method_id TEXT NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES stripe.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'alipay', 'au_becs_debit', 'bacs_debit', 'bancontact', 'eps', 'giropay', 'ideal', 'p24', 'sepa_debit', 'sofort')),
    card_brand TEXT,
    card_last4 TEXT,
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stripe webhook events table
CREATE TABLE IF NOT EXISTS stripe.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stripe_event_id TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    object TEXT NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscription plans table
CREATE TABLE IF NOT EXISTS stripe.user_plans (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium', 'enterprise')),
    subscription_id UUID REFERENCES stripe.subscriptions(id) ON DELETE SET NULL,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stripe.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe.user_plans ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_customers_user_id ON stripe.customers(user_id);
CREATE INDEX idx_customers_stripe_customer_id ON stripe.customers(stripe_customer_id);
CREATE INDEX idx_products_stripe_product_id ON stripe.products(stripe_product_id);
CREATE INDEX idx_prices_product_id ON stripe.prices(product_id);
CREATE INDEX idx_prices_stripe_price_id ON stripe.prices(stripe_price_id);
CREATE INDEX idx_subscriptions_customer_id ON stripe.subscriptions(customer_id);
CREATE INDEX idx_subscriptions_price_id ON stripe.subscriptions(price_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON stripe.subscriptions(stripe_subscription_id);
CREATE INDEX idx_invoices_customer_id ON stripe.invoices(customer_id);
CREATE INDEX idx_invoices_subscription_id ON stripe.invoices(subscription_id);
CREATE INDEX idx_invoices_stripe_invoice_id ON stripe.invoices(stripe_invoice_id);
CREATE INDEX idx_payment_methods_customer_id ON stripe.payment_methods(customer_id);
CREATE INDEX idx_payment_methods_stripe_payment_method_id ON stripe.payment_methods(stripe_payment_method_id);
CREATE INDEX idx_webhook_events_stripe_event_id ON stripe.webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON stripe.webhook_events(type);
CREATE INDEX idx_user_plans_user_id ON stripe.user_plans(user_id);
CREATE INDEX idx_user_plans_subscription_id ON stripe.user_plans(subscription_id);
