import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, MenuItem, Select, FormControl, InputLabel, Tooltip, IconButton, Typography, TextField } from '@mui/material';
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
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');

  // Delete Dialog State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

        const projList = projRes.data?.data || [];
        setProjects(projList);
        setEmployees(empRes.data?.data || []);

        if (projList.length > 0) {
          setSelectedProjectId(projList[0].id); // Default select first project
        }
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
        const list = res.data?.data || [];
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
    if (!selectedMilestoneId) {
      setTasks([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      // Role Visibility Constraint
      const assignedEmployeeId = isEmployee ? user?.id : (assigneeFilter || undefined);

      const res = await taskService.getByMilestoneId(selectedMilestoneId, {
        page: page + 1,
        limit: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
        assignedEmployeeId,
      });

      setTasks(res.data?.data || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to retrieve milestone tasks:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedMilestoneId, page, pageSize, search, statusFilter, priorityFilter, assigneeFilter, isEmployee, user?.id]);

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
    setDueDateFilter('');
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

  // Check if PM manages the currently selected project
  const canManageTasks = isAdmin || (isPM && currentProject?.projectManager?.id === user?.id);

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
        id: 'timeline',
        label: 'Due Date',
        minWidth: 120,
        render: (_, row) => formatDate(row.dueDate),
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
    [canManageTasks, user?.id, isEmployee, navigate]
  );

  return (
    <Box>
      <PageHeader
        title="Tasks"
        description="Monitor system work schedules, checklists, and execution logs."
        breadcrumbItems={[{ label: 'Tasks' }]}
        action={
          canManageTasks &&
          selectedMilestoneId && (
            <AppButton
              variant="primary"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate(`${ROUTES.TASKS}/create?milestoneId=${selectedMilestoneId}`)}
            >
              Add Task
            </AppButton>
          )
        }
      />

      {/* Cascading Filter Bar */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Project cascading selector */}
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl size="small" fullWidth disabled={loadingProjects}>
              <InputLabel id="task-project-select-label">Project</InputLabel>
              <Select
                labelId="task-project-select-label"
                value={selectedProjectId}
                onChange={handleProjectChange}
                label="Project"
              >
                {projects.length === 0 ? (
                  <MenuItem value="" disabled>
                    {loadingProjects ? 'Loading...' : 'No projects'}
                  </MenuItem>
                ) : (
                  projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.projectName}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Milestone cascading selector */}
          <Grid item xs={12} sm={4} md={2.5}>
            <FormControl size="small" fullWidth disabled={loadingMilestones || !selectedProjectId}>
              <InputLabel id="task-ms-select-label">Milestone</InputLabel>
              <Select
                labelId="task-ms-select-label"
                value={selectedMilestoneId}
                onChange={handleMilestoneChange}
                label="Milestone"
              >
                {milestones.length === 0 ? (
                  <MenuItem value="" disabled>
                    {loadingMilestones ? 'Loading...' : 'No milestones'}
                  </MenuItem>
                ) : (
                  milestones.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.milestoneTitle}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Grid>

          {/* Search text */}
          <Grid item xs={12} sm={4} md={2.5}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search tasks..."
              fullWidth
              disabled={!selectedMilestoneId}
            />
          </Grid>

          {/* Status filter select */}
          <Grid item xs={12} sm={3} md={1.5}>
            <FormControl size="small" fullWidth disabled={!selectedMilestoneId}>
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

          {/* Priority filter select */}
          <Grid item xs={12} sm={3} md={1.5}>
            <FormControl size="small" fullWidth disabled={!selectedMilestoneId}>
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

          {/* Employee filter select (Admins and PMs only) */}
          {!isEmployee && (
            <Grid item xs={12} sm={3} md={1.5}>
              <FormControl size="small" fullWidth disabled={!selectedMilestoneId}>
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

          {(search || statusFilter || priorityFilter || assigneeFilter || dueDateFilter) && (
            <Grid item xs={12} sm={12} md={1}>
              <AppButton variant="outlined" size="small" fullWidth onClick={handleClearFilters}>
                Clear
              </AppButton>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Main Data Table */}
      {!selectedMilestoneId ? (
        <EmptyState
          title="No Milestone Selected"
          description={
            loadingProjects || loadingMilestones
              ? 'Loading workspace collections...'
              : 'Select both a Project and a Milestone to load task schedules.'
          }
          icon={TaskAltRoundedIcon}
        />
      ) : (
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
      )}

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
