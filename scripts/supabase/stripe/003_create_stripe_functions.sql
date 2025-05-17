-- Database functions for Stripe integration

-- Function to create or update a Stripe customer
CREATE OR REPLACE FUNCTION stripe.create_customer(
  user_id UUID,
  stripe_customer_id TEXT,
  email TEXT,
  name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  customer_id UUID;
BEGIN
  -- Check if customer already exists
  SELECT id INTO customer_id
  FROM stripe.customers
  WHERE stripe.customers.user_id = create_customer.user_id;

  IF customer_id IS NULL THEN
    -- Create new customer
    INSERT INTO stripe.customers (user_id, stripe_customer_id, email, name)
    VALUES (create_customer.user_id, create_customer.stripe_customer_id, create_customer.email, create_customer.name)
    RETURNING id INTO customer_id;
  ELSE
    -- Update existing customer
    UPDATE stripe.customers
    SET stripe_customer_id = create_customer.stripe_customer_id,
        email = create_customer.email,
        name = create_customer.name,
        updated_at = NOW()
    WHERE id = customer_id;
  END IF;

  RETURN customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update a Stripe product
CREATE OR REPLACE FUNCTION stripe.create_product(
  stripe_product_id TEXT,
  name TEXT,
  description TEXT DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  product_id UUID;
BEGIN
  -- Check if product already exists
  SELECT id INTO product_id
  FROM stripe.products
  WHERE stripe_product_id = create_product.stripe_product_id;

  IF product_id IS NULL THEN
    -- Create new product
    INSERT INTO stripe.products (stripe_product_id, name, description, active, metadata)
    VALUES (create_product.stripe_product_id, create_product.name, create_product.description, create_product.active, create_product.metadata)
    RETURNING id INTO product_id;
  ELSE
    -- Update existing product
    UPDATE stripe.products
    SET name = create_product.name,
        description = create_product.description,
        active = create_product.active,
        metadata = create_product.metadata,
        updated_at = NOW()
    WHERE id = product_id;
  END IF;

  RETURN product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update a Stripe price
CREATE OR REPLACE FUNCTION stripe.create_price(
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  currency TEXT,
  unit_amount INTEGER,
  type TEXT,
  interval TEXT DEFAULT NULL,
  interval_count INTEGER DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  price_id UUID;
  product_id UUID;
BEGIN
  -- Get product ID
  SELECT id INTO product_id
  FROM stripe.products
  WHERE stripe_product_id = create_price.stripe_product_id;

  IF product_id IS NULL THEN
    RAISE EXCEPTION 'Product with Stripe ID % not found', stripe_product_id;
  END IF;

  -- Check if price already exists
  SELECT id INTO price_id
  FROM stripe.prices
  WHERE stripe_price_id = create_price.stripe_price_id;

  IF price_id IS NULL THEN
    -- Create new price
    INSERT INTO stripe.prices (
      stripe_price_id, product_id, currency, unit_amount, type, 
      interval, interval_count, active, metadata
    )
    VALUES (
      create_price.stripe_price_id, product_id, create_price.currency, 
      create_price.unit_amount, create_price.type, create_price.interval, 
      create_price.interval_count, create_price.active, create_price.metadata
    )
    RETURNING id INTO price_id;
  ELSE
    -- Update existing price
    UPDATE stripe.prices
    SET product_id = product_id,
        currency = create_price.currency,
        unit_amount = create_price.unit_amount,
        type = create_price.type,
        interval = create_price.interval,
        interval_count = create_price.interval_count,
        active = create_price.active,
        metadata = create_price.metadata,
        updated_at = NOW()
    WHERE id = price_id;
  END IF;

  RETURN price_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update a Stripe subscription
CREATE OR REPLACE FUNCTION stripe.create_subscription(
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  stripe_price_id TEXT,
  status TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at TIMESTAMPTZ DEFAULT NULL,
  canceled_at TIMESTAMPTZ DEFAULT NULL,
  trial_start TIMESTAMPTZ DEFAULT NULL,
  trial_end TIMESTAMPTZ DEFAULT NULL,
  metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  subscription_id UUID;
  customer_id UUID;
  price_id UUID;
  user_id UUID;
  plan_type TEXT;
BEGIN
  -- Get customer ID
  SELECT id, user_id INTO customer_id, user_id
  FROM stripe.customers
  WHERE stripe_customer_id = create_subscription.stripe_customer_id;

  IF customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer with Stripe ID % not found', stripe_customer_id;
  END IF;

  -- Get price ID
  SELECT id INTO price_id
  FROM stripe.prices
  WHERE stripe_price_id = create_subscription.stripe_price_id;

  IF price_id IS NULL THEN
    RAISE EXCEPTION 'Price with Stripe ID % not found', stripe_price_id;
  END IF;

  -- Check if subscription already exists
  SELECT id INTO subscription_id
  FROM stripe.subscriptions
  WHERE stripe_subscription_id = create_subscription.stripe_subscription_id;

  IF subscription_id IS NULL THEN
    -- Create new subscription
    INSERT INTO stripe.subscriptions (
      stripe_subscription_id, customer_id, price_id, status, 
      current_period_start, current_period_end, cancel_at, 
      canceled_at, trial_start, trial_end, metadata
    )
    VALUES (
      create_subscription.stripe_subscription_id, customer_id, price_id, 
      create_subscription.status, create_subscription.current_period_start, 
      create_subscription.current_period_end, create_subscription.cancel_at, 
      create_subscription.canceled_at, create_subscription.trial_start, 
      create_subscription.trial_end, create_subscription.metadata
    )
    RETURNING id INTO subscription_id;
  ELSE
    -- Update existing subscription
    UPDATE stripe.subscriptions
    SET customer_id = customer_id,
        price_id = price_id,
        status = create_subscription.status,
        current_period_start = create_subscription.current_period_start,
        current_period_end = create_subscription.current_period_end,
        cancel_at = create_subscription.cancel_at,
        canceled_at = create_subscription.canceled_at,
        trial_start = create_subscription.trial_start,
        trial_end = create_subscription.trial_end,
        metadata = create_subscription.metadata,
        updated_at = NOW()
    WHERE id = subscription_id;
  END IF;

  -- Determine plan type based on price
  SELECT 
    CASE 
      WHEN p.unit_amount <= 0 THEN 'free'
      WHEN p.unit_amount <= 1000 THEN 'basic'
      WHEN p.unit_amount <= 5000 THEN 'premium'
      ELSE 'enterprise'
    END INTO plan_type
  FROM stripe.prices p
  WHERE p.id = price_id;

  -- Update user plan
  IF create_subscription.status = 'active' OR create_subscription.status = 'trialing' THEN
    -- Create or update user plan
    INSERT INTO stripe.user_plans (user_id, plan_type, subscription_id)
    VALUES (user_id, plan_type, subscription_id)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      plan_type = EXCLUDED.plan_type,
      subscription_id = EXCLUDED.subscription_id,
      updated_at = NOW();
  ELSIF create_subscription.status = 'canceled' OR create_subscription.status = 'unpaid' THEN
    -- Downgrade to free plan if subscription is canceled or unpaid
    UPDATE stripe.user_plans
    SET plan_type = 'free',
        subscription_id = NULL,
        updated_at = NOW()
    WHERE user_id = user_id;
  END IF;

  RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update a Stripe invoice
CREATE OR REPLACE FUNCTION stripe.create_invoice(
  stripe_invoice_id TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT DEFAULT NULL,
  status TEXT,
  amount_due INTEGER,
  amount_paid INTEGER,
  amount_remaining INTEGER,
  currency TEXT,
  invoice_pdf TEXT DEFAULT NULL,
  hosted_invoice_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  invoice_id UUID;
  customer_id UUID;
  subscription_id UUID;
BEGIN
  -- Get customer ID
  SELECT id INTO customer_id
  FROM stripe.customers
  WHERE stripe_customer_id = create_invoice.stripe_customer_id;

  IF customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer with Stripe ID % not found', stripe_customer_id;
  END IF;

  -- Get subscription ID if provided
  IF stripe_subscription_id IS NOT NULL THEN
    SELECT id INTO subscription_id
    FROM stripe.subscriptions
    WHERE stripe_subscription_id = create_invoice.stripe_subscription_id;
  END IF;

  -- Check if invoice already exists
  SELECT id INTO invoice_id
  FROM stripe.invoices
  WHERE stripe_invoice_id = create_invoice.stripe_invoice_id;

  IF invoice_id IS NULL THEN
    -- Create new invoice
    INSERT INTO stripe.invoices (
      stripe_invoice_id, customer_id, subscription_id, status, 
      amount_due, amount_paid, amount_remaining, currency, 
      invoice_pdf, hosted_invoice_url
    )
    VALUES (
      create_invoice.stripe_invoice_id, customer_id, subscription_id, 
      create_invoice.status, create_invoice.amount_due, create_invoice.amount_paid, 
      create_invoice.amount_remaining, create_invoice.currency, 
      create_invoice.invoice_pdf, create_invoice.hosted_invoice_url
    )
    RETURNING id INTO invoice_id;
  ELSE
    -- Update existing invoice
    UPDATE stripe.invoices
    SET customer_id = customer_id,
        subscription_id = subscription_id,
        status = create_invoice.status,
        amount_due = create_invoice.amount_due,
        amount_paid = create_invoice.amount_paid,
        amount_remaining = create_invoice.amount_remaining,
        currency = create_invoice.currency,
        invoice_pdf = create_invoice.invoice_pdf,
        hosted_invoice_url = create_invoice.hosted_invoice_url,
        updated_at = NOW()
    WHERE id = invoice_id;
  END IF;

  RETURN invoice_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create or update a Stripe payment method
CREATE OR REPLACE FUNCTION stripe.create_payment_method(
  stripe_payment_method_id TEXT,
  stripe_customer_id TEXT,
  type TEXT,
  card_brand TEXT DEFAULT NULL,
  card_last4 TEXT DEFAULT NULL,
  card_exp_month INTEGER DEFAULT NULL,
  card_exp_year INTEGER DEFAULT NULL,
  is_default BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  payment_method_id UUID;
  customer_id UUID;
BEGIN
  -- Get customer ID
  SELECT id INTO customer_id
  FROM stripe.customers
  WHERE stripe_customer_id = create_payment_method.stripe_customer_id;

  IF customer_id IS NULL THEN
    RAISE EXCEPTION 'Customer with Stripe ID % not found', stripe_customer_id;
  END IF;

  -- Check if payment method already exists
  SELECT id INTO payment_method_id
  FROM stripe.payment_methods
  WHERE stripe_payment_method_id = create_payment_method.stripe_payment_method_id;

  IF payment_method_id IS NULL THEN
    -- Create new payment method
    INSERT INTO stripe.payment_methods (
      stripe_payment_method_id, customer_id, type, card_brand, 
      card_last4, card_exp_month, card_exp_year, is_default
    )
    VALUES (
      create_payment_method.stripe_payment_method_id, customer_id, 
      create_payment_method.type, create_payment_method.card_brand, 
      create_payment_method.card_last4, create_payment_method.card_exp_month, 
      create_payment_method.card_exp_year, create_payment_method.is_default
    )
    RETURNING id INTO payment_method_id;
  ELSE
    -- Update existing payment method
    UPDATE stripe.payment_methods
    SET customer_id = customer_id,
        type = create_payment_method.type,
        card_brand = create_payment_method.card_brand,
        card_last4 = create_payment_method.card_last4,
        card_exp_month = create_payment_method.card_exp_month,
        card_exp_year = create_payment_method.card_exp_year,
        is_default = create_payment_method.is_default,
        updated_at = NOW()
    WHERE id = payment_method_id;
  END IF;

  -- If this is the default payment method, unset other default payment methods
  IF create_payment_method.is_default THEN
    UPDATE stripe.payment_methods
    SET is_default = FALSE
    WHERE customer_id = customer_id AND id != payment_method_id;
  END IF;

  RETURN payment_method_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a Stripe webhook event
CREATE OR REPLACE FUNCTION stripe.record_webhook_event(
  stripe_event_id TEXT,
  type TEXT,
  object TEXT,
  data JSONB
)
RETURNS UUID AS $$
DECLARE
  event_id UUID;
BEGIN
  -- Insert webhook event
  INSERT INTO stripe.webhook_events (stripe_event_id, type, object, data)
  VALUES (record_webhook_event.stripe_event_id, record_webhook_event.type, record_webhook_event.object, record_webhook_event.data)
  RETURNING id INTO event_id;

  RETURN event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user subscription plan
CREATE OR REPLACE FUNCTION stripe.get_user_plan(
  user_id UUID
)
RETURNS TABLE(
  plan_type TEXT,
  subscription_id UUID,
  subscription_status TEXT,
  current_period_end TIMESTAMPTZ,
  features JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    up.plan_type,
    up.subscription_id,
    s.status,
    s.current_period_end,
    up.features
  FROM stripe.user_plans up
  LEFT JOIN stripe.subscriptions s ON up.subscription_id = s.id
  WHERE up.user_id = get_user_plan.user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if a user has access to a specific feature
CREATE OR REPLACE FUNCTION stripe.has_feature_access(
  user_id UUID,
  feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_plan TEXT;
  feature_access BOOLEAN;
BEGIN
  -- Get user's plan type
  SELECT plan_type INTO user_plan
  FROM stripe.user_plans
  WHERE user_id = has_feature_access.user_id;

  -- Default to free plan if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Check feature access based on plan type
  CASE
    WHEN feature_name = 'max_projects' THEN
      feature_access := CASE
        WHEN user_plan = 'free' THEN TRUE -- Free users can have up to 3 projects
        WHEN user_plan = 'basic' THEN TRUE -- Basic users can have up to 10 projects
        WHEN user_plan = 'premium' THEN TRUE -- Premium users can have up to 50 projects
        WHEN user_plan = 'enterprise' THEN TRUE -- Enterprise users have unlimited projects
        ELSE FALSE
      END;
    WHEN feature_name = 'collaborators' THEN
      feature_access := CASE
        WHEN user_plan = 'free' THEN FALSE -- Free users cannot have collaborators
        WHEN user_plan = 'basic' THEN TRUE -- Basic users can have up to 3 collaborators per project
        WHEN user_plan = 'premium' THEN TRUE -- Premium users can have up to 10 collaborators per project
        WHEN user_plan = 'enterprise' THEN TRUE -- Enterprise users have unlimited collaborators
        ELSE FALSE
      END;
    WHEN feature_name = 'storage' THEN
      feature_access := CASE
        WHEN user_plan = 'free' THEN TRUE -- Free users have limited storage (100MB)
        WHEN user_plan = 'basic' THEN TRUE -- Basic users have more storage (1GB)
        WHEN user_plan = 'premium' THEN TRUE -- Premium users have even more storage (10GB)
        WHEN user_plan = 'enterprise' THEN TRUE -- Enterprise users have the most storage (100GB)
        ELSE FALSE
      END;
    WHEN feature_name = 'api_access' THEN
      feature_access := CASE
        WHEN user_plan = 'free' THEN FALSE -- Free users don't have API access
        WHEN user_plan = 'basic' THEN FALSE -- Basic users don't have API access
        WHEN user_plan = 'premium' THEN TRUE -- Premium users have API access
        WHEN user_plan = 'enterprise' THEN TRUE -- Enterprise users have API access
        ELSE FALSE
      END;
    ELSE
      feature_access := FALSE; -- Unknown feature
  END CASE;

  RETURN feature_access;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get feature limits for a user
CREATE OR REPLACE FUNCTION stripe.get_feature_limits(
  user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  user_plan TEXT;
  limits JSONB;
BEGIN
  -- Get user's plan type
  SELECT plan_type INTO user_plan
  FROM stripe.user_plans
  WHERE user_id = get_feature_limits.user_id;

  -- Default to free plan if no plan found
  IF user_plan IS NULL THEN
    user_plan := 'free';
  END IF;

  -- Set limits based on plan type
  CASE
    WHEN user_plan = 'free' THEN
      limits := jsonb_build_object(
        'max_projects', 3,
        'max_collaborators_per_project', 0,
        'max_storage_mb', 100,
        'api_access', false
      );
    WHEN user_plan = 'basic' THEN
      limits := jsonb_build_object(
        'max_projects', 10,
        'max_collaborators_per_project', 3,
        'max_storage_mb', 1024,
        'api_access', false
      );
    WHEN user_plan = 'premium' THEN
      limits := jsonb_build_object(
        'max_projects', 50,
        'max_collaborators_per_project', 10,
        'max_storage_mb', 10240,
        'api_access', true
      );
    WHEN user_plan = 'enterprise' THEN
      limits := jsonb_build_object(
        'max_projects', -1, -- Unlimited
        'max_collaborators_per_project', -1, -- Unlimited
        'max_storage_mb', 102400,
        'api_access', true
      );
    ELSE
      limits := jsonb_build_object(
        'max_projects', 3,
        'max_collaborators_per_project', 0,
        'max_storage_mb', 100,
        'api_access', false
      );
  END CASE;

  RETURN limits;
END;
$$ LANGUAGE plpgsql STABLE;
