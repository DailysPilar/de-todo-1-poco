import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#087DF1',
          secondary: '#FFBF2E',
          background: '#F5F8FC',
          surface: '#FFFFFF',
        },
      },
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})