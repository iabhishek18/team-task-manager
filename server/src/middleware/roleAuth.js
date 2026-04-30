const { TeamMember } = require('../models');

const requireProjectRole = (...roles) => {
  return async (req, res, next) => {
    try {
      const projectId = req.params.projectId || req.body.projectId;
      if (!projectId) {
        return res.status(400).json({ message: 'Project ID is required.' });
      }

      const membership = await TeamMember.findOne({
        where: { projectId, userId: req.user.id }
      });

      if (!membership) {
        return res.status(403).json({ message: 'You are not a member of this project.' });
      }

      if (roles.length > 0 && !roles.includes(membership.role)) {
        return res.status(403).json({ message: 'You do not have permission to perform this action.' });
      }

      req.membership = membership;
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Server error checking permissions.' });
    }
  };
};

module.exports = requireProjectRole;
