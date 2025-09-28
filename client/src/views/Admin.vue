<template>
  <div class="admin-page">
    <v-container fluid>
      <!-- Admin Header -->
      <v-row>
      <v-col cols="12">
        <v-card elevation="2" class="mb-6">
          <v-card-title class="text-h4 primary--text d-flex align-center">
            <v-icon left color="primary" size="large">mdi-shield-account</v-icon>
            {{ $t('admin.dashboard') || 'Admin Dashboard' }}
          </v-card-title>
          <v-card-subtitle class="text-subtitle-1">
            {{ $t('admin.subtitle') || 'System monitoring and user activity logs' }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- User Activity Logs -->
    <v-row>
      <v-col cols="12">
        <v-card elevation="4" class="logs-card">
          <v-card-title class="text-h5 d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon left color="info">mdi-file-document-outline</v-icon>
              {{ $t('admin.userLogs') || 'User Activity Logs' }}
            </div>
            <div class="d-flex align-center button-group">
              <v-btn
                @click="refreshLogs"
                :loading="loading"
                variant="outlined"
                size="small"
                prepend-icon="mdi-refresh"
                color="primary"
              >
                {{ $t('admin.refresh') || 'Refresh' }}
              </v-btn>
              <v-btn
                @click="exportLogs"
                :disabled="!logs.length"
                variant="outlined"
                size="small"
                prepend-icon="mdi-download"
                color="success"
              >
                {{ $t('admin.export') || 'Export' }}
              </v-btn>
              <v-btn
                @click="deleteAllLogs"
                :disabled="!logs.length || loading"
                variant="outlined"
                size="small"
                prepend-icon="mdi-delete-sweep"
                color="error"
              >
                {{ $t('admin.deleteAll') || 'Delete All' }}
              </v-btn>
            </div>
          </v-card-title>

          <v-card-text>
            <!-- Filters -->
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-select
                  v-model="filterLevel"
                  :items="logLevels"
                  :label="$t('admin.filterLevel') || 'Filter by Level'"
                  variant="outlined"
                  clearable
                  prepend-inner-icon="mdi-filter"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchTerm"
                  :label="$t('admin.search') || 'Search logs...'"
                  variant="outlined"
                  clearable
                  prepend-inner-icon="mdi-magnify"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="itemsPerPage"
                  :items="pageSizeOptions"
                  :label="$t('admin.itemsPerPage') || 'Items per page'"
                  variant="outlined"
                />
              </v-col>
            </v-row>

            <!-- Loading State -->
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="mt-4 text-subtitle-1">{{ $t('admin.loadingLogs') || 'Loading logs...' }}</p>
            </div>

            <!-- Error State -->
            <v-alert
              v-else-if="error"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="error = null"
            >
              <template #title>{{ $t('admin.errorTitle') || 'Error Loading Logs' }}</template>
              {{ error }}
            </v-alert>

            <!-- Empty State -->
            <div v-else-if="!filteredLogs.length" class="text-center py-8">
              <v-icon size="80" color="grey-lighten-1">mdi-file-document-outline</v-icon>
              <p class="text-h6 mt-4 text-grey">
                {{ searchTerm || filterLevel ?
                  ($t('admin.noFilteredLogs') || 'No logs match your filters') :
                  ($t('admin.noLogs') || 'No logs available')
                }}
              </p>
            </div>

            <!-- Logs Table -->
            <div v-else>
              <v-data-table
                :headers="headers"
                :items="paginatedLogs"
                :items-per-page="itemsPerPage"
                hide-default-footer
                class="logs-table"
              >
                <template #item.timestamp="{ item }">
                  <span class="font-mono">{{ formatTimestamp(item.timestamp) }}</span>
                </template>

                <template #item.level="{ item }">
                  <v-chip
                    :color="getLevelColor(item.level)"
                    variant="tonal"
                    size="small"
                    class="font-weight-bold"
                  >
                    {{ item.level.toUpperCase() }}
                  </v-chip>
                </template>

                <template #item.email="{ item }">
                  <span class="email-cell">
                    {{ getEmailFromLog(item) || 'N/A' }}
                  </span>
                </template>

                <template #item.view="{ item }">
                  <v-chip
                    :color="getViewColor(item)"
                    variant="tonal"
                    size="small"
                    class="font-weight-medium"
                  >
                    {{ getViewFromLog(item) || 'unknown' }}
                  </v-chip>
                </template>

                <template #item.action="{ item }">
                  <v-chip
                    :color="getActionColor(item)"
                    variant="outlined"
                    size="small"
                    class="font-weight-medium"
                  >
                    {{ getActionFromLog(item) || 'N/A' }}
                  </v-chip>
                </template>

                <template #item.message="{ item }">
                  <div class="message-cell">
                    {{ item.message }}
                    <div v-if="item.meta && Object.keys(item.meta).length" class="meta-info">
                      <v-btn
                        @click="toggleMeta(item)"
                        variant="text"
                        size="x-small"
                        color="info"
                      >
                        {{ item.showMeta ? 'Hide Details' : 'Show Details' }}
                      </v-btn>
                      <div v-if="item.showMeta" class="meta-content mt-2">
                        <pre class="text-caption">{{ JSON.stringify(item.meta, null, 2) }}</pre>
                      </div>
                    </div>
                  </div>
                </template>

                <template #item.actions="{ item }">
                  <v-btn
                    @click="viewLogDetails(item)"
                    variant="text"
                    size="small"
                    color="primary"
                    prepend-icon="mdi-eye"
                  >
                    View
                  </v-btn>
                </template>
              </v-data-table>

              <!-- Pagination -->
              <div class="d-flex justify-center mt-4">
                <v-pagination
                  v-model="currentPage"
                  :length="Math.ceil(filteredLogs.length / itemsPerPage)"
                  :total-visible="7"
                  color="primary"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../services/api.js'

const router = useRouter()

// Reactive data
const logs = ref([])
const loading = ref(false)
const error = ref(null)
const filterLevel = ref(null)
const searchTerm = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(25)

// Configuration
const logLevels = [
  { title: 'All Levels', value: null },
  { title: 'Error', value: 'error' },
  { title: 'Warn', value: 'warn' },
  { title: 'Info', value: 'info' },
  { title: 'Debug', value: 'debug' }
]

const pageSizeOptions = [10, 25, 50, 100]

const headers = [
  { title: 'Timestamp', key: 'timestamp', width: '180px' },
  { title: 'Level', key: 'level', width: '80px' },
  { title: 'Email', key: 'email', width: '180px' },
  { title: 'View', key: 'view', width: '120px' },
  { title: 'Action', key: 'action', width: '150px' },
  { title: 'Message', key: 'message', sortable: false },
  { title: 'Details', key: 'actions', width: '100px', sortable: false }
]

// Computed properties
const filteredLogs = computed(() => {
  let filtered = logs.value

  // Filter by level
  if (filterLevel.value) {
    filtered = filtered.filter(log => log.level === filterLevel.value)
  }

  // Filter by search term
  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    filtered = filtered.filter(log =>
      log.message.toLowerCase().includes(term) ||
      log.level.toLowerCase().includes(term) ||
      (log.meta && JSON.stringify(log.meta).toLowerCase().includes(term))
    )
  }

  return filtered
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredLogs.value.slice(start, end)
})

// Methods
async function fetchLogs() {
  loading.value = true
  error.value = null

  try {
    const response = await api.get('/api/admin/logs')

    if (response.data.success) {
      // Parse log entries if they're in string format
      const logLines = response.data.data?.lines || response.data.logs || [];
      logs.value = logLines.map(log => {
        if (typeof log === 'string') {
          try {
            return JSON.parse(log)
          } catch {
            // If parsing fails, create a basic log entry
            return {
              timestamp: new Date().toISOString(),
              level: 'info',
              message: log,
              meta: {}
            }
          }
        }
        return { ...log, showMeta: false }
      })
    } else {
      throw new Error(response.data.message || 'Failed to fetch logs')
    }
  } catch (err) {
    console.error('Error fetching logs:', err)
    error.value = err.response?.data?.message || err.message || 'Failed to load logs'

    // If unauthorized, redirect to login
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    } else if (err.response?.status === 403) {
      error.value = 'Access denied. Admin privileges required.'
    }
  } finally {
    loading.value = false
  }
}

function refreshLogs() {
  fetchLogs()
}

function exportLogs() {
  try {
    const dataStr = JSON.stringify(filteredLogs.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `admin-logs-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error('Error exporting logs:', err)
  }
}

function formatTimestamp(timestamp) {
  if (!timestamp) return 'N/A'

  try {
    const date = new Date(timestamp)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  } catch {
    return timestamp.toString()
  }
}

function getLevelColor(level) {
  const colors = {
    error: 'error',
    warn: 'warning',
    info: 'info',
    debug: 'success'
  }
  return colors[level] || 'grey'
}

function toggleMeta(item) {
  item.showMeta = !item.showMeta
}

function getEmailFromLog(item) {
  // Try to extract email from meta data (new enhanced logging format)
  if (item.meta) {
    if (item.meta.userEmail) return item.meta.userEmail
    if (item.meta.email) return item.meta.email
    if (item.meta.user && item.meta.user.email) return item.meta.user.email
  }

  // Try to extract email from message using regex (fallback)
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  const match = item.message?.match(emailRegex)
  return match ? match[0] : null
}

function getViewFromLog(item) {
  // Extract view from meta data
  if (item.meta && item.meta.view) {
    return item.meta.view
  }
  return 'unknown'
}

function getActionFromLog(item) {
  // Extract action from meta data
  if (item.meta && item.meta.action) {
    return item.meta.action
  }
  return 'N/A'
}

function getViewColor(item) {
  const view = getViewFromLog(item)
  const colorMap = {
    'login': 'success',
    'register': 'info',
    'tasks': 'primary',
    'admin': 'warning',
    'unknown': 'grey'
  }
  return colorMap[view] || 'grey'
}

function getActionColor(item) {
  const action = getActionFromLog(item)
  const colorMap = {
    'LOGIN': 'success',
    'REGISTER': 'info',
    'CREATE_TASK': 'primary',
    'UPDATE_TASK': 'orange',
    'DELETE_TASK': 'error',
    'TOGGLE_TASK_STATUS': 'purple',
    'UPDATE_EXPIRED_TASKS': 'warning',
    'VIEW_LOGS': 'indigo',
    'DELETE_ALL_LOGS': 'red'
  }
  return colorMap[action] || 'grey'
}

function viewLogDetails(item) {
  // Create a formatted view of the log details
  const details = {
    timestamp: item.timestamp,
    level: item.level,
    message: item.message,
    ...(item.meta && { metadata: item.meta })
  }

  // For now, show in a simple alert - you could replace this with a dialog
  alert(JSON.stringify(details, null, 2))
}

async function deleteAllLogs() {
  // Confirm deletion
  if (!confirm('Are you sure you want to delete all logs? This action cannot be undone.')) {
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await api.delete('/api/admin/logs')

    if (response.data.success) {
      // Clear the logs array
      logs.value = []
      // Show success message
      alert('All logs have been deleted successfully.')
    } else {
      throw new Error(response.data.message || 'Failed to delete logs')
    }
  } catch (err) {
    console.error('Error deleting logs:', err)
    error.value = err.response?.data?.message || err.message || 'Failed to delete logs'

    // If unauthorized, redirect to login
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
    } else if (err.response?.status === 403) {
      error.value = 'Access denied. Admin privileges required.'
    }
  } finally {
    loading.value = false
  }
}

// Watchers
watch([filterLevel, searchTerm], () => {
  currentPage.value = 1
})

// Lifecycle
onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.admin-page {
  max-width: 1200px;
  margin: calc(-1 * var(--container-padding-md)) auto 0 auto;
  padding: var(--container-padding-md);
  background: var(--app-background);
  color: var(--app-text-primary);
  transition: background 0.3s ease, color 0.3s ease;
}

.logs-card {
  background: var(--app-surface) !important;
  transition: background 0.3s ease;
}

/* Dark theme for logs card */
.dark-theme .logs-card {
  background: var(--app-surface) !important;
}

.logs-table {
  background: var(--app-surface) !important;
  border-radius: 8px;
  transition: background 0.3s ease;
}

/* Dark theme for table */
.dark-theme .logs-table {
  background: var(--app-surface) !important;
}

.message-cell {
  max-width: 400px;
  word-break: break-word;
  color: var(--app-text-primary);
}

.meta-content {
  background: var(--app-background);
  border: 1px solid var(--app-border-color);
  border-radius: var(--spacing-xs);
  padding: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  transition: background 0.3s ease, border-color 0.3s ease;
}

.meta-content pre {
  margin: 0;
  white-space: pre-wrap;
  font-size: 11px;
  color: var(--app-text-secondary);
}

.font-mono {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--app-text-primary);
}

/* Theme-aware card styling */
.v-card {
  background: var(--app-surface) !important;
  color: var(--app-text-primary) !important;
}

.v-card-title {
  color: var(--app-text-primary) !important;
}

.v-card-subtitle {
  color: var(--app-text-secondary) !important;
}

/* Theme-aware form elements */
.v-text-field,
.v-select {
  color: var(--app-text-primary) !important;
}

.v-text-field .v-field__input,
.v-select .v-field__input {
  color: var(--app-text-primary) !important;
}

.v-text-field .v-field__outline,
.v-select .v-field__outline {
  color: var(--app-border-color) !important;
}

.v-label {
  color: var(--app-text-secondary) !important;
}

/* Theme-aware data table */
.v-data-table {
  background: var(--app-surface) !important;
  color: var(--app-text-primary) !important;
}

.v-data-table th {
  background: var(--app-surface) !important;
  color: var(--app-text-primary) !important;
  border-bottom: 1px solid var(--app-border-color) !important;
}

.v-data-table td {
  color: var(--app-text-primary) !important;
  border-bottom: 1px solid var(--app-border-color) !important;
}

/* Theme-aware buttons */
.v-btn {
  color: var(--app-text-primary) !important;
}

/* Theme-aware alert */
.v-alert {
  background: var(--app-surface) !important;
  color: var(--app-text-primary) !important;
}

/* Button group spacing */
.button-group {
  gap: var(--spacing-md);
}

.button-group .v-btn {
  margin: 0 !important;
}

/* Email column styling */
.email-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: var(--app-text-secondary);
  word-break: break-all;
}

/* Enhanced RTL Support with Professional Arabic Typography */
.rtl .admin-page {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  direction: rtl;
}

.rtl .v-card-title {
  font-family: 'Tajawal', 'Cairo', 'IBM Plex Sans Arabic', sans-serif;
  font-weight: 600;
  line-height: 1.5;
}

.rtl .v-card-subtitle {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  line-height: 1.75;
}

.rtl .logs-table {
  direction: rtl;
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
}

.rtl .message-cell {
  text-align: right;
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  line-height: 1.75;
  word-spacing: 0.1em;
}

.rtl .v-data-table th {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 600;
  text-align: right;
}

.rtl .v-data-table td {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  text-align: right;
}

.rtl .v-btn {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.rtl .v-text-field,
.rtl .v-select {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
}

.rtl .v-text-field .v-field__input {
  text-align: right;
  line-height: 1.75;
}

.rtl .v-label {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
}

.rtl .v-chip {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  font-weight: 500;
}

.rtl .v-alert {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', sans-serif;
  line-height: 1.75;
}

.rtl .v-progress-circular {
  margin: 0 auto;
}

/* Better Arabic text rendering for timestamps */
.rtl .font-mono {
  font-family: 'Cairo', 'IBM Plex Sans Arabic', 'Noto Sans Arabic', 'Courier New', monospace;
  font-feature-settings: 'lnum' 1, 'tnum' 1;
}
</style>