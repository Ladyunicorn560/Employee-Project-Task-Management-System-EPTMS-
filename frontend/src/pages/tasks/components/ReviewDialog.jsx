import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, MenuItem, Select,
  FormControl, InputLabel, TextField, FormHelperText, IconButton, Grid,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { toast } from 'react-toastify';

import AppButton from '../../../components/ui/AppButton';
import employeeService from '../../../services/employeeService';
import reviewService from '../../../services/reviewService';

/**
 * ReviewDialog
 * Handles creating a review request or updating a pending review request's outcome.
 *
 * @param {boolean} open
 * @param {number} taskId
 * @param {object} pendingReview - The active pending review request object if resolving (null if creating)
 * @param {number} assigneeId - The employee ID assigned to task (used to prevent self-review requests)
 * @param {function} onClose
 * @param {function} onSuccess
 */
const ReviewDialog = ({ open, taskId, pendingReview = null, assigneeId = null, onClose, onSuccess }) => {
  const [reviewers, setReviewers] = useState([]);
  const [loading, setLoading] = useState(true);

  const isResolveMode = !!pendingReview;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
  });

  // Load potential reviewers list (Admins, PMs, and other active employees)
  useEffect(() => {
    if (!open || isResolveMode) return;
    const fetchReviewersList = async () => {
      setLoading(true);
      try {
        const res = await employeeService.getAll({ limit: 100 });
        const list = res.data?.data || [];
        // Filter: active employees and prevent self-review assignment
        const filtered = list.filter((emp) => emp.status === 'Active' && emp.id !== assigneeId);
        setReviewers(filtered);
      } catch (err) {
        console.error('Failed to load reviewers list:', err);
        toast.error('Failed to load reviewers dropdown options.');
      } finally {
        setLoading(false);
      }
    };
    fetchReviewersList();
  }, [open, isResolveMode, assigneeId]);

  // Prepopulate form if in resolve mode
  useEffect(() => {
    if (open) {
      if (isResolveMode && pendingReview) {
        reset({
          status: 'Approved',
          comments: '',
        });
      } else {
        reset({
          reviewerId: '',
          comments: '',
        });
      }
    }
  }, [open, isResolveMode, pendingReview, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      if (isResolveMode && pendingReview) {
        // Resolve Pending Review
        const payload = {
          status: data.status,
          comments: data.comments.trim() || null,
        };
        await reviewService.update(pendingReview.id, payload);
        toast.success(`Review outcome submitted: ${data.status}`);
      } else {
        // Create Pending Review Request
        const payload = {
          reviewerId: parseInt(data.reviewerId, 10),
          comments: data.comments.trim() || null,
          status: 'Pending',
        };
        await reviewService.createInTask(taskId, payload);
        toast.success('Review request submitted successfully.');
      }
      reset();
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit review details.';
      toast.error(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isResolveMode ? 'Resolve Review Request' : 'Request Task Review'}
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ p: 3, pt: 1, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {isResolveMode ? (
            /* Resolve Mode: Outcome Status select */
            <FormControl fullWidth error={!!errors.status} disabled={isSubmitting}>
              <InputLabel id="resolve-status-label">Select Outcome</InputLabel>
              <Select
                labelId="resolve-status-label"
                label="Select Outcome"
                defaultValue="Approved"
                {...register('status', { required: 'Please select an outcome status' })}
              >
                <MenuItem value="Approved">Approved (Task marked Completed)</MenuItem>
                <MenuItem value="Changes Required">Changes Required (Feedback needed)</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          ) : (
            /* Create Mode: Select Reviewer dropdown */
            <FormControl fullWidth error={!!errors.reviewerId} disabled={loading || isSubmitting}>
              <InputLabel id="request-reviewer-label">Select Reviewer</InputLabel>
              <Select
                labelId="request-reviewer-label"
                label="Select Reviewer"
                defaultValue=""
                {...register('reviewerId', { required: 'Please select a reviewer' })}
              >
                {reviewers.length === 0 ? (
                  <MenuItem value="" disabled>
                    {loading ? 'Loading reviewers...' : 'No active reviewer options'}
                  </MenuItem>
                ) : (
                  reviewers.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.role?.name})
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.reviewerId && <FormHelperText>{errors.reviewerId.message}</FormHelperText>}
            </FormControl>
          )}

          {/* Comments input */}
          <TextField
            id="review-dialog-comments"
            fullWidth
            multiline
            rows={3}
            label={isResolveMode ? 'Review Feedback Notes' : 'Request comments / instructions'}
            error={!!errors.comments}
            helperText={errors.comments?.message}
            disabled={isSubmitting}
            {...register('comments', {
              required: isResolveMode ? 'Outcome comments/feedback is required' : false,
            })}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1.5, gap: 1 }}>
          <AppButton variant="outlined" onClick={handleClose} disabled={isSubmitting} fullWidth>
            Cancel
          </AppButton>
          <AppButton variant="primary" type="submit" loading={isSubmitting} fullWidth>
            {isResolveMode ? 'Submit Outcome' : 'Request Review'}
          </AppButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ReviewDialog;
