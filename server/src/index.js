const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const config = require('./config');
const { sequelize } = require('./models');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const notificationRoutes = require('./routes/notifications');
const profileRoutes = require('./routes/profile');
const searchRoutes = require('./routes/search');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many auth attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    version: '2.0.0'
  });
});

app.get('/api/reset-demo', async (req, res) => {
  try {
    const { User, Project, TeamMember, Task, Activity, Comment, Notification } = require('./models');

    await Comment.destroy({ where: {} });
    await Activity.destroy({ where: {} });
    await Notification.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await TeamMember.destroy({ where: {} });
    await Project.destroy({ where: {} });
    await User.destroy({ where: {} });

    const alex = await User.create({ name: 'Alex Johnson', email: 'alex@taskflow.com', password: 'password123' });
    const sarah = await User.create({ name: 'Sarah Chen', email: 'sarah@taskflow.com', password: 'password123' });
    const mike = await User.create({ name: 'Mike Peters', email: 'mike@taskflow.com', password: 'password123' });

    const p1 = await Project.create({ name: 'Website Redesign', description: 'Complete overhaul of company website with new branding', ownerId: alex.id });
    const p2 = await Project.create({ name: 'Mobile App v2.0', description: 'Major update to mobile application', ownerId: sarah.id });

    await TeamMember.bulkCreate([
      { projectId: p1.id, userId: alex.id, role: 'admin' },
      { projectId: p1.id, userId: sarah.id, role: 'member' },
      { projectId: p1.id, userId: mike.id, role: 'member' },
      { projectId: p2.id, userId: sarah.id, role: 'admin' },
      { projectId: p2.id, userId: alex.id, role: 'member' },
      { projectId: p2.id, userId: mike.id, role: 'member' },
    ]);

    const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
    const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

    await Task.bulkCreate([
      { title: 'Design homepage mockups', status: 'done', priority: 'high', dueDate: daysAgo(3), projectId: p1.id, assigneeId: sarah.id, creatorId: alex.id },
      { title: 'Implement responsive navigation', status: 'done', priority: 'high', dueDate: daysAgo(1), projectId: p1.id, assigneeId: mike.id, creatorId: alex.id },
      { title: 'Build contact form', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(3), projectId: p1.id, assigneeId: mike.id, creatorId: alex.id },
      { title: 'Set up CI/CD pipeline', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(5), projectId: p1.id, assigneeId: alex.id, creatorId: alex.id },
      { title: 'Write SEO meta tags', status: 'todo', priority: 'low', dueDate: daysFromNow(7), projectId: p1.id, assigneeId: sarah.id, creatorId: alex.id },
      { title: 'Performance audit', status: 'todo', priority: 'high', dueDate: daysAgo(1), projectId: p1.id, assigneeId: alex.id, creatorId: alex.id },
      { title: 'Push notification system', status: 'done', priority: 'high', dueDate: daysAgo(2), projectId: p2.id, assigneeId: alex.id, creatorId: sarah.id },
      { title: 'Offline data sync', status: 'in_progress', priority: 'high', dueDate: daysFromNow(4), projectId: p2.id, assigneeId: sarah.id, creatorId: sarah.id },
      { title: 'Biometric authentication', status: 'todo', priority: 'medium', dueDate: daysFromNow(6), projectId: p2.id, assigneeId: mike.id, creatorId: sarah.id },
      { title: 'App store screenshots', status: 'todo', priority: 'low', dueDate: daysFromNow(10), projectId: p2.id, assigneeId: alex.id, creatorId: sarah.id },
    ]);

    res.json({ success: true, message: 'Full demo data seeded. Login: alex@taskflow.com / password123 (also sarah@, mike@)' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);

if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(err.status || 500).json({
    message: config.nodeEnv === 'development' ? err.message : 'Internal server error',
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
});

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database synced.');

    const { User } = require('./models');
    const { Project, TeamMember, Task } = require('./models');
    const bcrypt = require('bcryptjs');

    const alex = await User.findOne({ where: { email: 'alex@taskflow.com' } });
    let needsSeed = false;

    if (!alex) {
      needsSeed = true;
      console.log('Demo user alex@taskflow.com not found. Will seed.');
    } else {
      const valid = await bcrypt.compare('password123', alex.password);
      if (!valid) {
        needsSeed = true;
        console.log('Demo user password corrupted. Will re-seed.');
        await User.destroy({ where: { email: { [require('sequelize').Op.in]: ['alex@taskflow.com', 'sarah@taskflow.com', 'mike@taskflow.com'] } } });
      }
    }

    if (needsSeed) {
      console.log('Seeding demo users...');
      const alexUser = await User.create({ name: 'Alex Johnson', email: 'alex@taskflow.com', password: 'password123' });
      const sarahUser = await User.create({ name: 'Sarah Chen', email: 'sarah@taskflow.com', password: 'password123' });
      const mikeUser = await User.create({ name: 'Mike Peters', email: 'mike@taskflow.com', password: 'password123' });

      const demoProject = await Project.findOne({ where: { name: 'Website Redesign' } });
      if (!demoProject) {
        const projects = await Project.bulkCreate([
          { name: 'Website Redesign', description: 'Complete overhaul of company website', ownerId: alexUser.id },
          { name: 'Mobile App v2.0', description: 'Major update to mobile application', ownerId: sarahUser.id },
        ]);
        const [webProject, mobileProject] = projects;

        await TeamMember.bulkCreate([
          { projectId: webProject.id, userId: alexUser.id, role: 'admin' },
          { projectId: webProject.id, userId: sarahUser.id, role: 'member' },
          { projectId: webProject.id, userId: mikeUser.id, role: 'member' },
          { projectId: mobileProject.id, userId: sarahUser.id, role: 'admin' },
          { projectId: mobileProject.id, userId: alexUser.id, role: 'member' },
        ]);

        const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
        const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

        await Task.bulkCreate([
          { title: 'Design homepage mockups', status: 'done', priority: 'high', dueDate: daysAgo(3), projectId: webProject.id, assigneeId: sarahUser.id, creatorId: alexUser.id },
          { title: 'Implement responsive navigation', status: 'done', priority: 'high', dueDate: daysAgo(1), projectId: webProject.id, assigneeId: mikeUser.id, creatorId: alexUser.id },
          { title: 'Build contact form', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(3), projectId: webProject.id, assigneeId: mikeUser.id, creatorId: alexUser.id },
          { title: 'Set up CI/CD pipeline', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(5), projectId: webProject.id, assigneeId: alexUser.id, creatorId: alexUser.id },
          { title: 'Performance audit', status: 'todo', priority: 'high', dueDate: daysAgo(1), projectId: webProject.id, assigneeId: alexUser.id, creatorId: alexUser.id },
          { title: 'Push notification system', status: 'done', priority: 'high', dueDate: daysAgo(2), projectId: mobileProject.id, assigneeId: alexUser.id, creatorId: sarahUser.id },
          { title: 'Offline data sync', status: 'in_progress', priority: 'high', dueDate: daysFromNow(4), projectId: mobileProject.id, assigneeId: sarahUser.id, creatorId: sarahUser.id },
          { title: 'Biometric authentication', status: 'todo', priority: 'medium', dueDate: daysFromNow(6), projectId: mobileProject.id, assigneeId: alexUser.id, creatorId: sarahUser.id },
        ]);
      }
      console.log('Demo data seeded successfully.');
    } else {
      console.log('Demo users OK.');
    }

    app.listen(config.port, () => {
      console.log(`Server running on port ${config.port} [${config.nodeEnv}]`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
