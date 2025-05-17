-- Database functions for authentication and user management

-- Function to register a new user
CREATE OR REPLACE FUNCTION auth.register_user(
  email TEXT,
  password TEXT,
  full_name TEXT
)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT) AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Insert into users table
  INSERT INTO auth.users (email, encrypted_password)
  VALUES (email, crypt(password, gen_salt('bf')))
  RETURNING id INTO new_user_id;

  -- Insert into user_profiles
  INSERT INTO auth.user_profiles (user_id, full_name)
  VALUES (new_user_id, full_name);

  -- Return the newly created user
  RETURN QUERY
  SELECT new_user_id, email, full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to login a user
CREATE OR REPLACE FUNCTION auth.login_user(
  email TEXT,
  password TEXT
)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT, role TEXT) AS $$
BEGIN
  -- Return user if credentials are valid
  RETURN QUERY
  SELECT u.id, u.email, p.full_name, p.role
  FROM auth.users u
  JOIN auth.user_profiles p ON u.id = p.user_id
  WHERE u.email = email AND u.encrypted_password = crypt(password, u.encrypted_password);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset password
CREATE OR REPLACE FUNCTION auth.reset_password(
  user_id UUID,
  new_password TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update user's password
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user profile
CREATE OR REPLACE FUNCTION auth.update_user_profile(
  user_id UUID,
  new_full_name TEXT,
  new_avatar_url TEXT,
  new_organization TEXT
)
RETURNS VOID AS $$
BEGIN
  -- Update user profile
  UPDATE auth.user_profiles
  SET full_name = new_full_name,
      avatar_url = new_avatar_url,
      organization = new_organization,
      updated_at = NOW()
  WHERE user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a verification token
CREATE OR REPLACE FUNCTION auth.create_verification_token(
  user_id UUID
)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate a random token
  token := gen_random_uuid()::TEXT;

  -- Store the token and set expiration (1 hour from now)
  INSERT INTO auth.email_verification_tokens (user_id, token, expires_at)
  VALUES (user_id, token, NOW() + INTERVAL '1 hour')
  ON CONFLICT (user_id) DO UPDATE
  SET token = EXCLUDED.token,
      expires_at = EXCLUDED.expires_at;

  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify email
CREATE OR REPLACE FUNCTION auth.verify_email(
  token TEXT
)
RETURNS TABLE(id UUID, email TEXT, full_name TEXT) AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Find the user_id associated with the token
  SELECT user_id INTO user_id
  FROM auth.email_verification_tokens
  WHERE token = verify_email.token
    AND expires_at > NOW();

  -- If token not found or expired, raise exception
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired token';
  END IF;

  -- Update user's email verification status
  UPDATE auth.users
  SET email_verified = TRUE
  WHERE id = user_id;

  -- Delete the used token
  DELETE FROM auth.email_verification_tokens
  WHERE user_id = user_id;

  -- Return the verified user
  RETURN QUERY
  SELECT u.id, u.email, p.full_name
  FROM auth.users u
  JOIN auth.user_profiles p ON u.id = p.user_id
  WHERE u.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a password reset token
CREATE OR REPLACE FUNCTION auth.create_password_reset_token(
  email TEXT
)
RETURNS TEXT AS $$
DECLARE
  user_id UUID;
  token TEXT;
BEGIN
  -- Get user_id from email
  SELECT id INTO user_id
  FROM auth.users
  WHERE email = create_password_reset_token.email;

  -- If user not found, raise exception
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Generate a random token
  token := gen_random_uuid()::TEXT;

  -- Store the token and set expiration (1 hour from now)
  INSERT INTO auth.password_reset_tokens (user_id, token, expires_at)
  VALUES (user_id, token, NOW() + INTERVAL '1 hour')
  ON CONFLICT (user_id) DO UPDATE
  SET token = EXCLUDED.token,
      expires_at = EXCLUDED.expires_at;

  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
