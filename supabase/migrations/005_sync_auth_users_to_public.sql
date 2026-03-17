-- Auth.users kaydı olduğunda public.users'a otomatik satır ekler (kayıt sonrası giriş için gerekli)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  full_name text;
BEGIN
  full_name := COALESCE(
    TRIM(CONCAT(
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      ' ',
      COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    )),
    NEW.raw_user_meta_data->>'name',
    NEW.email
  );
  IF full_name IS NULL OR full_name = '' THEN
    full_name := NEW.email;
  END IF;

  INSERT INTO public.users (id, email, name, first_name, last_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    full_name,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
