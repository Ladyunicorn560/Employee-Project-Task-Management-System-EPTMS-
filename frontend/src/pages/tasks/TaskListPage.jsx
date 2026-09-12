import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Grid, MenuItem, Select, FormControl, InputLabel, Tooltip, IconButton, Typography, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/tables/DataTable';
import StatusChip from '../../components/common/StatusChip';
import PriorityChip from '../../components/common/PriorityChip';
import ProgressBar from '../../components/common/ProgressBar';
import HoursDisplay from '../../components/common/HoursDisplay';
import AppButton from '../../components/ui/AppButton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';

import useAuth from '../../hooks/useAuth';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import milestoneService from '../../services/milestoneService';
import employeeService from '../../services/employeeService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate } from '../../utils/dateUtils';

/**
 * TaskListPage
 * Renders paginated, filtered lists of tasks based on Project -> Milestone cascades.
 * Admins and assigned PMs have full CRUD. Employees see assigned items.
 */
const TaskListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const isReviewer = user?.roleName === ROLES.REVIEWER;

  // Collection options state
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  // Table State
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filter Values
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [reviewerFilter, setReviewerFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');

  // Sync search parameters from URL (e.g. from header search)
  useEffect(() => {
    const q = searchParams.get('search') || '';
    setSearch(q);
  }, [searchParams]);

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status Change Dialog State
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusComment, setStatusComment] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  const handleConfirmStatusChange = async () => {
    if (!statusComment.trim()) {
      toast.error('Status change requires a tracked comment.');
      return;
    }
    setStatusSubmitting(true);
    try {
      await taskService.update(statusTarget.taskId, {
        status: statusTarget.newStatus,
        comment: statusComment.trim(),
      });
      toast.success(`Task status updated to ${statusTarget.newStatus}`);
      setStatusModalOpen(false);
      setStatusTarget(null);
      setStatusComment('');
      fetchTasks();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    } finally {
      setStatusSubmitting(false);
    }
  };

  // 1. Fetch initial Projects and Employees list
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoadingProjects(true);
      try {
        const assignedEmployeeId = isEmployee || isReviewer ? user?.id : undefined;
        
        const [projRes, empRes] = await Promise.all([
          projectService.getAll({ limit: 100, assignedEmployeeId }),
          employeeService.getAll({ limit: 100 }),
        ]);

        const projList = projRes.data || [];
        setProjects(projList);
        setEmployees(empRes.data || []);

        // Default to All Projects and All Milestones (empty strings)
      } catch (err) {
        console.error('Failed to load tasks filter dropdown lists:', err);
        toast.error('Failed to load filter select lists.');
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchDropdownData();
  }, [isEmployee, isReviewer, user?.id]);

  // 2. Fetch Milestones when selected project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setMilestones([]);
      setSelectedMilestoneId('');
      return;
    }
    const fetchProjectMilestones = async () => {
      setLoadingMilestones(true);
      try {
        const res = await milestoneService.getByProjectId(selectedProjectId, { limit: 100 });
        const list = res.data || [];
        setMilestones(list);
        if (list.length > 0) {
          setSelectedMilestoneId(list[0].id); // Default select first milestone
        } else {
          setSelectedMilestoneId('');
        }
      } catch (err) {
        console.error('Failed to load project milestones:', err);
      } finally {
        setLoadingMilestones(false);
      }
    };
    fetchProjectMilestones();
  }, [selectedProjectId]);

  // 3. Fetch Tasks when selected milestone or filters change
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // Role Visibility Constraint
      const assignedEmployeeId = isEmployee ? user?.id : (assigneeFilter || undefined);
      const reviewerId = reviewerFilter || undefined;
      const isOverdueParam = searchParams.get('filter') === 'overdue';

      const res = await taskService.getAll({
        projectId: isOverdueParam ? undefined : (selectedProjectId || undefined),
        milestoneId: isOverdueParam ? undefined : (selectedMilestoneId || undefined),
        page: isOverdueParam ? 1 : page + 1,
        limit: isOverdueParam ? 500 : pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assignedEmployeeId,
        reviewerId,
      });

      let list = res.data || [];
      if (isOverdueParam) {
        list = list.filter(
          (t) => t.status !== 'Completed' && t.status !== 'Cancelled' && t.dueDate && new Date(t.dueDate) < new Date()
        );
      }

      setTasks(list);
      setTotalCount(isOverdueParam ? list.length : (res.pagination?.total || 0));
    } catch (err) {
      console.error('Failed to retrieve tasks:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, selectedMilestoneId, page, pageSize, search, statusFilter, priorityFilter, assigneeFilter, reviewerFilter, isEmployee, user?.id, searchParams]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
    setPage(0);
  };

  const handleMilestoneChange = (e) => {
    setSelectedMilestoneId(e.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setReviewerFilter('');
    setDueDateFilter('');
    setSearchParams({}); // Clear query string
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

  // Find currently selected project details for ownership check
  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  // Permission checks
  const canManageTasks = isAdmin || (isPM && currentProject?.projectManager?.id === user?.id);
  const canCreateTasks = !!user;

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
        minWidth: 130,
        render: (val, row) => {
          const isAssigned = row.assignedEmployee?.id === user?.id;
          const canUserEdit = canManageTasks || (isEmployee && isAssigned);

          if (!canUserEdit) {
            return <StatusChip status={val} />;
          }

          return (
            <Select
              value={val}
              size="small"
              variant="standard"
              disableUnderline
              onChange={(e) => {
                const newStatus = e.target.value;
                if (newStatus === val) return;
                if (isEmployee && newStatus === 'Cancelled') {
                  toast.error('Employees cannot cancel tasks. For task cancellation, Manager approval is required.');
                  return;
                }
                const isReviewerForTask = canManageTasks || row.reviewerId === user?.id || row.reviewer?.id === user?.id;
                if ((newStatus === 'Under Review' || val === 'Under Review') && !isReviewerForTask) {
                  toast.error("Status 'Under Review' can only be updated by the assigned Reviewer.");
                  return;
                }
                setStatusTarget({ taskId: row.id, newStatus, currentStatus: val, title: row.taskTitle });
                setStatusComment('');
                setStatusModalOpen(true);
              }}
              renderValue={(selected) => <StatusChip status={selected} />}
              sx={{
                '& .MuiSelect-select': {
                  paddingY: 0,
                  paddingX: 0,
                  display: 'flex',
                  alignItems: 'center',
                },
              }}
            >
              <MenuItem value="Not Started">Not Started</MenuItem>
              <MenuItem value="Assigned">Assigned</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Waiting for Information">Waiting for Information</MenuItem>
              <MenuItem value="Blocked">Blocked</MenuItem>
              <MenuItem value="Ready for Review">Ready for Review</MenuItem>
              <MenuItem value="Under Review">Under Review</MenuItem>
              <MenuItem value="Changes Required">Changes Required</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          );
        },
      },
      {
        id: 'timeline',
        label: 'Due Date',
        minWidth: 160,
        render: (_, row) => {
          const isTaskOverdue = row.status !== 'Completed' && row.status !== 'Cancelled' && row.dueDate && new Date(row.dueDate) < new Date();
          let overdueDays = 0;
          if (isTaskOverdue) {
            const diffMs = new Date() - new Date(row.dueDate);
            overdueDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
          }
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body2" 
                color={isTaskOverdue ? 'error.main' : 'text.primary'} 
                fontWeight={isTaskOverdue ? 600 : 500}
              >
                {formatDate(row.dueDate)}
              </Typography>
              {isTaskOverdue && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'error.main',
                    fontWeight: 800,
                    backgroundColor: '#FFF5F5',
                    px: 0.8,
                    py: 0.2,
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: 'error.light',
                    fontSize: '0.65rem',
                    letterSpacing: 0.3,
                  }}
                >
                  {overdueDays}d OVERDUE
                </Typography>
              )}
            </Box>
          );
        },
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
        render: (_, row) => {
          // Edit permissions: Admin, PM managing project, or Assigned Employee (if allowed by backend)
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
    [canManageTasks, user?.id, isEmployee, navigate, fetchTasks]
  );

  return (
    <Box>
      <PageHeader
        title="Tasks"
        description="Monitor system work schedules, checklists, and execution logs."
        breadcrumbItems={[{ label: 'Tasks' }]}
        action={
          canCreateTasks && (
            <AppButton
              variant="primary"
              startIcon={<AddRoundedIcon />}
              onClick={() =>
                navigate(
                  selectedMilestoneId
                    ? `${ROUTES.TASKS}/create?milestoneId=${selectedMilestoneId}`
                    : `${ROUTES.TASKS}/create`
                )
              }
            >
              Create Task
            </AppButton>
          )
        }
      />

      {searchParams.get('filter') === 'overdue' && (
        <Alert
          severity="warning"
          sx={{ mb: 3, borderRadius: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => setSearchParams({})}>
              Show All Tasks
            </Button>
          }
        >
          Viewing <strong>Overdue Tasks Only</strong>. Filter applied from Dashboard.
        </Alert>
      )}

      {/* Cascading Filter Bar */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2.5} alignItems="center">
          {/* Row 1: Project & Milestone Selectors */}
          <Grid item xs={12} md={6}>
            <FormControl size="small" fullWidth disabled={loadingProjects}>
              <InputLabel id="task-project-select-label">Project</InputLabel>
              <Select
                labelId="task-project-select-label"
                value={selectedProjectId}
                onChange={handleProjectChange}
                label="Project"
              >
                <MenuItem value="">
                  <em>All Projects</em>
                </MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.projectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl size="small" fullWidth disabled={loadingMilestones || !selectedProjectId}>
              <InputLabel id="task-ms-select-label">Milestone</InputLabel>
              <Select
                labelId="task-ms-select-label"
                value={selectedMilestoneId}
                onChange={handleMilestoneChange}
                label="Milestone"
              >
                <MenuItem value="">
                  <em>All Milestones</em>
                </MenuItem>
                {milestones.map((m) => (
                  <MenuItem key={m.id} value={m.id}>
                    {m.milestoneTitle}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Row 2: Search and Status / Priority / Assignee / Reviewer filters */}
          <Grid item xs={12} sm={6} md={3.5}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search tasks..."
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth sx={{ minWidth: 130 }}>
              <InputLabel id="task-status-filter-label">Status</InputLabel>
              <Select
                labelId="task-status-filter-label"
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Under Review">Under Review</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={2.1}>
            <FormControl size="small" fullWidth sx={{ minWidth: 120 }}>
              <InputLabel id="task-priority-filter-label">Priority</InputLabel>
              <Select
                labelId="task-priority-filter-label"
                value={priorityFilter}
                onChange={handleFilterChange(setPriorityFilter)}
                label="Priority"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {!isEmployee && (
            <Grid item xs={12} sm={6} md={2.2}>
              <FormControl size="small" fullWidth sx={{ minWidth: 130 }}>
                <InputLabel id="task-assignee-filter-label">Assignee</InputLabel>
                <Select
                  labelId="task-assignee-filter-label"
                  value={assigneeFilter}
                  onChange={handleFilterChange(setAssigneeFilter)}
                  label="Assignee"
                >
                  <MenuItem value="">All</MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {!isEmployee && (
            <Grid item xs={12} sm={6} md={2.2}>
              <FormControl size="small" fullWidth sx={{ minWidth: 130 }}>
                <InputLabel id="task-reviewer-filter-label">Reviewer</InputLabel>
                <Select
                  labelId="task-reviewer-filter-label"
                  value={reviewerFilter}
                  onChange={handleFilterChange(setReviewerFilter)}
                  label="Reviewer"
                >
                  <MenuItem value="">All</MenuItem>
                  {employees.map((e) => (
                    <MenuItem key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {(search || statusFilter || priorityFilter || assigneeFilter || reviewerFilter || dueDateFilter) && (
            <Grid item xs={12} sm={12} md={1}>
              <AppButton variant="outlined" size="small" fullWidth onClick={handleClearFilters}>
                Clear
              </AppButton>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        rows={tasks}
        loading={loading}
        error={error}
        onRetry={fetchTasks}
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchQuery={search}
        onEmptyAction={handleClearFilters}
        emptyTitle="No Tasks Scheduled"
        emptyDescription="Create a new task pipeline item to allocate work deliverables."
        emptyActionLabel="Clear Filters"
      />

      {/* Status Change Comment Dialog */}
      <Dialog open={statusModalOpen} onClose={() => setStatusModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Status Change Comment Required
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Updating <strong>{statusTarget?.title || 'Task'}</strong> status from <em>{statusTarget?.currentStatus}</em> to <strong>{statusTarget?.newStatus}</strong>.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            rows={3}
            label="Comment / Reason (Mandatory)"
            placeholder="Explain the work done or reason for changing status..."
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            error={!statusComment.trim()}
            helperText={!statusComment.trim() ? 'A comment is mandatory when changing status.' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setStatusModalOpen(false)} disabled={statusSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!statusComment.trim() || statusSubmitting}
            onClick={handleConfirmStatusChange}
          >
            {statusSubmitting ? 'Updating...' : 'Confirm Status Change'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Task"
        message="Are you sure you want to delete this task? All subtasks, reviews, comments, and attachments will be deleted permanently."
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

export default TaskListPage;
