<template>
  <div class="tasks-page">
    <v-container fluid>
      <v-row>
      <!-- Sidebar - Task Creation -->
      <v-col cols="12" md="4" lg="3">
        <v-card elevation="4" class="task-form-card">
          <v-card-title class="text-h5 primary--text">
            <v-icon left color="primary">mdi-plus-circle</v-icon>
            {{ $t('tasks.createTask') }}
          </v-card-title>
          
          <v-card-text>
            <VeeForm @submit="createTask" class="task-form">
              <VeeField
                v-model="form.title"
                name="title"
                rules="required|min:3|max:100"
                v-slot="{ field, errorMessage }"
              >
                <v-text-field
                  v-bind="field"
                  :label="$t('tasks.title')"
                  prepend-inner-icon="mdi-format-title"
                  variant="outlined"
                  :error-messages="errorMessage"
                  :placeholder="$t('tasks.titlePlaceholder')"
                  class="mb-4"
                />
              </VeeField>
              
              <VeeField
                v-model="form.description"
                name="description"
                v-slot="{ field }"
              >
                <v-textarea
                  v-bind="field"
                  :label="$t('tasks.description')"
                  prepend-inner-icon="mdi-text"
                  variant="outlined"
                  rows="3"
                  :placeholder="$t('tasks.descriptionPlaceholder')"
                  class="mb-4"
                />
              </VeeField>
              
              <VeeField
                v-model="form.dueDate"
                name="dueDate"
                rules="required|validDate|futureDate"
                v-slot="{ field, errorMessage }"
              >
                <v-text-field
                  v-bind="field"
                  :label="$t('tasks.dueDate')"
                  type="date"
                  prepend-inner-icon="mdi-calendar"
                  variant="outlined"
                  :error-messages="errorMessage"
                  class="mb-4"
                />
              </VeeField>
              
              <v-select
                v-model="form.priority"
                :label="$t('common.priority')"
                :items="priorityOptions"
                item-title="text"
                item-value="value"
                prepend-inner-icon="mdi-flag"
                variant="outlined"
                class="mb-4"
              />
              
              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                prepend-icon="mdi-plus"
                :disabled="isLoadingTasks"
                :loading="isLoadingTasks"
              >
                {{ $t('tasks.createTask') }}
              </v-btn>
              
              <v-alert v-if="formError" type="error" class="mt-4">
                {{ formError }}
              </v-alert>
            </VeeForm>
          </v-card-text>
        </v-card>

        <!-- Stats Card -->
        <v-card v-if="stats" elevation="4" class="mt-4">
          <v-card-title class="text-h6">
            <v-icon left>mdi-chart-line</v-icon>
            {{ $t('tasks.statistics') }}
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="4">
                <div class="text-center">
                  <div class="text-h4 primary--text">{{ stats.total }}</div>
                  <div class="text-caption">Total</div>
                </div>
              </v-col>
              <v-col cols="4">
                <div class="text-center">
                  <div class="text-h4 success--text">{{ stats.completed }}</div>
                  <div class="text-caption">Completed</div>
                </div>
              </v-col>
              <v-col cols="4">
                <div class="text-center">
                  <div class="text-h4 warning--text">{{ stats.pending }}</div>
                  <div class="text-caption">Pending</div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Main Content - Tasks List/Calendar -->
      <v-col cols="12" md="8" lg="9">
        <v-card elevation="4" class="tasks-list-card position-relative">
          <!-- Loading Overlay -->
          <v-overlay
            v-model="isLoadingTasks"
            class="task-list-overlay"
            persistent
            contained
          >
            <div class="loading-content">
              <div class="loading-spinner-container">
                <v-progress-circular
                  color="primary"
                  size="80"
                  width="8"
                  indeterminate
                  class="loading-spinner"
                ></v-progress-circular>
                <v-icon class="loading-icon" size="32" color="primary">mdi-clipboard-list</v-icon>
              </div>
              <div class="loading-dots">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
              </div>
            </div>
          </v-overlay>

          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-clipboard-list</v-icon>
            <span class="text-h5">{{ $t('tasks.yourTasks') }}</span>
            <v-spacer></v-spacer>
            <v-chip color="primary" variant="outlined" size="small" class="mr-2 header-chip">
              {{ tasks.length }} {{ $t('tasks.total') }}
            </v-chip>
          </v-card-title>
          
          <!-- Tasks List -->
          <v-card-text v-if="tasks.length > 0" class="pa-0">
            <v-list>
              <v-list-item
                v-for="task in sortedTasks"
                :key="task._id"
                class="task-item"
                :class="{
                  'task-completed': task.status === 'completed',
                  'has-overdue-task': getDueDateUrgency(task.dueDate) === 'overdue',
                  'has-due-today': getDueDateUrgency(task.dueDate) === 'today'
                }"
              >
                <template v-slot:prepend>
                  <v-checkbox
                    :model-value="task.status === 'completed'"
                    @update:model-value="(value) => handleTaskToggle(task, value)"
                    :disabled="task.status === 'expired'"
                    color="success"
                    hide-details
                    density="compact"
                    class="task-checkbox"
                    :class="{ 'task-expired': task.status === 'expired' }"
                  />
                </template>

                <v-list-item-title
                  class="task-title"
                  :class="{ 'text-decoration-line-through': task.status === 'completed' }"
                >
                  {{ task.title }}
                </v-list-item-title>
                <v-list-item-subtitle v-if="task.description" class="task-description">
                  {{ task.description }}
                </v-list-item-subtitle>
                <div class="d-flex align-center mt-2">
                  <v-chip
                    :color="getPriorityColor(task.priority)"
                    size="small"
                    variant="outlined"
                    class="task-chip"
                  >
                    {{ getPriorityText(task.priority) }}
                  </v-chip>
                  <v-chip
                    :color="task.status === 'completed' ? 'success' : task.status === 'expired' ? 'error' : 'warning'"
                    size="small"
                    variant="outlined"
                    class="ml-2 task-chip"
                  >
                    {{ getStatusText(task.status) }}
                  </v-chip>
                  <v-chip
                    v-if="task.dueDate"
                    :color="getUrgencyColor(task.dueDate)"
                    size="small"
                    variant="outlined"
                    class="ml-2 task-chip due-date-chip"
                    :class="`urgency-${getDueDateUrgency(task.dueDate)}`"
                  >
                    <v-icon size="small" class="chip-icon">mdi-calendar</v-icon>
                    {{ formatDate(task.dueDate) }}
                  </v-chip>
                </div>

                <template v-slot:append>
                  <div class="task-actions">
                    <v-btn
                      :icon="task.status === 'completed' ? 'mdi-backup-restore' : 'mdi-check'"
                      :color="task.status === 'completed' ? 'warning' : 'success'"
                      variant="text"
                      @click="toggle(task)"
                      :title="task.status === 'completed' ? $t('tasks.markPending') : $t('tasks.markComplete')"
                    />
                    <v-btn
                      icon="mdi-delete"
                      color="error"
                      variant="text"
                      @click="deleteTask(task)"
                      :title="$t('tasks.deleteTask')"
                    />
                  </div>
                </template>

                <v-divider v-if="task !== sortedTasks[sortedTasks.length - 1]" class="mt-2" />
              </v-list-item>
            </v-list>
          </v-card-text>


          <!-- Empty State -->
          <v-card-text v-if="tasks.length === 0" class="text-center py-12">
            <v-icon size="100" color="grey-lighten-1">mdi-clipboard-text-outline</v-icon>
            <div class="text-h6 mt-4 mb-2">{{ $t('tasks.noTasks') }}</div>
            <div class="text-body-2 text-medium-emphasis">
              {{ $t('tasks.createFirstTask') }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Task Details Dialog -->
    <v-dialog v-model="showTaskDetails" max-width="500px">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ selectedTask?.title }}</span>
        </v-card-title>
        
        <v-card-text>
          <v-list>
            <v-list-item>
              <v-list-item-title>{{ $t('tasks.description') }}</v-list-item-title>
              <v-list-item-subtitle>{{ selectedTask?.description || $t('tasks.noDescription') }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-title>{{ $t('tasks.dueDate') }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedTask?.dueDate) }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-title>{{ $t('common.priority') }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="getPriorityColor(selectedTask?.priority)" size="small" class="dialog-chip">
                  {{ getPriorityText(selectedTask?.priority) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item>
              <v-list-item-title>{{ $t('common.status') }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="selectedTask?.status === 'completed' ? 'success' : selectedTask?.status === 'expired' ? 'error' : 'warning'" size="small" class="dialog-chip">
                  {{ getStatusText(selectedTask?.status) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" @click="deleteTask(selectedTask)">
            {{ $t('common.delete') }}
          </v-btn>
          <v-btn color="grey-darken-1" variant="text" @click="showTaskDetails = false">
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Field as VeeField, Form as VeeForm, ErrorMessage as VeeErrorMessage } from 'vee-validate'
import api from '../services/api'

const router = useRouter()
const { t: $t } = useI18n()
const tasks = ref([])
const stats = ref(null)
const form = reactive({ title: '', description: '', dueDate: '', priority: 'medium' })
const formError = ref('')
const showTaskDetails = ref(false)
const selectedTask = ref(null)
const isLoadingTasks = ref(true)
// Priority options for the select dropdown with i18n
const priorityOptions = computed(() => [
  { text: $t('tasks.low'), value: 'low' },
  { text: $t('tasks.medium'), value: 'medium' },
  { text: $t('tasks.high'), value: 'high' }
])

// Computed property to sort tasks by urgency and priority
const sortedTasks = computed(() => {
  return [...tasks.value].sort((a, b) => {
    // First, prioritize incomplete tasks
    if (a.status === 'completed' && b.status !== 'completed') return 1
    if (a.status !== 'completed' && b.status === 'completed') return -1

    // For incomplete tasks, sort by due date urgency
    if (a.status !== 'completed' && b.status !== 'completed') {
      const urgencyA = getDueDateUrgency(a.dueDate)
      const urgencyB = getDueDateUrgency(b.dueDate)

      // Define urgency order (higher number = more urgent)
      const urgencyOrder = {
        overdue: 6,
        today: 5,
        tomorrow: 4,
        soon: 3,
        upcoming: 2,
        future: 1,
        none: 0
      }

      const urgencyDiff = urgencyOrder[urgencyB] - urgencyOrder[urgencyA]
      if (urgencyDiff !== 0) return urgencyDiff

      // If urgency is the same, sort by priority
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Finally, sort by due date (earlier dates first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate) - new Date(b.dueDate)
      }
    }

    return 0
  })
})

// Function to get priority color
function getPriorityColor(priority) {
  const colors = {
    low: 'success',
    medium: 'warning',
    high: 'error'
  }
  return colors[priority] || 'grey'
}

// Function to get translated priority text
function getPriorityText(priority) {
  const translations = {
    low: $t('tasks.low'),
    medium: $t('tasks.medium'),
    high: $t('tasks.high')
  }
  return translations[priority] || priority
}

// Function to get translated status text
function getStatusText(status) {
  const translations = {
    pending: $t('tasks.pending'),
    completed: $t('tasks.completed'),
    expired: $t('tasks.expired') || 'Expired'
  }
  return translations[status] || status
}

// Helper function to check if task is expired
function isTaskExpired(task) {
  return task.status === 'pending' && getDueDateUrgency(task.dueDate) === 'overdue'
}

// Function to automatically update expired tasks
async function updateExpiredTasks() {
  const expiredTasks = tasks.value.filter(task => isTaskExpired(task))

  for (const task of expiredTasks) {
    try {
      await api.put(`/api/tasks/${task._id}`, {
        ...task,
        status: 'expired'
      })
      task.status = 'expired'
    } catch (error) {
      console.error('Error updating expired task:', error)
    }
  }

  if (expiredTasks.length > 0) {
    await fetchStats()
  }
}

// Enhanced date formatting with relative dates and urgency indicators
function formatDate(dateString, options = {}) {
  if (!dateString) return ''

  const date = new Date(dateString)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)

  // Reset time for accurate comparison
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate())

  const diffTime = dateOnly - todayOnly
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Return relative dates for better UX
  if (diffDays === 0) {
    return $t('dates.today')
  } else if (diffDays === 1) {
    return $t('dates.tomorrow')
  } else if (diffDays === -1) {
    return $t('dates.yesterday')
  } else if (diffDays > 1 && diffDays <= 7) {
    return $t('dates.inDays', { days: diffDays })
  } else if (diffDays < -1 && diffDays >= -7) {
    return $t('dates.daysAgo', { days: Math.abs(diffDays) })
  } else {
    // Use localized date format for dates further away
    return date.toLocaleDateString($t('dates.locale'), {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

// Get due date urgency level for styling
function getDueDateUrgency(dateString) {
  if (!dateString) return 'none'

  const date = new Date(dateString)
  const today = new Date()
  const diffTime = date - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays === 1) return 'tomorrow'
  if (diffDays <= 3) return 'soon'
  if (diffDays <= 7) return 'upcoming'
  return 'future'
}

// Get urgency color for chips
function getUrgencyColor(dateString) {
  const urgency = getDueDateUrgency(dateString)
  const colors = {
    overdue: 'error',
    today: 'warning',
    tomorrow: 'orange',
    soon: 'amber',
    upcoming: 'info',
    future: 'info',
    none: 'grey'
  }
  return colors[urgency] || 'info'
}


async function fetchTasks() {
  try {
    isLoadingTasks.value = true
    const { data } = await api.get('/api/tasks')
    tasks.value = data.data.tasks

    // Check and update expired tasks
    await updateExpiredTasks()

    await fetchStats()
  } catch (e) {
    console.error('Fetch tasks error:', e)
    if (e?.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }
  } finally {
    isLoadingTasks.value = false
  }
}

async function fetchStats() {
  try {
    const { data } = await api.get('/api/tasks/stats')
    stats.value = data.data.stats
  } catch (e) {
    console.error('Fetch stats error:', e)
  }
}

async function createTask(values, { resetForm }) {
  formError.value = ''
  
  try {
    const { data } = await api.post('/api/tasks', {
      title: values.title,
      description: values.description,
      dueDate: form.dueDate,
      priority: form.priority
    })
    
    const newTask = data.data?.task || data.data || data
    if (newTask && newTask._id) {
      tasks.value.unshift(newTask)
    }
    
    resetForm()
    form.title = ''
    form.description = ''
    form.dueDate = ''
    form.priority = 'medium'
    
    await fetchStats()
  } catch (error) {
    console.error('Task creation failed:', error)
    formError.value = error.response?.data?.message || 'Failed to create task'
  }
}

// Handle checkbox toggle
function handleTaskToggle(task, newValue) {
  // Only toggle if the status is actually changing
  if ((task.status === 'completed') !== newValue) {
    toggle(task)
  }
}

async function toggle(t) {
  try {
    const { data } = await api.patch(`/api/tasks/${t._id}/toggle`)
    const idx = tasks.value.findIndex(x => x._id === t._id)
    if (idx !== -1) {
      tasks.value[idx] = data.data.task
    }
    await fetchStats()
  } catch (error) {
    console.error('Toggle task error:', error)
    console.error('Error details:', error.response?.data)
  }
}

async function deleteTask(t) {
  try {
    await api.delete(`/api/tasks/${t._id}`)
    tasks.value = tasks.value.filter(x => x._id !== t._id)
    await fetchStats()
    showTaskDetails.value = false
  } catch (error) {
    console.error('Delete task error:', error)
  }
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.tasks-page {
  background: var(--app-background);
  min-height: calc(100vh - var(--header-height));
  margin: calc(-1 * var(--container-padding-md));
  padding: var(--container-padding-md);
  transition: background-color 0.3s ease;
}

.task-form-card,
.tasks-list-card {
  background: var(--app-surface) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px var(--app-shadow);
  border: 1px solid var(--app-border-color);
}

.task-list-overlay {
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-list-overlay .v-overlay__content {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(16px);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  min-width: 320px;
  position: relative;
  overflow: hidden;
}

/* Dark theme overlay */
.dark-theme .task-list-overlay .v-overlay__content {
  background: rgba(30, 30, 30, 0.98);
  color: #ffffff;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 2;
}

.loading-spinner-container {
  position: relative;
  margin-bottom: 24px;
}

.loading-spinner {
  animation: float 3s ease-in-out infinite;
}

.loading-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 2s ease-in-out infinite;
}

.loading-dots {
  display: flex;
  gap: 8px;
}

.loading-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--the7-accent-color, #1ebbf0);
  animation: bounce 1.5s ease-in-out infinite;
}

.loading-dots .dot:nth-child(1) {
  animation-delay: 0ms;
}

.loading-dots .dot:nth-child(2) {
  animation-delay: 150ms;
}

.loading-dots .dot:nth-child(3) {
  animation-delay: 300ms;
}

/* Background decoration */
.task-list-overlay .v-overlay__content::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg,
    transparent,
    rgba(30, 187, 240, 0.05),
    transparent,
    rgba(57, 223, 170, 0.05),
    transparent);
  animation: shimmer 4s ease-in-out infinite;
  z-index: 1;
}

/* Animations */
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  40% {
    transform: translateY(-8px);
    opacity: 1;
  }
  60% {
    transform: translateY(-4px);
    opacity: 0.8;
  }
}

@keyframes shimmer {
  0% {
    transform: rotate(0deg);
    opacity: 0.3;
  }
  50% {
    opacity: 0.1;
  }
  100% {
    transform: rotate(360deg);
    opacity: 0.3;
  }
}

.task-item {
  transition: all 0.3s ease;
  border-radius: 8px;
}

.task-item:hover {
  background-color: var(--app-border-color);
}

.task-completed {
  opacity: 0.7;
}

.task-completed .task-title {
  color: #9e9e9e !important;
}

.task-actions {
  display: flex;
  gap: 4px;
}

.task-form {
  display: flex;
  flex-direction: column;
}

/* Enhanced RTL Support for Tasks Page */
.rtl .task-form-card,
.rtl .tasks-list-card,
.v-application--is-rtl .task-form-card,
.v-application--is-rtl .tasks-list-card {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  direction: rtl !important;
}

.rtl .task-item,
.v-application--is-rtl .task-item {
  direction: rtl !important;
  text-align: right !important;
}

.rtl .task-title,
.v-application--is-rtl .task-title {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
  line-height: 1.6;
  letter-spacing: 0.01em;
  text-align: right !important;
}

.rtl .task-description,
.v-application--is-rtl .task-description {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  line-height: 1.75;
  letter-spacing: 0.02em;
  text-align: right !important;
}

.rtl .task-actions,
.v-application--is-rtl .task-actions {
  flex-direction: row-reverse !important;
}

/* Force RTL for task layout components */
.rtl .v-row,
.rtl .v-col,
.v-application--is-rtl .v-row,
.v-application--is-rtl .v-col {
  direction: rtl !important;
}

.rtl .v-card-title {
  font-family: 'Tajawal', 'Cairo', 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  line-height: 1.5;
}

.rtl .v-text-field,
.rtl .v-textarea,
.rtl .v-select {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
}

.rtl .v-btn {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Improved Arabic number formatting */
.rtl .task-stats {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-feature-settings: 'lnum' 1, 'tnum' 1;
}

/* Enhanced Arabic form styling */
.rtl .task-form .v-field__input {
  text-align: right;
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  line-height: 1.75;
}

.rtl .task-form .v-label {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
}

/* Better spacing for Arabic text */
.rtl .v-list-item-title {
  word-spacing: 0.1em;
  letter-spacing: 0.02em;
}

/* Chip styling and alignment */
.task-chip {
  height: 24px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  display: inline-flex !important;
  align-items: center !important;
  vertical-align: middle !important;
  line-height: 1 !important;
}

.task-chip .v-chip__content {
  padding: 0 8px !important;
  line-height: 1 !important;
  display: flex !important;
  align-items: center !important;
}

.chip-icon {
  margin-right: 4px !important;
  margin-left: 0 !important;
}

.header-chip {
  height: 28px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
}

.header-chip .v-chip__content {
  padding: 0 12px !important;
  line-height: 1.2 !important;
}

.dialog-chip {
  height: 26px !important;
  font-size: 12px !important;
  font-weight: 500 !important;
}

.dialog-chip .v-chip__content {
  padding: 0 10px !important;
  line-height: 1.1 !important;
}

/* RTL chip alignment */
.rtl .task-chip,
.v-application--is-rtl .task-chip {
  direction: rtl !important;
}

.rtl .chip-icon,
.v-application--is-rtl .chip-icon {
  margin-right: 0 !important;
  margin-left: 4px !important;
}

/* Task checkbox styling */
.task-checkbox {
  flex-shrink: 0 !important;
  margin-right: 12px !important;
  margin-left: 0 !important;
}

.task-checkbox .v-selection-control {
  min-height: auto !important;
}

.task-checkbox .v-selection-control__wrapper {
  height: 24px !important;
  width: 24px !important;
}

.task-checkbox .v-checkbox .v-selection-control__input {
  width: 24px !important;
  height: 24px !important;
}

/* RTL checkbox alignment */
.rtl .task-checkbox,
.v-application--is-rtl .task-checkbox {
  margin-right: 0 !important;
  margin-left: 12px !important;
}

/* Theme-aware checkbox styling */
.task-checkbox .v-selection-control__input:before {
  border-color: var(--app-border-color) !important;
}

.task-checkbox .v-selection-control__input:hover:before {
  border-color: var(--the7-accent-color) !important;
}

/* Completed task styling enhancement */
.task-completed .task-checkbox {
  opacity: 0.8;
}

.task-completed .task-title,
.task-completed .task-description {
  opacity: 0.7;
  transition: opacity 0.3s ease;
}

/* Due date urgency styling */
.due-date-chip {
  font-weight: 600 !important;
  transition: all 0.3s ease;
}

.urgency-overdue {
  animation: pulse-red 2s infinite;
  font-weight: 700 !important;
}

.urgency-today {
  font-weight: 700 !important;
  background: rgba(255, 193, 7, 0.1) !important;
}

.urgency-tomorrow {
  font-weight: 600 !important;
  background: rgba(255, 152, 0, 0.1) !important;
}

.urgency-soon {
  background: rgba(255, 183, 77, 0.1) !important;
}

@keyframes pulse-red {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Enhanced task item styling based on urgency */
.task-item.has-overdue-task {
  border-left: 4px solid #f44336;
  background: rgba(244, 67, 54, 0.05);
}

.task-item.has-due-today {
  border-left: 4px solid #ff9800;
  background: rgba(255, 152, 0, 0.05);
}

/* Custom responsive behavior */
@media (max-width: 960px) {
  /* Responsive adjustments handled by CSS variables */

  .rtl .task-title {
    font-size: 1.1rem;
    line-height: 1.7;
  }

  .task-chip {
    height: 22px !important;
    font-size: 10px !important;
  }

  .task-chip .v-chip__content {
    padding: 0 6px !important;
  }

  .header-chip {
    height: 26px !important;
    font-size: 11px !important;
  }

  .task-checkbox {
    margin-right: 8px !important;
  }

  .task-checkbox .v-selection-control__wrapper {
    height: 20px !important;
    width: 20px !important;
  }

  .rtl .task-checkbox,
  .v-application--is-rtl .task-checkbox {
    margin-left: 8px !important;
    margin-right: 0 !important;
  }
}

@media (max-width: 480px) {
  /* Responsive adjustments handled by CSS variables */
}

/* Expired task styling */
.task-expired {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
}

.task-expired .v-selection-control__input {
  background-color: #f5f5f5 !important;
  border-color: #e0e0e0 !important;
}

.dark-theme .task-expired .v-selection-control__input {
  background-color: #424242 !important;
  border-color: #616161 !important;
}

.task-item.task-status-expired {
  border-left: 4px solid #f44336;
  background: rgba(244, 67, 54, 0.08);
  opacity: 0.8;
}

.task-item.task-status-expired .task-title {
  color: #9e9e9e !important;
  text-decoration: line-through;
}

.task-item.task-status-expired .task-description {
  color: #bdbdbd !important;
  opacity: 0.7;
}
</style>