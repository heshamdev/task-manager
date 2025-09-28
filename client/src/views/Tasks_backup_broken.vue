<template>
  <div class="tasks-page">
    <!-- Main Content -->
    <div class="container">
      <div class="tasks-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="card">
            <h2 class="card-title">{{ $t('tasks.createTask') }}</h2>
            <VeeForm class="form" @submit="createTask" v-slot="{ errors }">
              <div class="form-group">
                <label class="form-label">{{ $t('tasks.title') }}</label>
                <div class="input-wrapper">
                  <CheckSquare class="input-icon" :size="20" />
                  <VeeField 
                    name="title"
                    class="form-input" 
                    :class="{ 'error': errors.title }"
                    v-model="form.title" 
                    rules="required|min:3|max:100" 
                    placeholder="Enter task title"
                  />
                </div>
                <VeeErrorMessage name="title" class="error-message" />
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ $t('tasks.description') }}</label>
                <VeeField 
                  name="description"
                  as="textarea"
                  class="form-textarea" 
                  :class="{ 'error': errors.description }"
                  v-model="form.description" 
                  rules="max:500"
                  placeholder="Enter task description"
                  rows="3"
                />
                <VeeErrorMessage name="description" class="error-message" />
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ $t('common.priority') }}</label>
                <div class="select-wrapper">
                  <select class="form-select" v-model="form.priority">
                    <option value="low">{{ $t('tasks.low') }}</option>
                    <option value="medium">{{ $t('tasks.medium') }}</option>
                    <option value="high">{{ $t('tasks.high') }}</option>
                  </select>
                  <i class="select-arrow"></i>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">{{ $t('tasks.dueDate') }}</label>
                <VeeField 
                  name="dueDate"
                  type="date" 
                  class="form-input"
                  :class="{ 'error': errors.dueDate }"
                  v-model="form.dueDate" 
                  rules="validDate|futureDate"
                />
                <VeeErrorMessage name="dueDate" class="error-message" />
              </div>
              
              <button class="submit-btn" type="submit">{{ $t('common.create') }}</button>
              <p v-if="formError" class="error">{{ formError }}</p>
            </VeeForm>

            <div class="filters-section">
              <h3 class="section-subtitle">Filters</h3>
              <div class="filters-grid">
                <div class="form-group">
                  <label class="form-label">{{ $t('common.status') }}</label>
                  <div class="select-wrapper">
                    <select class="form-select" v-model="filters.status" @change="handleStatusFilterChange">
                      <option value="all">{{ $t('tasks.all') }}</option>
                      <option value="pending">{{ $t('tasks.pending') }}</option>
                      <option value="completed">{{ $t('tasks.completed') }}</option>
                    </select>
                    <i class="select-arrow"></i>
                  </div>
                </div>
                
                <div class="form-group">
                  <label class="form-label">{{ $t('common.priority') }}</label>
                  <div class="select-wrapper">
                    <select class="form-select" v-model="filters.priority" @change="handlePriorityFilterChange">
                      <option value="all">{{ $t('tasks.all') }}</option>
                      <option value="low">{{ $t('tasks.low') }}</option>
                      <option value="medium">{{ $t('tasks.medium') }}</option>
                      <option value="high">{{ $t('tasks.high') }}</option>
                    </select>
                    <i class="select-arrow"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">{{ $t('tasks.tasks') }}</h2>
              <div class="stats" v-if="stats">
                <span class="stat-item">{{ $t('tasks.all') }}: <strong>{{ stats.total }}</strong></span>
                <span class="stat-item">{{ $t('tasks.completed') }}: <strong>{{ stats.completed }}</strong></span>
                <span class="stat-item">{{ $t('tasks.pending') }}: <strong>{{ stats.pending }}</strong></span>
              </div>
            </div>

            <div class="tasks-grid" v-if="tasks.length">
              <article v-for="t in tasks" :key="t._id" class="task-card">
                <div class="task-header">
                  <h3 class="task-title">{{ t.title }}</h3>
                  <span class="task-status" :class="t.status">{{ t.status }}</span>
                </div>
                
                <p v-if="t.description" class="task-description">{{ t.description }}</p>
                
                <div class="task-meta">
                  <span class="priority-badge" :class="t.priority">{{ t.priority }}</span>
                  <small v-if="t.dueDate" class="due-date">
                    Due: {{ new Date(t.dueDate).toLocaleDateString() }}
                  </small>
                </div>
                
                <div class="task-actions">
                  <button class="btn-secondary" @click="toggle(t)">
                    {{ t.status === 'completed' ? $t('tasks.pending') : $t('tasks.completed') }}
                  </button>
                  <button class="btn-primary" @click="openEdit(t)">{{ $t('common.edit') }}</button>
                  <button class="btn-danger" @click="remove(t)">{{ $t('common.delete') }}</button>
                </div>
              </article>
            </div>
            
            <div v-else class="no-tasks">
              <p>No tasks found. Create your first task to get started!</p>
            </div>

          
            <!-- Enhanced Pagination Component -->
            <Pagination
              :current-page="pagination.currentPage"
              :total-pages="pagination.totalPages"
              :total-items="pagination.totalTasks"
              :page-size="pagination.limit || 3"
              @page-change="handlePageChange"
              @page-size-change="handlePageSizeChange"
            />
          </div>
        </main>
      </div>
    </div>

    <!-- Edit Dialog -->
    <dialog ref="editDialog" class="edit-dialog">
      <form class="dialog-form" @submit.prevent="saveEdit">
        <h3 class="dialog-title">Edit Task</h3>
        
        <div class="form-group">
          <label class="form-label">{{ $t('tasks.title') }}</label>
          <input class="form-input" v-model="edit.title" required maxlength="100" />
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('tasks.description') }}</label>
          <textarea class="form-textarea" v-model="edit.description" maxlength="500" rows="3"></textarea>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('common.priority') }}</label>
          <div class="select-wrapper">
            <select class="form-select" v-model="edit.priority">
              <option value="low">{{ $t('tasks.low') }}</option>
              <option value="medium">{{ $t('tasks.medium') }}</option>
              <option value="high">{{ $t('tasks.high') }}</option>
            </select>
            <i class="select-arrow"></i>
          </div>
        </div>
        
        <div class="form-group">
          <label class="form-label">{{ $t('tasks.dueDate') }}</label>
          <input class="form-input" type="date" v-model="edit.dueDate" />
        </div>
        
        <div class="dialog-actions">
          <button class="btn-secondary" type="button" @click="closeEdit">{{ $t('common.cancel') }}</button>
          <button class="btn-primary" type="submit">{{ $t('common.save') }}</button>
        </div>
      </form>
    </dialog>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { CheckSquare } from 'lucide-vue-next'
import { useLoading } from 'vue-loading-overlay'
import Pagination from '../components/Pagination.vue'
import api from '../services/api'

const router = useRouter()
const $loading = useLoading()
const tasks = ref([])
const stats = ref(null)
const pagination = reactive({ currentPage: 1, totalPages: 1, totalTasks: 0, hasNextPage: false, hasPrevPage: false, limit: 3 })
const filters = reactive({ status: 'all', priority: 'all' })
const form = reactive({ title: '', description: '', priority: 'medium', dueDate: '' })
const formError = ref('')

const editDialog = ref()
const edit = reactive({ _id: null, title: '', description: '', priority: 'medium', dueDate: '' })

async function fetchTasks(page = 1, showLoaderUI = false) {
  let loader = null
  
  if (showLoaderUI) {
    loader = $loading.show({
      message: 'Loading your tasks...',
      color: '#1ebbf0',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      blur: '3px'
    })
  }
  
  try {
    const params = {}
    if (filters.status !== 'all') params.status = filters.status
    if (filters.priority !== 'all') params.priority = filters.priority
    params.page = page
    params.limit = pagination.limit
    
    const { data } = await api.get('/api/tasks', { params })
    
    tasks.value = data.data.tasks
    Object.assign(pagination, data.data.pagination)
    
    console.log('Fetch tasks response:', data)
    console.log('Tasks data:', data.data.tasks)
    console.log('Pagination data:', pagination)
    console.log('Tasks count:', tasks.value.length)
    
    await fetchStats()
    
  } catch (e) {
    console.error('Fetch tasks error:', e)
    
    if (e?.response?.status === 401) {
      console.log('Authentication expired, redirecting to login')
      localStorage.removeItem('token')
      router.push('/login')
      return
    }
    
    console.error('Error loading tasks:', e)
  } finally {
    if (loader) {
      loader.hide()
    }
  }
}

async function fetchStats() {
  const { data } = await api.get('/api/tasks/stats')
  stats.value = data.data.stats
}

async function createTask(values, { setErrors, resetForm }) {
  formError.value = ''
  
  let loader = $loading.show({
    message: 'Creating your task...',
    color: '#1ebbf0',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    blur: '3px'
  })
  
  try {
    const { data } = await api.post('/api/tasks', {
      title: values.title,
      description: values.description,
      priority: form.priority,
      dueDate: values.dueDate || form.dueDate
    })
    
    console.log('Task creation response:', data)
    
    const newTask = data.data?.task || data.data || data.task || data
    
    if (newTask && newTask._id) {
      const taskToAdd = {
        _id: newTask._id,
        title: newTask.title || values.title,
        description: newTask.description || values.description || '',
        priority: newTask.priority || form.priority,
        dueDate: newTask.dueDate || values.dueDate || form.dueDate,
        status: newTask.status || 'pending',
        createdAt: newTask.createdAt || new Date().toISOString(),
        updatedAt: newTask.updatedAt || new Date().toISOString()
      }
      
      tasks.value.unshift(taskToAdd)
      console.log('Task added to list:', taskToAdd)
      console.log('Current tasks count:', tasks.value.length)
      
      await nextTick()
    }
    
    resetForm()
    form.title = ''
    form.description = ''
    form.priority = 'medium'
    form.dueDate = ''
    
    await fetchStats()
    
  } catch (error) {
    console.error('Task creation failed:', error)
    
    if (error.response?.data?.errors) {
      setErrors(error.response.data.errors.reduce((acc, err) => {
        acc[err.path] = err.msg
        return acc
      }, {}))
    } else {
      const statusCode = error?.response?.status
      let errorMessage = 'Failed to create task'
      
      if (statusCode === 401) {
        errorMessage = 'Authentication required'
        setTimeout(() => router.push('/login'), 2000)
      } else if (statusCode === 403) {
        errorMessage = 'No permission to create tasks'
      } else if (statusCode === 429) {
        errorMessage = 'Too many requests, please try again later'
      } else if (statusCode >= 500) {
        errorMessage = 'Server error, please try again later'
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      formError.value = errorMessage
    }
  } finally {
    if (loader) {
      loader.hide()
    }
  }
}

async function toggle(t) {
  const { data } = await api.patch(`/api/tasks/${t._id}/toggle`)
  const idx = tasks.value.findIndex(x => x._id === t._id)
  if (idx !== -1) tasks.value[idx] = data.data.task
  await fetchStats()
}

function openEdit(t) {
  Object.assign(edit, { ...t, dueDate: t.dueDate ? new Date(t.dueDate).toISOString().slice(0,10) : '' })
  editDialog.value.showModal()
}
function closeEdit() { editDialog.value.close() }

async function saveEdit() {
  const payload = { title: edit.title, description: edit.description, priority: edit.priority, dueDate: edit.dueDate || null }
  const { data } = await api.put(`/api/tasks/${edit._id}`, payload)
  const idx = tasks.value.findIndex(x => x._id === edit._id)
  if (idx !== -1) tasks.value[idx] = data.data.task
  closeEdit()
  await fetchStats()
}

async function remove(t) {
  await api.delete(`/api/tasks/${t._id}`)
  tasks.value = tasks.value.filter(x => x._id !== t._id)
  await fetchStats()
}

// Filter handlers with loading
async function handleStatusFilterChange() {
  try {
    await fetchTasks(1, false)
  } catch (e) {
    console.error('Status filter error:', e)
    if (e?.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
      return
    }
  }
}

async function handlePriorityFilterChange() {
  // Loader removed for simplicity
  })
  
  try {
    await fetchTasks(1, false)
    
    // Update message for success
    // Auto-managed by new loader system)
    }
    
    // Show success message briefly
    await new Promise(resolve => setTimeout(resolve, 800))
  } catch (e) {
    console.error('Fetch tasks error:', e)
    
    // Handle authentication errors
    if (e?.response?.status === 401) {
      console.log('Authentication expired, redirecting to login')
      localStorage.removeItem('token')
      router.push('/login')
      return
    }
    
    // For other errors, show error message
    if (showLoader && loader && !loader.isDestroyed) {
      loader.hide()
      // Loader removed for simplicity
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } finally {
    // Hide loading overlay safely
    try {
      // Auto-managed by new loader system
    } catch (hideError) {
      console.warn('Error hiding loader:', hideError)
    }
  }
}

// Pagination handlers with loading
async function handlePageChange(page) {
  // Loader removed for simplicity
  })
  
  try {
    await fetchTasks(page, false)
    
    // Update message for success
    // Auto-managed by new loader system loaded!\nTasks updated successfully.`
      })
    }
    
    // Show success message briefly
    await new Promise(resolve => setTimeout(resolve, 600))
  } catch (e) {
    console.error('Fetch tasks error:', e)
    
    // Handle authentication errors
    if (e?.response?.status === 401) {
      console.log('Authentication expired, redirecting to login')
      localStorage.removeItem('token')
      router.push('/login')
      return
    }
    
    // For other errors, show error message
    if (showLoader && loader && !loader.isDestroyed) {
      loader.hide()
      // Loader removed for simplicity
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } finally {
    // Hide loading overlay safely
    try {
      // Auto-managed by new loader system
    } catch (hideError) {
      console.warn('Error hiding loader:', hideError)
    }
  }
}

async function handlePageSizeChange(newSize) {
  // Loader removed for simplicity
  })
  
  try {
    pagination.limit = newSize
    // Reset to first page when changing page size
    await fetchTasks(1, false)
    
    // Update message for success
    // Auto-managed by new loader system tasks per page.`
      })
    }
    
    // Show success message briefly
    await new Promise(resolve => setTimeout(resolve, 800))
  } catch (e) {
    console.error('Fetch tasks error:', e)
    
    // Handle authentication errors
    if (e?.response?.status === 401) {
      console.log('Authentication expired, redirecting to login')
      localStorage.removeItem('token')
      router.push('/login')
      return
    }
    
    // For other errors, show error message
    if (showLoader && loader && !loader.isDestroyed) {
      loader.hide()
      // Loader removed for simplicity
      })
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  } finally {
    // Hide loading overlay safely
    try {
      // Auto-managed by new loader system
    } catch (hideError) {
      console.warn('Error hiding loader:', hideError)
    }
  }
}

onMounted(() => {
  // Show loader on initial app load
  fetchTasks(1, true)
})
</script>

<style scoped>
/* Global Styles */
.tasks-page {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #333;
  line-height: 1.6;
}

/* Hero Section */
.hero {
  background: linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)),
              url('https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2339&q=80');
  background-size: cover;
  background-position: center;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}

.hero-overlay {
  max-width: 800px;
  padding: 0 20px;
}

.hero-title {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 15px;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.hero-subtitle {
  font-size: 16px;
  opacity: 0.9;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.tasks-layout {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 30px;
  align-items: start;
}

/* Cards */
.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 30px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  border-bottom: 2px solid #2563eb;
  padding-bottom: 10px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

/* Form Styles */
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-label {
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.input-wrapper {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s;
  background: white;
  box-sizing: border-box;
}

.form-input.error, .form-textarea.error {
  border-color: #ef4444;
  background-color: #fef2f2;
}

.error-message {
  color: #ef4444;
  font-size: 14px;
  margin-top: 5px;
  margin-left: 5px;
  display: block;
}

.form-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.form-textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.select-wrapper {
  position: relative;
}

.form-select {
  width: 100%;
  padding: 12px 40px 12px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  background: white;
  cursor: pointer;
  appearance: none;
  transition: border-color 0.3s, box-shadow 0.3s;
  box-sizing: border-box;
}

.form-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.select-arrow {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid #666;
  pointer-events: none;
}

/* Buttons */
.submit-btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 15px 30px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
  box-sizing: border-box;
}

.submit-btn:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.btn-primary {
  background: #2563eb;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-secondary:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-danger:hover {
  background: #b91c1c;
}

/* Filters Section */
.filters-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.section-subtitle {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
}

.filters-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* Stats */
.stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 14px;
  color: #666;
}

.stat-item strong {
  color: #2563eb;
  font-weight: 600;
}

/* Tasks Grid */
.tasks-grid {
  display: grid;
  gap: 20px;
}

.task-card {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  transition: box-shadow 0.3s, transform 0.2s;
}

.task-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.task-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
}

.task-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-status.pending {
  background: #fef3c7;
  color: #92400e;
}

.task-status.completed {
  background: #d1fae5;
  color: #065f46;
}

.task-description {
  color: #666;
  margin: 10px 0;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 15px 0;
}

.priority-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.priority-badge.low {
  background: #e0f2fe;
  color: #0277bd;
}

.priority-badge.medium {
  background: #fff3e0;
  color: #ef6c00;
}

.priority-badge.high {
  background: #ffebee;
  color: #c62828;
}

.due-date {
  color: #666;
  font-size: 12px;
}

.task-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

/* No Tasks */
.no-tasks {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.no-tasks p {
  font-size: 16px;
  margin: 0;
}

/* Old pagination styles removed - now using Pagination component */

/* Dialog */
.edit-dialog {
  border: none;
  border-radius: 8px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90vw;
}

.edit-dialog::backdrop {
  background: rgba(0, 0, 0, 0.5);
}

.dialog-form {
  padding: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.dialog-title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 20px 0;
  border-bottom: 2px solid #2563eb;
  padding-bottom: 10px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 10px;
}

/* Error */
.error {
  color: #dc2626;
  font-size: 14px;
  margin-top: 5px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .tasks-layout {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .hero-title {
    font-size: 32px;
  }
  
  .hero-subtitle {
    font-size: 14px;
  }
  
  .card {
    padding: 20px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats {
    flex-direction: column;
    gap: 10px;
  }
  
  .task-actions {
    flex-direction: column;
  }
  
  .dialog-form {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 20px 15px;
  }
  
  .hero-title {
    font-size: 28px;
  }
  
  .card {
    padding: 15px;
  }
}
</style>
