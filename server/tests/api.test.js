const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://apple@localhost:5432/team_task_manager';
process.env.JWT_SECRET = 'test_secret_key';
process.env.NODE_ENV = 'test';

const app = express();
app.use(express.json());

const { sequelize, User, Project, TeamMember, Task, Notification } = require('../src/models');
const authRoutes = require('../src/routes/auth');
const projectRoutes = require('../src/routes/projects');
const taskRoutes = require('../src/routes/tasks');
const notificationRoutes = require('../src/routes/notifications');
const profileRoutes = require('../src/routes/profile');
const searchRoutes = require('../src/routes/search');

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/search', searchRoutes);

let adminToken, memberToken, adminUser, memberUser, testProject, testTask;

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Auth API', () => {
  test('POST /api/auth/signup - should create a new user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Admin User', email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('Admin User');
    expect(res.body.user.email).toBe('admin@test.com');
    expect(res.body.user.password).toBeUndefined();
    adminToken = res.body.token;
    adminUser = res.body.user;
  });

  test('POST /api/auth/signup - should create second user', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Member User', email: 'member@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    memberToken = res.body.token;
    memberUser = res.body.user;
  });

  test('POST /api/auth/signup - should reject duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Dup', email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('already registered');
  });

  test('POST /api/auth/signup - should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test', email: 'new@test.com', password: '123' });

    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login - should login with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('admin@test.com');
  });

  test('POST /api/auth/login - should reject wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login - should reject non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  test('GET /api/auth/profile - should return user profile', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@test.com');
  });

  test('GET /api/auth/profile - should reject without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/profile - should reject invalid token', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer invalid_token');
    expect(res.status).toBe(401);
  });
});

describe('Project API', () => {
  test('POST /api/projects - should create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Project', description: 'A test project' });

    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe('Test Project');
    testProject = res.body.project;
  });

  test('POST /api/projects - should reject without name', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'No name' });

    expect(res.status).toBe(400);
  });

  test('GET /api/projects - should list user projects', async () => {
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.projects.length).toBe(1);
    expect(res.body.projects[0].myRole).toBe('admin');
  });

  test('GET /api/projects/:id - should get project detail', async () => {
    const res = await request(app)
      .get(`/api/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.project.name).toBe('Test Project');
  });

  test('POST /api/projects/:id/members - should add member', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProject.id}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'member@test.com', role: 'member' });

    expect(res.status).toBe(201);
    expect(res.body.member.user.email).toBe('member@test.com');
  });

  test('POST /api/projects/:id/members - should reject non-admin', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProject.id}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ email: 'other@test.com', role: 'member' });

    expect(res.status).toBe(403);
  });

  test('PUT /api/projects/:id - should update project (admin)', async () => {
    const res = await request(app)
      .put(`/api/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Project' });

    expect(res.status).toBe(200);
    expect(res.body.project.name).toBe('Updated Project');
  });

  test('PUT /api/projects/:id - should reject update from member', async () => {
    const res = await request(app)
      .put(`/api/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hacked' });

    expect(res.status).toBe(403);
  });
});

describe('Task API', () => {
  test('POST /api/tasks/:projectId/tasks - should create task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${testProject.id}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Task', priority: 'high', status: 'todo', assigneeId: memberUser.id });

    expect(res.status).toBe(201);
    expect(res.body.task.title).toBe('Test Task');
    expect(res.body.task.assignee.id).toBe(memberUser.id);
    testTask = res.body.task;
  });

  test('POST /api/tasks/:projectId/tasks - member can create task', async () => {
    const res = await request(app)
      .post(`/api/tasks/${testProject.id}/tasks`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ title: 'Member Task', priority: 'low' });

    expect(res.status).toBe(201);
  });

  test('POST /api/tasks/:projectId/tasks - should reject empty title', async () => {
    const res = await request(app)
      .post(`/api/tasks/${testProject.id}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '', priority: 'high' });

    expect(res.status).toBe(400);
  });

  test('GET /api/tasks/:projectId/tasks - should list tasks', async () => {
    const res = await request(app)
      .get(`/api/tasks/${testProject.id}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThanOrEqual(2);
  });

  test('PUT /api/tasks/:projectId/tasks/:taskId - should update status', async () => {
    const res = await request(app)
      .put(`/api/tasks/${testProject.id}/tasks/${testTask.id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'in_progress' });

    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('in_progress');
  });

  test('DELETE /api/tasks/:projectId/tasks/:taskId - member cannot delete', async () => {
    const res = await request(app)
      .delete(`/api/tasks/${testProject.id}/tasks/${testTask.id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
  });

  test('DELETE /api/tasks/:projectId/tasks/:taskId - admin can delete', async () => {
    const createRes = await request(app)
      .post(`/api/tasks/${testProject.id}/tasks`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'To Delete' });

    const res = await request(app)
      .delete(`/api/tasks/${testProject.id}/tasks/${createRes.body.task.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });

  test('GET /api/tasks/dashboard - should return dashboard data', async () => {
    const res = await request(app)
      .get('/api/tasks/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.dashboard).toBeDefined();
    expect(res.body.dashboard.totalTasks).toBeGreaterThan(0);
    expect(res.body.dashboard.tasksByStatus).toBeDefined();
  });
});

describe('Search API', () => {
  test('GET /api/search/tasks - should search by title', async () => {
    const res = await request(app)
      .get('/api/search/tasks?q=Test')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  test('GET /api/search/tasks - should filter by status', async () => {
    const res = await request(app)
      .get('/api/search/tasks?status=in_progress')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.tasks.forEach(t => expect(t.status).toBe('in_progress'));
  });
});

describe('Profile API', () => {
  test('PUT /api/profile - should update name', async () => {
    const res = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Admin' });

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Updated Admin');
  });

  test('PUT /api/profile/password - should change password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPassword: 'password123', newPassword: 'newpassword123' });

    expect(res.status).toBe(200);
  });

  test('PUT /api/profile/password - should reject wrong current password', async () => {
    const res = await request(app)
      .put('/api/profile/password')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword123' });

    expect(res.status).toBe(401);
  });
});

describe('Notification API', () => {
  test('GET /api/notifications - should return notifications', async () => {
    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.notifications).toBeDefined();
    expect(res.body.unreadCount).toBeDefined();
  });
});

describe('Analytics & Export API', () => {
  test('GET /api/projects/:id/analytics - should return analytics', async () => {
    const res = await request(app)
      .get(`/api/projects/${testProject.id}/analytics`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.analytics).toBeDefined();
    expect(res.body.analytics.totalTasks).toBeGreaterThan(0);
    expect(res.body.analytics.completionRate).toBeDefined();
    expect(res.body.analytics.priorityBreakdown).toBeDefined();
    expect(res.body.analytics.velocityChart).toHaveLength(7);
  });

  test('GET /api/projects/:id/export - should return CSV', async () => {
    const res = await request(app)
      .get(`/api/projects/${testProject.id}/export`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Title');
    expect(res.text).toContain('Test Task');
  });
});

describe('RBAC Edge Cases', () => {
  test('Non-member cannot access project', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Outsider', email: 'outsider@test.com', password: 'password123' });

    const outsiderToken = signupRes.body.token;

    const res = await request(app)
      .get(`/api/projects/${testProject.id}`)
      .set('Authorization', `Bearer ${outsiderToken}`);

    expect(res.status).toBe(403);
  });

  test('Non-member cannot create tasks', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Outsider2', email: 'outsider2@test.com', password: 'password123' });

    const outsiderToken = signupRes.body.token;

    const res = await request(app)
      .post(`/api/tasks/${testProject.id}/tasks`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'Hacked Task' });

    expect(res.status).toBe(403);
  });
});
