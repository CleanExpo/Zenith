-- Zenith Platform Database Initialization
-- This file sets up the initial database configuration

-- Create database if it doesn't exist (handled by Docker)
-- The postgres Docker image will create the database automatically

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create performance indexes after Prisma migrations
-- Note: These will be created after the schema is deployed

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Initialize database settings for optimal performance
ALTER DATABASE zenith_db SET timezone = 'UTC';
ALTER DATABASE zenith_db SET log_statement = 'all';
ALTER DATABASE zenith_db SET log_min_duration_statement = 1000;

-- Create custom types that might be needed
DO $$ 
BEGIN
    -- This will be handled by Prisma migrations
    NULL;
END $$;