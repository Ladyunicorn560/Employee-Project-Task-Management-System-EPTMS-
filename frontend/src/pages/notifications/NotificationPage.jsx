import { useState, useEffect, useCallback } from 'react';
import { Box, Grid, MenuItem, Select, FormControl, InputLabel, Divider, Pagination, Alert } from '@mui/material';
import DraftsRoundedIcon from '@mui/icons-material/DraftsRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import NotificationCard from './NotificationCard';
import NotificationDetailsDialog from './NotificationDetailsDialog';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';
import PageLoader from '../../components/ui/PageLoader';
import AppButton from '../../components/ui/AppButton';

import notificationService from '../../services/notificationService';

/**
 * NotificationPage
 * Complete list feed and details view for system notifications.
 */
const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' = All, 'unread' = Unread, 'read' = Read
  const [typeFilter, setTypeFilter] = useState(''); // '' = All, other = specific type

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(10);

  // Modal Dialogs state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const isReadParam =
        statusFilter === 'read' ? true : statusFilter === 'unread' ? false : undefined;

      const res = await notificationService.getAll({
        page,
        limit,
        search: search || undefined,
        isRead: isReadParam,
        notificationType: typeFilter || undefined,
        sortBy: 'CreatedDate',
        sortOrder: 'DESC',
      });

      setNotifications(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load notifications list:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleTypeFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1);
  };

  const handleCardClick = async (notif) => {
    setSelectedNotif(notif);
    setDetailsOpen(true);
    // If clicked unread notification, mark it as read immediately
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.id);
        // Update local status immediately
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        // Refresh navbar notification counts if listening
        window.dispatchEvent(new Event('unread-notifications-update'));
      } catch (err) {
        console.error('Failed to mark notification read automatically:', err);
      }
    }
  };

  const handleMarkAsReadSingle = async (id) => {
    try {
      await notificationService.markAsRead(id);
      toast.success('Notification marked as read.');
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      window.dispatchEvent(new Event('unread-notifications-update'));
    } catch (err) {
      toast.error('Failed to update notification read status.');
    }
  };

  const handleMarkAllRead = async () => {
    setMarkAllLoading(true);
    try {
      await notificationService.markAllAsRead();
      toast.success('All notifications marked as read.');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      window.dispatchEvent(new Event('unread-notifications-update'));
    } catch (err) {
      toast.error('Failed to mark all as read.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await notificationService.remove(deleteId);
      toast.success('Notification deleted successfully.');
      fetchNotifications();
      window.dispatchEvent(new Event('unread-notifications-update'));
    } catch (err) {
      toast.error('Failed to delete notification.');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <Box>
      <PageHeader
        title="Notification Center"
        description="Monitor system events, assignments, task updates and workflow actions."
        breadcrumbItems={[{ label: 'Notifications' }]}
        action={
          hasUnread && (
            <AppButton
              variant="outlined"
              startIcon={<DraftsRoundedIcon />}
              onClick={handleMarkAllRead}
              loading={markAllLoading}
            >
              Mark All Read
            </AppButton>
          )
        }
      />

      {/* Filters row */}
      <Box sx={{ mb: 3.5 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5} md={4}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search notifications..."
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={3} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel id="notif-status-filter-label">Read Status</InputLabel>
              <Select
                labelId="notif-status-filter-label"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Read Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="unread">Unread Only</MenuItem>
                <MenuItem value="read">Read Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel id="notif-type-filter-label">Notification Type</InputLabel>
              <Select
                labelId="notif-type-filter-label"
                value={typeFilter}
                onChange={handleTypeFilterChange}
                label="Notification Type"
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="Task Assigned">Task Assigned</MenuItem>
                <MenuItem value="Review Request">Review Request</MenuItem>
                <MenuItem value="Review Approved">Review Approved</MenuItem>
                <MenuItem value="Review Rejected">Review Rejected</MenuItem>
                <MenuItem value="Review Changes Required">Review Changes Required</MenuItem>
                <MenuItem value="Project Created">Project Created</MenuItem>
                <MenuItem value="Milestone Created">Milestone Created</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      <Divider sx={{ mb: 3.5 }} />

      {/* Notifications List feed */}
      {loading && notifications.length === 0 ? (
        <PageLoader message="Loading notifications..." />
      ) : error ? (
        <Alert severity="error">Failed to retrieve notifications feed.</Alert>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No Notifications Found"
          description={
            search || statusFilter || typeFilter
              ? 'Try modifying your filters or search parameters.'
              : 'Your notification center is completely clear.'
          }
          icon={NotificationsActiveRoundedIcon}
          actionLabel={search || statusFilter || typeFilter ? 'Clear Filters' : undefined}
          onAction={
            search || statusFilter || typeFilter
              ? () => {
                  setSearch('');
                  setStatusFilter('');
                  setTypeFilter('');
                  setPage(1);
                }
              : undefined
          }
        />
      ) : (
        <Box>
          {notifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkRead={handleMarkAsReadSingle}
              onDelete={handleDeleteRequest}
              onClick={handleCardClick}
            />
          ))}

          {/* Pagination controls */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3.5 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, val) => setPage(val)}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Details View Modal */}
      <NotificationDetailsDialog
        open={detailsOpen}
        notification={selectedNotif}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedNotif(null);
        }}
      />

      {/* Deletion Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Notification"
        message="Are you sure you want to delete this notification? This action cannot be undone."
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

export default NotificationPage;
