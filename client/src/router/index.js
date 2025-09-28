import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Tasks from '../views/Tasks.vue'

const routes = [
  { path: '/', redirect: '/tasks' },
  { path: '/login', name: 'login', component: Login, meta: { public: true } },
  { path: '/register', name: 'register', component: Register, meta: { public: true } },
  { path: '/tasks', name: 'tasks', component: Tasks }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const isPublic = to.meta.public
  const token = localStorage.getItem('token')
  if (!isPublic && !token) {
    return next('/login')
  }
  if (isPublic && token && (to.path === '/login' || to.path === '/register')) {
    return next('/tasks')
  }
  next()
})

export default router
