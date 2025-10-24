import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#FF6F61', // Vibrant Coral
      light: '#FFA29A',
      dark: '#C63F33',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#26A69A', // Lively Teal
      light: '#4DD0E1',
      dark: '#00766C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FAFAFA', // Off-White
      paper: '#F0F2F5', // Soft Gray
    },
    text: {
      primary: '#212121', // Dark Charcoal
      secondary: '#00695C', // Muted Teal
    },
    success: {
      main: '#4CAF50', // Vibrant Green (unchanged, fits the lively theme)
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F', // Bold Red
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#FFB300', // Bright Amber
      contrastText: '#212121',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});