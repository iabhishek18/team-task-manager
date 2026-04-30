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
  origin: config.nodeEnv === 'production' ? config.clientUrl : '*',
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
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('No users found. Seeding demo data...');
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash('password123', 10);
      const { Project, TeamMember, Task } = require('./models');

      const users = await User.bulkCreate([
        { name: 'Alex Johnson', email: 'alex@taskflow.com', password: hash },
        { name: 'Sarah Chen', email: 'sarah@taskflow.com', password: hash },
        { name: 'Mike Peters', email: 'mike@taskflow.com', password: hash },
      ]);
      const [alex, sarah, mike] = users;

      const projects = await Project.bulkCreate([
        { name: 'Website Redesign', description: 'Complete overhaul of company website', ownerId: alex.id },
        { name: 'Mobile App v2.0', description: 'Major update to mobile application', ownerId: sarah.id },
      ]);
      const [webProject, mobileProject] = projects;

      await TeamMember.bulkCreate([
        { projectId: webProject.id, userId: alex.id, role: 'admin' },
        { projectId: webProject.id, userId: sarah.id, role: 'member' },
        { projectId: webProject.id, userId: mike.id, role: 'member' },
        { projectId: mobileProject.id, userId: sarah.id, role: 'admin' },
        { projectId: mobileProject.id, userId: alex.id, role: 'member' },
      ]);

      const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
      const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

      await Task.bulkCreate([
        { title: 'Design homepage mockups', status: 'done', priority: 'high', dueDate: daysAgo(3), projectId: webProject.id, assigneeId: sarah.id, creatorId: alex.id },
        { title: 'Implement responsive navigation', status: 'done', priority: 'high', dueDate: daysAgo(1), projectId: webProject.id, assigneeId: mike.id, creatorId: alex.id },
        { title: 'Build contact form', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(3), projectId: webProject.id, assigneeId: mike.id, creatorId: alex.id },
        { title: 'Set up CI/CD pipeline', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(5), projectId: webProject.id, assigneeId: alex.id, creatorId: alex.id },
        { title: 'Write SEO meta tags', status: 'todo', priority: 'low', dueDate: daysFromNow(7), projectId: webProject.id, assigneeId: sarah.id, creatorId: alex.id },
        { title: 'Performance audit', status: 'todo', priority: 'high', dueDate: daysAgo(1), projectId: webProject.id, assigneeId: alex.id, creatorId: alex.id },
        { title: 'Push notification system', status: 'done', priority: 'high', dueDate: daysAgo(2), projectId: mobileProject.id, assigneeId: alex.id, creatorId: sarah.id },
        { title: 'Offline data sync', status: 'in_progress', priority: 'high', dueDate: daysFromNow(4), projectId: mobileProject.id, assigneeId: sarah.id, creatorId: sarah.id },
        { title: 'Biometric authentication', status: 'todo', priority: 'medium', dueDate: daysFromNow(6), projectId: mobileProject.id, assigneeId: alex.id, creatorId: sarah.id },
        { title: 'App store screenshots', status: 'todo', priority: 'low', dueDate: daysFromNow(10), projectId: mobileProject.id, assigneeId: sarah.id, creatorId: sarah.id },
      ]);

      console.log('Demo data seeded: 3 users, 2 projects, 10 tasks');
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
