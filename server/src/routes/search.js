const express = require('express');
const authenticate = require('../middleware/auth');
const { searchTasks } = require('../controllers/searchController');

const router = express.Router();
router.use(authenticate);

router.get('/tasks', searchTasks);

module.exports = router;
