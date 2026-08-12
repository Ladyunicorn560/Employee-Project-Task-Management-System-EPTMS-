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
const DateRangeDisplay = ({ startDate, endDate, showIcon = true, isOverdue = false }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {showIcon && (
        <CalendarMonthRoundedIcon sx={{ fontSize: 16, color: isOverdue ? 'error.main' : 'text.disabled' }} />
      )}
      <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'} fontWeight={isOverdue ? 600 : 500}>
        {formatDate(startDate)}
      </Typography>
      <ArrowForwardRoundedIcon sx={{ fontSize: 12, color: isOverdue ? 'error.main' : 'text.disabled' }} />
      <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'} fontWeight={isOverdue ? 600 : 500}>
        {formatDate(endDate)}
      </Typography>
      {isOverdue && (
        <Typography
          variant="caption"
          sx={{
            color: 'error.main',
            fontWeight: 800,
            backgroundColor: '#FFF5F5',
            px: 0.75,
            py: 0.2,
            borderRadius: '4px',
            border: '1px solid',
            borderColor: 'error.light',
            textTransform: 'uppercase',
            fontSize: '0.62rem',
            letterSpacing: 0.5,
            ml: 0.5
          }}
        >
          Overdue
        </Typography>
      )}
    </Box>
  );
};

export default DateRangeDisplay;
