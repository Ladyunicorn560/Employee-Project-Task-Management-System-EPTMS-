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

import useAuth from '../../hooks/useAuth';
import projectService from '../../services/projectService';
import departmentService from '../../services/departmentService';
import employeeService from '../../services/employeeService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { toInputDate } from '../../utils/dateUtils';

/**
 * ProjectEditPage
 * Page for editing existing projects.
 * Restricted to Admins, and PMs who are assigned to manage the project.
 */
const ProjectEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [pms, setPms] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [forbiddenError, setForbiddenError] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    mode: 'onBlur',
  });

  const startDateVal = watch('startDate');

  // Load dropdown lists and project details
  const loadData = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(false);
    setForbiddenError(false);
    try {
      // 1. Fetch dropdown options
      const [deptRes, pmRes] = await Promise.all([
        departmentService.getAll({ limit: 100 }),
        employeeService.getAll({ limit: 100 }),
      ]);
      setDepartments(deptRes.data?.data || []);
      const filtered = (pmRes.data?.data || []).filter(
        (emp) =>
          emp.role?.name === ROLES.PROJECT_MANAGER ||
          emp.role?.name === ROLES.ADMINISTRATOR
      );
      setPms(filtered);
      setLoadingOptions(false);

      // 2. Fetch project details
      const projData = await projectService.getById(id);
      if (projData) {
        // PM Ownership Guard: PMs can only edit projects they manage
        const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
        const isAssignedPm =
          user?.roleName === ROLES.PROJECT_MANAGER &&
          projData.projectManager?.id === user?.id;

        if (!isAdmin && !isAssignedPm) {
          setForbiddenError(true);
          return;
        }

        reset({
          projectName: projData.projectName || '',
          description: projData.description || '',
          departmentId: projData.department?.id || '',
          projectManagerId: projData.projectManager?.id || '',
          status: projData.status || 'Planning',
          startDate: toInputDate(projData.startDate),
          endDate: toInputDate(projData.endDate),
          progressPercentage: projData.progressPercentage || 0,
        });
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Failed to load project edit data:', err);
      setLoadError(true);
    } finally {
      setInitialLoading(false);
    }
  }, [id, reset, user]);

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
      navigate(`${ROUTES.PROJECTS}/${id}`);
    }
  };

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

      await projectService.update(id, payload);
      toast.success('Project details updated successfully.');
      reset(data); // clear dirty state
      navigate(`${ROUTES.PROJECTS}/${id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update project.';
      toast.error(msg);
    }
  };

  if (initialLoading) {
    return <PageLoader message="Loading project file..." />;
  }

  if (forbiddenError) {
    return (
      <Box>
        <PageHeader title="Edit Project" breadcrumbItems={[{ label: 'Projects', to: ROUTES.PROJECTS }, { label: 'Edit' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Access denied. You are only authorized to update projects that you manage.
        </Alert>
      </Box>
    );
  }

  if (loadError) {
    return (
      <Box>
        <PageHeader title="Edit Project" breadcrumbItems={[{ label: 'Projects', to: ROUTES.PROJECTS }, { label: 'Edit' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load project details. The record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Edit Project details"
        description="Update scheduler and manager allocation below."
        breadcrumbItems={[
          { label: 'Projects', to: ROUTES.PROJECTS },
          { label: 'Edit' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Core fields */}
        <FormSection title="Project Details" subtitle="Name, description, and status settings">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                id="proj-edit-name"
                fullWidth
                label="Project Name"
                error={!!errors.projectName}
                helperText={errors.projectName?.message}
                {...register('projectName', { required: 'Project name is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl size="medium" fullWidth error={!!errors.status}>
                <InputLabel id="proj-edit-status-label">Status</InputLabel>
                <Select
                  labelId="proj-edit-status-label"
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
                id="proj-edit-desc"
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
        <FormSection title="Work Alignment" subtitle="Select department and lead project manager">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FormControl size="medium" fullWidth error={!!errors.departmentId} disabled={loadingOptions}>
                <InputLabel id="proj-edit-dept-label">Department</InputLabel>
                <Select
                  labelId="proj-edit-dept-label"
                  label="Department"
                  defaultValue=""
                  {...register('departmentId', { required: 'Department is required' })}
                >
                  {departments.map((d) => (
                    <MenuItem key={d.id} value={d.id}>
                      {d.departmentName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.departmentId && <FormHelperText>{errors.departmentId.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="medium" fullWidth error={!!errors.projectManagerId} disabled={loadingOptions}>
                <InputLabel id="proj-edit-pm-label">Project Manager</InputLabel>
                <Select
                  labelId="proj-edit-pm-label"
                  label="Project Manager"
                  defaultValue=""
                  {...register('projectManagerId', { required: 'Project Manager is required' })}
                >
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
                id="proj-edit-start-date"
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
                id="proj-edit-end-date"
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
                id="proj-edit-progress"
                fullWidth
                type="number"
                label="Project Progress (%)"
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
          submitLabel="Save Changes"
          onCancel={handleCancelClick}
        />
      </Box>

      {/* Cancel Warning Modal */}
      <ConfirmDialog
        open={showCancelConfirm}
        title="Discard Changes"
        message="You have unsaved edits. Are you sure you want to discard them and return to the project overview?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        confirmColor="error"
        variant="warning"
        onConfirm={() => navigate(`${ROUTES.PROJECTS}/${id}`)}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </Box>
  );
};

export default ProjectEditPage;
