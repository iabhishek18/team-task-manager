const { Op } = require('sequelize');
const { Task, Project, User, TeamMember } = require('../models');

const searchTasks = async (req, res) => {
  try {
    const { q, status, priority, assigneeId, projectId } = req.query;

    const memberships = await TeamMember.findAll({
      where: { userId: req.user.id },
      attributes: ['projectId']
    });
    const projectIds = projectId ? [projectId] : memberships.map(m => m.projectId);

    const where = { projectId: { [Op.in]: projectIds } };

    if (q) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } }
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['updatedAt', 'DESC']],
      limit: 50
    });

    res.json({ tasks, count: tasks.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error searching tasks.' });
  }
};

module.exports = { searchTasks };
