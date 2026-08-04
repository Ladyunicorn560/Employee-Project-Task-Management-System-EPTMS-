import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Box, Grid, TextField, Alert } from '@mui/material';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/forms/FormSection';
import FormActions from '../../components/forms/FormActions';
import PageLoader from '../../components/ui/PageLoader';
import PermissionMatrix from '../../components/common/PermissionMatrix';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import roleService from '../../services/roleService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';

const SYSTEM_CRITICAL_ROLES = [
  ROLES.ADMINISTRATOR,
  ROLES.PROJECT_MANAGER,
  ROLES.EMPLOYEE,
  ROLES.REVIEWER,
];

/**
 * RoleEditPage
 * Page for editing custom and system access roles. Admin only.
 */
const RoleEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [permissions, setPermissions] = useState({});
  const [initialPermissions, setInitialPermissions] = useState({});
  const [isSystemRole, setIsSystemRole] = useState(false);

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

  const loadData = useCallback(async () => {
    setInitialLoading(true);
    setLoadError(false);
    try {
      const data = await roleService.getById(id);
      if (data) {
        reset({
          roleName: data.roleName || '',
          description: data.description || '',
        });
        const perms = data.permissions || {};
        setPermissions(perms);
        setInitialPermissions(perms);
        setIsSystemRole(SYSTEM_CRITICAL_ROLES.includes(data.roleName));
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Failed to load role details:', err);
      setLoadError(true);
    } finally {
      setInitialLoading(false);
    }
  }, [id, reset]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if permissions object has been changed from initial load
  const isPermissionsDirty = JSON.stringify(permissions) !== JSON.stringify(initialPermissions);
  const isFormDirty = isDirty || isPermissionsDirty;

  // Window unload warn
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isFormDirty]);

  const handleCancelClick = () => {
    if (isFormDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate(ROUTES.ROLES);
    }
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        roleName: data.roleName.trim(),
        description: data.description.trim() || null,
        permissions,
      };

      await roleService.update(id, payload);
      toast.success('Access Role updated successfully.');
      navigate(`${ROUTES.ROLES}/${id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update access role.';
      toast.error(msg);
    }
  };

  if (initialLoading) {
    return <PageLoader message="Loading role parameters..." />;
  }

  if (loadError) {
    return (
      <Box>
        <PageHeader title="Edit Role" breadcrumbItems={[{ label: 'Roles', to: ROUTES.ROLES }, { label: 'Edit' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load role details. The role record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Edit Access Role"
        description="Update description or customize access permissions matrix."
        breadcrumbItems={[
          { label: 'Roles', to: ROUTES.ROLES },
          { label: 'Edit' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Core fields */}
        <FormSection title="Role Identification" subtitle="Set name and descriptive notes">
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                id="role-edit-name"
                fullWidth
                label="Role Name"
                disabled={isSystemRole}
                error={!!errors.roleName}
                helperText={errors.roleName?.message || (isSystemRole ? 'Core system roles cannot be renamed' : '')}
                {...register('roleName', { required: 'Role name is required' })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="role-edit-desc"
                fullWidth
                multiline
                rows={2}
                label="Description"
                error={!!errors.description}
                helperText={errors.description?.message}
                {...register('description')}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Permissions check matrix */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, mt: 1 }}>
          Configure Access Policy Matrix
        </Typography>
        <PermissionMatrix
          value={permissions}
          onChange={setPermissions}
        />

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
        onConfirm={() => navigate(ROUTES.ROLES)}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </Box>
  );
};

export default RoleEditPage;
