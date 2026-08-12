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

import departmentService from '../../services/departmentService';
import employeeService from '../../services/employeeService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';

/**
 * DepartmentEditPage
 * Page for editing existing departments. Admin only.
 */
const DepartmentEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    mode: 'onBlur',
  });

  // Fetch managers & department details
  const loadData = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(false);
    try {
      // 1. Fetch managers list first
      const managerRes = await employeeService.getAll({ limit: 100 });
      const list = managerRes.data || [];
      const filtered = list.filter(
        (emp) =>
          emp.role?.name === ROLES.PROJECT_MANAGER ||
          emp.role?.name === ROLES.ADMINISTRATOR
      );
      setManagers(filtered);
      setLoadingManagers(false);

      // 2. Fetch department details
      const deptData = await departmentService.getById(id);
      if (deptData) {
        reset({
          departmentName: deptData.departmentName || '',
          description: deptData.description || '',
          managerId: '', // Default placeholder as not persisted in DB
        });
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Failed to load department details:', err);
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
      navigate(ROUTES.DEPARTMENTS);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        departmentName: data.departmentName.trim(),
        description: data.description.trim() || null,
      };

      await departmentService.update(id, payload);
      toast.success('Department updated successfully.');
      reset(data); // clear dirty state
      navigate(`${ROUTES.DEPARTMENTS}/${id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update department.';
      toast.error(msg);
    }
  };

  if (initialLoading) {
    return <PageLoader message="Loading department..." />;
  }

  if (loadError) {
    return (
      <Box>
        <PageHeader title="Edit Department" breadcrumbItems={[{ label: 'Departments', to: ROUTES.DEPARTMENTS }, { label: 'Edit' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load department details. The department record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Edit Department"
        description="Update department details below."
        breadcrumbItems={[
          { label: 'Departments', to: ROUTES.DEPARTMENTS },
          { label: 'Edit' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Core details */}
        <FormSection title="Department Specification" subtitle="Configure branch properties">
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                id="dept-edit-name"
                fullWidth
                label="Department Name"
                error={!!errors.departmentName}
                helperText={errors.departmentName?.message}
                {...register('departmentName', { required: 'Department name is required' })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="dept-edit-description"
                fullWidth
                multiline
                rows={3}
                label="Description"
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register('description')}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Manager configuration */}
        <FormSection title="Management Assignment" subtitle="Designate a manager or director for this node">
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <FormControl size="medium" fullWidth error={!!errors.managerId} disabled={loadingManagers}>
                <InputLabel id="dept-edit-manager-label">Department Head / Manager</InputLabel>
                <Select
                  labelId="dept-edit-manager-label"
                  label="Department Head / Manager"
                  defaultValue=""
                  {...register('managerId')}
                >
                  <MenuItem value="">No Manager Assigned</MenuItem>
                  {managers.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.role?.name})
                    </MenuItem>
                  ))}
                </Select>
                <FormHelperText>
                  Note: Manager relationships are displayed as metadata profiles.
                </FormHelperText>
              </FormControl>
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
        message="You have unsaved edits. Are you sure you want to discard them and return to the list?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        confirmColor="error"
        variant="warning"
        onConfirm={() => navigate(ROUTES.DEPARTMENTS)}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </Box>
  );
};

export default DepartmentEditPage;
