import { Box, Typography, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';

/**
 * EmptyState
 * Displayed when a list or table has no data to show.
 *
 * @param {string} title - Main heading (default: "No data found")
 * @param {string} description - Subtext message
 * @param {ReactNode} icon - Custom icon (default: InboxIcon)
 * @param {string} actionLabel - Optional action button label
 * @param {function} onAction - Optional action button handler
 */
const EmptyState = ({
  title = 'No data found',
  description = 'There is nothing to display here yet.',
  icon: Icon = InboxIcon,
  actionLabel,
  onAction,
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
          width: 80,
          height: 80,
          borderRadius: '50%',
          backgroundColor: 'primary.light',
          opacity: 0.12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          mb: 3,
        }}
      >
        <Box sx={{ position: 'absolute' }}>
          <Icon sx={{ fontSize: 40, color: 'primary.main', opacity: 1 / 0.12 * 0.5 }} />
        </Box>
      </Box>

      <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320, mb: actionLabel ? 3 : 0 }}>
        {description}
      </Typography>

      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction} size="medium">
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
