-- RLS Policies for auth schema

-- Users table policies
CREATE POLICY "Users can view their own data" ON auth.users
  FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data" ON auth.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- User profiles table policies
CREATE POLICY "Users can view all profiles" ON auth.user_profiles
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update their own profile" ON auth.user_profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Sessions table policies
CREATE POLICY "Users can view their own sessions" ON auth.sessions
  FOR SELECT
  USING (user_id = auth.uid());

-- Email verification tokens table policies
CREATE POLICY "Users can view their own verification tokens" ON auth.email_verification_tokens
  FOR SELECT
  USING (user_id = auth.uid());

-- Password reset tokens table policies
CREATE POLICY "Users can view their own reset tokens" ON auth.password_reset_tokens
  FOR SELECT
  USING (user_id = auth.uid());

-- Enable required extensions for auth
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
