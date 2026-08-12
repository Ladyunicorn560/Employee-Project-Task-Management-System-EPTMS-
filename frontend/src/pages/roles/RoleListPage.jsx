import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Tooltip, IconButton, Typography, Chip } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/tables/DataTable';
import AppButton from '../../components/ui/AppButton';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import useAuth from '../../hooks/useAuth';
import roleService from '../../services/roleService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate } from '../../utils/dateUtils';

// Helper to check if role is system-protected
const isSystemProtected = (roleName) => {
  return [
    ROLES.ADMINISTRATOR,
    ROLES.PROJECT_MANAGER,
    ROLES.EMPLOYEE,
    ROLES.REVIEWER,
  ].includes(roleName);
};

/**
 * Format permissions JSON to a clean summary chip list.
 */
const renderPermissionsSummary = (perms = {}) => {
  if (perms && perms.all) {
    return <Chip label="All Access" size="small" color="primary" sx={{ fontWeight: 600 }} />;
  }

  const activeKeys = Object.keys(perms).filter((key) => perms[key] === true);
  if (activeKeys.length === 0) {
    return <Typography variant="caption" color="text.disabled">No access assigned</Typography>;
  }

  // Show first 2 permissions and count remainder
  const displayed = activeKeys.slice(0, 2).map((key) =>
    key.replace('_', ' ')
  ).join(', ');

  const extra = activeKeys.length > 2 ? ` (+${activeKeys.length - 2} more)` : '';

  return (
    <Typography variant="body2" sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>
      {displayed}{extra}
    </Typography>
  );
};

/**
 * RoleListPage
 * Lists system access roles. Admins only.
 */
const RoleListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await roleService.getAll({
        page: page + 1,
        limit: pageSize,
        search: search || undefined,
      });

      setRoles(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching roles:', err);
      setError(true);
      toast.toast ? toast.toast.error('Failed to load system roles list.') : toast.error('Failed to load system roles list.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleEdit = (id) => navigate(`${ROUTES.ROLES}/${id}/edit`);
  const handleView = (id) => navigate(`${ROUTES.ROLES}/${id}`);

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await roleService.remove(deleteId);
      toast.success('Role deleted successfully.');
      fetchRoles();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        'Cannot delete role due to active employee dependencies or protect constraints.';
      toast.error(msg, { autoClose: 6000 });
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  const columns = useMemo(
    () => [
      {
        id: 'roleName',
        label: 'Role Name',
        minWidth: 150,
      },
      {
        id: 'description',
        label: 'Description',
        minWidth: 260,
        render: (val) => val || '—',
      },
      {
        id: 'permissions',
        label: 'Permissions Summary',
        minWidth: 220,
        render: (val) => renderPermissionsSummary(val),
      },
      {
        id: 'employeeCount',
        label: 'Active Employees',
        minWidth: 150,
        align: 'center',
        render: (val) => val ?? 0,
      },
      {
        id: 'createdDate',
        label: 'Created Date',
        minWidth: 130,
        render: (val) => formatDate(val),
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 120,
        render: (_, row) => {
          const systemRole = isSystemProtected(row.roleName);
          return (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
              <Tooltip title="View details">
                <IconButton onClick={() => handleView(row.id)} size="small" color="primary">
                  <VisibilityOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              {isAdmin && (
                <>
                  <Tooltip title={systemRole ? 'System-protected role (Permissions only)' : 'Edit role'}>
                    <IconButton onClick={() => handleEdit(row.id)} size="small" color="secondary">
                      <ModeEditOutlineOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={systemRole ? 'Cannot delete core system roles' : 'Delete role'}>
                    <span>
                      <IconButton
                        onClick={() => handleDeleteRequest(row.id)}
                        size="small"
                        color="error"
                        disabled={systemRole}
                      >
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
            </Box>
          );
        },
      },
    ],
    [isAdmin]
  );

  return (
    <Box>
      <PageHeader
        title="Roles & Permissions"
        description="Configure access roles and define fine-grained permission matrices."
        breadcrumbItems={[{ label: 'Roles' }]}
        action={
          isAdmin && (
            <AppButton
              variant="primary"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate(`${ROUTES.ROLES}/create`)}
            >
              Create Role
            </AppButton>
          )
        }
      />

      {/* Search Filter Row */}
      <Box sx={{ mb: 3 }}>
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search roles..."
        />
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={roles}
        loading={loading}
        error={error}
        onRetry={fetchRoles}
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchQuery={search}
        onEmptyAction={() => handleSearchChange('')}
        emptyTitle="No Roles Found"
        emptyDescription="Create a new custom role to configure tailored access permissions."
        emptyActionLabel="Clear Search"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Role"
        message="Are you sure you want to delete this custom role? Employees assigned to this role must be reassigned first."
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

export default RoleListPage;
