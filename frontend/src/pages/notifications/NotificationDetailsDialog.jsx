import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box,
  Typography, IconButton, Divider, Chip,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FolderOpenRoundedIcon from '@mui/icons-material/FolderOpenRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';

import AppButton from '../../components/ui/AppButton';
import { getNotificationIcon } from './NotificationCard';
import { ROUTES } from '../../constants/routes';
import { formatDateTime } from '../../utils/dateUtils';

/**
 * NotificationDetailsDialog
 * Detailed modal view for single notifications with direct entity link navigation.
 *
 * @param {boolean} open
 * @param {object} notification
 * @param {function} onClose
 */
const NotificationDetailsDialog = ({ open, notification, onClose }) => {
  const navigate = useNavigate();
  if (!notification) return null;

  const senderName = notification.triggeredBy
    ? `${notification.triggeredBy.firstName} ${notification.triggeredBy.lastName}`
    : 'System / Automations';

  const handleNavigateEntity = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Notification Details
        <IconButton onClick={onClose} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header Icon + Type */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {getNotificationIcon(notification.notificationType)}
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: 'capitalize' }}>
              {notification.notificationType}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Sent: {formatDateTime(notification.createdDate)}
            </Typography>
          </Box>
        </Box>

        <Divider />

        {/* Message body */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
            MESSAGE MESSAGE
          </Typography>
          <Typography variant="body2" color="text.primary" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {notification.message}
          </Typography>
        </Box>

        {/* Sent By metadata */}
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
            TRIGGERED BY
          </Typography>
          <Typography variant="body2" color="text.primary" fontWeight={600}>
            {senderName}
          </Typography>
          {notification.triggeredBy?.email && (
            <Typography variant="caption" color="text.secondary">
              {notification.triggeredBy.email}
            </Typography>
          )}
        </Box>

        {/* Delivery channels */}
        {notification.deliveryChannel && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
              DELIVERY CHANNEL
            </Typography>
            <Chip label={notification.deliveryChannel} size="small" variant="outlined" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.62rem' }} />
          </Box>
        )}

        {/* Clickable links to Project / Task if available */}
        {(notification.projectId || notification.taskId) && (
          <>
            <Divider sx={{ my: 1 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
              RELATED WORKFLOW ENTITIES
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 0.5 }}>
              {notification.projectId && (
                <AppButton
                  variant="outlined"
                  size="small"
                  startIcon={<FolderOpenRoundedIcon />}
                  onClick={() => handleNavigateEntity(`${ROUTES.PROJECTS}/${notification.projectId}`)}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Project: {notification.projectName || 'View Details'}
                </AppButton>
              )}
              {notification.taskId && (
                <AppButton
                  variant="outlined"
                  size="small"
                  startIcon={<TaskAltRoundedIcon />}
                  onClick={() => handleNavigateEntity(`${ROUTES.TASKS}/${notification.taskId}`)}
                  sx={{ justifyContent: 'flex-start', textTransform: 'none' }}
                >
                  Task: {notification.taskTitle || 'View Details'}
                </AppButton>
              )}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 0 }}>
        <AppButton variant="primary" onClick={onClose} fullWidth>
          Close
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationDetailsDialog;
