const express = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { updateProfile, changePassword } = require('../controllers/profileController');

const router = express.Router();
router.use(authenticate);

router.put('/', [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
], validate, updateProfile);

router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], validate, changePassword);

module.exports = router;
