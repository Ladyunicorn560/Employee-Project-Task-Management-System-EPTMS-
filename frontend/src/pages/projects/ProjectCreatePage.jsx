import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box, Grid, TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText,
} from '@mui/material';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/forms/FormSection';
import FormActions from '../../components/forms/FormActions';

import projectService from '../../services/projectService';
import departmentService from '../../services/departmentService';
import employeeService from '../../services/employeeService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';

/**
 * ProjectCreatePage
 * Renders create form for projects. Accessible to Admins & PMs.
 */
const ProjectCreatePage = () => {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [pms, setPms] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      projectName: '',
      description: '',
      departmentId: '',
      projectManagerId: '',
      status: 'Planning',
      startDate: '',
      endDate: '',
      progressPercentage: 0,
    },
  });

  const startDateVal = watch('startDate');

  // Fetch dropdown collections
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const [deptRes, pmRes] = await Promise.all([
          departmentService.getAll({ limit: 100 }),
          employeeService.getAll({ limit: 100 }),
        ]);
        setDepartments(deptRes.data || []);
        // Only select PMs or Admins
        const filtered = (pmRes.data || []).filter(
          (emp) =>
            emp.role?.name === ROLES.PROJECT_MANAGER ||
            emp.role?.name === ROLES.ADMINISTRATOR
        );
        setPms(filtered);
      } catch (err) {
        console.error('Failed to load project form options:', err);
        toast.error('Failed to load department or project manager list options.');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchLists();
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        projectName: data.projectName.trim(),
        description: data.description.trim() || null,
        departmentId: parseInt(data.departmentId, 10),
        projectManagerId: parseInt(data.projectManagerId, 10),
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        progressPercentage: parseFloat(data.progressPercentage || 0),
      };

      await projectService.create(payload);
      toast.success('Project created successfully.');
      navigate(ROUTES.PROJECTS);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create project.';
      toast.error(msg);
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Add New Project"
        description="Launch a new client project and allocate manager ownership."
        breadcrumbItems={[
          { label: 'Projects', to: ROUTES.PROJECTS },
          { label: 'Add Project' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Profile details */}
        <FormSection title="Project Details" subtitle="Name, description, and status settings">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                id="proj-create-name"
                fullWidth
                label="Project Name"
                error={!!errors.projectName}
                helperText={errors.projectName?.message}
                {...register('projectName', { required: 'Project name is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="medium" fullWidth error={!!errors.status}>
                <InputLabel id="proj-create-status-label">Status</InputLabel>
                <Select
                  labelId="proj-create-status-label"
                  label="Status"
                  defaultValue="Planning"
                  {...register('status', { required: 'Status is required' })}
                >
                  <MenuItem value="Planning">Planning</MenuItem>
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="On Hold">On Hold</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
                {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="proj-create-desc"
                fullWidth
                multiline
                rows={3}
                label="Description"
                {...register('description')}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Ownership assignment */}
        <FormSection title="Work Alignment" subtitle="Select organizational node and lead project manager">
          <Grid container spacing={2.5}>
            <Grid item xs={12} md={6}>
              <FormControl size="medium" fullWidth error={!!errors.departmentId} disabled={loadingOptions}>
                <InputLabel id="proj-create-dept-label">Department</InputLabel>
                <Select
                  labelId="proj-create-dept-label"
                  label="Department"
                  defaultValue=""
                  {...register('departmentId', { required: 'Department is required' })}
                >
                  <MenuItem value="" disabled>Select Department</MenuItem>
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.departmentName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.departmentId && <FormHelperText>{errors.departmentId.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl size="medium" fullWidth error={!!errors.projectManagerId} disabled={loadingOptions}>
                <InputLabel id="proj-create-pm-label">Project Manager</InputLabel>
                <Select
                  labelId="proj-create-pm-label"
                  label="Project Manager"
                  defaultValue=""
                  {...register('projectManagerId', { required: 'Project Manager is required' })}
                >
                  <MenuItem value="" disabled>Select Project Manager</MenuItem>
                  {pms.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.projectManagerId && <FormHelperText>{errors.projectManagerId.message}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </FormSection>

        {/* Time parameters */}
        <FormSection title="Project Schedule" subtitle="Configure dates and track progress">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="proj-create-start-date"
                fullWidth
                type="date"
                label="Start Date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.startDate}
                helperText={errors.startDate?.message}
                {...register('startDate', { required: 'Start date is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="proj-create-end-date"
                fullWidth
                type="date"
                label="End Date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.endDate}
                helperText={errors.endDate?.message}
                {...register('endDate', {
                  required: 'End date is required',
                  validate: (val) => {
                    if (!startDateVal || !val) return true;
                    return (
                      new Date(val) >= new Date(startDateVal) ||
                      'End date cannot be before start date'
                    );
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="proj-create-progress"
                fullWidth
                type="number"
                label="Initial Progress (%)"
                slotProps={{ htmlInput: { min: 0, max: 100 } }}
                error={!!errors.progressPercentage}
                helperText={errors.progressPercentage?.message}
                {...register('progressPercentage', {
                  min: { value: 0, message: 'Cannot be negative' },
                  max: { value: 100, message: 'Cannot exceed 100%' },
                })}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Action Panel */}
        <FormActions
          loading={isSubmitting}
          submitLabel="Create Project"
          onCancel={() => navigate(ROUTES.PROJECTS)}
        />
      </Box>
    </Box>
  );
};

export default ProjectCreatePage;
