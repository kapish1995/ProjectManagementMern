const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

// @GET /api/projects
const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    })
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: projects.length, projects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/projects
const createProject = async (req, res) => {
  try {
    const { name, description, status, priority, deadline, tags } = req.body;

    const project = await Project.create({
      name, description, status, priority, deadline, tags,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    await project.populate('owner', 'name email avatar');

    // Notify all members
    await addNotification(req.user._id, `Project "${name}" created successfully`, `/projects/${project._id}`);

    res.status(201).json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    res.json({ success: true, project, tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    }).populate('owner', 'name email avatar').populate('members.user', 'name email avatar');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    await Task.deleteMany({ project: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/projects/:id/members
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const project = await Project.findById(req.params.id);
    const alreadyMember = project.members.find(m => m.user.toString() === user._id.toString());
    if (alreadyMember) return res.status(400).json({ success: false, message: 'Already a member' });

    project.members.push({ user: user._id, role: role || 'member' });
    await project.save();
    await project.populate('members.user', 'name email avatar');

    await addNotification(user._id, `You were added to project "${project.name}"`, '/projects/' + project._id);

    res.json({ success: true, project });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const addNotification = async (userId, message, link = '') => {
  await User.findByIdAndUpdate(userId, {
    $push: { notifications: { message, link, isRead: false } },
  });
};

module.exports = { getProjects, createProject, getProjectById, updateProject, deleteProject, addMember };
