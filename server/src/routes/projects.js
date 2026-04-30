const express = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const requireProjectRole = require('../middleware/roleAuth');
const validate = require('../middleware/validate');
const {
  createProject, getProjects, getProject, updateProject, deleteProject,
  addMember, removeMember, updateMemberRole
} = require('../controllers/projectController');

const router = express.Router();

router.use(authenticate);

router.post('/', [
  body('name').trim().notEmpty().withMessage('Project name is required')
    .isLength({ min: 2, max: 200 }).withMessage('Project name must be between 2 and 200 characters')
], validate, createProject);

router.get('/', getProjects);

router.get('/:projectId', requireProjectRole(), getProject);

router.put('/:projectId', requireProjectRole('admin'), [
  body('name').optional().trim().isLength({ min: 2, max: 200 }).withMessage('Project name must be between 2 and 200 characters')
], validate, updateProject);

router.delete('/:projectId', requireProjectRole('admin'), deleteProject);

router.post('/:projectId/members', requireProjectRole('admin'), [
  body('email').trim().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member')
], validate, addMember);

router.delete('/:projectId/members/:userId', requireProjectRole('admin'), removeMember);

router.patch('/:projectId/members/:userId/role', requireProjectRole('admin'), [
  body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member')
], validate, updateMemberRole);

const { getProjectAnalytics } = require('../controllers/analyticsController');
const { exportProjectTasks } = require('../controllers/exportController');
const { getLabels, createLabel, deleteLabel, addLabelToTask, removeLabelFromTask } = require('../controllers/labelController');

router.get('/:projectId/analytics', requireProjectRole(), getProjectAnalytics);
router.get('/:projectId/export', requireProjectRole(), exportProjectTasks);

router.get('/:projectId/labels', requireProjectRole(), getLabels);
router.post('/:projectId/labels', requireProjectRole('admin'), [
  body('name').trim().notEmpty().withMessage('Label name is required'),
  body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid color format')
], validate, createLabel);
router.delete('/:projectId/labels/:labelId', requireProjectRole('admin'), deleteLabel);

router.post('/:projectId/tasks/:taskId/labels', requireProjectRole(), [
  body('labelId').notEmpty().withMessage('Label ID is required')
], validate, addLabelToTask);
router.delete('/:projectId/tasks/:taskId/labels/:labelId', requireProjectRole(), removeLabelFromTask);

module.exports = router;
