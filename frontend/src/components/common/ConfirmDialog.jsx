import {
  Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button, IconButton, Box, Typography, CircularProgress,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

/**
 * ConfirmDialog
 * Generic reusable confirmation dialog.
 * Used for logout, delete, and any destructive actions.
 *
 * @param {boolean} open - Dialog visibility
 * @param {string} title - Dialog heading
 * @param {string} message - Descriptive message
 * @param {string} confirmLabel - Confirm button text (default: "Confirm")
 * @param {string} cancelLabel - Cancel button text (default: "Cancel")
 * @param {'error'|'warning'|'primary'} confirmColor - Confirm button color
 * @param {'delete'|'logout'|'warning'|'default'} variant - Icon variant
 * @param {boolean} loading - Loading state for confirm button
 * @param {function} onConfirm - Confirm callback
 * @param {function} onCancel - Cancel callback
 */
const ICONS = {
  delete: { Icon: DeleteOutlineRoundedIcon, color: '#D32F2F', bg: '#FFEBEE' },
  logout: { Icon: LogoutRoundedIcon, color: '#ED6C02', bg: '#FFF3E0' },
  warning: { Icon: WarningAmberRoundedIcon, color: '#ED6C02', bg: '#FFF3E0' },
  default: { Icon: HelpOutlineRoundedIcon, color: '#1976D2', bg: '#E3F2FD' },
};

const ConfirmDialog = ({
  open = false,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmColor = 'error',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const { Icon, color, bg } = ICONS[variant] || ICONS.default;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, p: 0.5 },
      }}
    >
      {/* Close Button */}
      <IconButton
        onClick={onCancel}
        disabled={loading}
        size="small"
        sx={{
          position: 'absolute',
          right: 12,
          top: 12,
          color: 'text.disabled',
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      <DialogTitle sx={{ pt: 3, pb: 1, pr: 6 }}>
        {/* Icon */}
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <Icon sx={{ color, fontSize: 26 }} />
        </Box>
        <Typography variant="h6" fontWeight={700} color="text.primary">
          {title}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: 0.5, pb: 1 }}>
        <DialogContentText variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          {message}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onCancel}
          disabled={loading}
          fullWidth
          sx={{ color: 'text.secondary', borderColor: 'divider' }}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          color={confirmColor}
          onClick={onConfirm}
          disabled={loading}
          fullWidth
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Please wait...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;
