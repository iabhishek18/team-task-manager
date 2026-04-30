const { Op } = require('sequelize');
const { Task, User, Project, TeamMember } = require('../models');
const { logActivity } = require('../utils/activity');
const { notify } = require('../controllers/notificationController');

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const { projectId } = req.params;

    if (assigneeId) {
      const assigneeMember = await TeamMember.findOne({
        where: { projectId, userId: assigneeId }
      });
      if (!assigneeMember) {
        return res.status(400).json({ message: 'Assignee must be a member of the project.' });
      }
    }

    const task = await Task.create({
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate,
      projectId,
      assigneeId,
      creatorId: req.user.id
    });

    const fullTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.status(201).json({ message: 'Task created successfully', task: fullTask });

    logActivity({ action: 'created task', entityType: 'task', entityId: task.id, entityName: task.title, projectId, userId: req.user.id });

    if (assigneeId && assigneeId !== req.user.id) {
      notify({ type: 'task_assigned', title: 'New task assigned', message: `${req.user.name} assigned you "${task.title}"`, userId: assigneeId, actorId: req.user.id, entityType: 'task', entityId: task.id, projectId });
    }
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    res.status(500).json({ message: 'Server error creating task.' });
  }
};

const getTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assigneeId } = req.query;

    const where = { projectId };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    const tasks = await Task.findAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tasks.' });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.taskId, projectId: req.params.projectId },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project' }
      ]
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching task.' });
  }
};

const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const task = await Task.findOne({
      where: { id: req.params.taskId, projectId: req.params.projectId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (assigneeId) {
      const assigneeMember = await TeamMember.findOne({
        where: { projectId: req.params.projectId, userId: assigneeId }
      });
      if (!assigneeMember) {
        return res.status(400).json({ message: 'Assignee must be a member of the project.' });
      }
    }

    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      status: status || task.status,
      priority: priority || task.priority,
      dueDate: dueDate !== undefined ? dueDate : task.dueDate,
      assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId
    });

    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ]
    });

    res.json({ message: 'Task updated successfully', task: updatedTask });

    const changes = [];
    if (status && status !== task.status) changes.push(`status → ${status}`);
    if (assigneeId && assigneeId !== task.assigneeId) changes.push('reassigned');
    logActivity({ action: `updated task${changes.length ? ': ' + changes.join(', ') : ''}`, entityType: 'task', entityId: task.id, entityName: task.title, projectId: req.params.projectId, userId: req.user.id, details: { changes } });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        message: 'Validation failed',
        errors: error.errors.map(e => ({ field: e.path, message: e.message }))
      });
    }
    res.status(500).json({ message: 'Server error updating task.' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      where: { id: req.params.taskId, projectId: req.params.projectId }
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting task.' });
  }
};

const getDashboard = async (req, res) => {
  try {
    const memberships = await TeamMember.findAll({
      where: { userId: req.user.id },
      attributes: ['projectId']
    });
    const projectIds = memberships.map(m => m.projectId);

    const totalTasks = await Task.count({
      where: { projectId: { [Op.in]: projectIds } }
    });

    const tasksByStatus = await Task.findAll({
      where: { projectId: { [Op.in]: projectIds } },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const overdueTasks = await Task.findAll({
      where: {
        projectId: { [Op.in]: projectIds },
        status: { [Op.ne]: 'done' },
        dueDate: { [Op.lt]: new Date() }
      },
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['dueDate', 'ASC']]
    });

    const myTasks = await Task.findAll({
      where: {
        assigneeId: req.user.id,
        status: { [Op.ne]: 'done' }
      },
      include: [
        { model: Project, as: 'project', attributes: ['id', 'name'] }
      ],
      order: [['dueDate', 'ASC'], ['priority', 'DESC']]
    });

    const statusMap = {};
    tasksByStatus.forEach(s => { statusMap[s.status] = parseInt(s.count); });

    const projectProgress = await Promise.all(projectIds.map(async (pid) => {
      const project = await Project.findByPk(pid, { attributes: ['id', 'name'] });
      const total = await Task.count({ where: { projectId: pid } });
      const done = await Task.count({ where: { projectId: pid, status: 'done' } });
      const inProgress = await Task.count({ where: { projectId: pid, status: 'in_progress' } });
      return { id: pid, name: project?.name, total, done, inProgress, todo: total - done - inProgress, percent: total > 0 ? Math.round((done / total) * 100) : 0 };
    }));

    const weeklyVelocity = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(); dayStart.setDate(dayStart.getDate() - i); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
      const created = await Task.count({ where: { projectId: { [Op.in]: projectIds }, createdAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } });
      const completed = await Task.count({ where: { projectId: { [Op.in]: projectIds }, status: 'done', updatedAt: { [Op.gte]: dayStart, [Op.lt]: dayEnd } } });
      weeklyVelocity.push({ date: dayStart.toISOString().split('T')[0], day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }), created, completed });
    }

    res.json({
      dashboard: {
        totalTasks,
        tasksByStatus: {
          todo: statusMap.todo || 0,
          in_progress: statusMap.in_progress || 0,
          done: statusMap.done || 0
        },
        overdueCount: overdueTasks.length,
        overdueTasks,
        myTasks,
        projectCount: projectIds.length,
        projectProgress,
        weeklyVelocity
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching dashboard.' });
  }
};

module.exports = { createTask, getTasks, getTask, updateTask, deleteTask, getDashboard };
