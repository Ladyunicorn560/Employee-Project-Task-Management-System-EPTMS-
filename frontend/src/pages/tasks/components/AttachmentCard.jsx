import { Card, CardContent, Box, Typography, Tooltip, IconButton } from '@mui/material';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import ImageRoundedIcon from '@mui/icons-material/ImageRounded';
import TableChartRoundedIcon from '@mui/icons-material/TableChartRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import FolderZipRoundedIcon from '@mui/icons-material/FolderZipRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import DownloadForOfflineRoundedIcon from '@mui/icons-material/DownloadForOfflineRounded';

import { formatDateTime } from '../../../utils/dateUtils';

// Helper to format file size in bytes to human readable string (KB/MB)
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Helper to return correct Icon component based on file extension
const getFileIcon = (fileName = '') => {
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  switch (ext) {
    case '.pdf':
      return <PictureAsPdfRoundedIcon sx={{ fontSize: 32, color: '#D32F2F' }} />;
    case '.png':
    case '.jpg':
    case '.jpeg':
    case '.gif':
      return <ImageRoundedIcon sx={{ fontSize: 32, color: '#2E7D32' }} />;
    case '.xls':
    case '.xlsx':
    case '.csv':
      return <TableChartRoundedIcon sx={{ fontSize: 32, color: '#1B5E20' }} />;
    case '.doc':
    case '.docx':
      return <DescriptionRoundedIcon sx={{ fontSize: 32, color: '#1565C0' }} />;
    case '.zip':
      return <FolderZipRoundedIcon sx={{ fontSize: 32, color: '#F57C00' }} />;
    default:
      return <InsertDriveFileRoundedIcon sx={{ fontSize: 32, color: 'text.secondary' }} />;
  }
};

/**
 * AttachmentCard
 * Renders file card with size, extension icons, uploaded employee info,
 * and download/delete controls.
 *
 * @param {object} attachment
 * @param {number} currentUserId
 * @param {boolean} isAdminOrPm - Permissions override
 * @param {function} onDelete - Delete callback
 */
const AttachmentCard = ({ attachment, currentUserId, isAdminOrPm, onDelete }) => {
  const uploader = attachment.uploader || {};
  const isOwner = uploader.id === currentUserId;
  const canDelete = isOwner || isAdminOrPm;

  const uploaderName = uploader.firstName ? `${uploader.firstName} ${uploader.lastName}` : 'System';

  const handleDownload = () => {
    // Mock download/open in new window
    toast.info(`Downloading file: ${attachment.fileName}`);
    window.open(attachment.filePath || '#', '_blank');
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: 2.5, mb: 1.5, border: '1px solid rgba(0,0,0,0.08)', transition: 'all 0.15s ease', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.04)', borderColor: 'primary.light' } }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
        {getFileIcon(attachment.fileName)}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ color: 'text.primary' }}>
            {attachment.fileName}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {formatBytes(attachment.fileSize)}
            </Typography>
            <Typography variant="caption" color="text.disabled">•</Typography>
            <Typography variant="caption" color="text.secondary">
              By {uploaderName}
            </Typography>
            <Typography variant="caption" color="text.disabled">•</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDateTime(attachment.createdDate)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Download/Open file">
            <IconButton size="small" onClick={handleDownload} color="primary">
              <DownloadForOfflineRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {canDelete && (
            <Tooltip title="Delete file">
              <IconButton size="small" color="error" onClick={() => onDelete(attachment.id)}>
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default AttachmentCard;
export { getFileIcon, formatBytes };
