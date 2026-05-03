require('dotenv').config();
const express = require('express');
const cors = require('cors');

const userRoutes = require('./src/routes/userRoutes');
const publicRoutes = require('./src/routes/publicRoutes');
const adminContentRoutes = require('./src/routes/adminContentRoutes');
const eventRsvpRoutes = require('./src/routes/eventRsvpRoutes');
const chatRoutes = require('./src/routes/chatRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminContentRoutes);
app.use('/api/events', eventRsvpRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

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
