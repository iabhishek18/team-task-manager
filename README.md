# TeamSync — Team Task Manager

A full-stack web application where users can create projects, assign tasks, and track progress with role-based access control (Admin/Member).

## Live Demo

🔗 **Live URL**: [https://team-task-manager-production-3e82.up.railway.app](https://team-task-manager-production-3e82.up.railway.app)  
📹 **Demo Video**: [Link]  

### Test Credentials
| Email | Password | Role |
|-------|----------|------|
| alex@taskflow.com | password123 | Admin |
| sarah@taskflow.com | password123 | Admin |
| mike@taskflow.com | password123 | Admin |

## Key Features

### 1. Authentication (Signup/Login)
- JWT-based authentication with bcrypt password hashing
- Protected routes with token validation
- Form validation with specific error messages
- Persistent login (localStorage tokens)

### 2. Project & Team Management
- Create, update, delete projects
- Add/remove team members by email
- Assign roles: **Admin** (full access) / **Member** (limited access)
- Role-based permissions enforced on API + UI

### 3. Task Creation, Assignment & Status Tracking
- Create tasks with title, description, priority (High/Medium/Low), due dates
- Assign tasks to team members
- Inline status updates (Todo → In Progress → Done)
- Board view (Kanban columns) + List view
- Task comments/discussion threads
- Task labels and color coding

### 4. Dashboard
- Overview stats: Projects, Tasks, Completed, Overdue
- SVG donut chart for completion percentage
- Weekly velocity bar chart (tasks created vs completed)
- Per-project progress bars with percentages
- My Tasks list (assigned to current user)
- Overdue tasks section with days-late counter

## Additional Features
- 🔍 **Global search** (⌘K) — search tasks across all projects
- 🔔 **Notifications** — task assignments, updates
- 👤 **Profile management** — update name, change password
- 🌓 **Dark/Light theme** — toggle with persistence
- 📊 **Project analytics** — completion rate, priority breakdown, team workload
- 📥 **CSV export** — export project tasks
- 🏷️ **Labels** — color-coded task labels
- 📋 **Activity log** — tracks who did what, when
- 🔒 **Security** — Helmet headers, rate limiting, input validation
- ✅ **36 automated tests** — auth, RBAC, task CRUD, search, analytics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Node.js, Express.js, Sequelize ORM |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Security | Helmet, express-rate-limit, express-validator |
| Testing | Jest, Supertest |
| Deployment | Railway |

## Project Structure

```
team-task-manager/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Layout, Avatar, BackgroundAnimation
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── pages/          # Dashboard, Projects, ProjectDetail, Profile, Login, Signup
│   │   ├── services/       # API client (axios)
│   │   └── index.css       # Tailwind + theme variables
│   └── index.html          # Entry + loader
├── server/                 # Express backend
│   ├── src/
│   │   ├── config/         # Database, environment config
│   │   ├── controllers/    # Auth, Projects, Tasks, Comments, Notifications, etc.
│   │   ├── middleware/     # Auth, RBAC, validation
│   │   ├── models/         # User, Project, TeamMember, Task, Activity, Comment, etc.
│   │   ├── routes/         # API route definitions
│   │   ├── utils/          # Activity logger, token utils
│   │   ├── seed.js         # Mock data seeder
│   │   └── index.js        # Server entry
│   └── tests/              # Jest test suite
├── railway.toml            # Railway deployment config
├── railway.json            # Railway JSON config
└── Procfile                # Process file
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/profile | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects | List user's projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PUT | /api/projects/:id | Update project (Admin) |
| DELETE | /api/projects/:id | Delete project (Admin) |
| POST | /api/projects/:id/members | Add member (Admin) |
| DELETE | /api/projects/:id/members/:userId | Remove member (Admin) |
| PATCH | /api/projects/:id/members/:userId/role | Update role (Admin) |
| GET | /api/projects/:id/analytics | Project analytics |
| GET | /api/projects/:id/export | Export CSV |
| GET/POST/DELETE | /api/projects/:id/labels | Manage labels (Admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/tasks/dashboard | Dashboard data |
| GET | /api/tasks/activities/recent | Recent activity |
| POST | /api/tasks/:projectId/tasks | Create task |
| GET | /api/tasks/:projectId/tasks | List tasks |
| PUT | /api/tasks/:projectId/tasks/:taskId | Update task |
| DELETE | /api/tasks/:projectId/tasks/:taskId | Delete task (Admin) |
| GET/POST | /api/tasks/:projectId/tasks/:taskId/comments | Task comments |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get notifications |
| PATCH | /api/notifications/:id/read | Mark as read |
| PUT | /api/profile | Update profile |
| PUT | /api/profile/password | Change password |
| GET | /api/search/tasks?q= | Search tasks |
| GET | /api/health | Health check |

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL

### Setup
```bash
# Clone
git clone <repo-url>
cd team-task-manager

# Backend
cd server
cp .env.example .env  # Edit DATABASE_URL with your PostgreSQL credentials
npm install
npm run seed          # Populate mock data (optional)
npm run dev           # Starts on port 5000

# Frontend (new terminal)
cd client
npm install
npm run dev           # Starts on port 5174
```

### Run Tests
```bash
cd server
npm test              # 36 tests
```

## Deployment on Railway

### Steps
1. Push code to GitHub
2. Create new project on [railway.app](https://railway.app)
3. Add PostgreSQL plugin (Railway provisions automatically)
4. Connect GitHub repo — Railway detects `railway.toml` config
5. Set environment variables:

| Variable | Value |
|----------|-------|
| DATABASE_URL | Auto-provided by Railway PostgreSQL |
| JWT_SECRET | Any secure random string |
| JWT_EXPIRES_IN | 7d |
| NODE_ENV | production |
| PORT | 5000 |

6. Deploy — Railway builds frontend + starts backend automatically

### Railway Config (railway.toml)
```toml
[build]
builder = "NIXPACKS"
buildCommand = "npm install && cd client && npm install && npm run build && cd ../server && npm install"

[deploy]
startCommand = "cd server && npm start"
```

The Express server serves the built React frontend in production mode.

## Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| View projects/tasks | ✅ | ✅ |
| Create tasks | ✅ | ✅ |
| Update task status | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
| Manage members | ✅ | ❌ |
| Delete projects | ✅ | ❌ |
| Update project settings | ✅ | ❌ |

## Screenshots

*Dashboard with stats, charts, and task list*  
*Project board view with Kanban columns*  
*Dark/Light theme support*
