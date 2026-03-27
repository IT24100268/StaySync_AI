import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2f7cfb',
    },
    secondary: {
      main: '#4a96ff',
    },
    success: {
      main: '#1ea972',
    },
    warning: {
      main: '#ef9a2b',
    },
    info: {
      main: '#2c8cff',
    },
    text: {
      primary: '#1d2d45',
      secondary: '#556987',
    },
    background: {
      default: '#edf4ff',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 700,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          paddingInline: 18,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 600,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          minHeight: 38,
          textTransform: 'none',
          fontWeight: 600,
          marginRight: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 24,
        },
      },
    },
  },
})

export default theme
