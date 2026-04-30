const { Task, Project, TeamMember, User } = require('../models');
const { Op } = require('sequelize');

const exportProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.findAll({
      where: { projectId },
      include: [
        { model: User, as: 'assignee', attributes: ['name', 'email'] },
        { model: User, as: 'creator', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true
    });

    const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Assignee', 'Assignee Email', 'Creator', 'Created At'];
    const rows = tasks.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      t.assignee?.name || 'Unassigned',
      t.assignee?.email || '',
      t.creator?.name || '',
      new Date(t.createdAt).toISOString()
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tasks-${projectId}.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Server error exporting data.' });
  }
};

module.exports = { exportProjectTasks };
