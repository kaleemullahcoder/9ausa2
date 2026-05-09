-- 1. Update the table default for future rows
ALTER TABLE users ALTER COLUMN account_balance SET DEFAULT 0;

-- 2. Update the function that handles new user creation (triggered by Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_unique_id TEXT;
BEGIN
  -- Generate unique user ID
  BEGIN
    user_unique_id := generate_unique_user_id();
  EXCEPTION WHEN OTHERS THEN
    -- Fallback if function fails
    user_unique_id := 'USER' || LPAD(FLOOR(RANDOM() * 900000 + 100000)::TEXT, 6, '0');
  END;
  
  -- Insert user profile with all required fields
  -- UPDATED: account_balance is now 0 (was 1500)
  INSERT INTO public.users (
    id, 
    email, 
    name, 
    account_balance, 
    total_invested, 
    trading_level, 
    member_since,
    unique_user_id,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'user@example.com'), '@', 1), 'User'),
    0, -- CHANGED FROM 1500 TO 0
    0,
    'Beginner',
    NOW(),
    user_unique_id,
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, users.email),
    name = COALESCE(EXCLUDED.name, users.name),
    unique_user_id = COALESCE(users.unique_user_id, EXCLUDED.unique_user_id);
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the auth signup
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
