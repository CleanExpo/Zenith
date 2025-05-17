-- RLS Policies for stripe schema

-- Customers table policies
CREATE POLICY "Users can view their own customer data"
ON stripe.customers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all customer data"
ON stripe.customers
FOR ALL
USING (auth.role() = 'service_role');

-- Products table policies
CREATE POLICY "Everyone can view active products"
ON stripe.products
FOR SELECT
USING (active = TRUE);

CREATE POLICY "Service role can manage all products"
ON stripe.products
FOR ALL
USING (auth.role() = 'service_role');

-- Prices table policies
CREATE POLICY "Everyone can view active prices"
ON stripe.prices
FOR SELECT
USING (
  active = TRUE AND
  EXISTS (
    SELECT 1 FROM stripe.products
    WHERE id = stripe.prices.product_id AND active = TRUE
  )
);

CREATE POLICY "Service role can manage all prices"
ON stripe.prices
FOR ALL
USING (auth.role() = 'service_role');

-- Subscriptions table policies
CREATE POLICY "Users can view their own subscriptions"
ON stripe.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stripe.customers
    WHERE id = stripe.subscriptions.customer_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all subscriptions"
ON stripe.subscriptions
FOR ALL
USING (auth.role() = 'service_role');

-- Invoices table policies
CREATE POLICY "Users can view their own invoices"
ON stripe.invoices
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stripe.customers
    WHERE id = stripe.invoices.customer_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all invoices"
ON stripe.invoices
FOR ALL
USING (auth.role() = 'service_role');

-- Payment methods table policies
CREATE POLICY "Users can view their own payment methods"
ON stripe.payment_methods
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM stripe.customers
    WHERE id = stripe.payment_methods.customer_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage all payment methods"
ON stripe.payment_methods
FOR ALL
USING (auth.role() = 'service_role');

-- Webhook events table policies
CREATE POLICY "Service role can manage webhook events"
ON stripe.webhook_events
FOR ALL
USING (auth.role() = 'service_role');

-- User plans table policies
CREATE POLICY "Users can view their own plan"
ON stripe.user_plans
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all user plans"
ON stripe.user_plans
FOR ALL
USING (auth.role() = 'service_role');
