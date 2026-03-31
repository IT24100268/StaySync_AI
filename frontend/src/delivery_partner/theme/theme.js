import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1a0a00',
    },
    secondary: {
      main: '#c9a84c',
    },
    success: {
      main: '#2f7b4b',
    },
    warning: {
      main: '#c9a84c',
    },
    info: {
      main: '#8b735a',
    },
    text: {
      primary: '#281304',
      secondary: '#7d664f',
    },
    background: {
      default: '#f5f0e8',
      paper: '#fffaf3',
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
