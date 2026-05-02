const rateLimit = require('express-rate-limit');

const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' }
});

const broadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Giới hạn gửi email: thử lại sau một giờ.' }
});

module.exports = { sensitiveLimiter, broadcastLimiter };
