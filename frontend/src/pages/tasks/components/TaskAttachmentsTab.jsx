import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Divider, Pagination, Alert, Grid, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';
import { toast } from 'react-toastify';

import AttachmentCard from './AttachmentCard';
import UploadAttachmentDialog from './UploadAttachmentDialog';
import SearchBar from '../../../components/common/SearchBar';
import EmptyState from '../../../components/ui/EmptyState';
import PageLoader from '../../../components/ui/PageLoader';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import AppButton from '../../../components/ui/AppButton';

import useAuth from '../../../hooks/useAuth';
import attachmentService from '../../../services/attachmentService';
import projectService from '../../../services/projectService';
import { ROLES } from '../../../constants/roles';

/**
 * TaskAttachmentsTab
 * Attachments tab panel inside TaskDetailsPage.
 * Displays uploaded task files, supports sorting, search filters, and file deletes.
 *
 * @param {object} task - Parent task details object
 */
const TaskAttachmentsTab = ({ task }) => {
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;

  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState('DESC'); // DESC = newest, ASC = oldest

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(6);

  // Modal Dialogs state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load project to verify PM ownership
  const [project, setProject] = useState(null);
  useEffect(() => {
    if (!task?.projectId) return;
    const fetchProj = async () => {
      try {
        const p = await projectService.getById(task.projectId);
        setProject(p);
      } catch (err) {
        console.error('Failed to load project details for attachment authorization:', err);
      }
    };
    fetchProj();
  }, [task?.projectId]);

  const isAdminOrPm = isAdmin || (isPM && project?.projectManager?.id === user?.id);

  const fetchAttachments = useCallback(async () => {
    if (!task?.id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await attachmentService.getByTaskId(task.id, {
        page,
        limit,
        search: search || undefined,
        sortBy: 'CreatedDate',
        sortOrder,
      });

      setAttachments(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load attachments:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [task?.id, page, limit, search, sortOrder]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortOrder(e.target.value);
    setPage(1);
  };

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await attachmentService.remove(deleteId);
      toast.success('File deleted successfully.');
      fetchAttachments();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete file.';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  return (
    <Box>
      {/* Filters & Actions Panel */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyBetween: 'center', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Grid container spacing={2} alignItems="center" sx={{ flex: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search attachments..."
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel id="attachment-sort-label">Sort Date</InputLabel>
              <Select
                labelId="attachment-sort-label"
                value={sortOrder}
                onChange={handleSortChange}
                label="Sort Date"
              >
                <MenuItem value="DESC">Newest First</MenuItem>
                <MenuItem value="ASC">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <AppButton
          variant="primary"
          startIcon={<AttachFileRoundedIcon />}
          onClick={() => setUploadOpen(true)}
          sx={{ flexShrink: 0 }}
        >
          Upload File
        </AppButton>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Main Files Display */}
      {loading ? (
        <PageLoader message="Loading attachments list..." />
      ) : error ? (
        <Alert severity="error">Failed to retrieve task attachments.</Alert>
      ) : attachments.length === 0 ? (
        <EmptyState
          title="No Attachments Uploaded"
          description="Upload project documents, screenshots, and deliverables."
          icon={AttachFileRoundedIcon}
          actionLabel={search ? "Clear Search" : undefined}
          onAction={search ? () => handleSearchChange('') : undefined}
        />
      ) : (
        <Box>
          <Grid container spacing={2}>
            {attachments.map((file) => (
              <Grid item xs={12} sm={6} key={file.id}>
                <AttachmentCard
                  attachment={file}
                  currentUserId={user?.id}
                  isAdminOrPm={isAdminOrPm}
                  onDelete={handleDeleteRequest}
                />
              </Grid>
            ))}
          </Grid>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Upload Dialog */}
      <UploadAttachmentDialog
        open={uploadOpen}
        taskId={task.id}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => {
          setUploadOpen(false);
          setPage(1);
          fetchAttachments();
        }}
      />

      {/* Deletion Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete File Attachment"
        message="Are you sure you want to delete this file metadata from the task? This action is permanent."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmColor="error"
        variant="delete"
        loading={deleteLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteId(null)}
      />
    </Box>
  );
};

export default TaskAttachmentsTab;
