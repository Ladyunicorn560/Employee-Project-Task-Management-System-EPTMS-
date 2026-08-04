import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, MenuItem, Select,
  FormControl, InputLabel, TextField, IconButton, Typography, Divider, CircularProgress,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import DownloadForOfflineRoundedIcon from '@mui/icons-material/DownloadForOfflineRounded';
import { toast } from 'react-toastify';

import AppButton from '../../../components/ui/AppButton';
import ReportFilters from './ReportFilters';
import reportService from '../../../services/reportService';

/**
 * ExportDialog
 * Modal popup allowing users to filter, specify custom filename, format,
 * and download binary files locally.
 *
 * @param {boolean} open
 * @param {string} reportType - projects | employees | tasks | milestones | reviews | notifications
 * @param {string} title - Report title
 * @param {function} onClose
 */
const ExportDialog = ({ open, reportType, title, onClose }) => {
  const [format, setFormat] = useState('pdf');
  const [fileName, setFileName] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Dynamic filter values
  const [filters, setFilters] = useState({});

  const handleClose = () => {
    if (exportLoading) return;
    setFormat('pdf');
    setFileName('');
    setFilters({});
    onClose();
  };

  const handleExport = async (e) => {
    e.preventDefault();
    setExportLoading(true);
    try {
      // 1. Calculate filename fallback
      const cleanReportName = reportType.toLowerCase();
      const userFileName = fileName.trim() || `${cleanReportName}_report_${Date.now()}`;
      
      const extensionMap = { pdf: '.pdf', xlsx: '.xlsx', csv: '.csv' };
      const extension = extensionMap[format] || '.pdf';
      const completeFileName = userFileName.endsWith(extension) ? userFileName : `${userFileName}${extension}`;

      // 2. Query binary stream blob from backend reports service
      const blob = await reportService.export(reportType, format, filters);

      // 3. Initiate browser auto-download stream using temporary object URLs
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', completeFileName);
      document.body.appendChild(link);
      link.click();
      
      // Clean up DOM references
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`${completeFileName} downloaded successfully.`);
      handleClose();
    } catch (err) {
      console.error('Failed to export document:', err);
      // Attempt to read JSON error message if server returned JSON error inside blob
      if (err?.response?.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const parsed = JSON.parse(text);
          toast.error(parsed?.message || 'Failed to download report.');
        } catch {
          toast.error('Export failed. Network error or invalid query bounds.');
        }
      } else {
        toast.error(err?.response?.data?.message || 'Export failed. Network error or server offline.');
      }
    } finally {
      setExportLoading(false);
    }
  };

  const extensionMap = { pdf: '.pdf', xlsx: '.xlsx', csv: '.csv' };
  const currentExtension = extensionMap[format] || '.pdf';
  const previewName = fileName.trim()
    ? fileName.trim().endsWith(currentExtension)
      ? fileName.trim()
      : `${fileName.trim()}${currentExtension}`
    : `${reportType}_report_${currentExtension}`;

  return (
    <Dialog
      open={open}
      onClose={exportLoading ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Export: {title}
        <IconButton onClick={handleClose} disabled={exportLoading} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleExport} noValidate>
        <DialogContent sx={{ p: 3, pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* File configurations */}
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <TextField
                fullWidth
                label="Custom Filename"
                size="small"
                placeholder={`${reportType}_report`}
                disabled={exportLoading}
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                helperText={`Preview: ${previewName}`}
              />
            </Grid>
            <Grid item xs={4}>
              <FormControl size="small" fullWidth disabled={exportLoading}>
                <InputLabel id="export-format-label">Select Format</InputLabel>
                <Select
                  labelId="export-format-label"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  label="Select Format"
                >
                  <MenuItem value="pdf">PDF Document</MenuItem>
                  <MenuItem value="xlsx">Excel Sheet</MenuItem>
                  <MenuItem value="csv">CSV Spread</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Divider />
          <Typography variant="subtitle2" fontWeight={700}>Customize Filters</Typography>

          {/* Dynamic Filters Form block */}
          <ReportFilters
            reportType={reportType}
            filters={filters}
            onFilterChange={setFilters}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1.5, gap: 1 }}>
          <AppButton variant="outlined" onClick={handleClose} disabled={exportLoading} fullWidth>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            type="submit"
            loading={exportLoading}
            startIcon={!exportLoading && <DownloadForOfflineRoundedIcon />}
            fullWidth
          >
            {exportLoading ? 'Exporting...' : 'Download File'}
          </AppButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ExportDialog;
