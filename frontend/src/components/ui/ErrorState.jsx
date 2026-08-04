import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * ErrorState
 * Displayed when an API call fails inside a component (not a full-page error).
 *
 * @param {string} title - Error heading
 * @param {string} message - Error detail message
 * @param {function} onRetry - Optional retry handler
 */
const ErrorState = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content. Please try again.',
  onRetry,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: 'error.light',
          opacity: 0.15,
          position: 'relative',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ErrorOutlineIcon
          sx={{
            position: 'absolute',
            fontSize: 40,
            color: 'error.main',
            opacity: 1 / 0.15 * 0.6,
          }}
        />
      </Box>

      <Typography variant="h6" color="error.main" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 340, mb: onRetry ? 3 : 0 }}>
        {message}
      </Typography>

      {onRetry && (
        <Button
          variant="outlined"
          color="error"
          onClick={onRetry}
          startIcon={<RefreshIcon />}
          size="medium"
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};

export default ErrorState;
