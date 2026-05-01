require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const userRoutes = require('./src/routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

// Middleware
app.use(cors({ origin: corsOrigin, credentials: true })); // Cho phép Frontend gọi API
app.use(express.json()); // Parser JSON body

// Routes
app.use('/api/users', userRoutes);

// Root Endpoint
app.get('/', (req, res) => {
  res.json({ message: "Chào mừng đến với Start Innova Backend API!" });
});

if (require.main === module) {
  // Khởi chạy server khi chạy local bằng npm start/dev.
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  });
}

module.exports = app;
