const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Task, Project, TeamMember, User } = require('../models');

const getProjectAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;

    const tasks = await Task.findAll({ where: { projectId }, raw: true });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;

    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.dueDate && new Date(t.dueDate) < new Date()).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const priorityBreakdown = {
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length
    };

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const created = tasks.filter(t => {
        const d = new Date(t.createdAt);
        return d >= date && d < nextDate;
      }).length;

      const completed = tasks.filter(t => {
        if (t.status !== 'done') return false;
        const d = new Date(t.updatedAt);
        return d >= date && d < nextDate;
      }).length;

      last7Days.push({
        date: date.toISOString().split('T')[0],
        created,
        completed
      });
    }

    const memberWorkload = await Task.findAll({
      where: { projectId, status: { [Op.ne]: 'done' }, assigneeId: { [Op.ne]: null } },
      attributes: ['assigneeId', [sequelize.fn('COUNT', sequelize.col('Task.id')), 'taskCount']],
      include: [{ model: User, as: 'assignee', attributes: ['id', 'name'] }],
      group: ['assigneeId', 'assignee.id'],
      raw: true,
      nest: true
    });

    res.json({
      analytics: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        completionRate,
        priorityBreakdown,
        velocityChart: last7Days,
        memberWorkload
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching analytics.' });
  }
};

module.exports = { getProjectAnalytics };
