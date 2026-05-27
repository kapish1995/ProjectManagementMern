const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db');
const { getNotifications, markAllRead, getDashboardStats } = require('./controllers/uploadController');
const { protect } = require('./middleware/auth');

// Connect MongoDB
connectDB();

const app = express();

// Create uploads folder if not exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));

// Dashboard & Notifications
app.get('/api/dashboard', protect, getDashboardStats);
app.get('/api/notifications', protect, getNotifications);
app.put('/api/notifications/read', protect, markAllRead);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Server is running!' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
