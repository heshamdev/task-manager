import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Create Vuetify theme
const theme = {
  defaultTheme: 'light',
  themes: {
    light: {
      dark: false,
      colors: {
        primary: '#1ebbf0', // 3DDX accent color
        secondary: '#39dfaa', // 3DDX accent bg 2
        accent: '#1ebbf0',
        error: '#f44336',
        warning: '#ffc107',
        info: '#2196f3',
        success: '#4caf50',
        surface: '#ffffff',
        background: '#f8f9fa',
        'on-surface': '#000000',
        'on-background': '#000000',
        'surface-bright': '#ffffff',
        'surface-light': '#f5f5f5',
        'surface-variant': '#e0e0e0',
        'on-surface-variant': '#424242',
      },
    },
    dark: {
      dark: true,
      colors: {
        primary: '#1ebbf0',
        secondary: '#39dfaa',
        accent: '#1ebbf0',
        error: '#ff5252',
        warning: '#ffc107',
        info: '#2196f3',
        success: '#4caf50',
        surface: '#1e1e1e',
        background: '#121212',
        'on-surface': '#ffffff',
        'on-background': '#ffffff',
        'surface-bright': '#2c2c2c',
        'surface-light': '#424242',
        'surface-variant': '#424242',
        'on-surface-variant': '#e0e0e0',
      },
    },
  },
}

// Arabic typography configuration for Vuetify
const arabicTypography = {
  fontFamily: 'Cairo, IBM Plex Sans Arabic, Noto Sans Arabic, Segoe UI Arabic, Tahoma, sans-serif',
  fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
  textRendering: 'optimizeLegibility',
  webkitFontSmoothing: 'antialiased',
  mozOsxFontSmoothing: 'grayscale',
}

// Create Vuetify instance with enhanced Arabic support
export default createVuetify({
  components,
  directives,
  theme,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  defaults: {
    VCard: {
      flat: true,
    },
    VBtn: {
      style: {
        textTransform: 'none',
        fontWeight: '500',
        letterSpacing: '0.02em'
      },
    },
    VTextField: {
      variant: 'outlined',
      style: {
        fontFamily: arabicTypography.fontFamily,
        lineHeight: '1.75'
      }
    },
    VTextarea: {
      variant: 'outlined',
      style: {
        fontFamily: arabicTypography.fontFamily,
        lineHeight: '1.75'
      }
    },
    VSelect: {
      variant: 'outlined',
      style: {
        fontFamily: arabicTypography.fontFamily
      }
    },
    VCardTitle: {
      style: {
        fontFamily: 'Tajawal, Cairo, IBM Plex Sans Arabic, sans-serif',
        fontWeight: '600',
        lineHeight: '1.5'
      }
    },
    VListItem: {
      style: {
        fontFamily: arabicTypography.fontFamily,
        fontWeight: '500'
      }
    },
    VDataTable: {
      style: {
        fontFamily: arabicTypography.fontFamily
      }
    }
  },
  // RTL support - will be controlled dynamically
  locale: {
    rtl: {
      ar: true,
      en: false
    }
  }
})