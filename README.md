# Start Innova

Static frontend + Express backend cho Start Innova.

## Chay local

1. Dien backend env:

```powershell
cd backend
Copy-Item .env.example .env
cd ..
```

Sau do cap nhat `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

2. Dien frontend config:

```powershell
Copy-Item frontend-config.example.js frontend-config.js
```

Cap nhat `supabaseUrl`, `supabaseAnonKey`, `apiBaseUrl`.

Khi deploy len Vercel, khong can commit `frontend-config.js`. Build script se tao file nay tu env:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
FRONTEND_API_BASE_URL
```

`FRONTEND_API_BASE_URL` co the de trong de frontend goi API cung domain tren Vercel.

3. Cai dependency backend:

```powershell
cd backend
npm install
npm run dev
```

4. Mo frontend bang static server tai repo root, vi du:

```powershell
npx http-server . -p 3000
```

Sau do truy cap `http://localhost:3000`.

## Supabase

Neu tao database lan dau, chay `backend/database-schema.sql` trong Supabase SQL Editor.

Neu da co bang `public.users`, chay them migration:

```text
backend/migrations/001_profile_fields.sql
```

User dang ky moi se co role mac dinh `guest`. Hay set user dau tien thanh `head` trong Supabase SQL Editor de mo quyen admin.

```sql
UPDATE public.users
SET role = 'head'
WHERE email = 'email-cua-ban@example.com';
```
