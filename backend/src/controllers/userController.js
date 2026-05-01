const { supabaseAdmin, hasServiceRole } = require('../config/supabase');

const validRoles = ['head', 'admin', 'member', 'guest', 'customer'];

// API Admin: Xem toàn bộ database user (Chỉ dành cho 'head' hoặc 'admin')
const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, mssv, department, role, created_at, updated_at')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    return res.status(200).json({
      message: "Lấy dữ liệu thành công.",
      total: data.length,
      data
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Yêu cầu 3: Lựa chọn tài khoản truy cập
// Cập nhật role của user (Chỉ Admin/Head mới được dùng API này)
const updateUserRole = async (req, res) => {
  try {
    const { email, newRole } = req.body;

    if (!email || !newRole) {
      return res.status(400).json({ error: 'Vui lòng cung cấp email và newRole.' });
    }

    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: `Role không hợp lệ. Vui lòng chọn: ${validRoles.join(', ')}` });
    }

    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('users')
      .select('email, role')
      .eq('email', email)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({ error: `Không tìm thấy tài khoản với email: ${email}` });
    }

    if (req.user.role !== 'head' && (newRole === 'head' || targetUser.role === 'head')) {
      return res.status(403).json({ error: 'Chỉ head mới được thay đổi role head.' });
    }

    // Cập nhật role trong bảng public.users 
    // (Lưu ý: Bạn phải dùng chuỗi supabase được init bằng SERVICE_ROLE_KEY mới bypass được RLS nếu Row Level Security đang chặn UPDATE)
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('email', email)
      .select();

    if (error) throw error;
    
    if (data.length === 0) {
      return res.status(404).json({ error: `Không tìm thấy tài khoản với email: ${email}` });
    }

    return res.status(200).json({ 
      message: `Đã thay đổi quyền của email ${email} thành [${newRole}] thành công!`, 
      user: data[0] 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Xóa user khỏi cơ sở dữ liệu (Ví dụ thêm cho quyền 'head')
const deleteUser = async (req, res) => {
  try {
    const { email } = req.params;

    if (!hasServiceRole) {
      return res.status(500).json({ error: 'Cần SUPABASE_SERVICE_ROLE_KEY để xóa user trong Supabase Auth.' });
    }
    
    const { data: user, error: findError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (findError || !user) {
      return res.status(404).json({ error: `Không tìm thấy tài khoản với email: ${email}` });
    }

    // Xóa auth.users trước, public.users sẽ bị xóa cascade theo FK.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return res.status(200).json({ message: `Đã xóa user ${email} khỏi hệ thống.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// API lấy dữ liệu chung của câu lạc bộ (Dành cho member, admin, head)
const getClubData = async (req, res) => {
  return res.status(200).json({ 
    message: "Đây là dữ liệu nội bộ của Start Innova (Chỉ dành cho Member trở lên).", 
    data: [
      { id: 1, info: "Kế hoạch quý 3 2026" },
      { id: 2, info: "Tài liệu R&D Knowledge Hub" }
    ] 
  });
};

module.exports = { getAllUsers, updateUserRole, deleteUser, getClubData };
