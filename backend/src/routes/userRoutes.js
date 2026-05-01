const express = require('express');
const { requireAuth, checkRole } = require('../middlewares/authMiddleware');
const { getAllUsers, updateUserRole, deleteUser, getClubData } = require('../controllers/userController');

const router = express.Router();

// Tất cả endpoints dưới đây đều yêu cầu phải có Token hợp lệ (đã đăng nhập)
router.use(requireAuth);

// -------------------------------------------------------------
// NHÓM API QUẢN TRỊ (Chỉ 'head' hoặc 'admin' mới được truy cập)
// -------------------------------------------------------------

// Xem toàn bộ dữ liệu users
// Cấu hình: 'head' và 'admin' đều xem được
router.get('/all', checkRole(['head', 'admin']), getAllUsers);

// Thay đổi role của một email bất kỳ
router.put('/role', checkRole(['head', 'admin']), updateUserRole);

// Truy cập mang tính phá hủy (chỉ dành riêng cho 'head')
router.delete('/by-email/:email', checkRole(['head']), deleteUser);

// -------------------------------------------------------------
// NHÓM API THÀNH VIÊN CLB
// -------------------------------------------------------------

// Các tài khoản role = 'member' (hoặc cao hơn) mới xem được dữ liệu chung
router.get('/club-data', checkRole(['head', 'admin', 'member']), getClubData);

// -------------------------------------------------------------
// NHÓM API PHỔ THÔNG (Khách/Customer)
// Những tài khoản role = 'guest', 'customer' chỉ cần lấy nội dung frontend
// Họ không cần request API này, hoặc API này sẽ có checkRole lỏng lẻo hơn.
// Ví dụ:
router.get('/public-profile', checkRole(['head', 'admin', 'member', 'guest', 'customer']), (req, res) => {
  res.json({ message: "Chào bạn, đây là profile của bạn.", user: req.user });
});

module.exports = router;
