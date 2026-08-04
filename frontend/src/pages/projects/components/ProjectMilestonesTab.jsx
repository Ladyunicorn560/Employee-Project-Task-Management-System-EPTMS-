import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Tooltip, IconButton, Typography } from '@mui/material';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { toast } from 'react-toastify';

import DataTable from '../../../components/tables/DataTable';
import StatusChip from '../../../components/common/StatusChip';
import ProgressBar from '../../../components/common/ProgressBar';
import AppButton from '../../../components/ui/AppButton';
import ConfirmDialog from '../../../components/common/ConfirmDialog';

import useAuth from '../../../hooks/useAuth';
import milestoneService from '../../../services/milestoneService';
import { ROUTES } from '../../../constants/routes';
import { ROLES } from '../../../constants/roles';
import { formatDate } from '../../../utils/dateUtils';

/**
 * ProjectMilestonesTab
 * Tab screen embedded inside ProjectDetailsPage.
 * Shows milestones for a specific project.
 *
 * @param {object} project - Complete project details object from parent details view
 */
const ProjectMilestonesTab = ({ project }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;

  // PM ownership check: PMs can only add/edit/delete milestones on projects they manage
  const canManageMilestones = isAdmin || (isPM && project?.projectManager?.id === user?.id);

  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch milestones
  const fetchMilestones = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await milestoneService.getByProjectId(project.id, {
        page: page + 1,
        limit: pageSize,
      });
      setMilestones(res.data?.data || []);
      setTotalCount(res.data?.total || 0);
    } catch (err) {
      console.error('Failed to load project milestones:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [project?.id, page, pageSize]);

  useEffect(() => {
    fetchMilestones();
  }, [fetchMilestones]);

  const handleView = (id) => navigate(`${ROUTES.MILESTONES}/${id}`);
  const handleEdit = (id) => navigate(`${ROUTES.MILESTONES}/${id}/edit`);

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
          // Progress is calculated from status: Completed -> 100%, else 0% (in milestones)
          const value = row.status === 'Completed' ? 100 : 0;
          return <ProgressBar value={value} color="auto" />;
        },
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
            {canManageMilestones && (
              <>
                <Tooltip title="Edit milestone">
                  <IconButton onClick={() => handleEdit(row.id)} size="small" color="secondary">
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
    [canManageMilestones]
  );

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Project Milestones List
        </Typography>
        {canManageMilestones && (
          <AppButton
            variant="primary"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate(`${ROUTES.MILESTONES}/create?projectId=${project.id}`)}
          >
            Add Milestone
          </AppButton>
        )}
      </Box>

      {/* Milestones list table */}
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
        emptyTitle="No Milestones Found"
        emptyDescription="This project has no milestones created yet."
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete Milestone"
        message="Are you sure you want to delete this milestone? All associated tasks will be orphaned."
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

export default ProjectMilestonesTab;
