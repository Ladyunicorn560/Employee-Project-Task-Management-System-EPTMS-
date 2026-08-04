import { Box, Typography } from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

/**
 * HoursDisplay
 * Renders estimated hours versus actual hours with a clock icon.
 *
 * @param {number} estimated - Estimated time in hours
 * @param {number} actual - Actual logged time in hours
 * @param {boolean} showLabel - Display detail headers
 */
const HoursDisplay = ({ estimated = 0, actual = 0, showLabel = true }) => {
  const estNum = Number(estimated || 0);
  const actNum = Number(actual || 0);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AccessTimeRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Typography variant="body2" color="text.primary" fontWeight={600}>
          {actNum}h
        </Typography>
        <Typography variant="body2" color="text.secondary">
          logged
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mx: 0.25 }}>
          /
        </Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>
          {estNum}h
        </Typography>
        <Typography variant="body2" color="text.secondary">
          est.
        </Typography>
      </Box>
    </Box>
  );
};

export default HoursDisplay;
