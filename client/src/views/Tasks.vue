<template>
  <v-container fluid class="tasks-page">
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
                  placeholder="Enter task title"
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
                  placeholder="Enter task description"
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
                :label="$t('tasks.priority')"
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
        <v-card elevation="4" class="tasks-list-card">
          <v-card-title class="d-flex align-center">
            <v-icon left color="primary">mdi-clipboard-list</v-icon>
            <span class="text-h5">{{ $t('tasks.yourTasks') }}</span>
            <v-spacer></v-spacer>
            <v-chip color="primary" variant="outlined" class="mr-2">
              {{ tasks.length }} {{ $t('tasks.total') }}
            </v-chip>
          </v-card-title>
          
          <!-- Tasks List -->
          <v-card-text v-if="tasks.length > 0" class="pa-0">
            <v-list>
              <v-list-item
                v-for="task in tasks"
                :key="task._id"
                class="task-item"
                :class="{ 'task-completed': task.status === 'completed' }"
              >
                <template v-slot:prepend>
                  <v-btn
                    :icon="task.status === 'completed' ? 'mdi-check-circle' : 'mdi-circle-outline'"
                    :color="task.status === 'completed' ? 'success' : 'grey'"
                    variant="text"
                    @click="toggle(task)"
                  />
                </template>

                <v-list-item-content>
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
                      size="x-small"
                      variant="outlined"
                    >
                      {{ task.priority }}
                    </v-chip>
                    <v-chip
                      :color="task.status === 'completed' ? 'success' : 'warning'"
                      size="x-small"
                      variant="outlined"
                      class="ml-2"
                    >
                      {{ task.status }}
                    </v-chip>
                    <v-chip
                      v-if="task.dueDate"
                      color="info"
                      size="x-small"
                      variant="outlined"
                      class="ml-2"
                    >
                      <v-icon size="x-small" left>mdi-calendar</v-icon>
                      {{ formatDate(task.dueDate) }}
                    </v-chip>
                  </div>
                </v-list-item-content>

                <template v-slot:append>
                  <div class="task-actions">
                    <v-btn
                      :icon="task.status === 'completed' ? 'mdi-backup-restore' : 'mdi-check'"
                      :color="task.status === 'completed' ? 'warning' : 'success'"
                      variant="text"
                      @click="toggle(task)"
                      :title="task.status === 'completed' ? 'Mark as Pending' : 'Mark as Complete'"
                    />
                    <v-btn
                      icon="mdi-delete"
                      color="error"
                      variant="text"
                      @click="deleteTask(task)"
                      title="Delete Task"
                    />
                  </div>
                </template>

                <v-divider v-if="task !== tasks[tasks.length - 1]" class="mt-2" />
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
              <v-list-item-subtitle>{{ selectedTask?.description || 'No description' }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-title>{{ $t('tasks.dueDate') }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedTask?.dueDate) }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-title>{{ $t('tasks.priority') }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="getPriorityColor(selectedTask?.priority)" size="small">
                  {{ selectedTask?.priority }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <v-list-item-title>{{ $t('tasks.status') }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="selectedTask?.status === 'completed' ? 'success' : 'warning'" size="small">
                  {{ selectedTask?.status }}
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
// Priority options for the select dropdown
const priorityOptions = [
  { text: 'Low Priority', value: 'low' },
  { text: 'Medium Priority', value: 'medium' },
  { text: 'High Priority', value: 'high' }
]

// Function to get priority color
function getPriorityColor(priority) {
  const colors = {
    low: 'success',
    medium: 'warning', 
    high: 'error'
  }
  return colors[priority] || 'grey'
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString()
}


async function fetchTasks() {
  try {
    const { data } = await api.get('/api/tasks')
    tasks.value = data.data.tasks
    await fetchStats()
  } catch (e) {
    console.error('Fetch tasks error:', e)
    if (e?.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    }
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

async function toggle(t) {
  try {
    const { data } = await api.patch(`/api/tasks/${t._id}/toggle`)
    const idx = tasks.value.findIndex(x => x._id === t._id)
    if (idx !== -1) tasks.value[idx] = data.data.task
    await fetchStats()
  } catch (error) {
    console.error('Toggle task error:', error)
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  padding: 16px !important;
}

.task-form-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px !important;
}

.tasks-list-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px !important;
}

.task-item {
  transition: all 0.3s ease;
  border-radius: 8px;
}

.task-item:hover {
  background-color: rgba(30, 187, 240, 0.05);
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

/* Custom responsive behavior */
@media (max-width: 960px) {
  .tasks-page {
    padding: 8px !important;
  }
}
</style>