const express = require('express');
const { getPublicSummary } = require('../controllers/contentController');

const router = express.Router();

router.get('/summary', getPublicSummary);

module.exports = router;
