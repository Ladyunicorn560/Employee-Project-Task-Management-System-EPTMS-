import { Box, Typography } from '@mui/material';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { formatDate } from '../../utils/dateUtils';

/**
 * DateRangeDisplay
 * Renders two formatted dates representing a timeline range.
 *
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @param {boolean} showIcon - Displays a leading calendar icon (default: true)
 */
const DateRangeDisplay = ({ startDate, endDate, showIcon = true }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {showIcon && (
        <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
      )}
      <Typography variant="body2" color="text.primary" fontWeight={500}>
        {formatDate(startDate)}
      </Typography>
      <ArrowForwardRoundedIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
      <Typography variant="body2" color="text.primary" fontWeight={500}>
        {formatDate(endDate)}
      </Typography>
    </Box>
  );
};

export default DateRangeDisplay;
