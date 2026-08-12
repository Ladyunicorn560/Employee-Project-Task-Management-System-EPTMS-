import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, MenuItem, Select, FormControl, InputLabel, Typography, Card, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Divider
} from '@mui/material';
import { toast } from 'react-toastify';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';

import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/ui/AppButton';
import DataTable from '../../components/tables/DataTable';
import PriorityChip from '../../components/common/PriorityChip';
import HoursDisplay from '../../components/common/HoursDisplay';
import projectService from '../../services/projectService';
import milestoneService from '../../services/milestoneService';
import taskService from '../../services/taskService';
import reviewService from '../../services/reviewService';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { formatDate } from '../../utils/dateUtils';

const ReviewQueuePage = () => {
  const { user } = useAuth();
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const isReviewer = user?.roleName === ROLES.REVIEWER;

  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Review Dialog State
  const [selectedTask, setSelectedTask] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Approved');
  const [comments, setComments] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // 1. Fetch Projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const assignedEmployeeId = isEmployee || isReviewer ? user?.id : undefined;
        const res = await projectService.getAll({ limit: 100, assignedEmployeeId });
        setProjects(res.data || []);
        // Do NOT auto-select — default to All Projects
      } catch (err) {
        console.error('Failed to load projects for review queue:', err);
        toast.error('Failed to load projects list.');
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [isEmployee, isReviewer, user?.id]);

  // 2. Fetch Milestones when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setMilestones([]);
      setSelectedMilestoneId('');
      return;
    }
    const fetchMilestones = async () => {
      setLoadingMilestones(true);
      try {
        const res = await milestoneService.getByProjectId(selectedProjectId, { limit: 100 });
        setMilestones(res.data || []);
        setSelectedMilestoneId(''); // Default to All Milestones
      } catch (err) {
        console.error('Failed to load milestones for review queue:', err);
      } finally {
        setLoadingMilestones(false);
      }
    };
    fetchMilestones();
  }, [selectedProjectId]);

  // 3. Fetch Tasks that are "Under Review" — supports all-project / all-milestone mode
  const fetchTasksUnderReview = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const assignedEmployeeId = isEmployee || isReviewer ? user?.id : undefined;
      const res = await taskService.getAll({
        projectId: selectedProjectId || undefined,
        milestoneId: selectedMilestoneId || undefined,
        status: 'Under Review',
        assignedEmployeeId,
        limit: 200,
      });
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks for review queue:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [selectedProjectId, selectedMilestoneId, isEmployee, isReviewer, user?.id]);

  useEffect(() => {
    fetchTasksUnderReview();
  }, [fetchTasksUnderReview]);

  const handleOpenReview = (task) => {
    setSelectedTask(task);
    setReviewStatus('Approved');
    setComments('');
  };

  const handleCloseReview = () => {
    setSelectedTask(null);
  };

  const handleSubmitReview = async () => {
    if (!selectedTask) return;
    setSubmittingReview(true);
    try {
      await reviewService.createInTask(selectedTask.id, {
        reviewerId: user.id,
        status: reviewStatus,
        comments: comments.trim() || null
      });
      toast.success('Review submitted successfully.');
      handleCloseReview();
      fetchTasksUnderReview();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit code review.';
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  const columns = [
    {
      id: 'taskTitle',
      label: 'Task Title',
      minWidth: 180,
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
      id: 'dueDate',
      label: 'Due Date',
      minWidth: 120,
      render: (val) => formatDate(val),
    },
    {
      id: 'hours',
      label: 'Hours Logged',
      minWidth: 140,
      render: (_, row) => <HoursDisplay estimated={row.estimatedHours} actual={row.actualHours} />,
    },
    {
      id: 'actions',
      label: 'Actions',
      align: 'right',
      minWidth: 120,
      render: (_, row) => (
        <AppButton
          variant="primary"
          size="small"
          startIcon={<RateReviewRoundedIcon />}
          onClick={() => handleOpenReview(row)}
        >
          Review
        </AppButton>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Review Queue"
        description="Process pending tasks waiting for code reviews and milestone approvals."
        breadcrumbItems={[{ label: 'Work' }, { label: 'Review Queue' }]}
      />

      <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl size="small" fullWidth disabled={loadingProjects}>
                <InputLabel id="reviews-project-label">Project</InputLabel>
                <Select
                  labelId="reviews-project-label"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  label="Project"
                >
                  <MenuItem value=""><em>All Projects</em></MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.projectName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl size="small" fullWidth disabled={loadingMilestones || !selectedProjectId}>
                <InputLabel id="reviews-ms-label">Milestone</InputLabel>
                <Select
                  labelId="reviews-ms-label"
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  label="Milestone"
                >
                  <MenuItem value=""><em>All Milestones</em></MenuItem>
                  {milestones.map((m) => (
                    <MenuItem key={m.id} value={m.id}>{m.milestoneTitle}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <DataTable
        columns={columns}
        rows={tasks}
        loading={loadingTasks}
        emptyMessage="No tasks currently pending review under this milestone."
      />

      {/* Review Dialogue Modal */}
      <Dialog open={Boolean(selectedTask)} onClose={handleCloseReview} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Submit Task Review</DialogTitle>
        <DialogContent dividers>
          {selectedTask && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, my: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase' }}>Task Under Review</Typography>
                <Typography variant="body1" fontWeight={700}>{selectedTask.taskTitle}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase' }}>Description</Typography>
                <Typography variant="body2">{selectedTask.description || 'No description provided.'}</Typography>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Assignee</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedTask.assignedEmployee
                      ? `${selectedTask.assignedEmployee.firstName} ${selectedTask.assignedEmployee.lastName}`
                      : 'Unassigned'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Hours Logged</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedTask.actualHours} hrs</Typography>
                </Grid>
              </Grid>

              <Divider />

              <FormControl fullWidth size="small">
                <InputLabel id="review-action-status">Review Decision</InputLabel>
                <Select
                  labelId="review-action-status"
                  value={reviewStatus}
                  onChange={(e) => setReviewStatus(e.target.value)}
                  label="Review Decision"
                >
                  <MenuItem value="Approved">Approve (Complete Task)</MenuItem>
                  <MenuItem value="Changes Required">Request Changes</MenuItem>
                  <MenuItem value="Rejected">Reject</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Comments & Recommendations"
                multiline
                rows={4}
                size="small"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Detail changes required, or notes on successful validation..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <AppButton variant="outlined" onClick={handleCloseReview}>Cancel</AppButton>
          <AppButton variant="primary" loading={submittingReview} onClick={handleSubmitReview}>Submit Decision</AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewQueuePage;
