<template>
  <div class="tasks-page">
    <!-- Floating Action Button -->
    <v-tooltip text-tooltip location="left">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          class="floating-create-btn"
          color="primary"
          size="large"
          icon
          elevation="8"
          @click="openCreateDialog"
          :disabled="isCreatingTask"
        >
          <v-icon size="large">mdi-plus</v-icon>
        </v-btn>
      </template>
      <span>{{ $t('tasks.createNewTask') }}</span>
    </v-tooltip>

    <v-container fluid class="pt-6">
      <v-row>
      <!-- Filters Sidebar -->
      <v-col cols="12" md="4" lg="3">
        <!-- Professional Filters Card -->
        <v-card elevation="4" class="filters-card">
          <v-card-title class="text-h6">
            <v-icon left>mdi-filter</v-icon>
            {{ $t('tasks.filters') }}
          </v-card-title>
          <v-card-text class="pt-4">
            <!-- Search -->
            <v-text-field
              v-model="filters.search"
              :label="$t('tasks.search')"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              clearable
              class="mb-3"
              @update:model-value="applyFilters"
            />

            <!-- Status Filter -->
            <v-select
              v-model="filters.status"
              :label="$t('tasks.filterByStatus')"
              :placeholder="$t('tasks.selectStatus')"
              :items="statusFilterOptions"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-check-circle"
              variant="outlined"
              density="compact"
              clearable
              class="mb-3"
              @update:model-value="applyFilters"
              persistent-placeholder
            />

            <!-- Priority Filter -->
            <v-select
              v-model="filters.priority"
              :label="$t('tasks.filterByPriority')"
              :placeholder="$t('common.selectPriority')"
              :items="priorityOptions"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-flag"
              variant="outlined"
              density="compact"
              clearable
              class="mb-3"
              @update:model-value="applyFilters"
              persistent-placeholder
            />

            <!-- Date Filter -->
            <v-select
              v-model="filters.dateFilter"
              :label="$t('tasks.filterByDate')"
              :placeholder="$t('tasks.selectDateFilter')"
              :items="dateFilterOptions"
              item-title="text"
              item-value="value"
              prepend-inner-icon="mdi-calendar"
              variant="outlined"
              density="compact"
              clearable
              class="mb-3"
              @update:model-value="applyFilters"
              persistent-placeholder
            />

            <!-- Sort Options -->
            <v-row>
              <v-col cols="8">
                <v-select
                  v-model="filters.sortBy"
                  :label="$t('tasks.sortBy')"
                  :placeholder="$t('tasks.selectSortField')"
                  :items="sortOptions"
                  item-title="text"
                  item-value="value"
                  prepend-inner-icon="mdi-sort"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                  @update:model-value="applyFilters"
                  persistent-placeholder
                />
              </v-col>
              <v-col cols="4">
                <v-select
                  v-model="filters.sortOrder"
                  :label="$t('tasks.sortOrder')"
                  :placeholder="$t('tasks.selectSortOrder')"
                  :items="sortOrderOptions"
                  item-title="text"
                  item-value="value"
                  variant="outlined"
                  density="compact"
                  class="mb-3"
                  @update:model-value="applyFilters"
                  persistent-placeholder
                />
              </v-col>
            </v-row>

            <!-- Clear Filters Button -->
            <v-btn
              color="secondary"
              variant="outlined"
              block
              prepend-icon="mdi-filter-off"
              @click="clearFilters"
            >
              {{ $t('tasks.clearFilters') }}
            </v-btn>
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
                    :disabled="task.status === 'overdue'"
                    color="success"
                    hide-details
                    density="compact"
                    class="task-checkbox"
                    :class="{ 'task-overdue': task.status === 'overdue' }"
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
                    :color="task.status === 'completed' ? 'success' : task.status === 'overdue' ? 'error' : 'info'"
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
                  <v-chip
                    v-if="task.updatedAt && task.updatedAt !== task.createdAt && isRecentlyUpdated(task.updatedAt)"
                    color="info"
                    size="small"
                    variant="outlined"
                    class="ml-2 task-chip updated-chip"
                  >
                    <v-icon size="small" class="chip-icon">mdi-pencil</v-icon>
                    {{ $t('tasks.updated') }}
                  </v-chip>
                </div>

                <template v-slot:append>
                  <div class="task-actions">
                    <v-btn
                      :icon="task.status === 'completed' ? 'mdi-backup-restore' : 'mdi-check'"
                      :color="task.status === 'completed' ? 'warning' : 'success'"
                      variant="text"
                      @click="toggle(task)"
                      :title="task.status === 'completed' ? $t('tasks.markActive') : $t('tasks.markComplete')"
                      :loading="isTogglingTask[task._id]"
                      :disabled="isTogglingTask[task._id]"
                    />
                    <v-btn
                      icon="mdi-pencil"
                      color="primary"
                      variant="text"
                      @click="editTask(task)"
                      :title="$t('tasks.editTask')"
                      :disabled="isDeletingTask || isTogglingTask[task._id]"
                    />
                    <v-btn
                      icon="mdi-delete"
                      color="error"
                      variant="text"
                      @click="deleteTask(task)"
                      :title="$t('tasks.deleteTask')"
                      :loading="isDeletingTask"
                      :disabled="isDeletingTask || isTogglingTask[task._id]"
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

          <!-- Pagination Controls -->
          <v-card-text v-if="tasks.length > 0 && pagination.totalPages > 1" class="py-3">
            <div class="d-flex align-center justify-center flex-wrap ga-2">
              <!-- First Page Button -->
              <v-btn
                size="small"
                variant="outlined"
                :disabled="!pagination.hasPrev"
                @click="firstPage"
                :title="$t('pagination.firstPage')"
              >
                <v-icon>mdi-page-first</v-icon>
              </v-btn>

              <!-- Previous Page Button -->
              <v-btn
                size="small"
                variant="outlined"
                :disabled="!pagination.hasPrev"
                @click="prevPage"
                :title="$t('pagination.previousPage')"
              >
                <v-icon>mdi-chevron-left</v-icon>
                {{ $t('pagination.previous') }}
              </v-btn>

              <!-- Page Number Display -->
              <div class="d-flex align-center mx-3">
                <span class="text-body-2">
                  {{ $t('pagination.showing') }} {{ pagination.page }} {{ $t('pagination.of') }} {{ pagination.totalPages }}
                </span>
              </div>

              <!-- Next Page Button -->
              <v-btn
                size="small"
                variant="outlined"
                :disabled="!pagination.hasNext"
                @click="nextPage"
                :title="$t('pagination.nextPage')"
              >
                {{ $t('pagination.next') }}
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>

              <!-- Last Page Button -->
              <v-btn
                size="small"
                variant="outlined"
                :disabled="!pagination.hasNext"
                @click="lastPage"
                :title="$t('pagination.lastPage')"
              >
                <v-icon>mdi-page-last</v-icon>
              </v-btn>
            </div>

            <!-- Page Info -->
            <div class="text-center mt-2">
              <span class="text-caption text-medium-emphasis">
                {{ $t('pagination.showing') }} {{ ((pagination.page - 1) * pagination.limit) + 1 }}-{{ Math.min(pagination.page * pagination.limit, pagination.total) }} {{ $t('pagination.of') }} {{ pagination.total }} {{ $t('pagination.results') }}
              </span>
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
                <v-chip :color="selectedTask?.status === 'completed' ? 'success' : selectedTask?.status === 'overdue' ? 'error' : 'info'" size="small" class="dialog-chip">
                  {{ getStatusText(selectedTask?.status) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedTask?.createdAt">
              <v-list-item-title>{{ $t('tasks.createdAt') }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatDateTime(selectedTask?.createdAt) }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedTask?.updatedAt && selectedTask?.updatedAt !== selectedTask?.createdAt">
              <v-list-item-title>{{ $t('tasks.lastUpdated') }}</v-list-item-title>
              <v-list-item-subtitle>{{ formatDateTime(selectedTask?.updatedAt) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            @click="deleteTask(selectedTask)"
            :loading="isDeletingTask"
            :disabled="isDeletingTask"
          >
            {{ isDeletingTask ? $t('common.deleting') : $t('common.delete') }}
          </v-btn>
          <v-btn color="grey-darken-1" variant="text" @click="showTaskDetails = false">
            {{ $t('common.close') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Create Task Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 primary--text">
          <v-icon left color="primary">mdi-plus-circle</v-icon>
          {{ $t('tasks.createTask') }}
        </v-card-title>

        <v-card-text>
          <VeeForm @submit="createTask" class="task-form" :key="'create-form'" id="create-task-form">
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
                ref="titleInput"
                autofocus
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

            <VeeField
              v-model="form.priority"
              name="priority"
              rules="required"
              v-slot="{ field, errorMessage }"
            >
              <v-select
                v-bind="field"
                :label="$t('common.priority')"
                :placeholder="$t('common.selectPriority')"
                :items="priorityOptions"
                item-title="text"
                item-value="value"
                prepend-inner-icon="mdi-flag"
                variant="outlined"
                :error-messages="errorMessage"
                class="mb-4"
                persistent-placeholder
              />
            </VeeField>

            <v-alert v-if="formError" type="error" class="mb-4">
              {{ formError }}
            </v-alert>
          </VeeForm>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="cancelCreate">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            type="submit"
            form="create-task-form"
            :loading="isCreatingTask"
            :disabled="isCreatingTask"
          >
            {{ $t('tasks.createTask') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Task Dialog -->
    <v-dialog v-model="showEditDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h5 primary--text">
          <v-icon left color="primary">mdi-pencil</v-icon>
          {{ $t('tasks.editTask') }}
        </v-card-title>

        <v-card-text>
          <VeeForm @submit="updateTask" class="edit-task-form" :key="taskBeingEdited?._id || 'new'">
            <VeeField
              :value="editForm.title"
              name="title"
              rules="required|min:3|max:100"
              v-slot="{ field, errorMessage }"
            >
              <v-text-field
                v-model="editForm.title"
                :label="$t('tasks.title')"
                prepend-inner-icon="mdi-format-title"
                variant="outlined"
                :error-messages="errorMessage"
                :placeholder="$t('tasks.titlePlaceholder')"
                class="mb-4"
              />
            </VeeField>

            <VeeField
              :value="editForm.description"
              name="description"
              v-slot="{ field }"
            >
              <v-textarea
                v-model="editForm.description"
                :label="$t('tasks.description')"
                prepend-inner-icon="mdi-text"
                variant="outlined"
                rows="3"
                :placeholder="$t('tasks.descriptionPlaceholder')"
                class="mb-4"
              />
            </VeeField>

            <VeeField
              :value="editForm.dueDate"
              name="dueDate"
              rules="validDate|futureDate"
              v-slot="{ field, errorMessage }"
            >
              <v-text-field
                v-model="editForm.dueDate"
                :label="$t('tasks.dueDate')"
                type="date"
                prepend-inner-icon="mdi-calendar"
                variant="outlined"
                :error-messages="errorMessage"
                class="mb-4"
              />
            </VeeField>

            <VeeField
              :value="editForm.priority"
              name="priority"
              rules="required"
              v-slot="{ field, errorMessage }"
            >
              <v-select
                v-model="editForm.priority"
                :label="$t('common.priority')"
                :placeholder="$t('common.selectPriority')"
                :items="priorityOptions"
                item-title="text"
                item-value="value"
                prepend-inner-icon="mdi-flag"
                variant="outlined"
                :error-messages="errorMessage"
                class="mb-4"
                persistent-placeholder
              />
            </VeeField>

            <v-alert v-if="editError" type="error" class="mb-4">
              {{ editError }}
            </v-alert>
          </VeeForm>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="cancelEdit">
            {{ $t('common.cancel') }}
          </v-btn>
          <v-btn
            color="primary"
            @click="updateTask"
            :loading="isUpdatingTask"
            :disabled="isUpdatingTask"
          >
            {{ $t('tasks.updateTask') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, nextTick, watch } from 'vue'
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
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const titleInput = ref(null)
const editForm = reactive({ title: '', description: '', dueDate: '', priority: 'medium' })
const editError = ref('')
const isUpdatingTask = ref(false)
const taskBeingEdited = ref(null)
const isDeletingTask = ref(false)
const isCreatingTask = ref(false)
const isTogglingTask = ref({})
const filters = reactive({
  search: '',
  status: '',
  priority: '',
  dateFilter: '',
  sortBy: 'dueDate',
  sortOrder: 'asc'
})
const isFiltering = ref(false)
const pagination = reactive({
  page: 1,
  totalPages: 1,
  total: 0,
  limit: 5,
  hasNext: false,
  hasPrev: false
})
// Priority options for the select dropdown with i18n
const priorityOptions = computed(() => [
  { text: $t('tasks.low'), value: 'low' },
  { text: $t('tasks.medium'), value: 'medium' },
  { text: $t('tasks.high'), value: 'high' }
])

// Status filter options
const statusFilterOptions = computed(() => [
  { text: $t('tasks.all'), value: '' },
  { text: $t('tasks.active'), value: 'active' },
  { text: $t('tasks.completed'), value: 'completed' },
  { text: $t('tasks.overdue'), value: 'overdue' }
])

// Date filter options
const dateFilterOptions = computed(() => [
  { text: $t('tasks.today'), value: 'today' },
  { text: $t('tasks.tomorrow'), value: 'tomorrow' },
  { text: $t('tasks.thisWeek'), value: 'thisWeek' },
  { text: $t('tasks.overdue'), value: 'overdue' },
  { text: $t('tasks.upcoming'), value: 'upcoming' },
  { text: $t('tasks.noDueDate'), value: 'noDueDate' }
])

// Sort options
const sortOptions = computed(() => [
  { text: $t('tasks.sortByCreated'), value: 'createdAt' },
  { text: $t('tasks.sortByUpdated'), value: 'updatedAt' },
  { text: $t('tasks.sortByDueDate'), value: 'dueDate' },
  { text: $t('tasks.sortByPriority'), value: 'priority' }
])

// Sort order options
const sortOrderOptions = computed(() => [
  { text: $t('tasks.descending'), value: 'desc' },
  { text: $t('tasks.ascending'), value: 'asc' }
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
    active: $t('tasks.active'),
    completed: $t('tasks.completed'),
    overdue: $t('tasks.overdue')
  }
  return translations[status] || status
}

// Helper function to check if task is overdue
function isTaskOverdue(task) {
  return task.status === 'active' && getDueDateUrgency(task.dueDate) === 'overdue'
}

// Function to automatically update overdue tasks using backend endpoint
async function updateOverdueTasks() {
  try {
    const response = await api.post('/api/tasks/update-overdue')

    if (response.data.success && response.data.data.modifiedCount > 0) {
      // Updated overdue tasks successfully
      await fetchStats() // Refresh stats to reflect the changes
    }
  } catch (error) {
    console.error('Error updating overdue tasks:', error)
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

// Format date and time for detailed view
function formatDateTime(dateString) {
  if (!dateString) return ''

  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  // Show relative time for recent updates
  if (diffMs < 60000) { // Less than 1 minute
    return $t('dates.justNow')
  } else if (diffMs < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diffMs / (1000 * 60))
    return $t('dates.minutesAgo', { minutes })
  } else if (diffHours < 24) { // Less than 24 hours
    return $t('dates.hoursAgo', { hours: diffHours })
  } else if (diffDays < 7) { // Less than 7 days
    return $t('dates.daysAgo', { days: diffDays })
  } else {
    // Use full date and time for older dates
    return date.toLocaleDateString($t('dates.locale'), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

// Check if task was recently updated (within last 24 hours)
function isRecentlyUpdated(updatedAt) {
  if (!updatedAt) return false
  const now = new Date()
  const updated = new Date(updatedAt)
  const diffMs = now - updated
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours <= 24 // Show "updated" chip for 24 hours
}


async function fetchTasks() {
  try {
    isLoadingTasks.value = true

    // Use filtering if any filters are applied
    if (isFiltering.value) {
      await fetchFilteredTasks()
    } else {
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const { data } = await api.get(`/api/tasks?${params.toString()}`)
      tasks.value = data.data.tasks

      // Update pagination info
      if (data.data.pagination) {
        pagination.totalPages = data.data.pagination.totalPages
        pagination.total = data.data.pagination.totalTasks
        pagination.hasNext = data.data.pagination.hasNextPage
        pagination.hasPrev = data.data.pagination.hasPrevPage
      }
    }

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

// Function to fetch filtered tasks using the professional filtering API
async function fetchFilteredTasks() {
  try {
    const params = new URLSearchParams()

    if (filters.search) params.append('search', filters.search)
    if (filters.status) params.append('status', filters.status)
    if (filters.priority) params.append('priority', filters.priority)
    if (filters.dateFilter) params.append('dateFilter', filters.dateFilter)
    if (filters.sortBy) params.append('sortBy', filters.sortBy)
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)
    params.append('page', pagination.page.toString())
    params.append('limit', pagination.limit.toString())

    const { data } = await api.get(`/api/tasks/filter?${params.toString()}`)
    tasks.value = data.data.tasks

    // Update pagination info
    if (data.data.pagination) {
      pagination.totalPages = data.data.pagination.totalPages
      pagination.total = data.data.pagination.totalTasks
      pagination.hasNext = data.data.pagination.hasNextPage
      pagination.hasPrev = data.data.pagination.hasPrevPage
    }
  } catch (error) {
    console.error('Fetch filtered tasks error:', error)
    // Fallback to regular fetch if filtering fails
    const { data } = await api.get('/api/tasks')
    tasks.value = data.data.tasks
  }
}

// Apply filters function
async function applyFilters() {
  // Check if any filter is active
  isFiltering.value = !!(
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.dateFilter ||
    filters.sortBy !== 'dueDate' ||
    filters.sortOrder !== 'asc'
  )

  pagination.page = 1 // Reset to first page when applying filters
  await fetchTasks()
}

// Clear all filters
function clearFilters() {
  filters.search = ''
  filters.status = ''
  filters.priority = ''
  filters.dateFilter = ''
  filters.sortBy = 'dueDate'
  filters.sortOrder = 'asc'
  isFiltering.value = false
  pagination.page = 1 // Reset to first page when clearing filters
  fetchTasks()
}

// Pagination functions
function goToPage(page) {
  if (page >= 1 && page <= pagination.totalPages) {
    pagination.page = page
    fetchTasks()
  }
}

function nextPage() {
  if (pagination.hasNext) {
    pagination.page++
    fetchTasks()
  }
}

function prevPage() {
  if (pagination.hasPrev) {
    pagination.page--
    fetchTasks()
  }
}

function firstPage() {
  pagination.page = 1
  fetchTasks()
}

function lastPage() {
  pagination.page = pagination.totalPages
  fetchTasks()
}

async function fetchStats() {
  try {
    const { data } = await api.get('/api/tasks/stats')
    stats.value = data.data.stats
  } catch (e) {
    console.error('Fetch stats error:', e)
  }
}

async function createTask(values, { resetForm, setErrors }) {
  formError.value = ''

  if (isCreatingTask.value) return

  isCreatingTask.value = true

  try {
    const { data } = await api.post('/api/tasks', {
      title: values.title,
      description: values.description,
      dueDate: values.dueDate,
      priority: values.priority
    })

    // Reset form and close dialog
    resetForm()
    form.title = ''
    form.description = ''
    form.dueDate = ''
    form.priority = 'medium'
    showCreateDialog.value = false

    // Go to first page to see new task and refetch
    pagination.page = 1
    await fetchTasks()
    await fetchStats()
  } catch (error) {
    console.error('Task creation failed:', error)

    // Handle validation errors from server with improved formatting
    if (error.response?.status === 400 && error.response?.data?.validationFailed && error.response?.data?.errors) {
      const serverErrors = {}
      error.response.data.errors.forEach(err => {
        // Use the field name from the new error format
        const fieldName = err.field || err.path
        if (fieldName) {
          // Use the formatted message that includes user-friendly field names
          serverErrors[fieldName] = err.message
        }
      })

      // Set field-specific errors
      if (Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors)
        // Also show the main validation message for better UX
        formError.value = error.response?.data?.message || $t('validation.validationFailed')
        return
      }
    }

    // Show general error if no specific field errors
    formError.value = error.response?.data?.message || $t('errors.serverError') || 'Failed to create task'
  } finally {
    isCreatingTask.value = false
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
  if (isTogglingTask.value[t._id]) return

  isTogglingTask.value[t._id] = true

  try {
    await api.patch(`/api/tasks/${t._id}/toggle`)
    await fetchTasks()
    await fetchStats()
  } catch (error) {
    console.error('Toggle task error:', error)
    console.error('Error details:', error.response?.data)
  } finally {
    isTogglingTask.value[t._id] = false
  }
}

async function deleteTask(t) {
  if (isDeletingTask.value) return

  isDeletingTask.value = true

  try {
    await api.delete(`/api/tasks/${t._id}`)
    showTaskDetails.value = false

    // If we're on a page that becomes empty after deletion, go to previous page
    if (tasks.value.length === 1 && pagination.page > 1) {
      pagination.page--
    }

    await fetchTasks()
    await fetchStats()
  } catch (error) {
    console.error('Delete task error:', error)
  } finally {
    isDeletingTask.value = false
  }
}

function editTask(task) {
  taskBeingEdited.value = task

  // Populate form with current task values
  editForm.title = task.title || ''
  editForm.description = task.description || ''
  editForm.priority = task.priority || 'medium'

  // Handle date formatting properly
  if (task.dueDate) {
    try {
      const date = new Date(task.dueDate)
      editForm.dueDate = date.toISOString().split('T')[0]
    } catch (e) {
      editForm.dueDate = ''
    }
  } else {
    editForm.dueDate = ''
  }

  editError.value = ''
  showEditDialog.value = true

  // Force Vue to update the DOM with new values
  nextTick(() => {
    // This ensures the form fields display the values immediately
  })
}

async function updateTask(values, { setErrors } = {}) {
  if (!taskBeingEdited.value) return

  editError.value = ''
  isUpdatingTask.value = true

  try {
    const updateData = {
      title: values?.title || editForm.title,
      description: values?.description || editForm.description,
      priority: values?.priority || editForm.priority
    }

    if (values?.dueDate || editForm.dueDate) {
      updateData.dueDate = values?.dueDate || editForm.dueDate
    }

    await api.put(`/api/tasks/${taskBeingEdited.value._id}`, updateData)

    showEditDialog.value = false
    await fetchTasks()
    await fetchStats()

  } catch (error) {
    console.error('Task update failed:', error)

    // Handle validation errors from server with improved formatting
    if (error.response?.status === 400 && error.response?.data?.validationFailed && error.response?.data?.errors && setErrors) {
      const serverErrors = {}
      error.response.data.errors.forEach(err => {
        // Use the field name from the new error format
        const fieldName = err.field || err.path
        if (fieldName) {
          // Use the formatted message that includes user-friendly field names
          serverErrors[fieldName] = err.message
        }
      })

      // Set field-specific errors
      if (Object.keys(serverErrors).length > 0) {
        setErrors(serverErrors)
        // Also show the main validation message for better UX
        editError.value = error.response?.data?.message || $t('validation.validationFailed')
        return
      }
    }

    // Show general error if no specific field errors
    editError.value = error.response?.data?.message || $t('errors.serverError') || 'Failed to update task'
  } finally {
    isUpdatingTask.value = false
  }
}

function openCreateDialog() {
  showCreateDialog.value = true
  // Reset form when opening dialog
  form.title = ''
  form.description = ''
  form.dueDate = ''
  form.priority = 'medium'
  formError.value = ''
}

function cancelCreate() {
  showCreateDialog.value = false
  form.title = ''
  form.description = ''
  form.dueDate = ''
  form.priority = 'medium'
  formError.value = ''
}

function cancelEdit() {
  showEditDialog.value = false
  editForm.title = ''
  editForm.description = ''
  editForm.dueDate = ''
  editForm.priority = 'medium'
  editError.value = ''
  taskBeingEdited.value = null
}

// Watch for dialog open to focus first input
watch(showCreateDialog, (newValue) => {
  if (newValue) {
    nextTick(() => {
      if (titleInput.value) {
        titleInput.value.focus()
      }
    })
  }
})

onMounted(async () => {
  // Update overdue tasks once on initial load
  await updateOverdueTasks()
  fetchTasks()
})
</script>

<style scoped>
.tasks-page {
  background: var(--app-background);
  min-height: calc(100vh - var(--header-height));
  margin: calc(-1 * var(--container-padding-md));
  padding: var(--container-padding-md);
  padding-top: 0;
  transition: background-color 0.3s ease;
}

.task-form-card,
.tasks-list-card,
.filters-card {
  background: var(--app-surface) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px var(--app-shadow);
  border: 1px solid var(--app-border-color);
}

/* Fix select component placeholder/label overlap issues */
:deep(.v-select .v-field__field) {
  --v-field-label-scale: 0.75em;
}

:deep(.v-select .v-field--active .v-field__label) {
  opacity: 1;
  transform: translateY(-50%) scale(var(--v-field-label-scale));
}

:deep(.v-select .v-field--no-label .v-field__label) {
  opacity: 0;
}

:deep(.v-select .v-field__label) {
  transition: all 0.2s ease-in-out;
  z-index: 1;
}

:deep(.v-select .v-field__input) {
  padding-top: 8px;
}

/* Ensure placeholder text doesn't overlap with label */
:deep(.v-select .v-field__field .v-field__input input) {
  padding-top: 16px !important;
}

/* Fix for clearable select components */
:deep(.v-select.v-field--clearable .v-field__label) {
  max-width: calc(100% - 40px);
}

/* Floating Action Button */
.floating-create-btn {
  position: fixed !important;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
  width: 56px;
  height: 56px;
}

@media (max-width: 768px) {
  .floating-create-btn {
    bottom: 16px;
    right: 16px;
    width: 48px;
    height: 48px;
  }

  .tasks-page {
    padding: 16px;
    padding-top: 0;
  }

  .v-container.pt-6 {
    padding-top: 24px !important;
  }
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

/* Overdue task styling */
.task-overdue {
  opacity: 0.7 !important;
  cursor: not-allowed !important;
}

.task-overdue .v-selection-control__input {
  background-color: #ffebee !important;
  border-color: #f44336 !important;
}

.dark-theme .task-overdue .v-selection-control__input {
  background-color: #4d2c2c !important;
  border-color: #f44336 !important;
}

.task-item.task-status-overdue {
  border-left: 4px solid #f44336;
  background: rgba(244, 67, 54, 0.08);
  opacity: 0.9;
}

.task-item.task-status-overdue .task-title {
  color: #d32f2f !important;
  font-weight: 600;
}

.task-item.task-status-overdue .task-description {
  color: #f44336 !important;
  opacity: 0.8;
}

/* Updated task chip styling */
.updated-chip {
  background: rgba(33, 150, 243, 0.1) !important;
  border-color: #2196f3 !important;
  animation: pulse-blue 2s infinite;
}

.updated-chip .v-chip__content {
  color: #1976d2 !important;
  font-weight: 600 !important;
}

.dark-theme .updated-chip {
  background: rgba(33, 150, 243, 0.2) !important;
}

.dark-theme .updated-chip .v-chip__content {
  color: #42a5f5 !important;
}

@keyframes pulse-blue {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

/* Filters card styling */
.filters-card {
  background: var(--app-surface) !important;
  border-radius: 12px !important;
  box-shadow: 0 4px 12px var(--app-shadow);
  border: 1px solid var(--app-border-color);
}

.filters-card .v-card-title {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.1), rgba(33, 150, 243, 0.05));
  border-bottom: 1px solid var(--app-border-color);
}

.filters-card .v-text-field,
.filters-card .v-select {
  font-size: 0.9rem;
}

.filters-card .v-field--outlined {
  border-radius: 8px;
}

/* Active filter indicator */
.v-select--dirty .v-field__input,
.v-text-field--dirty .v-field__input {
  background: rgba(33, 150, 243, 0.05);
}
</style>