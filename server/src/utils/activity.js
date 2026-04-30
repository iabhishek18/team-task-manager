const { Activity } = require('../models');

const logActivity = async ({ action, entityType, entityId, entityName, details, projectId, userId }) => {
  try {
    await Activity.create({
      action,
      entityType,
      entityId,
      entityName,
      details,
      projectId,
      userId
    });
  } catch (error) {
    console.error('Failed to log activity:', error.message);
  }
};

module.exports = { logActivity };
