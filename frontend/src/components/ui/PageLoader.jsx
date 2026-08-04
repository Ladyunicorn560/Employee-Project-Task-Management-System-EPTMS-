import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * PageLoader
 * Full-viewport centered loading screen.
 * Shown while checking initial auth state or loading page-level data.
 *
 * @param {string} message - Loading message (default: "Loading...")
 */
const PageLoader = ({ message = 'Loading...' }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
        zIndex: 9999,
        gap: 3,
      }}
    >
      {/* Brand logo area */}
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 1,
          boxShadow: '0 8px 24px rgba(25,118,210,0.35)',
        }}
      >
        <Typography
          variant="h5"
          sx={{ color: '#fff', fontWeight: 800, letterSpacing: '-0.5px' }}
        >
          E
        </Typography>
      </Box>

      <CircularProgress size={36} color="primary" thickness={4} />

      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default PageLoader;
