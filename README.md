# Task Manager

A simple task manager web application demonstrating clean structure, best practices, AI-assisted development, and deployment. Users can register/login, create/update/delete tasks, mark tasks as done/pending, and filter tasks. Admins can view user action logs.

## Project Overview
- Backend: Node.js (Express), MongoDB (Mongoose), JWT auth, Winston logging, i18n
- Frontend: Vue 3 (Vite), Vue Router, Vue I18n, Axios
- Deployment: Suitable for Render (backend) and Netlify/Vercel (frontend)

## Tech Stack
- Node.js 18+
- Express 4
- Mongoose 7
- JWT (jsonwebtoken)
- Winston logger
- i18next (server) / vue-i18n (client)
- Vue 3 + Vite

## Structure
```
.
├── server/
│   ├── server.js                 # Express app bootstrap
│   ├── config/
│   │   ├── database.js           # Mongo connection
│   │   └── i18n.js               # i18n setup
│   ├── middleware/
│   │   ├── auth.js               # JWT auth + requireAdmin
│   │   └── validation.js         # express-validator rules
│   ├── models/
│   │   ├── User.js               # User model (isAdmin)
│   │   └── Task.js               # Task model
│   ├── routes/
│   │   ├── auth.js               # Register/Login/Profile/Logout
│   │   ├── tasks.js              # CRUD + toggle + stats
│   │   └── admin.js              # Admin-only logs
│   ├── utils/
│   │   └── logger.js             # Winston logger + logUserAction()
│   ├── locales/en/*.json         # i18n resources
├── client/
│   ├── index.html
│   ├── vite.config.js
│   └── src/
│       ├── main.js
│       ├── App.vue
│       ├── style.css
│       ├── router/
│       │   └── index.js
│       ├── services/
│       │   └── api.js
│       ├── i18n/
│       │   ├── index.js
│       │   └── locales/en.json
│       └── views/
│           ├── Login.vue
│           ├── Register.vue
│           └── Tasks.vue
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Environment (.env)
Copy `.env.example` to `.env` and update values:
```
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
LOG_FILE_PATH=./logs/app.log
LOG_LEVEL=info
CLIENT_URL=http://localhost:8080
```

## Setup Instructions
1. Install dependencies (root + client):
```
npm run install-all
```

2. Start development servers (concurrently):
```
npm run dev
```
- Backend runs at http://localhost:5000
- Frontend runs at http://localhost:8080 (proxy to backend `/api`)

3. Create an account and login on the frontend, then start creating tasks.

## Deployment
- Backend (Render):
  - Create a new Web Service from the repo
  - Build command: `npm install`
  - Start command: `node server/server.js`
  - Environment: add `.env` variables (MONGODB_URI, JWT_SECRET, CLIENT_URL to your frontend URL)

- Frontend (Netlify/Vercel):
  - Build command: `npm --prefix client run build`
  - Publish directory: `client/dist`
  - Set environment variables for API base if needed (we use relative `/api`, so configure a proxy or set full URL in `api.js` for production)

- Set `CLIENT_URL` to your deployed frontend URL on the backend for CORS
- Consider serving the frontend statically from Netlify/Vercel and backend from Render with CORS enabled

## AI Usage Notes
- I used an AI assistant to:
  - Scaffold project structure and boilerplate files
  - Implement common patterns: JWT auth, CRUD routes, i18n setup, logging with winston
  - Generate initial Vue pages and API service
  - Create comprehensive documentation and setup instructions
  - Implement a professional theme switcher with light/dark mode toggle next to the globe icon
- I reviewed and validated all generated code, adjusted configurations, ensured proper error handling, and added comments and documentation.

## Limitations / Known Issues
- No password reset flow
- Admin UI for viewing logs is not implemented; API exists at `/api/admin/logs` (admin token required)

## How to make a user admin
Update the user in MongoDB:
```
db.users.updateOne({ email: 'you@example.com' }, { $set: { isAdmin: true } })
```
Then use their token to call `/api/admin/logs`.
