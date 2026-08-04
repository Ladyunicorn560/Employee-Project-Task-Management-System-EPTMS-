import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, MenuItem, Select, FormControl, InputLabel, Tooltip, IconButton, Typography } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/tables/DataTable';
import StatusChip from '../../components/common/StatusChip';
import ProgressBar from '../../components/common/ProgressBar';
import AppButton from '../../components/ui/AppButton';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/ui/EmptyState';

import useAuth from '../../hooks/useAuth';
import milestoneService from '../../services/milestoneService';
import projectService from '../../services/projectService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate } from '../../utils/dateUtils';

/**
 * MilestoneListPage
 * Renders list of milestones filtered by selected project.
 * Restricts CRUD actions to Admins and assigned PMs.
 */
const MilestoneListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const isReviewer = user?.roleName === ROLES.REVIEWER;

  // Project select options
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Table Data State
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  // Filters State
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');

  // Delete State
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 1. Fetch Projects List first
  useEffect(() => {
    const fetchProjectsList = async () => {
      setLoadingProjects(true);
      try {
        const assignedEmployeeId = isEmployee || isReviewer ? user?.id : undefined;
        const res = await projectService.getAll({
          limit: 100,
          assignedEmployeeId, // Employees only see milestones for assigned projects
        });
        const list = res.data?.data || [];
        setProjects(list);
        if (list.length > 0) {
          setSelectedProjectId(list[0].id); // Default to first project
        }
      } catch (err) {
        console.error('Failed to load projects list for milestones:', err);
        toast.error('Failed to load projects selection options.');
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjectsList();
  }, [isEmployee, isReviewer, user?.id]);

  // 2. Fetch Milestones for Selected Project
  const fetchMilestones = useCallback(async () => {
    if (!selectedProjectId) {
      setMilestones([]);
      setTotalCount(0);
      return;
    }
    setLoading(true);
    setError(false);
    try {
      const res = await milestoneService.getByProjectId(selectedProjectId, {
        page: page + 1,
        limit: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        dueDate: dueDateFilter || undefined,
      });
      setMilestones(res.data?.data || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error('Error fetching milestones:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId, page, pageSize, search, statusFilter, dueDateFilter]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

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
    setSearch('');
    setStatusFilter('');
    setDueDateFilter('');
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDueDateFilter('');
    setPage(0);
  };

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await milestoneService.remove(deleteId);
      toast.success('Milestone deleted successfully.');
      fetchMilestones();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete milestone.';
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
  const canManageMilestones = isAdmin || (isPM && currentProject?.projectManager?.id === user?.id);

  const columns = useMemo(
    () => [
      {
        id: 'milestoneTitle',
        label: 'Milestone Title',
        minWidth: 180,
      },
      {
        id: 'dueDate',
        label: 'Due Date',
        minWidth: 120,
        render: (val) => formatDate(val),
      },
      {
        id: 'completedDate',
        label: 'Completed Date',
        minWidth: 130,
        render: (val) => formatDate(val),
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 100,
        render: (val) => <StatusChip status={val} />,
      },
      {
        id: 'progress',
        label: 'Progress',
        minWidth: 130,
        render: (_, row) => {
          const value = row.status === 'Completed' ? 100 : 0;
          return <ProgressBar value={value} color="auto" />;
        },
      },
      {
        id: 'projectName',
        label: 'Project',
        minWidth: 160,
        render: () => currentProject?.projectName || '—',
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 120,
        render: (_, row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title="View details">
              <IconButton onClick={() => navigate(`${ROUTES.MILESTONES}/${row.id}`)} size="small" color="primary">
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {canManageMilestones && (
              <>
                <Tooltip title="Edit milestone">
                  <IconButton onClick={() => navigate(`${ROUTES.MILESTONES}/${row.id}/edit`)} size="small" color="secondary">
                    <ModeEditOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete milestone">
                  <IconButton onClick={() => handleDeleteRequest(row.id)} size="small" color="error">
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        ),
      },
    ],
    [currentProject, canManageMilestones, navigate]
  );

  return (
    <Box>
      <PageHeader
        title="Milestones"
        description="Configure project delivery phases, checklists, and timelines."
        breadcrumbItems={[{ label: 'Milestones' }]}
        action={
          canManageMilestones &&
          selectedProjectId && (
            <AppButton
              variant="primary"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate(`${ROUTES.MILESTONES}/create?projectId=${selectedProjectId}`)}
            >
              Add Milestone
            </AppButton>
          )
        }
      />

      {/* Filter Options Row */}
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Project dropdown select */}
          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth disabled={loadingProjects}>
              <InputLabel id="milestone-project-select-label">Project</InputLabel>
              <Select
                labelId="milestone-project-select-label"
                value={selectedProjectId}
                onChange={handleProjectChange}
                label="Project"
              >
                {projects.length === 0 ? (
                  <MenuItem value="" disabled>
                    {loadingProjects ? 'Loading projects...' : 'No projects available'}
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

          {/* Search bar */}
          <Grid item xs={12} sm={4} md={3.5}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search milestone..."
              fullWidth
              disabled={!selectedProjectId}
            />
          </Grid>

          {/* Status dropdown filter */}
          <Grid item xs={12} sm={2} md={2}>
            <FormControl size="small" fullWidth disabled={!selectedProjectId}>
              <InputLabel id="milestone-status-filter-label">Status</InputLabel>
              <Select
                labelId="milestone-status-filter-label"
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
                label="Status"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Due date filter input */}
          <Grid item xs={12} sm={2} md={2.5}>
            <TextField
              id="milestone-duedate-filter"
              fullWidth
              size="small"
              type="date"
              label="Due Date"
              slotProps={{ inputLabel: { shrink: true } }}
              value={dueDateFilter}
              onChange={(e) => {
                setDueDateFilter(e.target.value);
                setPage(0);
              }}
              disabled={!selectedProjectId}
            />
          </Grid>

          {(search || statusFilter || dueDateFilter) && (
            <Grid item xs={12} sm={12} md={1}>
              <AppButton variant="outlined" size="small" fullWidth onClick={handleClearFilters}>
                Clear
              </AppButton>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Main Data Content */}
      {!selectedProjectId ? (
        <EmptyState
          title="No Project Selected"
          description={
            loadingProjects
              ? 'Retrieving organizational projects list...'
              : 'Select a project from the dropdown list to view associated milestones.'
          }
          icon={FlagRoundedIcon}
        />
      ) : (
        <DataTable
          columns={columns}
          rows={milestones}
          loading={loading}
          error={error}
          onRetry={fetchMilestones}
          total={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          searchQuery={search}
          onEmptyAction={handleClearFilters}
          emptyTitle="No Milestones Found"
          emptyDescription="This project has no milestones created or matching the search filters."
          emptyActionLabel="Clear Filters"
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone? Associated tasks will be detached."
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

export default MilestoneListPage;
