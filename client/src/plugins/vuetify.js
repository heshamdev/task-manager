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
      },
    },
  },
}

// Create Vuetify instance
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
      style: { textTransform: 'none' },
    },
    VTextField: {
      variant: 'outlined',
    },
    VTextarea: {
      variant: 'outlined',
    },
    VSelect: {
      variant: 'outlined',
    },
  },
})