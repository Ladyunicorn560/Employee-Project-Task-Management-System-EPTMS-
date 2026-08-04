import { Box, Card, Typography, Tooltip, IconButton, Avatar } from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import AssignmentIndRoundedIcon from '@mui/icons-material/AssignmentIndRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DraftsRoundedIcon from '@mui/icons-material/DraftsRounded';

import { formatDate } from '../../utils/dateUtils';

// Helper to determine icon based on notificationType
const getNotificationIcon = (type = '') => {
  const lower = type.toLowerCase();
  if (lower.includes('assigned')) {
    return <AssignmentIndRoundedIcon sx={{ color: 'primary.main' }} />;
  }
  if (lower.includes('review')) {
    return <RateReviewRoundedIcon sx={{ color: 'warning.main' }} />;
  }
  if (lower.includes('milestone')) {
    return <FlagRoundedIcon sx={{ color: 'secondary.main' }} />;
  }
  if (lower.includes('info') || lower.includes('alert')) {
    return <InfoRoundedIcon sx={{ color: 'info.main' }} />;
  }
  return <NotificationsRoundedIcon sx={{ color: 'text.secondary' }} />;
};

/**
 * NotificationCard
 * Renders individual notification items with read/unread statuses.
 *
 * @param {object} notification
 * @param {function} onMarkRead
 * @param {function} onDelete
 * @param {function} onClick
 */
const NotificationCard = ({ notification, onMarkRead, onDelete, onClick }) => {
  const isUnread = !notification.isRead;

  const handleMarkRead = (e) => {
    e.stopPropagation();
    onMarkRead(notification.id);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(notification.id);
  };

  return (
    <Card
      onClick={() => onClick(notification)}
      variant="outlined"
      sx={{
        p: 2,
        mb: 1.5,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 2.5,
        backgroundColor: isUnread ? 'rgba(25, 118, 210, 0.03)' : 'background.paper',
        borderColor: isUnread ? 'primary.light' : 'divider',
        transition: 'all 0.15s ease',
        '&:hover': {
          backgroundColor: isUnread ? 'rgba(25, 118, 210, 0.05)' : 'action.hover',
          borderColor: isUnread ? 'primary.main' : 'text.disabled',
        },
      }}
    >
      <Avatar
        sx={{
          bgcolor: isUnread ? 'rgba(25, 118, 210, 0.1)' : 'action.selected',
          width: 40,
          height: 40,
        }}
      >
        {getNotificationIcon(notification.notificationType)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
          <Typography
            variant="subtitle2"
            fontWeight={isUnread ? 700 : 600}
            color={isUnread ? 'text.primary' : 'text.secondary'}
            sx={{ textTransform: 'capitalize' }}
          >
            {notification.notificationType}
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {formatDate(notification.createdDate)}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          color={isUnread ? 'text.primary' : 'text.secondary'}
          noWrap
          sx={{ fontWeight: isUnread ? 500 : 400 }}
        >
          {notification.message}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {isUnread && (
          <Tooltip title="Mark as read">
            <IconButton size="small" onClick={handleMarkRead} color="primary">
              <DraftsRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Tooltip title="Delete notification">
          <IconButton size="small" color="error" onClick={handleDelete}>
            <DeleteOutlineRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
};

export default NotificationCard;
export { getNotificationIcon };
