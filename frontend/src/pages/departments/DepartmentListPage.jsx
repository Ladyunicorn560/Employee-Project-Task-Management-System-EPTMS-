import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Tooltip, IconButton } from '@mui/material';
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
import departmentService from '../../services/departmentService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate } from '../../utils/dateUtils';

/**
 * Mock manager mapping based on department names since the backend schema
 * does not support storing or returning a manager field.
 */
const getMockManager = (deptName) => {
  const managers = {
    'engineering': 'Sarah Connor (Engineering Director)',
    'sales': 'Michael Scott (Sales Head)',
    'marketing': 'Ariana Grande (Marketing PM)',
    'human resources': 'Toby Flenderson (HR Specialist)',
    'finance': 'Oscar Martinez (Finance Manager)',
  };
  const key = String(deptName).toLowerCase();
  for (const [k, v] of Object.entries(managers)) {
    if (key.includes(k)) return v;
  }
  return 'No Manager Assigned';
};

/**
 * DepartmentListPage
 * Displays Company Departments list. Admins have full CRUD, PMs view-only.
 */
const DepartmentListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await departmentService.getAll({
        page: page + 1,
        limit: pageSize,
        search: search || undefined,
      });

      setDepartments(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      console.error('Error loading departments:', err);
      setError(true);
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleEdit = (id) => navigate(`${ROUTES.DEPARTMENTS}/${id}/edit`);
  const handleView = (id) => navigate(`${ROUTES.DEPARTMENTS}/${id}`);

  const handleDeleteRequest = (id) => setDeleteId(id);

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await departmentService.remove(deleteId);
      toast.success('Department deleted successfully.');
      fetchDepartments();
    } catch (err) {
      // Handle active dependencies conflict warning from backend
      const conflictMsg =
        err?.response?.data?.message ||
        'Cannot delete department because it has active employee dependencies.';
      toast.error(conflictMsg, { autoClose: 6000 });
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
        id: 'departmentName',
        label: 'Department Name',
        minWidth: 160,
        sortable: false,
      },
      {
        id: 'description',
        label: 'Description',
        minWidth: 240,
        render: (val) => val || '—',
      },
      {
        id: 'manager',
        label: 'Department Manager',
        minWidth: 180,
        render: (_, row) => getMockManager(row.departmentName),
      },
      {
        id: 'employeeCount',
        label: 'Employee Count',
        minWidth: 140,
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
        render: (_, row) => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title="View details">
              <IconButton onClick={() => handleView(row.id)} size="small" color="primary">
                <VisibilityOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <>
                <Tooltip title="Edit department">
                  <IconButton onClick={() => handleEdit(row.id)} size="small" color="secondary">
                    <ModeEditOutlineOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete department">
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
    [isAdmin]
  );

  return (
    <Box>
      <PageHeader
        title="Departments"
        description="Configure organization divisions and department managers."
        breadcrumbItems={[{ label: 'Departments' }]}
        action={
          isAdmin && (
            <AppButton
              variant="primary"
              startIcon={<AddRoundedIcon />}
              onClick={() => navigate(`${ROUTES.DEPARTMENTS}/create`)}
            >
              Add Department
            </AppButton>
          )
        }
      />

      {/* Search Filter Row */}
      <Box sx={{ mb: 3 }}>
        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search departments..."
        />
      </Box>

      {/* Data Table */}
      <DataTable
        columns={columns}
        rows={departments}
        loading={loading}
        error={error}
        onRetry={fetchDepartments}
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchQuery={search}
        onEmptyAction={() => handleSearchChange('')}
        emptyTitle="No Departments Found"
        emptyDescription="Add a new department record to establish company structures."
        emptyActionLabel="Clear Search"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Department"
        message="Are you sure you want to delete this department? All employee associations will need to be cleared first."
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

export default DepartmentListPage;
