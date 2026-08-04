import { Chip } from '@mui/material';

/**
 * PriorityChip
 * Renders standard colored priority badges.
 *
 * @param {string} priority - High | Medium | Low
 * @param {string} size - small | medium
 */
const PriorityChip = ({ priority = 'Low', size = 'small' }) => {
  let color = 'default';
  let label = priority;

  switch (priority?.toLowerCase()) {
    case 'high':
      color = 'error';
      break;
    case 'medium':
      color = 'warning';
      break;
    case 'low':
      color = 'info';
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      label={label}
      size={size}
      color={color}
      sx={{
        fontWeight: 600,
        textTransform: 'capitalize',
        borderRadius: 1.5,
        fontSize: size === 'small' ? '0.75rem' : '0.85rem',
      }}
    />
  );
};

export default PriorityChip;
