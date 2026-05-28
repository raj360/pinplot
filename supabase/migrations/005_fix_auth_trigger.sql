-- Fix handle_new_user trigger (signup "Database error saving new user")
-- Safe enum parsing, explicit search_path, grants for Supabase Auth.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role := 'TENANT';
  v_meta_role TEXT;
BEGIN
  v_meta_role := NULLIF(TRIM(NEW.raw_user_meta_data->>'role'), '');

  IF v_meta_role IS NOT NULL THEN
    BEGIN
      v_role := v_meta_role::user_role;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_role := 'TENANT';
    END;
  END IF;

  INSERT INTO public.profiles (
    id,
    role,
    first_name,
    last_name,
    phone,
    country_code
  )
  VALUES (
    NEW.id,
    v_role,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''),
    NULLIF(
      TRIM(
        COALESCE(
          NEW.phone,
          NEW.raw_user_meta_data->>'phone'
        )
      ),
      ''
    ),
    COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'country_code'), ''),
      'UG'
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Allow Supabase Auth service to invoke the trigger function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Profile row is created by trigger; allow authenticated users to read/update own row only
DROP POLICY IF EXISTS profiles_insert_own ON profiles;
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
