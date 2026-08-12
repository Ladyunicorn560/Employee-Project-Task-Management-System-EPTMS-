import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, MenuItem, Select, FormControl, InputLabel, Tooltip, IconButton, Typography, Grid } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { toast } from 'react-toastify';

import DataTable from '../../../components/tables/DataTable';
import StatusChip from '../../../components/common/StatusChip';
import PriorityChip from '../../../components/common/PriorityChip';
import HoursDisplay from '../../../components/common/HoursDisplay';
import AppButton from '../../../components/ui/AppButton';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import EmptyState from '../../../components/ui/EmptyState';

import useAuth from '../../../hooks/useAuth';
import milestoneService from '../../../services/milestoneService';
import taskService from '../../../services/taskService';
import { ROUTES } from '../../../constants/routes';
import { ROLES } from '../../../constants/roles';
import { formatDate } from '../../../utils/dateUtils';

/**
 * ProjectTasksTab
 * Tab screen embedded inside ProjectDetailsPage.
 * Shows tasks grouped by Milestone for a specific project.
 */
const ProjectTasksTab = ({ project }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;

  // PM ownership check: PMs can only add/edit/delete tasks on projects they manage
  const canManageTasks = isAdmin || (isPM && project?.projectManager?.id === user?.id);

  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');

  const [loadingMilestones, setLoadingMilestones] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Fetch Milestones for project
  useEffect(() => {
    if (!project?.id) return;
    const fetchMilestones = async () => {
      setLoadingMilestones(true);
      try {
        const res = await milestoneService.getByProjectId(project.id, { limit: 100 });
        const list = res.data || [];
        setMilestones(list);
        if (list.length > 0) {
          setSelectedMilestoneId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load project milestones for tasks:', err);
      } finally {
        setLoadingMilestones(false);
      }
    };
    fetchMilestones();
  }, [project?.id]);

  // 2. Fetch Tasks when selected milestone or pagination changes
  const fetchTasks = useCallback(async () => {
    if (!selectedMilestoneId) {
      setTasks([]);
      setTotalCount(0);
      return;
    }
    setLoadingTasks(true);
    try {
      const res = await taskService.getByMilestoneId(selectedMilestoneId, {
        page: page + 1,
        limit: pageSize,
      });
      setTasks(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load milestone tasks:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [selectedMilestoneId, page, pageSize]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleMilestoneChange = (e) => {
    setSelectedMilestoneId(e.target.value);
    setPage(0);
  };

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await taskService.remove(deleteId);
      toast.success('Task deleted successfully.');
      fetchTasks();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete task.';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        id: 'taskTitle',
        label: 'Task Title',
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
        id: 'reviewer',
        label: 'Assigned Reviewer',
        minWidth: 160,
        render: (_, row) =>
          row.reviewer
            ? `${row.reviewer.firstName} ${row.reviewer.lastName}`
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
        minWidth: 140,
        render: (_, row) => (
          <HoursDisplay estimated={row.estimatedHours} actual={row.actualHours} />
        ),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 120,
        render: (_, row) => {
          const isAssigned = row.assignedEmployee?.id === user?.id;
          const canUserEdit = canManageTasks || (isEmployee && isAssigned);

          return (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              <Tooltip title="View details">
                <IconButton onClick={() => navigate(`${ROUTES.TASKS}/${row.id}`)} size="small" color="primary">
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canUserEdit && (
                <Tooltip title="Edit task">
                  <IconButton onClick={() => navigate(`${ROUTES.TASKS}/${row.id}/edit`)} size="small" color="secondary">
                    <ModeEditOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {canManageTasks && (
                <Tooltip title="Delete task">
                  <IconButton onClick={() => handleDeleteRequest(row.id)} size="small" color="error">
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        },
      },
    ],
    [canManageTasks, isEmployee, navigate, user?.id]
  );

  if (loadingMilestones) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">Loading milestone configurations...</Typography>
      </Box>
    );
  }

  if (milestones.length === 0) {
    return (
      <EmptyState
        title="No Milestones Defined"
        description="To begin managing tasks, please create a project milestone under the Milestones tab first."
        icon={TaskAltRoundedIcon}
      />
    );
  }

  return (
    <Box>
      {/* Selector & Add button Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, gap: 2, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 260 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="project-tasks-ms-select-label">Milestone Filter</InputLabel>
            <Select
              labelId="project-tasks-ms-select-label"
              value={selectedMilestoneId}
              onChange={handleMilestoneChange}
              label="Milestone Filter"
            >
              {milestones.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.milestoneTitle}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {canManageTasks && (
          <AppButton
            variant="primary"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate(`${ROUTES.TASKS}/create?milestoneId=${selectedMilestoneId}`)}
            disabled={!selectedMilestoneId}
          >
            Create Task
          </AppButton>
        )}
      </Box>

      {/* Tasks Datatable */}
      <DataTable
        columns={columns}
        rows={tasks}
        loading={loadingTasks}
        paginationMode="server"
        rowCount={totalCount}
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={(size) => {
          setPageSize(size);
          setPage(0);
        }}
        emptyMessage="No tasks found for the selected milestone."
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Task"
        message="Are you sure you want to permanently delete this task record? This action is irreversible."
        loading={deleteLoading}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default ProjectTasksTab;
