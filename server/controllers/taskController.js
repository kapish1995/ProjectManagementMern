const Task = require('../models/Task');
const User = require('../models/User');

const addNotification = async (userId, message, link = '') => {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message, link, isRead: false } },
  });
};

// @GET /api/tasks?project=id
const getTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) filter.project = req.query.project;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, project, assignedTo, deadline, tags } = req.body;

    const task = await Task.create({
      title, description, status, priority, project, assignedTo, deadline, tags,
      createdBy: req.user._id,
    });

    await task.populate('assignedTo', 'name email avatar');
    await task.populate('createdBy', 'name email avatar');

    // Notify assigned user
    if (assignedTo && assignedTo !== req.user._id.toString()) {
      await addNotification(assignedTo, `You have been assigned task: "${title}"`, '/tasks/' + task._id);
    }

    res.status(201).json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('comments.user', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/tasks/:id/comments
const addComment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.comments.push({ user: req.user._id, text: req.body.text });
    await task.save();
    await task.populate('comments.user', 'name email avatar');

    res.json({ success: true, comments: task.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate('assignedTo', 'name email avatar');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTasks, createTask, getTaskById, updateTask, deleteTask, addComment, updateTaskStatus };
