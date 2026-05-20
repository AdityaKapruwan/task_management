# Team Task Manager (Full-Stack)

A full-stack web app for creating projects, assigning tasks to team members, and tracking progress with **Admin** and **Member** role-based access control (RBAC).

## Features

- **Authentication** — Sign up and sign in with JWT
- **Projects & teams** — Admins create projects and add members
- **Tasks** — Create tasks, assign users, update status (To Do / In Progress / Done)
- **Dashboard** — Task overview, status counts, overdue and due-soon highlights
- **RBAC** — Admins manage projects and members; members work on assigned project tasks

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, Vite, React Router           |
| Backend  | Node.js, Express (REST API)         |
| Database | MongoDB, Mongoose ODM               |
| Auth     | JWT, bcrypt                         |
| Deploy   | Railway                             |

## Demo Accounts (after seed)

| Role   | Email             | Password   |
|--------|-------------------|------------|
| Admin  | admin@team.com    | admin123   |
| Member | member@team.com   | member123  |

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB — choose one:
  - **[MongoDB Atlas](https://www.mongodb.com/atlas)** (recommended, free tier, no local install)
  - **MongoDB Community** installed on your machine ([Windows install guide](https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-windows/))

### 1. Set up MongoDB

**Option A — MongoDB Atlas (easiest)**

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a database user and allow your IP in **Network Access**.
3. Copy the connection string (Connect → Drivers → Node.js).

**Option B — Local MongoDB**

1. Install [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Start the MongoDB service (Windows: it usually runs as a service after install).
3. Use: `mongodb://localhost:27017/team_task_manager`

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set:

- `DATABASE_URL` — your Atlas or local MongoDB connection string
- `JWT_SECRET` — any long random string

### 3. Install and run

```bash
npm run install:all
npm run db:seed
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/dashboard` | Dashboard stats |
| GET/POST | `/api/projects` | List / create projects |
| GET/PUT/DELETE | `/api/projects/:id` | Project CRUD |
| POST/DELETE | `/api/projects/:id/members` | Manage members |
| GET/POST | `/api/tasks` | List / create tasks |
| PUT/DELETE | `/api/tasks/:id` | Update / delete task |
| GET | `/api/users` | List users (Admin only) |

## Deploy to Railway

1. Push this repo to **GitHub**.
2. Create a new project on [Railway](https://railway.app).
3. Add **MongoDB** (Railway plugin) or connect **MongoDB Atlas** and set `DATABASE_URL`.
4. Set environment variables:
   - `DATABASE_URL` — MongoDB connection string
   - `JWT_SECRET` — long random string
   - `NODE_ENV` — `production`
5. Deploy from GitHub. Railway builds the frontend, seeds demo data, and serves the app.
6. Open the generated **public URL**.

## Submission Checklist

- [ ] Live URL (Railway deployment)
- [ ] GitHub repository link
- [ ] This README in the repo
- [ ] 2–5 min demo video (signup, projects, tasks, dashboard, admin vs member)

## Project Structure

```
team-task-manager/
├── backend/          # Express REST API + Mongoose
├── frontend/         # React SPA
├── railway.toml
└── README.md
```

## License

MIT
