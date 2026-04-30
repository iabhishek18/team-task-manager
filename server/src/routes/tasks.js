const express = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const requireProjectRole = require('../middleware/roleAuth');
const validate = require('../middleware/validate');
const { createTask, getTasks, getTask, updateTask, deleteTask, getDashboard } = require('../controllers/taskController');
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const { getProjectActivities, getRecentActivities } = require('../controllers/activityController');

const router = express.Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/activities/recent', getRecentActivities);

router.post('/:projectId/tasks', requireProjectRole(), [
  body('title').trim().notEmpty().withMessage('Task title is required')
    .isLength({ min: 2, max: 300 }).withMessage('Task title must be between 2 and 300 characters'),
  body('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date')
], validate, createTask);

router.get('/:projectId/tasks', requireProjectRole(), getTasks);

router.get('/:projectId/tasks/:taskId', requireProjectRole(), getTask);

router.put('/:projectId/tasks/:taskId', requireProjectRole(), [
  body('title').optional().trim().isLength({ min: 2, max: 300 }).withMessage('Task title must be between 2 and 300 characters'),
  body('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date')
], validate, updateTask);

router.delete('/:projectId/tasks/:taskId', requireProjectRole('admin'), deleteTask);

router.get('/:projectId/tasks/:taskId/comments', requireProjectRole(), getComments);
router.post('/:projectId/tasks/:taskId/comments', requireProjectRole(), [
  body('content').trim().notEmpty().withMessage('Comment content is required')
], validate, addComment);
router.delete('/:projectId/tasks/:taskId/comments/:commentId', requireProjectRole(), deleteComment);

router.get('/:projectId/activities', requireProjectRole(), getProjectActivities);

module.exports = router;
