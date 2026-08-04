import { Box, LinearProgress, Typography } from '@mui/material';

/**
 * ProgressBar
 * Standardized progress bar component for projects and tasks.
 *
 * @param {number} value - Progress percentage (0 to 100)
 * @param {string} color - Bar color (primary | secondary | success | warning | error | info)
 * @param {boolean} showLabel - Whether to display the percentage text label
 * @param {number} height - Height of the progress track in px (default: 8)
 */
const ProgressBar = ({ value = 0, color = 'primary', showLabel = true, height = 8 }) => {
  const roundedValue = Math.round(Number(value || 0));
  const clampedValue = Math.max(0, Math.min(100, roundedValue));

  // Determine standard colors for progress levels if no explicit color is set
  let progressColor = color;
  if (color === 'auto') {
    if (clampedValue < 30) progressColor = 'error';
    else if (clampedValue < 70) progressColor = 'warning';
    else progressColor = 'success';
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
      <Box sx={{ flex: 1 }}>
        <LinearProgress
          variant="determinate"
          value={clampedValue}
          color={progressColor}
          sx={{
            height,
            borderRadius: height / 2,
            backgroundColor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              borderRadius: height / 2,
            },
          }}
        />
      </Box>
      {showLabel && (
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          sx={{ minWidth: 35, textAlign: 'right' }}
        >
          {clampedValue}%
        </Typography>
      )}
    </Box>
  );
};

export default ProgressBar;
