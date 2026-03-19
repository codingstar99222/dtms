// frontend/src/theme.ts
import { createTheme } from '@mui/material/styles';

export const getTheme = (darkMode: boolean) => createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: darkMode ? '#121212' : '#f5f5f5',
      paper: darkMode ? '#1e1e1e' : '#ffffff',
    },
    text: {
      primary: darkMode ? '#ffffff' : '#000000',
      secondary: darkMode ? '#aaaaaa' : '#666666',
    },
  },
  components: {
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'inherit !important', // Force color
        },
        h1: { color: 'text.primary !important' },
        h2: { color: 'text.primary !important' },
        h3: { color: 'text.primary !important' },
        h4: { color: 'text.primary !important' },
        h5: { color: 'text.primary !important' },
        h6: { color: 'text.primary !important' },
        subtitle1: { color: 'text.primary !important' },
        subtitle2: { color: 'text.secondary !important' },
        body1: { color: 'text.primary !important' },
        body2: { color: 'text.secondary !important' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: darkMode ? '#1e1e1e !important' : '#ffffff !important',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: darkMode ? '#1e1e1e !important' : '#ffffff !important',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: 'inherit !important',
        },
        head: {
          backgroundColor: darkMode ? '#2d2d2d !important' : '#f5f5f5 !important',
          color: darkMode ? '#ffffff !important' : '#000000 !important',
          fontWeight: 'bold',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          color: 'inherit !important',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          color: 'inherit !important',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: darkMode ? '#aaaaaa !important' : '#666666 !important',
        },
      },
    },
  },
});