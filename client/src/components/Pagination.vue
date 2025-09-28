<template>
  <div class="pagination-container" v-if="totalItems > 0">
    <div class="pagination-info">
      <span class="results-text">
        {{ $t('pagination.showing') }} {{ startItem }}-{{ endItem }} {{ $t('pagination.of') }} {{ totalItems }} {{ $t('pagination.results') }}
      </span>
    </div>
    
    <nav class="pagination" aria-label="Pagination Navigation" v-if="totalPages > 1">
      <!-- First Page Button -->
      <button 
        class="pagination-btn pagination-btn--first"
        :disabled="currentPage === 1"
        @click="goToPage(1)"
        :title="$t('pagination.firstPage')"
      >
        <ChevronLeft :size="16" />
        <ChevronLeft :size="16" class="double-chevron" />
      </button>
      
      <!-- Previous Page Button -->
      <button 
        class="pagination-btn pagination-btn--prev"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        :title="$t('pagination.previousPage')"
      >
        <ChevronLeft :size="16" />
        <span class="btn-text">{{ $t('pagination.previous') }}</span>
      </button>
      
      <!-- Page Numbers -->
      <div class="pagination-pages">
        <button
          v-for="page in visiblePages"
          :key="page"
          class="pagination-btn pagination-btn--page"
          :class="{ 'pagination-btn--active': page === currentPage }"
          @click="goToPage(page)"
          :aria-label="`${$t('pagination.goToPage')} ${page}`"
        >
          {{ page }}
        </button>
        
        <!-- Ellipsis for gap -->
        <span v-if="showEndEllipsis" class="pagination-ellipsis">...</span>
        
        <!-- Last page if not visible -->
        <button
          v-if="showLastPage"
          class="pagination-btn pagination-btn--page"
          @click="goToPage(totalPages)"
          :aria-label="`${$t('pagination.goToPage')} ${totalPages}`"
        >
          {{ totalPages }}
        </button>
      </div>
      
      <!-- Next Page Button -->
      <button 
        class="pagination-btn pagination-btn--next"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        :title="$t('pagination.nextPage')"
      >
        <span class="btn-text">{{ $t('pagination.next') }}</span>
        <ChevronRight :size="16" />
      </button>
      
      <!-- Last Page Button -->
      <button 
        class="pagination-btn pagination-btn--last"
        :disabled="currentPage === totalPages"
        @click="goToPage(totalPages)"
        :title="$t('pagination.lastPage')"
      >
        <ChevronRight :size="16" class="double-chevron" />
        <ChevronRight :size="16" />
      </button>
    </nav>
    
    <!-- Page Size Selector -->
    <div class="page-size-selector">
      <label for="pageSize" class="page-size-label">{{ $t('pagination.itemsPerPage') }}:</label>
      <select 
        id="pageSize"
        class="page-size-select"
        :value="pageSize"
        @change="changePageSize($event.target.value)"
      >
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
    default: 1
  },
  totalPages: {
    type: Number,
    required: true,
    default: 1
  },
  totalItems: {
    type: Number,
    required: true,
    default: 0
  },
  pageSize: {
    type: Number,
    default: 10
  },
  maxVisiblePages: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['page-change', 'page-size-change'])

// Computed properties
const startItem = computed(() => {
  return (props.currentPage - 1) * props.pageSize + 1
})

const endItem = computed(() => {
  const end = props.currentPage * props.pageSize
  return end > props.totalItems ? props.totalItems : end
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = props.maxVisiblePages
  const total = props.totalPages
  const current = props.currentPage
  
  if (total <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= total; i++) {
      pages.push(i)
    }
  } else {
    // Calculate start and end of visible range
    let start = Math.max(1, current - Math.floor(maxVisible / 2))
    let end = Math.min(total, start + maxVisible - 1)
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }
  
  return pages
})

const showEndEllipsis = computed(() => {
  const lastVisible = visiblePages.value[visiblePages.value.length - 1]
  return lastVisible < props.totalPages - 1
})

const showLastPage = computed(() => {
  const lastVisible = visiblePages.value[visiblePages.value.length - 1]
  return lastVisible < props.totalPages
})

// Methods
function goToPage(page) {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('page-change', page)
  }
}

function changePageSize(newSize) {
  emit('page-size-change', parseInt(newSize))
}
</script>

<style scoped>
.pagination-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid #e5e7eb;
  margin-top: 24px;
}

.pagination-info {
  color: #6b7280;
  font-size: 14px;
}

.results-text {
  font-weight: 500;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 40px;
  height: 40px;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--the7-accent-bg-filter, rgba(30, 187, 240, 0.1));
  border-color: var(--the7-accent-color, #1ebbf0);
  color: var(--the7-accent-color, #1ebbf0);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f9fafb;
}

.pagination-btn--active {
  background: var(--the7-accent-color, #1ebbf0);
  border-color: var(--the7-accent-color, #1ebbf0);
  color: white;
}

.pagination-btn--active:hover {
  background: var(--the7-accent-color, #1ebbf0);
  color: white;
}

.pagination-btn--page {
  min-width: 40px;
  padding: 8px;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pagination-ellipsis {
  padding: 8px 4px;
  color: #6b7280;
  font-weight: 500;
}

.double-chevron {
  margin-left: -8px;
}

.btn-text {
  font-size: 14px;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.page-size-label {
  color: #6b7280;
  font-weight: 500;
}

.page-size-select {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.page-size-select:focus {
  outline: none;
  border-color: var(--the7-accent-color, #1ebbf0);
  box-shadow: 0 0 0 3px rgba(30, 187, 240, 0.1);
}

/* Responsive Design */
@media (max-width: 768px) {
  .pagination-container {
    gap: 12px;
  }
  
  .pagination {
    gap: 4px;
  }
  
  .pagination-btn {
    padding: 6px 8px;
    min-width: 36px;
    height: 36px;
    font-size: 13px;
  }
  
  .btn-text {
    display: none;
  }
  
  .pagination-btn--first,
  .pagination-btn--last {
    display: none;
  }
  
  .page-size-selector {
    flex-direction: column;
    gap: 4px;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .pagination-pages {
    gap: 2px;
  }
  
  .pagination-btn--page {
    min-width: 32px;
    padding: 6px;
  }
}
</style>
