const multer = require('multer');
const path = require('path');
const Task = require('../models/Task');
const User = require('../models/User');

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  ext ? cb(null, true) : cb(new Error('File type not allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// @POST /api/tasks/:id/upload
const uploadFile = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.attachments.push({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
    });
    await task.save();

    res.json({ success: true, attachments: task.attachments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ success: true, notifications: user.notifications.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/notifications/read
const markAllRead = async (req, res) => {
  try {
    await User.updateOne(
      { _id: req.user._id },
      { $set: { 'notifications.$[].isRead': true } }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const Project = require('../models/Project');
    const Task = require('../models/Task');

    const totalProjects = await Project.countDocuments({ 'members.user': req.user._id });
    const totalTasks = await Task.countDocuments({ assignedTo: req.user._id });
    const completedTasks = await Task.countDocuments({ assignedTo: req.user._id, status: 'done' });
    const inProgressTasks = await Task.countDocuments({ assignedTo: req.user._id, status: 'in-progress' });
    const todoTasks = await Task.countDocuments({ assignedTo: req.user._id, status: 'todo' });

    const recentTasks = await Task.find({ assignedTo: req.user._id })
      .populate('project', 'name')
      .sort({ updatedAt: -1 })
      .limit(5);

    const recentProjects = await Project.find({ 'members.user': req.user._id })
      .sort({ updatedAt: -1 })
      .limit(4);

    res.json({
      success: true,
      stats: { totalProjects, totalTasks, completedTasks, inProgressTasks, todoTasks },
      recentTasks,
      recentProjects,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { upload, uploadFile, getNotifications, markAllRead, getDashboardStats };
