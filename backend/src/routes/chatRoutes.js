const express = require('express');
const { chat } = require('../controllers/chatController');
const { chatLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

router.post('/', chatLimiter, chat);

module.exports = router;
