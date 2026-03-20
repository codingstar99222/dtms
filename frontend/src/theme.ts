// frontend/src/theme.ts
import { createTheme } from '@mui/material/styles';

export const getTheme = (darkMode: boolean) =>
  createTheme({
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
        primary: darkMode ? '#ffffff !important' : '#000000 !important',
        secondary: darkMode ? '#aaaaaa !important' : '#666666 !important',
      },
    },
    components: {
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e1e1e !important' : '#1976d2 !important',
            color: '#ffffff !important',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            // Contained buttons (primary variant)
            '&.Mui-contained': {
              color: '#ffffff !important', // White text for contained buttons
            },
            // Text buttons (like "Cancel")
            '&.Mui-text': {
              color: darkMode ? '#ffffff !important' : '#1976d2 !important',
            },
            // Outlined buttons
            '&.Mui-outlined': {
              color: darkMode ? '#ffffff !important' : '#1976d2 !important',
              borderColor: darkMode ? '#ffffff !important' : '#1976d2 !important',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff !important' : '#ffffff !important', // White in both modes for navbar
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: 'inherit !important',
          },
          h1: { color: 'text.primary' },
          h2: { color: 'text.primary' },
          h3: { color: 'text.primary' },
          h4: { color: 'text.primary' },
          h5: { color: 'text.primary' },
          h6: { color: 'text.primary' },
          subtitle1: { color: 'text.primary' },
          subtitle2: { color: 'text.secondary' },
          body1: { color: 'text.primary' },
          body2: { color: 'text.secondary' },
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
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: darkMode ? '#1e1e1e !important' : '#ffffff !important',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff !important' : '#000000 !important',
            '&:hover': {
              backgroundColor: darkMode ? '#333333 !important' : '#f5f5f5 !important',
            },
          },
        },
      },
    },
  });
