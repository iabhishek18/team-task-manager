const sequelize = require('../config/database');
const User = require('./User');
const Project = require('./Project');
const TeamMember = require('./TeamMember');
const Task = require('./Task');
const Activity = require('./Activity');
const Comment = require('./Comment');
const Notification = require('./Notification');
const { Label, TaskLabel } = require('./Label');

User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

Project.hasMany(TeamMember, { foreignKey: 'projectId', as: 'members' });
TeamMember.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(TeamMember, { foreignKey: 'userId', as: 'memberships' });
TeamMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

User.hasMany(Task, { foreignKey: 'assigneeId', as: 'assignedTasks' });
Task.belongsTo(User, { foreignKey: 'assigneeId', as: 'assignee' });

User.hasMany(Task, { foreignKey: 'creatorId', as: 'createdTasks' });
Task.belongsTo(User, { foreignKey: 'creatorId', as: 'creator' });

Project.hasMany(Activity, { foreignKey: 'projectId', as: 'activities' });
Activity.belongsTo(Project, { foreignKey: 'projectId' });
User.hasMany(Activity, { foreignKey: 'userId', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments' });
Comment.belongsTo(Task, { foreignKey: 'taskId' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'actorId', as: 'triggeredNotifications' });
Notification.belongsTo(User, { foreignKey: 'actorId', as: 'actor' });

Project.hasMany(Label, { foreignKey: 'projectId', as: 'labels' });
Label.belongsTo(Project, { foreignKey: 'projectId' });

Task.belongsToMany(Label, { through: TaskLabel, foreignKey: 'taskId', as: 'labels' });
Label.belongsToMany(Task, { through: TaskLabel, foreignKey: 'labelId', as: 'tasks' });

module.exports = {
  sequelize,
  User,
  Project,
  TeamMember,
  Task,
  Activity,
  Comment,
  Notification,
  Label,
  TaskLabel
};
