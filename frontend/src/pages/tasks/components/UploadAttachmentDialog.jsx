import { useState, useRef } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box,
  Typography, IconButton, Button,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import { toast } from 'react-toastify';

import AppButton from '../../../components/ui/AppButton';
import attachmentService from '../../../services/attachmentService';
import { formatBytes } from './AttachmentCard';

const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx',
  '.png', '.jpg', '.jpeg', '.gif', '.zip', '.txt', '.csv'
];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

/**
 * UploadAttachmentDialog
 * Handles uploading file metadata. Checks extension limits and size bounds.
 *
 * @param {boolean} open
 * @param {number} taskId
 * @param {function} onClose
 * @param {function} onSuccess
 */
const UploadAttachmentDialog = ({ open, taskId, onClose, onSuccess }) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error(`Invalid extension. Allowed file types: ${ALLOWED_EXTENSIONS.join(', ')}`);
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(`File size exceeds 10MB limit. Selected: ${formatBytes(file.size)}`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      const payload = {
        fileName: selectedFile.name,
        filePath: `/uploads/tasks/${taskId}/${Date.now()}-${selectedFile.name}`,
        fileSize: selectedFile.size,
        fileType: selectedFile.type || 'application/octet-stream',
      };

      await attachmentService.uploadInTask(taskId, payload);
      toast.success('File uploaded successfully.');
      handleClose();
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to upload file.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Upload File
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ p: 3, pt: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {/* File select drop zone style */}
          <Box
            onClick={() => !isSubmitting && fileInputRef.current?.click()}
            sx={{
              width: '100%',
              py: 4,
              border: '2px dashed',
              borderColor: selectedFile ? 'primary.main' : 'divider',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              backgroundColor: selectedFile ? 'rgba(25,118,210,0.02)' : 'transparent',
              '&:hover': {
                borderColor: isSubmitting ? 'divider' : 'primary.main',
              },
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            <UploadFileRoundedIcon sx={{ fontSize: 44, color: selectedFile ? 'primary.main' : 'text.disabled', mb: 1 }} />
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              {selectedFile ? 'Change Selected File' : 'Browse Local Files'}
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5 }}>
              Max size: 10MB. Allowed: PDF, Images, Office, Zip, TXT, CSV.
            </Typography>
          </Box>

          {/* Selected File Details */}
          {selectedFile && (
            <Box sx={{ width: '100%', p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={600} noWrap>
                  {selectedFile.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatBytes(selectedFile.size)}
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setSelectedFile(null)} disabled={isSubmitting}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1.5, gap: 1 }}>
          <AppButton variant="outlined" onClick={handleClose} disabled={isSubmitting} fullWidth>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            type="submit"
            loading={isSubmitting}
            disabled={!selectedFile}
            fullWidth
          >
            Upload File
          </AppButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UploadAttachmentDialog;
