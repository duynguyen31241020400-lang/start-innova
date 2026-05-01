const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const clientOptions = {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
};

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY trong file .env!");
}

if (!supabaseServiceRoleKey) {
  console.warn("Thiếu SUPABASE_SERVICE_ROLE_KEY. Các API quản trị có thể bị chặn bởi RLS.");
}

const createSupabaseClient = (key, options = {}) => {
  if (!supabaseUrl || !key) {
    return null;
  }

  return createClient(supabaseUrl, key, {
    ...clientOptions,
    ...options
  });
};

const supabaseAuth = createSupabaseClient(supabaseAnonKey);
const supabaseAdmin = createSupabaseClient(supabaseServiceRoleKey || supabaseAnonKey);
const createUserClient = (token) => createSupabaseClient(supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});

if (!supabaseAuth || !supabaseAdmin) {
  console.error("Không thể khởi tạo Supabase client. Kiểm tra lại biến môi trường.");
}

const supabase = supabaseAdmin;

module.exports = {
  supabase,
  supabaseAuth,
  supabaseAdmin,
  createUserClient,
  hasServiceRole: Boolean(supabaseServiceRoleKey)
};
