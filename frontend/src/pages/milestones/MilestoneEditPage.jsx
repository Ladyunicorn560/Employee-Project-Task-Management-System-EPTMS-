import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box, Grid, TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Alert,
} from '@mui/material';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/forms/FormSection';
import FormActions from '../../components/forms/FormActions';
import PageLoader from '../../components/ui/PageLoader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import milestoneService from '../../services/milestoneService';
import projectService from '../../services/projectService';
import { ROUTES } from '../../constants/routes';
import { toInputDate } from '../../utils/dateUtils';

/**
 * MilestoneEditPage
 * Page for editing milestone details, description, status, due dates, and completion status.
 */
const MilestoneEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    mode: 'onBlur',
  });

  const statusVal = watch('status');

  // Load milestone details
  const loadData = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(false);
    try {
      const msData = await milestoneService.getById(id);
      if (msData) {
        setMilestone(msData);
        // Load associated project
        const projData = await projectService.getById(msData.projectId);
        setProject(projData);

        reset({
          milestoneTitle: msData.milestoneTitle || '',
          description: msData.description || '',
          status: msData.status || 'Planning',
          dueDate: toInputDate(msData.dueDate) || '',
          completedDate: toInputDate(msData.completedDate) || '',
        });
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Failed to load milestone edit data:', err);
      setLoadError(true);
    } finally {
      setInitialLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Window unload confirmation warning when form is dirty
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate(`${ROUTES.MILESTONES}/${id}`);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        milestoneTitle: data.milestoneTitle.trim(),
        description: data.description.trim() || null,
        status: data.status,
        dueDate: data.dueDate,
        completedDate: data.status === 'Completed' ? (data.completedDate || new Date().toISOString().split('T')[0]) : null,
      };

      await milestoneService.update(id, payload);
      toast.success('Milestone details updated successfully.');
      reset(data); // clear dirty state
      navigate(`${ROUTES.MILESTONES}/${id}`);
    } catch (err) {
      const msg = err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || 'Failed to update milestone.';
      toast.error(msg);
    }
  };

  if (initialLoading) {
    return <PageLoader message="Loading milestone file..." />;
  }

  if (loadError || !milestone) {
    return (
      <Box>
        <PageHeader title="Edit Milestone" breadcrumbItems={[{ label: 'Milestones', to: ROUTES.MILESTONES }, { label: 'Edit' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load milestone details. The record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Edit Milestone Details"
        description={`Associated Project: ${project?.projectName || '—'}`}
        breadcrumbItems={[
          { label: 'Milestones', to: ROUTES.MILESTONES },
          { label: 'Edit' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Core fields */}
        <FormSection title="Milestone Details" subtitle="Title, description, and status settings">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                id="ms-edit-title"
                fullWidth
                label="Milestone Title"
                error={!!errors.milestoneTitle}
                helperText={errors.milestoneTitle?.message}
                {...register('milestoneTitle', { required: 'Milestone title is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="medium" fullWidth error={!!errors.status}>
                <InputLabel id="ms-edit-status-label">Status</InputLabel>
                <Select
                  labelId="ms-edit-status-label"
                  label="Status"
                  defaultValue="Planning"
                  {...register('status', { required: 'Status is required' })}
                >
                  <MenuItem value="Not Started">Not Started</MenuItem>
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
                {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="ms-edit-desc"
                fullWidth
                multiline
                rows={3}
                label="Description"
                {...register('description')}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Schedule */}
        <FormSection title="Scheduling Timeline" subtitle="Configure target limits and completion date">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="ms-edit-due-date"
                fullWidth
                type="date"
                label="Due Date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
                {...register('dueDate', { required: 'Due date is required' })}
              />
            </Grid>
            {statusVal === 'Completed' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  id="ms-edit-completed-date"
                  fullWidth
                  type="date"
                  label="Completed Date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.completedDate}
                  helperText={errors.completedDate?.message}
                  {...register('completedDate')}
                />
              </Grid>
            )}
          </Grid>
        </FormSection>

        {/* Action Panel */}
        <FormActions
          loading={isSubmitting}
          submitLabel="Save Changes"
          onCancel={handleCancelClick}
        />
      </Box>

      {/* Cancel Warning Modal */}
      <ConfirmDialog
        open={showCancelConfirm}
        title="Discard Changes"
        message="You have unsaved edits. Are you sure you want to discard them and return to the milestone details?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        confirmColor="error"
        variant="warning"
        onConfirm={() => navigate(`${ROUTES.MILESTONES}/${id}`)}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </Box>
  );
};

export default MilestoneEditPage;
