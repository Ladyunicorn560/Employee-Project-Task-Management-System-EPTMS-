import { Box, Typography, Button } from '@mui/material';
import InboxRoundedIcon from '@mui/icons-material/InboxRounded';

/**
 * EmptyState
 * Displayed when a list or table has no records at all.
 * Use NoData when a search/filter yields zero results.
 *
 * @param {string} title - Main heading
 * @param {string} description - Helper message
 * @param {ComponentType} icon - MUI icon component (default: InboxRoundedIcon)
 * @param {string} actionLabel - Primary action button label
 * @param {function} onAction - Primary action handler
 */
const EmptyState = ({
  title = 'Nothing here yet',
  description = 'Get started by creating your first record.',
  icon: Icon = InboxRoundedIcon,
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
        py: { xs: 6, md: 10 },
        px: 4,
        textAlign: 'center',
      }}
    >
      {/* Illustrated icon container */}
      <Box
        sx={{
          position: 'relative',
          width: 100,
          height: 100,
          mb: 3,
        }}
      >
        {/* Outer glow ring */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(25,118,210,0.10) 0%, rgba(25,118,210,0.04) 70%)',
          }}
        />
        {/* Inner circle */}
        <Box
          sx={{
            position: 'absolute',
            inset: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(25,118,210,0.09)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon sx={{ fontSize: 34, color: 'primary.main' }} />
        </Box>
      </Box>

      <Typography
        variant="h6"
        fontWeight={700}
        color="text.primary"
        sx={{ mb: 1 }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 360, lineHeight: 1.75, mb: actionLabel ? 3.5 : 0 }}
      >
        {description}
      </Typography>

      {actionLabel && onAction && (
        <Button
          variant="contained"
          color="primary"
          onClick={onAction}
          size="medium"
          sx={{ px: 3.5, borderRadius: 2.5 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
