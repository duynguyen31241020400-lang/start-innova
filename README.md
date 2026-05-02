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

Khi deploy len Vercel, khong can commit `frontend-config.js`. Build script se tao file nay tu env.

**Bien cho frontend build** — can du URL + anon key (mot trong hai cap):

- `SUPABASE_URL` + `SUPABASE_ANON_KEY`, hoac
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Bien cho API serverless (`/api/*`)** — can cho backend:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — bat buoc cho xoa user khoi Auth, va nen co de admin API khong bi RLS chan sai y dinh

**Tuy chon:**

- `FRONTEND_API_BASE_URL` — de trong tren Vercel de frontend goi `/api` cung domain

**Preview deployments:** Trong Vercel Project Settings > Environment Variables, them cung cac key cho muc **Preview** (neu khong, deploy preview co the thieu config).

Tham khao danh sach day du tai `.env.example` trong repo root.

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
