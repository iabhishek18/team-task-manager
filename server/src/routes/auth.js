const express = require('express');
const { body } = require('express-validator');
const { signup, login, getProfile } = require('../controllers/authController');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], validate, signup);

router.post('/login', [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], validate, login);

router.get('/profile', authenticate, getProfile);

module.exports = router;
