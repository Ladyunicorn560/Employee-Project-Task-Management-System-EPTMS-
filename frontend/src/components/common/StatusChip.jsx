import { Chip } from '@mui/material';

/**
 * StatusChip
 * Standardized status badge chip with consistent enterprise color mapping.
 *
 * @param {string} status - Status name (e.g. Active, Inactive, Completed, In Progress, Blocked, Suspended)
 * @param {string} size - MUI Chip size (small | medium)
 * @param {object} sx - Extra styling overrides
 */
const StatusChip = ({ status = '', size = 'small', sx = {} }) => {
  const statusStr = String(status).trim();
  const lower = statusStr.toLowerCase();

  let color = 'default';
  let variant = 'outlined';

  // Status mapping
  if (['active', 'completed', 'success', 'done', 'approved'].includes(lower)) {
    color = 'success';
    variant = 'filled';
  } else if (['inactive', 'suspended', 'cancelled', 'deleted', 'blocked', 'error'].includes(lower)) {
    color = 'error';
    variant = 'filled';
  } else if (['in progress', 'ongoing', 'planning', 'started', 'under review', 'ready for review'].includes(lower)) {
    color = 'primary';
    variant = 'outlined';
  } else if (['on hold', 'pending', 'waiting', 'waiting for information', 'warning'].includes(lower)) {
    color = 'warning';
    variant = 'outlined';
  }

  return (
    <Chip
      label={statusStr || 'Unknown'}
      color={color}
      variant={variant}
      size={size}
      sx={{
        fontWeight: 600,
        fontSize: size === 'small' ? '0.72rem' : '0.8rem',
        borderRadius: 1.5,
        textTransform: 'capitalize',
        px: 0.5,
        ...sx,
      }}
    />
  );
};

export default StatusChip;
