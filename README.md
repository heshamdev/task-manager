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
- Professional Arabic Typography (Cairo, IBM Plex Sans Arabic, Tajawal fonts)

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

### How AI Was Used
I extensively used Claude Code (Anthropic's AI assistant) throughout this project while maintaining full oversight and validation of all generated code.

### Specific AI Assistance Areas
- **Project Architecture**: AI helped scaffold the initial project structure, separating concerns into logical directories (routes, models, middleware, utils)
- **Authentication Implementation**: Guided AI to implement JWT-based authentication with specific requirements for token validation, password hashing, and admin role management
- **Database Design**: Used AI to create Mongoose schemas with proper validation rules and relationships
- **API Route Development**: AI generated CRUD endpoints with comprehensive error handling and validation middleware
- **Frontend Components**: Generated Vue 3 components using Composition API with Vuetify integration
- **Internationalization**: Implemented i18n setup for both backend (i18next) and frontend (vue-i18n) with professional Arabic typography and RTL support
- **Testing Suite**: Created comprehensive Jest test suites for both models and routes
- **Security Implementation**: Added security middleware (helmet, CORS, rate limiting) with AI guidance

### AI Guidance Techniques Used
- **Iterative Refinement**: Started with basic implementations and iteratively improved with specific requirements
- **Code Review**: Asked AI to review generated code for best practices, security vulnerabilities, and performance issues
- **Documentation**: Used AI to generate comprehensive function headers and inline comments
- **Error Handling**: Specifically guided AI to implement proper try/catch blocks and meaningful error messages
- **Validation**: Ensured AI implemented both client-side and server-side validation for all user inputs

### Validation and Quality Control
- **Manual Code Review**: Every AI-generated code block was manually reviewed and tested
- **Security Audit**: Validated all authentication and authorization logic
- **Performance Testing**: Tested all API endpoints with various scenarios
- **Cross-browser Testing**: Verified frontend functionality across different browsers and devices
- **Error Scenario Testing**: Tested edge cases and error conditions manually

## Assumptions Made During Development

### **UI/UX Design Decisions**
- **Clean, Professional Interface**: Assumed preference for a modern, professional look using Vuetify Material Design components
- **3DDX Branding**: Integrated company branding with custom color scheme and logo placement
- **Mobile-First Approach**: Assumed mobile responsiveness was important, implemented responsive design patterns
- **Accessibility**: Assumed basic accessibility requirements, implemented proper ARIA labels and keyboard navigation

### **Security Level Assumptions**
- **Development Environment**: Assumed this is for evaluation/demo purposes, so used development-appropriate security measures
- **JWT Expiration**: Set 7-day token expiration assuming user convenience over maximum security
- **Password Complexity**: Implemented moderate password requirements (6+ chars, mixed case, numbers) for demo usability
- **Rate Limiting**: Set moderate limits (100 requests/15min) suitable for demo usage
- **Admin Creation**: Assumed manual admin assignment via database for simplicity

### **Feature Scope Decisions**
- **Single-User Tasks**: Assumed tasks are private to each user (no sharing/collaboration features)
- **Basic Task Model**: Implemented title, description, due date, and status - assumed these core fields meet requirements
- **Language Support**: Added English/Arabic i18n assuming this demonstrates internationalization capability
- **Logging Granularity**: Logged major user actions (login, CRUD operations) - assumed this level of detail meets audit requirements
- **Admin Features**: Focused on log viewing API - assumed UI could be added later if needed

### **Technical Architecture Assumptions**
- **MongoDB Atlas**: Assumed cloud database is acceptable for demo deployment
- **Free Tier Limitations**: Designed within free tier constraints of Render, Netlify, and MongoDB Atlas
- **API-First Design**: Assumed separation of frontend/backend for scalability and flexibility
- **REST API**: Chose REST over GraphQL assuming simpler implementation for demo purposes
- **No Real-time Features**: Assumed real-time updates (WebSockets) not required for basic task management

### **Deployment & Environment Assumptions**
- **Internet Connectivity**: Assumed reliable internet for cloud database and API calls
- **Modern Browsers**: Assumed ES6+ support and modern browser features
- **Development Tools**: Assumed Node.js 18+, npm, and modern development environment
- **CORS Configuration**: Configured for specific domains assuming controlled deployment environment

## Admin Features

### Admin Dashboard
The application includes a comprehensive admin dashboard accessible at `/admin` for users with admin privileges.

**Features:**
- **User Activity Logs**: View all user actions with timestamps and details
- **Log Filtering**: Filter by log level (error, warn, info, debug) and search content
- **Pagination**: Navigate through large log sets efficiently
- **Export Functionality**: Download logs as JSON for external analysis
- **Real-time Refresh**: Manually refresh logs to get latest activity

**Access Requirements:**
- User must have `isAdmin: true` in their profile
- Valid JWT token required
- Automatic redirect for non-admin users

### Making a User Admin
Update user privileges in MongoDB:
```javascript
db.users.updateOne(
  { email: 'admin@example.com' },
  { $set: { isAdmin: true } }
)
```

### Admin API Endpoints
- `GET /api/admin/logs` - Retrieve user activity logs (admin only)
- Supports query parameters: `page`, `limit` for pagination

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
