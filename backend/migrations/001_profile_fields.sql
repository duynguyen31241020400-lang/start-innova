ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mssv TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_public_user_updated ON public.users;

CREATE TRIGGER on_public_user_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, mssv, department, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'mssv',
    new.raw_user_meta_data->>'department',
    'guest'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

