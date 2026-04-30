const { Notification, User } = require('../models');

const notify = async ({ type, title, message, userId, actorId, entityType, entityId, projectId }) => {
  try {
    if (userId === actorId) return;
    await Notification.create({ type, title, message, userId, actorId, entityType, entityId, projectId });
  } catch (error) {
    console.error('Notification error:', error.message);
  }
};

const getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const notifications = await Notification.findAndCountAll({
      where: { userId: req.user.id },
      include: [{ model: User, as: 'actor', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit
    });

    const unreadCount = await Notification.count({ where: { userId: req.user.id, read: false } });

    res.json({ notifications: notifications.rows, total: notifications.count, unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching notifications.' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === 'all') {
      await Notification.update({ read: true }, { where: { userId: req.user.id, read: false } });
    } else {
      await Notification.update({ read: true }, { where: { id, userId: req.user.id } });
    }
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { notify, getNotifications, markAsRead };
