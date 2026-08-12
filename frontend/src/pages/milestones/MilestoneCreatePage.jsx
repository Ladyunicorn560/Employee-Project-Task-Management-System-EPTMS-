import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Box, Grid, TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Alert } from '@mui/material';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/forms/FormSection';
import FormActions from '../../components/forms/FormActions';
import projectService from '../../services/projectService';
import milestoneService from '../../services/milestoneService';
import { ROUTES } from '../../constants/routes';

/**
 * MilestoneCreatePage
 * Form page to add a new milestone to a project.
 */
const MilestoneCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const [project, setProject] = useState(null);
  const [loadingProject, setLoadingProject] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      milestoneTitle: '',
      description: '',
      status: 'Planning',
      dueDate: '',
    },
  });

  // Load project details to verify existence
  useEffect(() => {
    if (!projectId) return;
    const loadProject = async () => {
      try {
        const data = await projectService.getById(projectId);
        setProject(data);
      } catch (err) {
        console.error('Failed to load project details for milestone create:', err);
      } finally {
        setLoadingProject(false);
      }
    };
    loadProject();
  }, [projectId]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        milestoneTitle: data.milestoneTitle.trim(),
        description: data.description.trim() || null,
        status: data.status,
        dueDate: data.dueDate,
      };

      await milestoneService.createInProject(projectId, payload);
      toast.success('Milestone created successfully.');
      
      // Navigate back to project details milestones tab (index 2)
      navigate(`${ROUTES.PROJECTS}/${projectId}`);
    } catch (err) {
      const msg = err?.response?.data?.errors?.[0]?.message || err?.response?.data?.message || 'Failed to create milestone.';
      toast.error(msg);
    }
  };

  if (!projectId) {
    return (
      <Box>
        <PageHeader title="Add Milestone" breadcrumbItems={[{ label: 'Milestones', to: ROUTES.MILESTONES }, { label: 'Create' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Error: Missing Project ID query parameter. Cannot create a milestone without an associated project.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Add Project Milestone"
        description={loadingProject ? 'Loading associated project...' : `Project: ${project?.projectName || '—'}`}
        breadcrumbItems={[
          { label: 'Milestones', to: ROUTES.MILESTONES },
          { label: 'Create' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Core Info */}
        <FormSection title="Milestone Identification" subtitle="Set title, notes and current phase status">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                id="ms-create-title"
                fullWidth
                label="Milestone Title"
                error={!!errors.milestoneTitle}
                helperText={errors.milestoneTitle?.message}
                {...register('milestoneTitle', { required: 'Milestone title is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="medium" fullWidth error={!!errors.status}>
                <InputLabel id="ms-create-status-label">Status</InputLabel>
                <Select
                  labelId="ms-create-status-label"
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
                id="ms-create-desc"
                fullWidth
                multiline
                rows={3}
                label="Description"
                {...register('description')}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Timeline Scheduling */}
        <FormSection title="Phase Schedule" subtitle="Allocates target milestone target limit">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="ms-create-due-date"
                fullWidth
                type="date"
                label="Due Date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
                {...register('dueDate', { required: 'Due date is required' })}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Action Panel */}
        <FormActions
          loading={isSubmitting}
          submitLabel="Create Milestone"
          onCancel={() => navigate(`${ROUTES.PROJECTS}/${projectId}`)}
        />
      </Box>
    </Box>
  );
};

export default MilestoneCreatePage;
