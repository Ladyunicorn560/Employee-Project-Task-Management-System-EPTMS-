import { createTheme } from '@mui/material/styles';

/**
 * EPTMS MUI Theme Configuration
 * Light mode (default). Dark mode deferred to Phase 17.
 *
 * Color Palette:
 *  Primary   : #1976D2  (Professional blue)
 *  Secondary : #26A69A  (Teal)
 *  Background: #F5F7FA  (Soft grey-white)
 *  Surface   : #FFFFFF
 *  Error     : #D32F2F
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976D2',
      light: '#42A5F5',
      dark: '#1565C0',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#26A69A',
      light: '#4DB6AC',
      dark: '#00796B',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#ED6C02',
      light: '#FF9800',
      dark: '#E65100',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1A2E',
      secondary: '#5A6A85',
      disabled: '#A0AEC0',
    },
    divider: '#E2E8F0',
  },

  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2.25rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.3 },
    h3: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h5: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.57 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
    overline: { fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' },
  },

  shape: {
    borderRadius: 10,
  },

  spacing: 8,

  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },

  shadows: [
    'none',
    '0px 1px 3px rgba(0,0,0,0.06), 0px 1px 2px rgba(0,0,0,0.04)',
    '0px 3px 8px rgba(0,0,0,0.08), 0px 1px 3px rgba(0,0,0,0.05)',
    '0px 6px 16px rgba(0,0,0,0.10), 0px 2px 6px rgba(0,0,0,0.06)',
    '0px 8px 24px rgba(0,0,0,0.12)',
    '0px 12px 32px rgba(0,0,0,0.14)',
    ...Array(19).fill('none'),
  ],

  components: {
    // ─── CssBaseline ──────────────────────────────────────────────────
    MuiCssBaseline: {
      styleOverrides: {
        '*': { boxSizing: 'border-box', margin: 0, padding: 0 },
        body: {
          backgroundColor: '#F5F7FA',
          fontFamily: '"Inter", sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '::-webkit-scrollbar': { width: '6px', height: '6px' },
        '::-webkit-scrollbar-track': { background: '#F1F5F9' },
        '::-webkit-scrollbar-thumb': {
          background: '#CBD5E0',
          borderRadius: '3px',
          '&:hover': { background: '#A0AEC0' },
        },
        'a': { textDecoration: 'none', color: 'inherit' },
      },
    },

    // ─── Button ───────────────────────────────────────────────────────
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          padding: '8px 20px',
          transition: 'all 0.2s ease',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: '0 4px 12px rgba(25,118,210,0.25)' },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)' },
        },
        containedSecondary: {
          background: 'linear-gradient(135deg, #26A69A 0%, #00796B 100%)',
        },
      },
    },

    // ─── Card ─────────────────────────────────────────────────────────
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #E2E8F0',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0px 6px 20px rgba(0,0,0,0.12)' },
        },
      },
    },

    // ─── TextField ────────────────────────────────────────────────────
    MuiTextField: {
      defaultProps: { size: 'medium', variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            transition: 'box-shadow 0.2s ease',
            '&:hover fieldset': { borderColor: '#1976D2' },
            '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(25,118,210,0.12)' },
          },
        },
      },
    },

    // ─── AppBar ───────────────────────────────────────────────────────
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#1A1A2E',
          boxShadow: '0px 1px 4px rgba(0,0,0,0.08)',
          borderBottom: '1px solid #E2E8F0',
        },
      },
    },

    // ─── Drawer ───────────────────────────────────────────────────────
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1A237E',
          color: '#FFFFFF',
          border: 'none',
        },
      },
    },

    // ─── Tooltip ──────────────────────────────────────────────────────
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1A1A2E',
          fontSize: '0.75rem',
          borderRadius: 6,
        },
      },
    },

    // ─── Chip ─────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500 },
      },
    },

    // ─── Paper ────────────────────────────────────────────────────────
    MuiPaper: {
      styleOverrides: {
        root: { borderRadius: 12 },
        elevation1: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' },
      },
    },

    // ─── Table ────────────────────────────────────────────────────────
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            fontWeight: 700,
            backgroundColor: '#F8FAFC',
            color: '#5A6A85',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: '#F8FAFC' },
          '&:last-child td': { borderBottom: 0 },
        },
      },
    },

    // ─── FormControl ──────────────────────────────────────────────────
    // Ensures every Select/FormControl has enough minimum width to show
    // its label text without truncating into "P..." / "Mr." etc.
    MuiFormControl: {
      styleOverrides: {
        root: {
          minWidth: 120,
        },
      },
    },

    // ─── Select ───────────────────────────────────────────────────────
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        select: {
          // Prevent the selected value from truncating with ellipsis inside
          // very narrow containers – show at least the first few characters
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        },
      },
    },

    // ─── OutlinedInput ────────────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'box-shadow 0.2s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1976D2',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(25,118,210,0.12)',
          },
        },
      },
    },

    // ─── InputLabel ───────────────────────────────────────────────────
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.9375rem',
        },
        // Shrunk label (floated above the field) should never be clipped
        shrink: {
          overflow: 'visible',
          whiteSpace: 'nowrap',
        },
      },
    },
  },
});

export default theme;
