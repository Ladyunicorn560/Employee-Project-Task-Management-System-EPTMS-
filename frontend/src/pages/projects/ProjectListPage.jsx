import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, MenuItem, Select, FormControl, InputLabel, Tooltip, IconButton, Typography } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/tables/DataTable';
import StatusChip from '../../components/common/StatusChip';
import ProgressBar from '../../components/common/ProgressBar';
import DateRangeDisplay from '../../components/common/DateRangeDisplay';
import AppButton from '../../components/ui/AppButton';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import useAuth from '../../hooks/useAuth';
import projectService from '../../services/projectService';
import departmentService from '../../services/departmentService';
import employeeService from '../../services/employeeService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';

/**
 * ProjectListPage
 * Lists EPTMS Projects.
 * Handles server-side paging, debounced searching, filters,
 * and role-based permissions (Admin vs PM vs Employee).
 */
const ProjectListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const isReviewer = user?.roleName === ROLES.REVIEWER;

  // Table Data State
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [pmFilter, setPmFilter] = useState('');

  // Dropdown options
  const [departments, setDepartments] = useState([]);
  const [pms, setPms] = useState([]);

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch options lists
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [deptRes, pmRes] = await Promise.all([
          departmentService.getAll({ limit: 100 }),
          employeeService.getAll({ limit: 100 }),
        ]);
        setDepartments(deptRes.data || []);
        // Filter to display only PMs or Admins in the manager selection list
        const filteredPms = (pmRes.data || []).filter(
          (emp) =>
            emp.role?.name === ROLES.PROJECT_MANAGER ||
            emp.role?.name === ROLES.ADMINISTRATOR
        );
        setPms(filteredPms);
      } catch (err) {
        console.error('Failed to load project filter lists:', err);
      }
    };
    fetchLists();
  }, []);

  // Fetch project records
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // Role-based restrictions: Non-admin users view assigned/managed projects only
      const assignedEmployeeId = !isAdmin ? user?.id : undefined;

      const res = await projectService.getAll({
        page: page + 1,
        limit: pageSize,
        search: search || undefined,
        status: statusFilter || undefined,
        departmentId: deptFilter || undefined,
        projectManagerId: pmFilter || undefined,
        assignedEmployeeId, // Send to API to filter projects
      });

      setProjects(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Error loading projects list:', err);
      setError(true);
      toast.error('Failed to load projects list.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, statusFilter, deptFilter, pmFilter, isEmployee, isReviewer, user?.id]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleEdit = (id) => navigate(`${ROUTES.PROJECTS}/${id}/edit`);
  const handleView = (id) => navigate(`${ROUTES.PROJECTS}/${id}`);

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await projectService.remove(deleteId);
      toast.success('Project deleted successfully.');
      fetchProjects();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete project.';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDeptFilter('');
    setPmFilter('');
    setPage(0);
  };

  const columns = useMemo(
    () => [
      {
        id: 'projectName',
        label: 'Project Name',
        minWidth: 160,
      },
      {
        id: 'departmentName',
        label: 'Department',
        minWidth: 140,
        render: (_, row) => row.department?.name || '—',
      },
      {
        id: 'projectManager',
        label: 'Project Manager',
        minWidth: 160,
        render: (_, row) =>
          row.projectManager
            ? `${row.projectManager.firstName} ${row.projectManager.lastName}`
            : '—',
      },
      {
        id: 'timeline',
        label: 'Timeline',
        minWidth: 220,
        render: (_, row) => {
          const isOverdueProject = row.status !== 'Completed' && row.endDate && new Date(row.endDate) < new Date();
          return (
            <DateRangeDisplay 
              startDate={row.startDate} 
              endDate={row.endDate} 
              isOverdue={isOverdueProject} 
            />
          );
        },
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 100,
        render: (val) => <StatusChip status={val} />,
      },
      {
        id: 'progressPercentage',
        label: 'Progress',
        minWidth: 130,
        render: (val) => <ProgressBar value={val} color="auto" />,
      },
      ...(!isEmployee
        ? [
            {
              id: 'totalAmount',
              label: 'Budget (₹)',
              minWidth: 110,
              render: (val, row) => `₹${Number(row.totalAmount || row.TotalAmount || 0).toLocaleString()}`,
            },
          ]
        : []),
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 120,
        render: (_, row) => {
          // PM Ownership Guard: PMs can only edit projects they manage
          const canUserEdit = isAdmin || (isPM && row.projectManager?.id === user?.id);

          return (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              <Tooltip title="View details">
                <IconButton onClick={() => handleView(row.id)} size="small" color="primary">
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {canUserEdit && (
                <Tooltip title="Edit project">
                  <IconButton onClick={() => handleEdit(row.id)} size="small" color="secondary">
                    <ModeEditOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {isAdmin && (
                <Tooltip title="Delete project">
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
    [isAdmin, isPM, isEmployee, user?.id]
  );

  return (
    <Box>
      <PageHeader
        title="Projects"
        description="Monitor system project developments, managers, and status values."
        breadcrumbItems={[{ label: 'Projects' }]}
        action={
          (isAdmin || isPM) && (
            <AppButton
              variant="primary"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate(`${ROUTES.PROJECTS}/create`)}
            >
              Add Project
            </AppButton>
          )
        }
      />

      {/* Filter Row */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center" wrap="wrap">
          <Grid item xs={12} sm={6} md={3}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by project name..."
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth sx={{ minWidth: 160 }}>
              <InputLabel id="proj-dept-filter-label">Department</InputLabel>
              <Select
                labelId="proj-dept-filter-label"
                value={deptFilter}
                onChange={handleFilterChange(setDeptFilter)}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.departmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl size="small" fullWidth sx={{ minWidth: 175 }}>
              <InputLabel id="proj-pm-filter-label">Project Manager</InputLabel>
              <Select
                labelId="proj-pm-filter-label"
                value={pmFilter}
                onChange={handleFilterChange(setPmFilter)}
                label="Project Manager"
              >
                <MenuItem value="">All Managers</MenuItem>
                {pms.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.firstName} {p.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl size="small" fullWidth sx={{ minWidth: 130 }}>
              <InputLabel id="proj-status-filter-label">Status</InputLabel>
              <Select
                labelId="proj-status-filter-label"
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Planning">Planning</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="On Hold">On Hold</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {(search || statusFilter || deptFilter || pmFilter) && (
            <Grid item xs={12} sm={12} md={1}>
              <AppButton variant="outlined" size="small" fullWidth onClick={handleClearFilters}>
                Clear
              </AppButton>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Projects Table */}
      <DataTable
        columns={columns}
        rows={projects}
        loading={loading}
        error={error}
        onRetry={fetchProjects}
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchQuery={search}
        onEmptyAction={handleClearFilters}
        emptyTitle="No Projects Found"
        emptyDescription="Get started by creating a new project record."
        emptyActionLabel="Clear Search"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated tasks, members, and milestones will be removed."
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

export default ProjectListPage;
