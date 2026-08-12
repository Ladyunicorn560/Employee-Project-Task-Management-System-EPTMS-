import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Box, Grid, TextField, Typography } from '@mui/material';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/forms/FormSection';
import FormActions from '../../components/forms/FormActions';
import PermissionMatrix from '../../components/common/PermissionMatrix';

import roleService from '../../services/roleService';
import { ROUTES } from '../../constants/routes';

/**
 * RoleCreatePage
 * Form page for creating system access roles. Admin only.
 */
const RoleCreatePage = () => {
  const navigate = useNavigate();
  const [permissions, setPermissions] = useState({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      roleName: '',
      description: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const payload = {
        roleName: data.roleName.trim(),
        description: data.description.trim() || null,
        permissions, // flat JSON object
      };

      await roleService.create(payload);
      toast.success('Access Role created successfully.');
      navigate(ROUTES.ROLES);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create access role.';
      toast.error(msg);
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Create Access Role"
        description="Configure new access privileges and role parameters."
        breadcrumbItems={[
          { label: 'Roles', to: ROUTES.ROLES },
          { label: 'Create Role' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Core fields */}
        <FormSection title="Role Identification" subtitle="Set name and descriptive notes">
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                id="role-create-name"
                fullWidth
                label="Role Name"
                error={!!errors.roleName}
                helperText={errors.roleName?.message}
                {...register('roleName', { required: 'Role name is required' })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="role-create-desc"
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
          submitLabel="Create Role"
          onCancel={() => navigate(ROUTES.ROLES)}
        />
      </Box>
    </Box>
  );
};

export default RoleCreatePage;
