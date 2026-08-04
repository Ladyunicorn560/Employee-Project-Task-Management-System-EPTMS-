import { Box } from '@mui/material';
import AppButton from '../ui/AppButton';

/**
 * FormActions
 * Reusable layout row containing cancel and submit action buttons.
 *
 * @param {boolean} loading - Displays loading animation on the primary action button
 * @param {string} submitLabel - Labels the primary submit action button (default: "Save Changes")
 * @param {string} cancelLabel - Labels the secondary back/cancel button (default: "Cancel")
 * @param {function} onCancel - Triggered when the secondary button is pressed
 * @param {boolean} submitDisabled - Explicitly disables the primary action button
 */
const FormActions = ({
  loading = false,
  submitLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  onCancel,
  submitDisabled = false,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2,
        mt: 4,
        pt: 2.5,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <AppButton
        variant="outlined"
        onClick={onCancel}
        disabled={loading}
        sx={{ minWidth: 100 }}
      >
        {cancelLabel}
      </AppButton>
      <AppButton
        id="form-submit-btn"
        type="submit"
        variant="primary"
        loading={loading}
        disabled={submitDisabled}
        sx={{ minWidth: 130 }}
      >
        {submitLabel}
      </AppButton>
    </Box>
  );
};

export default FormActions;
