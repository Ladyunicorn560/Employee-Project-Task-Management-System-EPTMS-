import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Grid, MenuItem, Select, FormControl, InputLabel,
  Tooltip, IconButton,
} from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/tables/DataTable';
import StatusChip from '../../components/common/StatusChip';
import AppButton from '../../components/ui/AppButton';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import useAuth from '../../hooks/useAuth';
import employeeService from '../../services/employeeService';
import departmentService from '../../services/departmentService';
import roleService from '../../services/roleService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate } from '../../utils/dateUtils';

/**
 * EmployeeListPage
 * Listing table for employees. Only accessible by Admins and PMs.
 * Admins have full CRUD. PMs have read-only views.
 */
const EmployeeListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;

  // Table & Filters State
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dropdown lists
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch dropdown helper lists on mount
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([
          departmentService.getAll({ limit: 100 }),
          roleService.getAll({ limit: 100 }),
        ]);
        setDepartments(deptRes.data || []);
        setRoles(roleRes.data || []);
      } catch (err) {
        console.error('Failed to load filter option lists:', err);
      }
    };
    fetchLists();
  }, []);

  // Fetch employee records
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await employeeService.getAll({
        page: page + 1, // API is 1-indexed
        limit: pageSize,
        search: search || undefined,
        departmentId: deptFilter || undefined,
        roleId: roleFilter || undefined,
        status: statusFilter || undefined,
      });

      setEmployees(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError(true);
      toast.toast ? toast.toast.error('Failed to load employees list.') : toast.error('Failed to load employees list.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, deptFilter, roleFilter, statusFilter]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Actions
  const handleEdit = (id) => navigate(`${ROUTES.EMPLOYEES}/${id}/edit`);
  const handleView = (id) => navigate(`${ROUTES.EMPLOYEES}/${id}`);

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await employeeService.remove(deleteId);
      toast.success('Employee deleted successfully.');
      fetchEmployees();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete employee.';
      toast.error(msg);
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  // Reset page index on filter change
  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setDeptFilter('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(0);
  };

  // Columns definition
  const columns = useMemo(
    () => [
      {
        id: 'employeeId',
        label: 'Emp ID',
        minWidth: 80,
        render: (_, row) => `EMP-${String(row.id).padStart(4, '0')}`,
      },
      {
        id: 'name',
        label: 'Name',
        minWidth: 150,
        render: (_, row) => `${row.firstName} ${row.lastName}`,
      },
      {
        id: 'email',
        label: 'Email',
        minWidth: 180,
      },
      {
        id: 'phone',
        label: 'Phone',
        minWidth: 120,
        render: (val) => val || '—',
      },
      {
        id: 'department',
        label: 'Department',
        minWidth: 140,
        render: (val) => val?.name || '—',
      },
      {
        id: 'role',
        label: 'Role',
        minWidth: 130,
        render: (val) => val?.name || '—',
      },
      {
        id: 'manager',
        label: 'Assigned Manager',
        minWidth: 150,
        render: (_, row) =>
          row.manager
            ? (row.manager.name || `${row.manager.firstName || ''} ${row.manager.lastName || ''}`.trim() || '—')
            : row.ManagerName || '—',
      },
      {
        id: 'hourlyRate',
        label: 'Rate (₹/hr)',
        minWidth: 100,
        render: (_, row) => {
          const rate = row.hourlyRate !== undefined ? row.hourlyRate : row.HourlyRate;
          return rate !== undefined && rate !== null ? `₹${rate}/hr` : '—';
        },
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 100,
        render: (val) => <StatusChip status={val} />,
      },
      {
        id: 'createdDate',
        label: 'Created Date',
        minWidth: 125,
        render: (val) => formatDate(val),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 120,
        render: (_, row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title="View details">
              <IconButton onClick={() => handleView(row.id)} size="small" color="primary">
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <>
                <Tooltip title="Edit record">
                  <IconButton onClick={() => handleEdit(row.id)} size="small" color="secondary">
                    <ModeEditOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete record">
                  <IconButton
                    onClick={() => handleDeleteRequest(row.id)}
                    size="small"
                    color="error"
                    disabled={row.id === user?.id} // Cannot delete self
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        ),
      },
    ],
    [isAdmin, user?.id]
  );

  return (
    <Box>
      <PageHeader
        title="Employees"
        description="Manage employee profiles, roles, and department assignments."
        breadcrumbItems={[{ label: 'Employees' }]}
        action={
          isAdmin && (
            <AppButton
              variant="primary"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate(`${ROUTES.EMPLOYEES}/create`)}
            >
              Add Employee
            </AppButton>
          )
        }
      />

      {/* Filter Row */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by name or email..."
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={3} md={2.5}>
            <FormControl size="small" fullWidth>
              <InputLabel id="dept-filter-label">Department</InputLabel>
              <Select
                labelId="dept-filter-label"
                value={deptFilter}
                onChange={handleFilterChange(setDeptFilter)}
                label="Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.departmentName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.5} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="role-filter-label">Role</InputLabel>
              <Select
                labelId="role-filter-label"
                value={roleFilter}
                onChange={handleFilterChange(setRoleFilter)}
                label="Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.roleName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2.5} md={2}>
            <FormControl size="small" fullWidth>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                onChange={handleFilterChange(setStatusFilter)}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {(search || deptFilter || roleFilter || statusFilter) && (
            <Grid item xs={12} sm={12} md={2.5}>
              <AppButton variant="outlined" size="small" fullWidth onClick={handleClearFilters}>
                Clear Filters
              </AppButton>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={employees}
        loading={loading}
        error={error}
        onRetry={fetchEmployees}
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchQuery={search}
        onEmptyAction={handleClearFilters}
        emptyTitle="No Employees Found"
        emptyDescription="Try clearing filters or add a new employee record to begin."
        emptyActionLabel="Clear Search"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Employee"
        message="Are you sure you want to delete this employee? This will deactivate the account."
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

export default EmployeeListPage;
