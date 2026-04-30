const { Activity, User, TeamMember } = require('../models');
const { Op } = require('sequelize');

const getProjectActivities = async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const activities = await Activity.findAndCountAll({
      where: { projectId },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    res.json({
      activities: activities.rows,
      total: activities.count,
      hasMore: offset + limit < activities.count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching activities.' });
  }
};

const getRecentActivities = async (req, res) => {
  try {
    const memberships = await TeamMember.findAll({
      where: { userId: req.user.id },
      attributes: ['projectId']
    });
    const projectIds = memberships.map(m => m.projectId);

    const activities = await Activity.findAll({
      where: { projectId: { [Op.in]: projectIds } },
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
      limit: 15
    });

    res.json({ activities });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching activities.' });
  }
};

module.exports = { getProjectActivities, getRecentActivities };
