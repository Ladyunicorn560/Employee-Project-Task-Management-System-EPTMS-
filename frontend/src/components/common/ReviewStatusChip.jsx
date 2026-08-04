import { Chip } from '@mui/material';

/**
 * ReviewStatusChip
 * Visual status chip tags for task review steps.
 *
 * @param {string} status - Pending | Approved | Rejected | Changes Required
 * @param {string} size - small | medium
 */
const ReviewStatusChip = ({ status = 'Pending', size = 'small' }) => {
  let color = 'default';
  let label = status;

  switch (status?.toLowerCase()) {
    case 'approved':
      color = 'success';
      break;
    case 'rejected':
      color = 'error';
      break;
    case 'changes required':
    case 'changes_required':
      color = 'warning';
      label = 'Changes Required';
      break;
    case 'pending':
    default:
      color = 'info';
      label = 'Pending';
  }

  return (
    <Chip
      label={label}
      size={size}
      color={color}
      sx={{
        fontWeight: 700,
        borderRadius: 1.5,
        fontSize: size === 'small' ? '0.75rem' : '0.85rem',
      }}
    />
  );
};

export default ReviewStatusChip;
