import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * LoadingSpinner
 * Inline circular loading indicator.
 *
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} message - Optional label below spinner
 * @param {string} color - MUI color prop (default: 'primary')
 */
const LoadingSpinner = ({ size = 'md', message, color = 'primary' }) => {
  const sizes = { sm: 24, md: 40, lg: 56 };
  const px = sizes[size] || sizes.md;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={1.5}
    >
      <CircularProgress size={px} color={color} thickness={4} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
