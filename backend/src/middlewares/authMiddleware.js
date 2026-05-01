const { supabaseAuth, supabaseAdmin } = require('../config/supabase');

// Middleware xác thực token từ Supabase
const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    
    if (!token) {
      return res.status(401).json({ error: 'Không tìm thấy token đăng nhập. Vui lòng thêm Bearer Token.' });
    }

    if (!supabaseAuth || !supabaseAdmin) {
      return res.status(500).json({ error: 'Server chưa được cấu hình Supabase.' });
    }

    // Xác thực token với Supabase
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    // Truy vấn role từ bảng public.users (Được tạo tự động qua Trigger khi đăng ký)
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return res.status(403).json({ error: 'Không tìm thấy thông tin quyền truy cập (Role) trong Database.' });
    }

    // Lưu thông tin user và role vào req để các middleware/controller sau sử dụng
    req.user = {
      ...user,
      role: userData.role
    };

    next();
  } catch (err) {
    return res.status(500).json({ error: 'Lỗi server trong quá trình xác thực.' });
  }
};

// Yêu cầu 2: Middleware Phân Quyền (Access Control)
// Ví dụ sử dụng: checkRole(['head', 'admin'])
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    // req.user phải tồn tại (đã đi qua requireAuth)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Truy cập bị từ chối: Không có quyền hạn nào được gán.' });
    }

    // Kiểm tra xem role của user hiện tại có nằm trong danh sách được phép không
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Truy cập bị từ chối: Quyền hạn của bạn là '${req.user.role}', nhưng yêu cầu [${allowedRoles.join(', ')}].` 
      });
    }

    // Nếu thỏa mãn, cho phép đi tiếp đến Controller
    next();
  };
};

module.exports = { requireAuth, checkRole };
