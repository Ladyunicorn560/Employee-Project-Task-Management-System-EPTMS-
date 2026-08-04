import { Box, Typography, Button } from '@mui/material';
import WifiTetheringErrorRoundedIcon from '@mui/icons-material/WifiTetheringErrorRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';

/**
 * ErrorState
 * Displayed when an API request fails inside a component section.
 * Not a full-page error — use Error404Page etc. for full-page errors.
 *
 * @param {string} title - Error heading
 * @param {string} message - Error detail / actionable advice
 * @param {function} onRetry - Retry handler
 */
const ErrorState = ({
  title = 'Failed to load data',
  message = 'Something went wrong while loading this content. Check your connection and try again.',
  onRetry,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 6, md: 10 },
        px: 4,
        textAlign: 'center',
      }}
    >
      {/* Icon Container */}
      <Box
        sx={{
          position: 'relative',
          width: 100,
          height: 100,
          mb: 3,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(211,47,47,0.10) 0%, rgba(211,47,47,0.03) 70%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(211,47,47,0.09)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <WifiTetheringErrorRoundedIcon sx={{ fontSize: 34, color: 'error.main' }} />
        </Box>
      </Box>

      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 360, lineHeight: 1.75, mb: onRetry ? 3.5 : 0 }}
      >
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="outlined"
          color="error"
          onClick={onRetry}
          size="medium"
          startIcon={<RefreshRoundedIcon />}
          sx={{ px: 3.5, borderRadius: 2.5 }}
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};

export default ErrorState;
