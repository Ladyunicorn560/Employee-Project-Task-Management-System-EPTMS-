import { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Alert, Divider, Pagination } from '@mui/material';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';
import { toast } from 'react-toastify';

import ReviewTimeline from './ReviewTimeline';
import ReviewDialog from './ReviewDialog';
import EmptyState from '../../../components/ui/EmptyState';
import PageLoader from '../../../components/ui/PageLoader';
import AppButton from '../../../components/ui/AppButton';

import useAuth from '../../../hooks/useAuth';
import reviewService from '../../../services/reviewService';
import projectService from '../../../services/projectService';
import { ROLES } from '../../../constants/roles';

/**
 * TaskReviewsTab
 * Reviews & Approvals workflow panel inside TaskDetailsPage.
 *
 * @param {object} task - Parent task details object
 */
const TaskReviewsTab = ({ task }) => {
  const { user } = useAuth();
  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit] = useState(5);

  // Modals state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPendingReview, setDialogPendingReview] = useState(null);

  // Load project to verify PM ownership
  const [project, setProject] = useState(null);
  useEffect(() => {
    if (!task?.projectId) return;
    const fetchProj = async () => {
      try {
        const p = await projectService.getById(task.projectId);
        setProject(p);
      } catch (err) {
        console.error('Failed to load project details for review authorization:', err);
      }
    };
    fetchProj();
  }, [task?.projectId]);

  const fetchReviews = useCallback(async () => {
    if (!task?.id) return;
    setLoading(true);
    setError(false);
    try {
      const res = await reviewService.getByTaskId(task.id, {
        page,
        limit,
        sortBy: 'Iteration',
        sortOrder: 'DESC', // newest iterations first
      });
      setReviews(res.data || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load task reviews:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [task?.id, page, limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Find active pending review request
  const pendingReview = useMemo(() => {
    return reviews.find((r) => r.status === 'Pending');
  }, [reviews]);

  const handleRequestReviewClick = () => {
    setDialogPendingReview(null); // Create Mode
    setDialogOpen(true);
  };

  const handleResolveReviewClick = () => {
    if (!pendingReview) return;
    setDialogPendingReview(pendingReview); // Resolve Mode
    setDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    setDialogOpen(false);
    setPage(1);
    fetchReviews();
  };

  // Authorization outcomes checks
  const isAssignedEmployee = task.assignedEmployee?.id === user?.id;
  const isPmOwner = isPM && project?.projectManager?.id === user?.id;
  
  // Can request a review: Admin, PM, or assigned Employee when there's no pending request
  const canRequest = !pendingReview && (isAdmin || isPmOwner || isAssignedEmployee);

  // Can resolve active pending review: designated Reviewer, Admin, or PM managing the project
  const isDesignatedReviewer = pendingReview?.reviewer?.id === user?.id;
  const canResolve = pendingReview && (isAdmin || isPmOwner || isDesignatedReviewer);

  // designated reviewer name details for notice banner
  const reviewerName = pendingReview?.reviewer
    ? `${pendingReview.reviewer.firstName} ${pendingReview.reviewer.lastName}`
    : 'designated reviewer';

  return (
    <Box>
      {/* Top Banner notice for active pending review */}
      {pendingReview && (
        <Alert
          severity="warning"
          icon={<HourglassEmptyRoundedIcon />}
          sx={{ mb: 3, borderRadius: 2.5, alignItems: 'center' }}
          action={
            canResolve && (
              <AppButton
                color="warning"
                variant="primary"
                size="small"
                onClick={handleResolveReviewClick}
              >
                Resolve Review
              </AppButton>
            )
          }
        >
          <Typography variant="body2" fontWeight={600}>
            This task is currently under review by {reviewerName}.
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Request comments: &ldquo;{pendingReview.comments || 'No comment notes'}&rdquo;
          </Typography>
        </Alert>
      )}

      {/* Title & Action header */}
      <Box sx={{ mb: 3.5, display: 'flex', justifyBetween: 'center', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" fontWeight={700}>
          Approval Workflow Timeline
        </Typography>

        {canRequest && (
          <AppButton
            variant="primary"
            startIcon={<RateReviewRoundedIcon />}
            onClick={handleRequestReviewClick}
          >
            Request Review
          </AppButton>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Reviews list */}
      {loading ? (
        <PageLoader message="Loading reviews timeline..." />
      ) : error ? (
        <Alert severity="error">Failed to fetch review steps.</Alert>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No Reviews Registered"
          description="Submit a review request once the task deliverables are ready for evaluation."
          icon={RateReviewRoundedIcon}
        />
      ) : (
        <Box>
          <ReviewTimeline reviews={reviews} />

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3.5 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, val) => setPage(val)}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Box>
      )}

      {/* Review Dialog */}
      <ReviewDialog
        open={dialogOpen}
        taskId={task.id}
        pendingReview={dialogPendingReview}
        assigneeId={task.assignedEmployee?.id}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleDialogSuccess}
      />
    </Box>
  );
};

export default TaskReviewsTab;
