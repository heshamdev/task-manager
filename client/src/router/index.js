import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Tasks from '../views/Tasks.vue'
import Admin from '../views/Admin.vue'

const routes = [
  { path: '/', redirect: '/tasks' },
  { path: '/login', name: 'login', component: Login, meta: { public: true } },
  { path: '/register', name: 'register', component: Register, meta: { public: true } },
  { path: '/tasks', name: 'tasks', component: Tasks },
  { path: '/admin', name: 'admin', component: Admin, meta: { requiresAdmin: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Helper function to decode JWT and check admin status
function isUserAdmin() {
  const token = localStorage.getItem('token')
  if (!token) return false

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.isAdmin === true
  } catch {
    return false
  }
}

router.beforeEach((to, from, next) => {
  const isPublic = to.meta.public
  const requiresAdmin = to.meta.requiresAdmin
  const token = localStorage.getItem('token')

  // Check if route is public and user is not authenticated
  if (!isPublic && !token) {
    return next('/login')
  }

  // Redirect authenticated users away from login/register
  if (isPublic && token && (to.path === '/login' || to.path === '/register')) {
    return next('/tasks')
  }

  // Check admin requirements
  if (requiresAdmin && !isUserAdmin()) {
    // Redirect non-admin users to tasks page
    return next('/tasks')
  }

  next()
})

export default router
