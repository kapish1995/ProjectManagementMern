const express = require('express');
const router = express.Router();
const { getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/:projectId/messages', protect, getMessages);

module.exports = router;
