const express = require('express');
const router = express.Router();
const { getTasks, createTask, getTaskById, updateTask, deleteTask, addComment, updateTaskStatus } = require('../controllers/taskController');
const { upload, uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTaskById).put(updateTask).delete(deleteTask);
router.post('/:id/comments', addComment);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/upload', upload.single('file'), uploadFile);

module.exports = router;
