const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const http = require('http');
require('dotenv').config({ path: __dirname + '/.env' });

const connectDB = require('./config/db');
const { getNotifications, markAllRead, getDashboardStats } = require('./controllers/uploadController');
const { protect } = require('./middleware/auth');
const Message = require('./models/Message');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

// Connect MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Frontend URL
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Socket.io setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { 
    origin: FRONTEND_URL, 
    methods: ['GET', 'POST'], 
    credentials: true 
  },
});

// Socket.io auth middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name avatar');
    if (!user) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.user.name);

  // Join project room
  socket.on('join_project', (projectId) => {
    socket.join(projectId);
    console.log(socket.user.name + ' joined project: ' + projectId);
  });

  // Leave project room
  socket.on('leave_project', (projectId) => {
    socket.leave(projectId);
  });

  // Send message
  socket.on('send_message', async ({ projectId, text }) => {
    try {
      if (!text?.trim()) return;

      const message = await Message.create({
        project: projectId,
        sender: socket.user._id,
        text: text.trim(),
      });

      const populated = await Message.findById(message._id).populate('sender', 'name avatar');

      // Broadcast to all in room including sender
      io.to(projectId).emit('receive_message', populated);
    } catch (err) {
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', ({ projectId, isTyping }) => {
    socket.to(projectId).emit('user_typing', {
      name: socket.user.name,
      isTyping,
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.user.name);
  });
});

// Create uploads folder
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Middleware
app.use(cors({ 
  origin: [
    "http://localhost:3000",
    "https://project-management-mern-wxzd.vercel.app"
  ], 
  credentials: true 
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Dashboard & Notifications
app.get('/api/dashboard', protect, getDashboardStats);
app.get('/api/notifications', protect, getNotifications);
app.put('/api/notifications/read', protect, markAllRead);

// Health check
app.get('/api/health', (req, res) => res.json({ success: true, message: 'Server running!' }));

// Error handler
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});