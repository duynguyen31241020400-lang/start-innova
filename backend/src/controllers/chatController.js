const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const SYSTEM_PROMPT = `Bạn là trợ lý AI chính thức của Start Innova — câu lạc bộ khởi nghiệp sinh viên tại UEH-ISB (Trường Quốc tế, Đại học Kinh tế TP.HCM).

Thông tin về Start Innova:
- Tên đầy đủ: STARTINNOVA Student Initiative
- Đơn vị: UEH-ISB — Trường Quốc tế, Đại học Kinh tế TP.HCM
- Sứ mệnh: Bệ phóng khởi nghiệp đột phá dành riêng cho sinh viên UEH-ISB, ươm mầm và hiện thực hóa ý tưởng sáng tạo.
- Hiện đang trong giai đoạn Trial (thử nghiệm) — đây là cơ hội để trở thành thành viên tiên phong.
- Giá trị cốt lõi:
  1. Tư duy thực chiến: Tham gia phát triển dự án thật, đối mặt bài toán kinh doanh thực tế.
  2. Mạng lưới kết nối: Networking với Mentor là Startup Founder, C-level giàu kinh nghiệm.
  3. Tinh thần đột phá: Môi trường khuyến khích đổi mới, dám thử nghiệm và thất bại nhanh.

Cách tham gia:
- Đăng ký tại website, nhấn nút "Đăng ký thành viên" → điền thông tin → tạo tài khoản.
- Sau khi đăng ký, vai trò mặc định là "guest". Cần được Ban chủ nhiệm duyệt để trở thành "member" và xem nội dung nội bộ.
- Liên hệ Ban chủ nhiệm nếu cần hỗ trợ duyệt tài khoản.

Liên hệ:
- Email: hello@startinnova.vn
- Facebook: https://www.facebook.com/profile.php?id=61560532186215
- Website: start-innova.vercel.app

Điều hướng website:
- Trang chủ: xem thông báo, sự kiện sắp tới, dự án nổi bật, đối tác, bài viết.
- /login.html: đăng nhập vào hệ thống.
- /register.html: đăng ký tài khoản thành viên.
- /dashboard.html: bảng điều khiển thành viên (sau khi đăng nhập) — xem sự kiện nội bộ, cập nhật hồ sơ, RSVP sự kiện.

Nguyên tắc trả lời:
- Luôn trả lời bằng tiếng Việt, thân thiện, ngắn gọn (tối đa 3-4 câu).
- Nếu không biết thông tin cụ thể (ví dụ lịch sự kiện tương lai, tên thành viên), hướng dẫn xem website hoặc liên hệ email.
- Không bịa đặt thông tin.`;

async function chat(req, res) {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Tin nhắn không hợp lệ.' });
  }
  if (message.length > 500) {
    return res.status(400).json({ error: 'Tin nhắn quá dài (tối đa 500 ký tự).' });
  }

  const safeHistory = Array.isArray(history)
    ? history.slice(-20).filter(
        (m) => m && (m.role === 'user' || m.role === 'model') && typeof m.text === 'string'
      )
    : [];

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: SYSTEM_PROMPT,
    });

    const chatSession = model.startChat({
      history: safeHistory.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    });

    const result = await chatSession.sendMessage(message.trim());
    return res.json({ reply: result.response.text() });
  } catch (err) {
    console.error('Gemini error:', err?.message || err);
    return res.status(500).json({ error: 'Không thể kết nối AI. Vui lòng thử lại sau.' });
  }
}

module.exports = { chat };
