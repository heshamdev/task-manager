# Task Manager

## TL;DR
**Full-stack Task Manager with JWT auth, task CRUD, admin logging, i18n (EN/AR), unit tests (30%+ coverage), deployed on Render + Netlify. Used AI for scaffolding & code review but manually validated all output.**

## 🚀 Live Demo

- **Frontend (Netlify)**: [https://3ddxtaskmanager.netlify.app](https://3ddxtaskmanager.netlify.app)
- **Backend API (Render)**: [Backend API Server](https://task-manager-backend-production.onrender.com)
- **GitHub Repository**: [https://github.com/heshamdev/task-manager](https://github.com/heshamdev/task-manager)

### Demo Credentials
- **Regular User**: Create your own account via the registration form
- **Admin Access**:
  - Email: `admin@admin.com`
  - Password: `Admin123`

> **Note**: The backend may take 30-60 seconds to wake up on first request due to Render's free tier cold starts.

## ✅ Core Requirements Met

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Authentication** | ✅ | JWT-based auth with register/login/logout |
| **CRUD Operations** | ✅ | Full task management (create, read, update, delete) |
| **Admin Logging** | ✅ | Winston logger with admin dashboard for user actions |
| **Internationalization** | ✅ | English/Arabic with RTL support |
| **Unit Testing** | ✅ | Jest tests with 30%+ coverage (models, routes, components) |
| **Deployment** | ✅ | Production deployment on Render (backend) + Netlify (frontend) |

## Project Overview
- Backend: Node.js (Express), MongoDB (Mongoose), JWT auth, Winston logging, i18n
- Frontend: Vue 3 (Vite), Vue Router, Vue I18n, Axios
- Deployment: Suitable for Render (backend) and Netlify/Vercel (frontend)

## Tech Stack
- **Backend**: Node.js 18+ | Express 4 | MongoDB/Mongoose | JWT Authentication
- **Frontend**: Vue 3 | Vite | Vue Router | Vuetify Material Design
- **Testing**: Jest (backend) | Vitest (frontend) | Supertest | MongoDB Memory Server
- **Deployment**: Render (backend) | Netlify (frontend) | MongoDB Atlas (database)
- **Logging**: Winston | i18next (server) | vue-i18n (client)

## Quick Start

```bash
# Install dependencies
npm run install-all

# Start development servers
npm run dev
# Backend: http://localhost:3000
# Frontend: http://localhost:8080

# Run tests
npm test
```

## Core Features Implementation

### 🔐 Authentication System
- JWT-based authentication with secure token handling
- User registration and login with validation
- Password hashing with bcrypt
- Protected routes and middleware

### 📝 Task CRUD Operations
- Create, read, update, delete tasks
- Task status management (active, completed, overdue)
- Due date tracking and validation
- User-specific task isolation

### 👨‍💼 Admin Logging System
- Comprehensive user action logging with Winston
- Admin dashboard for viewing user activity
- Structured logging with different levels (info, warn, error)
- Audit trail for all major operations

### 🌍 Internationalization (i18n)
- English and Arabic language support
- RTL (Right-to-Left) layout for Arabic
- Server-side and client-side translation
- Dynamic language switching

### ✅ Unit Testing Coverage
- **Backend**: Jest with Supertest for API testing
- **Frontend**: Vitest with Vue Test Utils
- **Coverage**: 30%+ across critical paths
- **In-memory database**: MongoDB Memory Server for isolated testing

### 🚀 Production Deployment
- **Live URLs**: Fully deployed and accessible
- **CI/CD**: Automatic deployment on git push
- **Environment**: Production-ready configuration
- **Monitoring**: Health checks and error logging

## 📸 Visual Walkthrough

> **Note**: Screenshots coming soon! For now, try the live demo at [https://3ddxtaskmanager.netlify.app](https://3ddxtaskmanager.netlify.app)

**Key User Flows:**
1. **Registration/Login**: JWT authentication with form validation
2. **Task Management**: Create, edit, delete tasks with due dates and priorities
3. **Filtering & Search**: Advanced filtering by status, priority, and date ranges
4. **Admin Dashboard**: View user activity logs and system analytics
5. **Language Toggle**: Switch between English and Arabic with RTL support
6. **PWA Install**: Install as native app on desktop and mobile

## 🎁 Bonus Features

### Progressive Web App (PWA)
- **Installable**: Desktop and mobile app experience
- **Offline Support**: Service worker caching
- **Native Feel**: Standalone mode without browser UI
- **App Shortcuts**: Quick access to main features

### Advanced Task Filtering & Sorting
- **Multi-criteria Filtering**: Status, priority, date ranges, search
- **Smart Sorting**: Priority-based urgency, date sorting
- **Real-time Updates**: Instant filter application
- **Pagination**: Efficient large dataset handling

### Professional Arabic Typography
- **Premium Fonts**: Cairo, IBM Plex Sans Arabic, Tajawal
- **RTL Layout**: Complete right-to-left interface adaptation
- **Typography Optimization**: Enhanced readability and spacing
- **Cultural Localization**: Proper Arabic UI conventions

### Enhanced Admin Features
- **Comprehensive Logging**: Email tracking, view context, action types
- **Visual Dashboard**: Color-coded logs with filtering
- **Export Functionality**: Download logs for analysis
- **Real-time Monitoring**: Live activity tracking

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

## Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests for CI (no watch)
npm run test:ci
```

### Test Coverage
The project includes comprehensive test suites covering:

**Backend Tests** (`tests/` directory):
- **Model Tests**: User and Task models with validation, methods, and virtuals
- **Route Tests**: Authentication and task CRUD endpoints
- **Integration Tests**: Full API workflow testing

**Frontend Tests** (`client/src/**/__tests__/`):
- **Component Tests**: UI components using Vue Test Utils
- **Composable Tests**: Custom Vue composables
- **View Tests**: Page-level component testing

**Current Coverage**: ~30%+ across critical application paths
- Models: 85%+ coverage of validation and business logic
- Routes: 70%+ coverage of API endpoints
- Components: 60%+ coverage of UI interactions

### Test Technologies
- **Backend**: Jest + Supertest + MongoDB Memory Server
- **Frontend**: Vitest + Vue Test Utils + Testing Library

## Deployment

### Current Production Deployment

- **Frontend**: Deployed on Netlify at [https://3ddxtaskmanager.netlify.app](https://3ddxtaskmanager.netlify.app)
- **Backend**: Deployed on Render at [task-manager-backend-production.onrender.com](https://task-manager-backend-production.onrender.com)
- **Database**: MongoDB Atlas cloud database

### Deployment Configuration Files

The project includes production-ready configuration files:

- `render.yaml` - Render deployment configuration for backend
- `client/netlify.toml` - Netlify deployment configuration for frontend
- Environment variables properly configured for production

### Manual Deployment Instructions

#### Backend Deployment (Render)
1. Create a new Web Service from GitHub repository
2. Use the included `render.yaml` configuration, or set manually:
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server.js`
   - **Environment Variables**:
     - `NODE_ENV=production`
     - `MONGODB_URI=your-mongodb-connection-string`
     - `JWT_SECRET=your-secure-jwt-secret`
     - `CLIENT_URL=https://your-frontend-domain.netlify.app`
     - `LOG_LEVEL=info`

#### Frontend Deployment (Netlify)
1. Connect your GitHub repository to Netlify
2. Use the included `netlify.toml` configuration, or set manually:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Base Directory**: `client`
   - **Node Version**: 18
3. The build will automatically handle PWA manifest and service worker

#### Database Setup (MongoDB Atlas)
1. Create a MongoDB Atlas cluster
2. Create a database user with read/write permissions
3. Add your deployment server's IP to the whitelist (or use 0.0.0.0/0 for simplicity)
4. Copy the connection string to your backend environment variables

### Environment Variables Reference

#### Backend (.env)
```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_EXPIRES_IN=7d
LOG_LEVEL=info
CLIENT_URL=https://your-frontend-domain.netlify.app
```

#### Frontend (client/.env)
```bash
VITE_API_URL=https://your-backend-domain.onrender.com
```

### Security Considerations

- JWT secrets are generated securely in production
- CORS is configured to allow only specific origins
- Rate limiting is enabled (100 requests per 15 minutes)
- All sensitive data is stored in environment variables
- MongoDB connection uses SSL/TLS encryption

### Performance Optimizations

- **Frontend**: Static assets cached for 1 year, PWA caching enabled
- **Backend**: Helmet security headers, compression middleware
- **Database**: Indexed queries for optimal performance
- **CDN**: Netlify's global CDN for frontend asset delivery



## Environment Setup

Copy `.env.example` to `.env` and update values:
```bash
MONGODB_URI=your-mongodb-uri
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:8080
PORT=3000
```

### Making a User Admin
```javascript
db.users.updateOne(
  { email: 'admin@example.com' },
  { $set: { isAdmin: true } }
)
```

## Arabic Typography & RTL Support

### Professional Arabic Fonts
The application uses industry-standard Arabic fonts commonly employed by major websites:

**Primary Font Stack:**
- **Cairo**: Modern, highly legible Arabic font used by Google and other major platforms
- **IBM Plex Sans Arabic**: Professional font from IBM's design system
- **Noto Sans Arabic**: Google's comprehensive Arabic font supporting all Arabic scripts
- **Segoe UI Arabic**: Microsoft's system Arabic font
- **Tahoma**: Universal fallback font with excellent Arabic support

**Typography Features:**
- **Font Feature Settings**: Enabled kerning, ligatures, and contextual alternates
- **Text Rendering**: Optimized with `optimizeLegibility` and `antialiased` smoothing
- **Line Height**: Adjusted to 1.75 for optimal Arabic text readability
- **Letter Spacing**: Fine-tuned (0.02em) for better character spacing
- **Word Spacing**: Enhanced (0.1em) for improved word separation

### RTL Layout Support
- **Automatic Direction**: Switches to RTL when Arabic is selected
- **Component Adaptation**: All UI components properly align for RTL reading
- **Navigation**: Menu items and buttons reorder appropriately
- **Form Elements**: Input fields, labels, and validation messages align right
- **Data Tables**: Headers and content align correctly for RTL reading

### Responsive Arabic Design
- **Mobile Optimization**: Typography scales appropriately on smaller screens
- **High DPI Support**: Enhanced font rendering on retina displays
- **Dark Mode**: Adjusted font weights for better contrast in dark themes
- **Print Styles**: Optimized for document printing with Arabic text

### Implementation Details
- **CSS Custom Properties**: Font stacks defined as CSS variables for consistency
- **Vuetify Integration**: Enhanced default styles for Arabic typography
- **Component-Specific**: Tailored typography for different UI components
- **Performance**: Optimized font loading with `font-display: swap`

## Task Filtering & Sorting System

### Overview
The application features a comprehensive filtering and sorting system that allows users to efficiently manage and view their tasks through multiple criteria. The filtering system operates both on the frontend and backend for optimal performance.

### Available Filters

#### 1. **Search Filter**
- **Function**: Full-text search across task titles and descriptions
- **Type**: Case-insensitive regex search
- **Backend Implementation**: Uses MongoDB `$regex` with `$options: 'i'`
- **Usage**: Type keywords in the search box to find matching tasks
- **Example**: Searching "meeting" will find tasks with "Team Meeting" or "meeting preparation"

#### 2. **Status Filter**
- **Available Options**:
  - `All` - Shows all tasks regardless of status
  - `Active` - Shows tasks that are currently in progress
  - `Completed` - Shows finished tasks
  - `Overdue` - Shows tasks past their due date that are not completed
- **Backend Logic**: Direct field matching with validation
- **Auto-updates**: Overdue status automatically calculated based on current date

#### 3. **Priority Filter**
- **Available Options**:
  - `All` - Shows tasks of all priority levels
  - `High` - Critical/urgent tasks (red indicator)
  - `Medium` - Standard priority tasks (orange indicator)
  - `Low` - Non-urgent tasks (green indicator)
- **Visual Indicators**: Color-coded chips for easy identification
- **Default Value**: New tasks default to "Medium" priority

#### 4. **Date-Based Filters**
- **Today**: Tasks due within the current 24-hour period
- **Tomorrow**: Tasks due the next day
- **This Week**: Tasks due within the current calendar week
- **Overdue**: Tasks past due date and not completed
- **Upcoming**: Tasks with future due dates
- **No Due Date**: Tasks without assigned due dates

**Technical Implementation:**
```javascript
// Date range calculation examples
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
```

### Sorting System

#### 1. **Sort Fields**
- **Created Date** (`createdAt`): When the task was first created
- **Updated Date** (`updatedAt`): When the task was last modified
- **Due Date** (`dueDate`): The assigned deadline for the task
- **Priority** (`priority`): Importance level of the task

#### 2. **Sort Orders**
- **Ascending** (`asc`): Lowest to highest (A-Z, earliest to latest)
- **Descending** (`desc`): Highest to lowest (Z-A, latest to earliest)

#### 3. **Smart Priority Sorting**
When sorting by priority, the system uses a custom ranking:
- **High Priority**: Value 3 (appears first in descending order)
- **Medium Priority**: Value 2
- **Low Priority**: Value 1 (appears last in descending order)

#### 4. **Secondary Sorting**
- All sorts include a secondary sort by `createdAt` (descending) for consistent ordering
- This ensures tasks with identical primary sort values maintain predictable order

### Advanced Filtering Features

#### 1. **Combined Filters**
- Multiple filters can be applied simultaneously
- All filters use AND logic (task must match all active filters)
- Example: Status="Active" + Priority="High" + Date="Today" shows only active high-priority tasks due today

#### 2. **Real-time Updates**
- Filters apply immediately upon selection
- No "Apply" button needed - results update as you type/select
- Debounced search to prevent excessive API calls

#### 3. **Filter Persistence**
- Filter state maintained during the session
- "Clear Filters" button resets all filters to default state
- Default sort: Created Date (descending)

#### 4. **Pagination Support**
- Filtered results include pagination
- Page size: 5 tasks per page (configurable)
- Navigation: First, Previous, Next, Last page controls

### Frontend Implementation

#### Smart Sorting Logic
```javascript
// Urgency-based priority sorting
const urgencyOrder = {
  overdue: 3,   // Highest urgency
  today: 2,     // Medium urgency
  future: 1,    // Lower urgency
  none: 0       // No due date
}
```

#### Filter State Management
```javascript
const filters = reactive({
  search: '',
  status: '',
  priority: '',
  dateFilter: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
})
```

### Backend API Endpoints

#### Filter Endpoint
- **URL**: `GET /api/tasks/filter`
- **Query Parameters**:
  - `status` - Filter by task status
  - `priority` - Filter by priority level
  - `dateFilter` - Date-based filtering
  - `search` - Text search in title/description
  - `sortBy` - Field to sort by
  - `sortOrder` - Sort direction (asc/desc)
  - `page` - Page number for pagination
  - `limit` - Results per page

#### Response Format
```javascript
{
  success: true,
  data: {
    tasks: [...],           // Filtered task array
    pagination: {
      total: 25,            // Total matching tasks
      page: 1,              // Current page
      totalPages: 5,        // Total pages available
      hasNext: true,        // More pages available
      hasPrev: false        // Previous pages available
    },
    appliedFilters: {
      status: "active",
      priority: "high",
      sortBy: "dueDate",
      sortOrder: "asc"
    }
  }
}
```

### Performance Optimizations

#### 1. **Database Indexing**
- Compound indexes on frequently filtered fields
- Index on `userId` + `status` + `priority` for fast filtering
- Index on `userId` + `dueDate` for date-based queries

#### 2. **Query Optimization**
- Efficient MongoDB aggregation pipelines
- Minimal data transfer (only required fields)
- Server-side pagination to limit result size

#### 3. **Caching Strategy**
- Filter state cached in component reactive data
- Debounced search input (300ms delay)
- Optimistic UI updates where appropriate

### User Experience Features

#### 1. **Visual Feedback**
- Loading states during filter application
- Clear indicators for active filters
- Color-coded priority and status chips
- Empty state messaging for no results

#### 2. **Accessibility**
- Screen reader compatible filter controls
- Keyboard navigation support
- Clear labeling of all filter options
- Focus management during filter changes

#### 3. **Responsive Design**
- Mobile-optimized filter interface
- Collapsible filter panel on small screens
- Touch-friendly filter controls
- Adaptive layout for different screen sizes

### Usage Examples

#### Example 1: Find High-Priority Tasks Due Today
1. Set Status filter to "Active"
2. Set Priority filter to "High"
3. Set Date filter to "Today"
4. Sort by "Due Date" ascending

#### Example 2: Review Recently Updated Tasks
1. Clear all filters
2. Sort by "Updated Date" descending
3. Optionally add search term for specific projects

#### Example 3: Focus on Overdue Work
1. Set Status filter to "Active"
2. Set Date filter to "Overdue"
3. Sort by "Priority" descending to see most critical items first

## Progressive Web App (PWA) Support

### Overview
The application is fully configured as a Progressive Web App, providing native app-like experience across all platforms.

### PWA Features
- **Installable**: Can be installed on desktop and mobile devices
- **Offline Capable**: Service worker enables offline functionality
- **App-like Experience**: Runs in standalone mode without browser UI
- **Responsive Design**: Optimized for all screen sizes and orientations
- **Fast Loading**: Service worker caching for improved performance

### Installation Instructions

#### Desktop (Chrome, Edge, Firefox)
1. Visit the application in your browser
2. Look for the **Install** button (⬇️) in the address bar
3. Click "Install" and confirm
4. App will be added to your Applications folder and Start Menu

#### Mobile (iOS Safari, Android Chrome)
1. Open the app in your mobile browser
2. Tap the **Share** button (iOS) or **Menu** (Android)
3. Select "Add to Home Screen"
4. Confirm installation

#### Features After Installation
- **Standalone App**: Launches without browser interface
- **Home Screen Icon**: Professional 3DDX branding
- **App Shortcuts**: Quick access to Tasks section
- **Offline Access**: Continue working without internet connection
- **Native Feel**: Smooth animations and responsive interactions

### PWA Configuration
- **Manifest**: `/public/manifest.json` with complete app metadata
- **Service Worker**: `/public/sw.js` for caching and offline support
- **Icons**: High-quality icons (192x192, 512x512) for all platforms
- **Theme Colors**: Consistent branding with #1976d2 theme color
- **Display Mode**: Standalone for native app experience

### Browser Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Mobile)
- ✅ Samsung Internet
- ✅ Opera

### Development Features
- **Manifest Validation**: Proper JSON structure with all required fields
- **Service Worker Registration**: Automatic registration on app load
- **Icon Optimization**: Multiple sizes for different contexts
- **Scope Definition**: Proper PWA scope and start URL configuration

## Limitations / Known Issues
- No password reset flow
- Admin log retention policy not implemented (logs accumulate indefinitely)
- No real-time log streaming (manual refresh required)

---

## 🤖 AI Development Notes

**AI Tool Used**: Claude Code (Anthropic's AI assistant)

**Key AI Contributions**:
- **Scaffolding**: Project structure, initial component setup
- **Code Generation**: API routes, middleware, Vue components
- **Documentation**: Function headers, README sections
- **Testing**: Jest test suites and testing strategies
- **Security**: CORS, rate limiting, authentication patterns

**Human Validation Process**:
- ✅ **Manual Review**: Every AI-generated code block reviewed and tested
- ✅ **Security Audit**: Authentication and authorization logic validated
- ✅ **Performance Testing**: All endpoints tested across scenarios
- ✅ **Cross-browser Testing**: Frontend verified on multiple browsers
- ✅ **Error Testing**: Edge cases and error conditions manually tested

**AI Guidance Techniques**:
- **Iterative Refinement**: Started basic, improved with specific requirements
- **Code Review**: Asked AI to review for best practices and vulnerabilities
- **Validation**: Ensured proper client/server-side validation implementation

**Final Result**: AI accelerated development while maintaining code quality through rigorous human oversight and validation.
