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

import departmentService from '../../services/departmentService';
import employeeService from '../../services/employeeService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';

/**
 * DepartmentCreatePage
 * Create company departments. Admin role only.
 */
const DepartmentCreatePage = () => {
  const navigate = useNavigate();
  const [managers, setManagers] = useState([]);
  const [loadingManagers, setLoadingManagers] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      departmentName: '',
      description: '',
      managerId: '',
    },
  });

  // Fetch PMs and Admins to select as department manager
  useEffect(() => {
    const fetchPossibleManagers = async () => {
      try {
        const res = await employeeService.getAll({ limit: 100 });
        const list = res.data || [];
        // Filter: only show Administrators or Project Managers
        const filtered = list.filter(
          (emp) =>
            emp.role?.name === ROLES.PROJECT_MANAGER ||
            emp.role?.name === ROLES.ADMINISTRATOR
        );
        setManagers(filtered);
      } catch (err) {
        console.error('Failed to load managers list:', err);
      } finally {
        setLoadingManagers(false);
      }
    };
    fetchPossibleManagers();
  }, []);

  const onSubmit = async (data) => {
    try {
      const payload = {
        departmentName: data.departmentName.trim(),
        description: data.description.trim() || null,
      };

      await departmentService.create(payload);
      toast.success('Department created successfully.');
      navigate(ROUTES.DEPARTMENTS);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create department.';
      toast.error(msg);
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Add New Department"
        description="Create a company organizational branch."
        breadcrumbItems={[
          { label: 'Departments', to: ROUTES.DEPARTMENTS },
          { label: 'Add Department' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Core details */}
        <FormSection title="Department Specification" subtitle="Configure branch properties">
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                id="dept-name"
                fullWidth
                label="Department Name"
                error={!!errors.departmentName}
                helperText={errors.departmentName?.message}
                {...register('departmentName', { required: 'Department name is required' })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="dept-description"
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
                <InputLabel id="dept-create-manager-label">Department Head / Manager</InputLabel>
                <Select
                  labelId="dept-create-manager-label"
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
          submitLabel="Create Department"
          onCancel={() => navigate(ROUTES.DEPARTMENTS)}
        />
      </Box>
    </Box>
  );
};

export default DepartmentCreatePage;
