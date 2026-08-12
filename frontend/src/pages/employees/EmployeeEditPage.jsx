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

import employeeService from '../../services/employeeService';
import departmentService from '../../services/departmentService';
import roleService from '../../services/roleService';
import { ROUTES } from '../../constants/routes';
import { VALIDATION } from '../../utils/validationUtils';

/**
 * EmployeeEditPage
 * Page for editing existing employee profiles. Admin only.
 */
const EmployeeEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Unsaved changes confirm dialog
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

  // Fetch roles, departments and initial employee data
  const loadData = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(false);
    try {
      // 1. Fetch options first
      const [deptRes, roleRes] = await Promise.all([
        departmentService.getAll({ limit: 100 }),
        roleService.getAll({ limit: 100 }),
      ]);
      setDepartments(deptRes.data || []);
      setRoles(roleRes.data || []);
      setLoadingOptions(false);

      // 2. Fetch employee details
      const empData = await employeeService.getById(id);
      if (empData) {
        const defaultValues = {
          firstName: empData.firstName || '',
          lastName: empData.lastName || '',
          email: empData.email || '',
          phone: empData.phone || '',
          departmentId: empData.department?.id || '',
          roleId: empData.role?.id || '',
          status: empData.status || 'Active',
        };
        reset(defaultValues);
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Failed to load edit screen options or details:', err);
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
      navigate(ROUTES.EMPLOYEES);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim() || null,
        departmentId: parseInt(data.departmentId, 10),
        roleId: parseInt(data.roleId, 10),
        status: data.status,
      };

      await employeeService.update(id, payload);
      toast.success('Employee profile updated successfully.');
      reset(data); // reset dirty state to clear prompt
      navigate(`${ROUTES.EMPLOYEES}/${id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update employee profile.';
      toast.error(msg);
    }
  };

  if (initialLoading) {
    return <PageLoader message="Fetching employee profile..." />;
  }

  if (loadError) {
    return (
      <Box>
        <PageHeader title="Edit Employee" breadcrumbItems={[{ label: 'Employees', to: ROUTES.EMPLOYEES }, { label: 'Edit' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load employee details. The employee record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Edit Employee Profile"
        description="Update contact, role and department settings below."
        breadcrumbItems={[
          { label: 'Employees', to: ROUTES.EMPLOYEES },
          { label: 'Edit Profile' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Personal Details */}
        <FormSection title="Personal Information" subtitle="Full name and status configurations">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="emp-edit-first-name"
                fullWidth
                label="First Name"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                {...register('firstName', { required: 'First name is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="emp-edit-last-name"
                fullWidth
                label="Last Name"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                {...register('lastName', { required: 'Last name is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="medium" fullWidth error={!!errors.status}>
                <InputLabel id="emp-edit-status-label">Status</InputLabel>
                <Select
                  labelId="emp-edit-status-label"
                  label="Status"
                  defaultValue="Active"
                  {...register('status', { required: 'Status is required' })}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                  <MenuItem value="Suspended">Suspended</MenuItem>
                </Select>
                {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>
        </FormSection>

        {/* Contact & Account Credentials */}
        <FormSection title="Account & Contact" subtitle="Primary contact channels">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="emp-edit-email"
                fullWidth
                label="Email Address"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email', VALIDATION.email)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="emp-edit-phone"
                fullWidth
                label="Phone Number"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                {...register('phone')}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Work Assignment */}
        <FormSection title="Work & Hierarchy" subtitle="Change department or access level">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FormControl size="medium" fullWidth error={!!errors.departmentId} disabled={loadingOptions}>
                <InputLabel id="emp-edit-dept-label">Department</InputLabel>
                <Select
                  labelId="emp-edit-dept-label"
                  label="Department"
                  defaultValue=""
                  {...register('departmentId', { required: 'Department assignment is required' })}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.departmentId && <FormHelperText>{errors.departmentId.message}</FormHelperText>}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="medium" fullWidth error={!!errors.roleId} disabled={loadingOptions}>
                <InputLabel id="emp-edit-role-label">System Role</InputLabel>
                <Select
                  labelId="emp-edit-role-label"
                  label="System Role"
                  defaultValue=""
                  {...register('roleId', { required: 'Role assignment is required' })}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.roleName}
                    </MenuItem>
                  ))}
                </Select>
                {errors.roleId && <FormHelperText>{errors.roleId.message}</FormHelperText>}
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
        onConfirm={() => navigate(ROUTES.EMPLOYEES)}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </Box>
  );
};

export default EmployeeEditPage;
