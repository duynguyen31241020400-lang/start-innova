-- Yêu cầu 1: Thiết kế Database cho Start Innova
-- Enum role
CREATE TYPE user_role AS ENUM ('head', 'admin', 'member', 'guest', 'customer');

-- Bảng users
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  mssv TEXT,
  department TEXT,
  role user_role DEFAULT 'guest'::user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bật bảo mật Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies cơ bản (Backend API sử dụng Token/Service Role sẽ override hoặc tuân theo RLS)
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Trigger: Tự động cập nhật updated_at khi sửa profile/role
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_public_user_updated
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger: Tự động thêm row vào bảng public.users khi có user mới đăng ký tại auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, mssv, department, role)
  VALUES (
    new.id, 
    new.email, 
    -- Tùy thuộc vào metadata được parse từ Google Login hoặc Email/Password
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'mssv',
    new.raw_user_meta_data->>'department',
    'guest' -- Mặc định khi đăng ký ban đầu là 'guest'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
