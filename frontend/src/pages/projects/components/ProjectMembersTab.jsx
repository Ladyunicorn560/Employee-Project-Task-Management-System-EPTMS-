import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Tooltip, IconButton, Avatar, Typography, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PersonAddRoundedIcon from '@mui/icons-material/PersonAddRounded';
import { toast } from 'react-toastify';

import SearchBar from '../../../components/common/SearchBar';
import DataTable from '../../../components/tables/DataTable';
import StatusChip from '../../../components/common/StatusChip';
import AppButton from '../../../components/ui/AppButton';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import ProjectMemberDialog from './ProjectMemberDialog';

import useAuth from '../../../hooks/useAuth';
import projectService from '../../../services/projectService';
import departmentService from '../../../services/departmentService';
import { ROLES } from '../../../constants/roles';
import { formatDate } from '../../../utils/dateUtils';

/**
 * ProjectMembersTab
 * Tab screen embedded inside ProjectDetailsPage.
 * Shows assigned project members, supports filtering, searching, and adding/removing employees.
 *
 * @param {object} project - Complete project details object from parent details view
 */
const ProjectMembersTab = ({ project }) => {
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;

  // Verify PM ownership: can only add/remove if they manage this project
  const canManageMembers = isAdmin || (isPM && project?.projectManager?.id === user?.id);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Dropdown options
  const [departments, setDepartments] = useState([]);

  // Modals state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(false);

  // Fetch departments list for search filter dropdown
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await departmentService.getAll({ limit: 100 });
        setDepartments(res.data || []);
      } catch (err) {
        console.error('Failed to load departments for members filter:', err);
      }
    };
    loadDepts();
  }, []);

  // Fetch team members assigned
  const fetchMembers = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await projectService.getMembers(project.id);
      const list = res.data || [];

      // Perform local search filtering since backend /members endpoint doesn't support nested department query directly
      let filtered = [...list];
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (m) =>
            m.employee?.firstName?.toLowerCase().includes(query) ||
            m.employee?.lastName?.toLowerCase().includes(query) ||
            m.employee?.email?.toLowerCase().includes(query) ||
            m.roleInProject?.toLowerCase().includes(query)
        );
      }
      if (deptFilter) {
        filtered = filtered.filter((m) => m.employee?.department?.id === parseInt(deptFilter, 10));
      }

      setTotalCount(filtered.length);
      // Slice local array to simulate server pagination
      const start = page * pageSize;
      const end = start + pageSize;
      setMembers(filtered.slice(start, end));
    } catch (err) {
      console.error('Failed to fetch project members:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [project?.id, page, pageSize, search, deptFilter]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRemoveRequest = (empId) => setRemoveId(empId);

  const handleRemoveConfirm = async () => {
    if (!removeId || !project?.id) return;
    setRemoveLoading(true);
    try {
      await projectService.removeMember(project.id, removeId);
      toast.success('Team member removed from project successfully.');
      fetchMembers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to remove member.';
      toast.error(msg);
    } finally {
      setRemoveLoading(false);
      setRemoveId(null);
    }
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(0);
  };

  const handleDeptFilterChange = (e) => {
    setDeptFilter(e.target.value);
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearch('');
    setDeptFilter('');
    setPage(0);
  };

  // Columns config
  const columns = useMemo(
    () => [
      {
        id: 'avatar',
        label: '',
        minWidth: 50,
        render: (_, row) => {
          const emp = row.employee || {};
          const initial = emp.firstName?.[0] || emp.email?.[0]?.toUpperCase() || 'U';
          return (
            <Avatar sx={{ width: 34, height: 34, fontSize: '0.85rem', fontWeight: 600, background: 'linear-gradient(135deg, #1976D2, #1565C0)' }}>
              {initial}
            </Avatar>
          );
        },
      },
      {
        id: 'name',
        label: 'Employee Name',
        minWidth: 160,
        render: (_, row) =>
          row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '—',
      },
      {
        id: 'email',
        label: 'Email',
        minWidth: 180,
        render: (_, row) => row.employee?.email || '—',
      },
      {
        id: 'department',
        label: 'Department',
        minWidth: 130,
        render: (_, row) => row.employee?.department?.name || '—',
      },
      {
        id: 'roleInProject',
        label: 'Role in Project',
        minWidth: 140,
        render: (val) => val || '—',
      },
      {
        id: 'joinedDate',
        label: 'Joined Date',
        minWidth: 120,
        render: (val) => formatDate(val),
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 100,
        render: (_, row) => <StatusChip status={row.employee?.status} />,
      },
      {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        minWidth: 80,
        render: (_, row) => {
          const isPMRecord = row.employee?.id === project?.projectManager?.id;
          const showRemove = canManageMembers && !isPMRecord; // Cannot remove the main project manager from team list

          return showRemove ? (
            <Tooltip title="Remove member">
              <IconButton onClick={() => handleRemoveRequest(row.employee?.id)} size="small" color="error">
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : null;
        },
      },
    ],
    [canManageMembers, project?.projectManager?.id]
  );

  return (
    <Box>
      {/* Search Filter Header */}
      <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyBetween: 'center', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Grid container spacing={2} alignItems="center" sx={{ flex: 1 }}>
          <Grid item xs={12} sm={6} md={4}>
            <SearchBar
              value={search}
              onChange={handleSearchChange}
              placeholder="Search members by name..."
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl size="small" fullWidth>
              <InputLabel id="member-dept-filter">Department</InputLabel>
              <Select
                labelId="member-dept-filter"
                value={deptFilter}
                onChange={handleDeptFilterChange}
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
          {(search || deptFilter) && (
            <Grid item xs={12} sm={2}>
              <AppButton variant="outlined" size="small" fullWidth onClick={handleClearFilters}>
                Clear
              </AppButton>
            </Grid>
          )}
        </Grid>

        {canManageMembers && (
          <AppButton
            variant="primary"
            startIcon={<PersonAddRoundedIcon />}
            onClick={() => setAddDialogOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            Add Member
          </AppButton>
        )}
      </Box>

      {/* Members table */}
      <DataTable
        columns={columns}
        rows={members}
        loading={loading}
        error={error}
        onRetry={fetchMembers}
        total={totalCount}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        searchQuery={search}
        onEmptyAction={handleClearFilters}
        emptyTitle="No Members Assigned"
        emptyDescription="This project has no team members assigned yet."
        emptyActionLabel="Clear Search"
      />

      {/* Add Member Dialog */}
      <ProjectMemberDialog
        open={addDialogOpen}
        projectId={project?.id}
        assignedMemberIds={members.map((m) => m.employee?.id)}
        onClose={() => setAddDialogOpen(false)}
        onSuccess={() => {
          setAddDialogOpen(false);
          fetchMembers();
        }}
      />

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        open={!!removeId}
        title="Remove Team Member"
        message="Are you sure you want to remove this employee from the project team?"
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmColor="error"
        variant="delete"
        loading={removeLoading}
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoveId(null)}
      />
    </Box>
  );
};

export default ProjectMembersTab;
