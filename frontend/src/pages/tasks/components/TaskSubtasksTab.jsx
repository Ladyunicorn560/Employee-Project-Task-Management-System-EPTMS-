import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Tooltip, IconButton, Typography, Grid, Card, CardContent, Checkbox } from '@mui/material';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import { toast } from 'react-toastify';

import SearchBar from '../../../components/common/SearchBar';
import DataTable from '../../../components/tables/DataTable';
import StatusChip from '../../../components/common/StatusChip';
import PriorityChip from '../../../components/common/PriorityChip';
import HoursDisplay from '../../../components/common/HoursDisplay';
import AppButton from '../../../components/ui/AppButton';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import SubtaskDialog from './SubtaskDialog';

import useAuth from '../../../hooks/useAuth';
import subtaskService from '../../../services/subtaskService';
import projectService from '../../../services/projectService';
import { ROLES } from '../../../constants/roles';
import { formatDate } from '../../../utils/dateUtils';

/**
 * TaskSubtasksTab
 * Real interactive subtasks module tab inside TaskDetailsPage.
 * Displays list, progress hours stats, and triggers create/edit/delete modals.
 *
 * @param {object} task - Complete parent task details object
 */
const TaskSubtasksTab = ({ task }) => {
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;

  const [subtasks, setSubtasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  // Project owner verification (PMs can only modify if they manage parent project)
  const [project, setProject] = useState(null);
  useEffect(() => {
    if (!task?.projectId) return;
    const fetchProj = async () => {
      try {
        const p = await projectService.getById(task.projectId);
        setProject(p);
      } catch (err) {
        console.error('Failed to load project details for subtask authorization:', err);
      }
    };
    fetchProj();
  }, [task?.projectId]);

  const canManageSubtasks = isAdmin || (isPM && project?.projectManager?.id === user?.id);
  const canEmployeeEdit = isEmployee && (task.assignedEmployee?.id === user?.id);
  const canUserEdit = canManageSubtasks || canEmployeeEdit;

  // Dialog Modals State
  const [dialogState, setDialogState] = useState({ open: false, subtask: null });
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch list of subtasks
  const fetchSubtasks = useCallback(async () => {
    if (!task?.id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await subtaskService.getByTaskId(task.id, {
        page: page + 1,
        limit: pageSize,
        search: search || undefined,
      });
      setSubtasks(res.data || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load task subtasks:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [task?.id, page, pageSize, search]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  // Totals stats calculation
  const stats = useMemo(() => {
    const totalEst = subtasks.reduce((sum, item) => sum + Number(item.estimatedHours || 0), 0);
    const totalAct = subtasks.reduce((sum, item) => sum + Number(item.actualHours || 0), 0);
    const completedCount = subtasks.filter((item) => item.status === 'Completed' || item.isCompleted).length;
    return { totalEst, totalAct, completedCount };
  }, [subtasks]);

  // Quick toggle completion checkbox
  const handleToggleComplete = async (row) => {
    if (!canUserEdit) {
      toast.error('You do not have permission to modify this subtask.');
      return;
    }
    try {
      const nextCompleted = !row.isCompleted;
      const payload = {
        status: nextCompleted ? 'Completed' : 'Pending',
        isCompleted: nextCompleted,
        actualHours: row.actualHours, // keep same actualHours
      };
      await subtaskService.update(row.id, payload);
      toast.success(nextCompleted ? 'Subtask marked completed.' : 'Subtask marked pending.');
      fetchSubtasks();
    } catch (err) {
      console.error('Failed to toggle subtask status:', err);
      toast.error(err?.response?.data?.message || 'Failed to update subtask.');
    }
  };

  const handleCreateRequest = () => {
    setDialogState({ open: true, subtask: null });
  };

  const handleEditRequest = (st) => {
    setDialogState({ open: true, subtask: st });
  };

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await subtaskService.remove(deleteId);
      toast.success('Subtask deleted successfully.');
      fetchSubtasks();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete subtask.';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        id: 'completed',
        label: '',
        minWidth: 50,
        render: (_, row) => (
          <Checkbox
            checked={row.isCompleted || row.status === 'Completed'}
            onChange={() => handleToggleComplete(row)}
            disabled={!canUserEdit}
            icon={<RadioButtonUncheckedRoundedIcon />}
            checkedIcon={<CheckCircleRoundedIcon color="success" />}
            size="small"
          />
        ),
      },
      {
        id: 'subtaskTitle',
        label: 'Subtask Title',
        minWidth: 160,
      },
      {
        id: 'assignee',
        label: 'Assigned Employee',
        minWidth: 160,
        render: (_, row) =>
          row.assignedEmployee
            ? `${row.assignedEmployee.firstName} ${row.assignedEmployee.lastName}`
            : 'Unassigned',
      },
      {
        id: 'priority',
        label: 'Priority',
        minWidth: 100,
        render: (val) => <PriorityChip priority={val} />,
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 100,
        render: (val) => <StatusChip status={val} />,
      },
      {
        id: 'dueDate',
        label: 'Due Date',
        minWidth: 120,
        render: (val) => formatDate(val),
      },
      {
        id: 'hours',
        label: 'Hours Logged',
        minWidth: 160,
        render: (_, row) => (
          <HoursDisplay estimated={row.estimatedHours} actual={row.actualHours} />
        ),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 120,
        render: (_, row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            {canUserEdit && (
              <Tooltip title="Edit subtask">
                <IconButton onClick={() => handleEditRequest(row)} size="small" color="secondary">
                  <ModeEditOutlineOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canManageSubtasks && (
              <Tooltip title="Delete subtask">
                <IconButton onClick={() => handleDeleteRequest(row.id)} size="small" color="error">
                  <DeleteOutlineRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      },
    ],
    [canUserEdit, canManageSubtasks]
  );

  return (
    <Box>
      {/* Progress Cards Summary */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, backgroundColor: 'action.hover' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                COMPLETED SUBTASKS
              </Typography>
              <Typography variant="h5" fontWeight={700} color="primary" sx={{ mt: 0.5 }}>
                {stats.completedCount} / {subtasks.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, backgroundColor: 'action.hover' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL ACTUAL HOURS
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {stats.totalAct} hrs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2.5, backgroundColor: 'action.hover' }}>
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                TOTAL ESTIMATED HOURS
              </Typography>
              <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
                {stats.totalEst} hrs
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Options Row */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(0);
          }}
          placeholder="Search subtasks..."
        />
        {canManageSubtasks && (
          <AppButton
            variant="primary"
            startIcon={<AddRoundedIcon />}
            onClick={handleCreateRequest}
          >
            Add Subtask
          </AppButton>
        )}
      </Box>

      {/* Subtasks DataTable */}
      <DataTable
        columns={columns}
        rows={subtasks}
        loading={loading}
        error={error}
        onRetry={fetchSubtasks}
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchQuery={search}
        onEmptyAction={() => {
          setSearch('');
          setPage(0);
        }}
        emptyTitle="No Subtasks Added"
        emptyDescription="This task has no subtasks scheduled."
        emptyActionLabel="Clear Search"
      />

      {/* Create/Edit Subtask Dialog */}
      <SubtaskDialog
        open={dialogState.open}
        subtask={dialogState.subtask}
        taskId={task.id}
        onClose={() => setDialogState({ open: false, subtask: null })}
        onSuccess={() => {
          setDialogState({ open: false, subtask: null });
          fetchSubtasks();
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Subtask"
        message="Are you sure you want to delete this subtask? Logged actual hours will be removed from totals."
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

export default TaskSubtasksTab;
