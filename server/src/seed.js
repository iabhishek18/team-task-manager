require('dotenv').config();
const { sequelize, User, Project, TeamMember, Task, Activity, Comment, Notification } = require('../src/models');
const bcrypt = require('bcryptjs');

const seed = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log('Database reset.');

    const hash = await bcrypt.hash('password123', 10);

    const users = await User.bulkCreate([
      { name: 'Alex Johnson', email: 'alex@taskflow.com', password: hash },
      { name: 'Sarah Chen', email: 'sarah@taskflow.com', password: hash },
      { name: 'Mike Peters', email: 'mike@taskflow.com', password: hash },
      { name: 'Emily Davis', email: 'emily@taskflow.com', password: hash },
      { name: 'James Wilson', email: 'james@taskflow.com', password: hash },
    ]);

    const [alex, sarah, mike, emily, james] = users;

    const projects = await Project.bulkCreate([
      { name: 'Website Redesign', description: 'Complete overhaul of company website with new branding, improved UX, and mobile-first approach', ownerId: alex.id },
      { name: 'Mobile App v2.0', description: 'Major update to mobile application including push notifications, offline mode, and performance improvements', ownerId: sarah.id },
      { name: 'API Platform', description: 'Build scalable REST API platform with rate limiting, documentation, and developer portal', ownerId: alex.id },
      { name: 'Data Analytics Dashboard', description: 'Real-time analytics dashboard for business intelligence and reporting', ownerId: mike.id },
    ]);

    const [webProject, mobileProject, apiProject, analyticsProject] = projects;

    await TeamMember.bulkCreate([
      { projectId: webProject.id, userId: alex.id, role: 'admin' },
      { projectId: webProject.id, userId: sarah.id, role: 'member' },
      { projectId: webProject.id, userId: mike.id, role: 'member' },
      { projectId: webProject.id, userId: emily.id, role: 'member' },

      { projectId: mobileProject.id, userId: sarah.id, role: 'admin' },
      { projectId: mobileProject.id, userId: alex.id, role: 'member' },
      { projectId: mobileProject.id, userId: james.id, role: 'member' },

      { projectId: apiProject.id, userId: alex.id, role: 'admin' },
      { projectId: apiProject.id, userId: mike.id, role: 'admin' },
      { projectId: apiProject.id, userId: james.id, role: 'member' },

      { projectId: analyticsProject.id, userId: mike.id, role: 'admin' },
      { projectId: analyticsProject.id, userId: emily.id, role: 'member' },
      { projectId: analyticsProject.id, userId: sarah.id, role: 'member' },
    ]);

    const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d; };
    const daysFromNow = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };

    const tasks = await Task.bulkCreate([
      { title: 'Design homepage mockups', description: 'Create high-fidelity mockups for the new homepage layout', status: 'done', priority: 'high', dueDate: daysAgo(5), projectId: webProject.id, assigneeId: sarah.id, creatorId: alex.id, createdAt: daysAgo(14) },
      { title: 'Implement responsive navigation', description: 'Build mobile-friendly navigation with hamburger menu', status: 'done', priority: 'high', dueDate: daysAgo(3), projectId: webProject.id, assigneeId: mike.id, creatorId: alex.id, createdAt: daysAgo(12) },
      { title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', status: 'done', priority: 'medium', dueDate: daysAgo(7), projectId: webProject.id, assigneeId: alex.id, creatorId: alex.id, createdAt: daysAgo(15) },
      { title: 'Build contact form with validation', description: 'Create contact form with email validation and spam protection', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(2), projectId: webProject.id, assigneeId: emily.id, creatorId: alex.id, createdAt: daysAgo(5) },
      { title: 'Optimize images and assets', description: 'Compress images, implement lazy loading, set up CDN', status: 'in_progress', priority: 'low', dueDate: daysFromNow(4), projectId: webProject.id, assigneeId: mike.id, creatorId: sarah.id, createdAt: daysAgo(3) },
      { title: 'Implement dark mode', description: 'Add dark mode toggle with system preference detection', status: 'todo', priority: 'low', dueDate: daysFromNow(7), projectId: webProject.id, assigneeId: sarah.id, creatorId: alex.id, createdAt: daysAgo(2) },
      { title: 'Write SEO meta tags', description: 'Add proper meta descriptions, OG tags, and structured data', status: 'todo', priority: 'medium', dueDate: daysFromNow(5), projectId: webProject.id, assigneeId: emily.id, creatorId: alex.id, createdAt: daysAgo(1) },
      { title: 'Performance audit', description: 'Run Lighthouse audit and fix performance issues', status: 'todo', priority: 'high', dueDate: daysAgo(1), projectId: webProject.id, assigneeId: alex.id, creatorId: alex.id, createdAt: daysAgo(4) },

      { title: 'Push notification system', description: 'Implement Firebase Cloud Messaging for push notifications', status: 'done', priority: 'high', dueDate: daysAgo(4), projectId: mobileProject.id, assigneeId: james.id, creatorId: sarah.id, createdAt: daysAgo(10) },
      { title: 'Offline data sync', description: 'Build offline-first architecture with background sync', status: 'in_progress', priority: 'high', dueDate: daysFromNow(3), projectId: mobileProject.id, assigneeId: sarah.id, creatorId: sarah.id, createdAt: daysAgo(7) },
      { title: 'Biometric authentication', description: 'Add Face ID and fingerprint login support', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(5), projectId: mobileProject.id, assigneeId: alex.id, creatorId: sarah.id, createdAt: daysAgo(6) },
      { title: 'App store screenshots', description: 'Design and generate screenshots for App Store and Play Store', status: 'todo', priority: 'low', dueDate: daysFromNow(10), projectId: mobileProject.id, assigneeId: james.id, creatorId: sarah.id, createdAt: daysAgo(2) },
      { title: 'Fix memory leak on chat screen', description: 'Investigate and fix memory leak causing crashes after extended use', status: 'todo', priority: 'high', dueDate: daysAgo(2), projectId: mobileProject.id, assigneeId: sarah.id, creatorId: alex.id, createdAt: daysAgo(5) },

      { title: 'Design API schema', description: 'Define OpenAPI 3.0 specification for all endpoints', status: 'done', priority: 'high', dueDate: daysAgo(8), projectId: apiProject.id, assigneeId: alex.id, creatorId: alex.id, createdAt: daysAgo(16) },
      { title: 'Implement rate limiting', description: 'Add token bucket rate limiting with Redis backend', status: 'done', priority: 'high', dueDate: daysAgo(6), projectId: apiProject.id, assigneeId: mike.id, creatorId: alex.id, createdAt: daysAgo(14) },
      { title: 'Build authentication middleware', description: 'JWT and API key authentication with role-based access', status: 'done', priority: 'high', dueDate: daysAgo(4), projectId: apiProject.id, assigneeId: alex.id, creatorId: alex.id, createdAt: daysAgo(12) },
      { title: 'Create developer documentation', description: 'Write comprehensive API docs with code examples', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(6), projectId: apiProject.id, assigneeId: james.id, creatorId: mike.id, createdAt: daysAgo(5) },
      { title: 'Set up monitoring and alerting', description: 'Configure Datadog/Prometheus for API health monitoring', status: 'todo', priority: 'medium', dueDate: daysFromNow(8), projectId: apiProject.id, assigneeId: mike.id, creatorId: alex.id, createdAt: daysAgo(3) },
      { title: 'Load testing', description: 'Run load tests with k6 to verify 10K req/s capability', status: 'todo', priority: 'high', dueDate: daysAgo(1), projectId: apiProject.id, assigneeId: alex.id, creatorId: mike.id, createdAt: daysAgo(4) },

      { title: 'Design dashboard wireframes', description: 'Create wireframes for all dashboard views and widgets', status: 'done', priority: 'high', dueDate: daysAgo(10), projectId: analyticsProject.id, assigneeId: emily.id, creatorId: mike.id, createdAt: daysAgo(18) },
      { title: 'Build chart components', description: 'Create reusable chart components (line, bar, pie, area)', status: 'done', priority: 'high', dueDate: daysAgo(5), projectId: analyticsProject.id, assigneeId: mike.id, creatorId: mike.id, createdAt: daysAgo(12) },
      { title: 'Real-time data pipeline', description: 'Set up WebSocket connection for live data streaming', status: 'in_progress', priority: 'high', dueDate: daysFromNow(2), projectId: analyticsProject.id, assigneeId: mike.id, creatorId: mike.id, createdAt: daysAgo(6) },
      { title: 'Export to PDF/Excel', description: 'Add export functionality for reports and charts', status: 'in_progress', priority: 'medium', dueDate: daysFromNow(4), projectId: analyticsProject.id, assigneeId: sarah.id, creatorId: mike.id, createdAt: daysAgo(4) },
      { title: 'User permission settings', description: 'Build admin panel for managing dashboard access levels', status: 'todo', priority: 'medium', dueDate: daysFromNow(7), projectId: analyticsProject.id, assigneeId: emily.id, creatorId: mike.id, createdAt: daysAgo(2) },
      { title: 'Mobile responsive charts', description: 'Make all charts render properly on mobile devices', status: 'todo', priority: 'low', dueDate: daysFromNow(9), projectId: analyticsProject.id, assigneeId: mike.id, creatorId: mike.id, createdAt: daysAgo(1) },
    ]);

    const activityData = [
      { action: 'created project', entityType: 'project', entityId: webProject.id, entityName: 'Website Redesign', projectId: webProject.id, userId: alex.id, createdAt: daysAgo(14) },
      { action: 'created task', entityType: 'task', entityId: tasks[0].id, entityName: 'Design homepage mockups', projectId: webProject.id, userId: alex.id, createdAt: daysAgo(14) },
      { action: 'completed task', entityType: 'task', entityId: tasks[0].id, entityName: 'Design homepage mockups', projectId: webProject.id, userId: sarah.id, createdAt: daysAgo(5) },
      { action: 'completed task', entityType: 'task', entityId: tasks[1].id, entityName: 'Implement responsive navigation', projectId: webProject.id, userId: mike.id, createdAt: daysAgo(3) },
      { action: 'created task', entityType: 'task', entityId: tasks[3].id, entityName: 'Build contact form with validation', projectId: webProject.id, userId: alex.id, createdAt: daysAgo(5) },
      { action: 'updated task: status → in_progress', entityType: 'task', entityId: tasks[3].id, entityName: 'Build contact form with validation', projectId: webProject.id, userId: emily.id, createdAt: daysAgo(2) },
      { action: 'created task', entityType: 'task', entityId: tasks[9].id, entityName: 'Offline data sync', projectId: mobileProject.id, userId: sarah.id, createdAt: daysAgo(7) },
      { action: 'completed task', entityType: 'task', entityId: tasks[8].id, entityName: 'Push notification system', projectId: mobileProject.id, userId: james.id, createdAt: daysAgo(4) },
      { action: 'added member', entityType: 'member', entityId: james.id, entityName: 'James Wilson', projectId: apiProject.id, userId: alex.id, createdAt: daysAgo(10) },
      { action: 'completed task', entityType: 'task', entityId: tasks[14].id, entityName: 'Implement rate limiting', projectId: apiProject.id, userId: mike.id, createdAt: daysAgo(6) },
    ];
    await Activity.bulkCreate(activityData);

    await Comment.bulkCreate([
      { content: 'The mockups look great! Can we add a dark mode toggle to the nav?', taskId: tasks[0].id, userId: alex.id, createdAt: daysAgo(7) },
      { content: 'Good idea. I\'ll add it to the next iteration.', taskId: tasks[0].id, userId: sarah.id, createdAt: daysAgo(6) },
      { content: 'Navigation is working on all screen sizes now. Ready for review.', taskId: tasks[1].id, userId: mike.id, createdAt: daysAgo(4) },
      { content: 'Tested on iPhone and Pixel — looks solid. Approved!', taskId: tasks[1].id, userId: alex.id, createdAt: daysAgo(3) },
      { content: 'I\'m using react-hook-form for validation. Should cover all edge cases.', taskId: tasks[3].id, userId: emily.id, createdAt: daysAgo(2) },
      { content: 'The sync conflicts are tricky. Using CRDT approach for now.', taskId: tasks[9].id, userId: sarah.id, createdAt: daysAgo(3) },
    ]);

    await Notification.bulkCreate([
      { type: 'task_assigned', title: 'New task assigned', message: 'Alex assigned you "Design homepage mockups"', userId: sarah.id, actorId: alex.id, entityType: 'task', entityId: tasks[0].id, projectId: webProject.id, read: true, createdAt: daysAgo(14) },
      { type: 'task_assigned', title: 'New task assigned', message: 'Alex assigned you "Build contact form with validation"', userId: emily.id, actorId: alex.id, entityType: 'task', entityId: tasks[3].id, projectId: webProject.id, read: false, createdAt: daysAgo(5) },
      { type: 'task_assigned', title: 'New task assigned', message: 'Sarah assigned you "Offline data sync"', userId: sarah.id, actorId: sarah.id, entityType: 'task', entityId: tasks[9].id, projectId: mobileProject.id, read: false, createdAt: daysAgo(7) },
      { type: 'comment_added', title: 'New comment', message: 'Alex commented on "Design homepage mockups"', userId: sarah.id, actorId: alex.id, entityType: 'task', entityId: tasks[0].id, projectId: webProject.id, read: false, createdAt: daysAgo(7) },
      { type: 'task_assigned', title: 'New task assigned', message: 'Mike assigned you "Create developer documentation"', userId: james.id, actorId: mike.id, entityType: 'task', entityId: tasks[16].id, projectId: apiProject.id, read: false, createdAt: daysAgo(5) },
    ]);

    console.log('✓ Seeded 5 users, 4 projects, 24 tasks, 10 activities, 6 comments, 5 notifications');
    console.log('\nLogin credentials (all passwords: password123):');
    console.log('  alex@taskflow.com  (Admin on Website Redesign, API Platform)');
    console.log('  sarah@taskflow.com (Admin on Mobile App v2.0)');
    console.log('  mike@taskflow.com  (Admin on API Platform, Data Analytics)');
    console.log('  emily@taskflow.com (Member)');
    console.log('  james@taskflow.com (Member)');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
