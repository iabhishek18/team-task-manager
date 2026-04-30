const express = require('express');
const authenticate = require('../middleware/auth');
const { getNotifications, markAsRead } = require('../controllers/notificationController');

const router = express.Router();
router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

module.exports = router;
