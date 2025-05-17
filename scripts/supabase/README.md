# Zenith Supabase Database Scripts

This directory contains SQL scripts for setting up and configuring the Supabase database for the Zenith research management platform.

## Overview

The scripts are organized into three main sections:

1. **Auth** - Authentication and user management
2. **Research** - Research project management
3. **Stripe** - Payment processing and subscription management

Each section contains scripts for:
- Schema and table creation
- Row Level Security (RLS) policies
- Database functions and stored procedures
- Storage configuration (where applicable)

## Execution Order

The scripts should be executed in the following order:

1. Auth scripts:
   - `auth/001_create_auth_schema.sql`
   - `auth/002_create_rls_policies.sql`
   - `auth/003_create_database_functions.sql`
   - `auth/004_create_storage_configuration.sql`

2. Research scripts:
   - `research/001_create_research_schema.sql`
   - `research/002_create_research_rls_policies.sql`
   - `research/003_create_research_functions.sql`

3. Stripe scripts:
   - `stripe/001_create_stripe_schema.sql`
   - `stripe/002_create_stripe_rls_policies.sql`
   - `stripe/003_create_stripe_functions.sql`

## Auth Schema

The auth schema contains tables and functions for user management:

- `users` - Core user information
- `user_profiles` - Extended user profile data
- `sessions` - User session management
- `email_verification_tokens` - Email verification
- `password_reset_tokens` - Password reset functionality

## Research Schema

The research schema contains tables and functions for research project management:

- `projects` - Research projects
- `project_collaborators` - Project collaboration
- `notes` - Research notes
- `documents` - Research documents
- `tasks` - Project tasks
- `tags` - Project categorization
- `comments` - Project discussions
- `activity_log` - Project activity tracking

## Stripe Schema

The stripe schema contains tables and functions for payment processing:

- `customers` - Stripe customer information
- `products` - Subscription products
- `prices` - Product pricing
- `subscriptions` - User subscriptions
- `invoices` - Payment invoices
- `payment_methods` - User payment methods
- `webhook_events` - Stripe webhook event logging
- `user_plans` - User subscription plans

## Row Level Security (RLS)

All tables have Row Level Security (RLS) policies to ensure data security:

- Users can only access their own data
- Project owners can manage their projects
- Project collaborators have appropriate access based on their role
- Public data is accessible to all users

## Database Functions

The scripts include various database functions for common operations:

- User registration and authentication
- Project creation and management
- Collaboration management
- Subscription handling
- Feature access control

## Storage Configuration

Storage buckets are configured for:

- User avatars
- Research documents
- Project assets

Each bucket has appropriate RLS policies to ensure secure access.

## Usage

To apply these scripts to your Supabase project:

1. Connect to your Supabase project using the SQL Editor
2. Execute each script in the order specified above
3. Verify that all tables, policies, and functions are created successfully

## Notes

- These scripts assume you have the necessary extensions enabled in your Supabase project (uuid-ossp, pgcrypto)
- The scripts use the Supabase auth.uid() function to identify the current user
- Some functions are marked as SECURITY DEFINER to allow them to bypass RLS policies when necessary
