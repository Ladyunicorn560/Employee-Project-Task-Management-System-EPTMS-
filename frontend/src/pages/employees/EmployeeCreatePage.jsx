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

import employeeService from '../../services/employeeService';
import departmentService from '../../services/departmentService';
import roleService from '../../services/roleService';
import { ROUTES } from '../../constants/routes';
import { VALIDATION } from '../../utils/validationUtils';

/**
 * EmployeeCreatePage
 * Page for creating new employees. Administrator role only.
 */
const EmployeeCreatePage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loadingLists, setLoadingLists] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      departmentId: '',
      roleId: '',
      status: 'Active',
    },
  });

  // Fetch roles and departments for select inputs
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [deptRes, roleRes] = await Promise.all([
          departmentService.getAll({ limit: 100 }),
          roleService.getAll({ limit: 100 }),
        ]);
        setDepartments(deptRes.data || []);
        setRoles(roleRes.data || []);
      } catch (err) {
        console.error('Failed to load form options:', err);
        toast.error('Failed to load departments or roles options.');
      } finally {
        setLoadingLists(false);
      }
    };
    loadOptions();
  }, []);

  const onSubmit = async (data) => {
    try {
      // Map form fields to API payload
      const payload = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim(),
        phone: data.phone.trim() || null,
        password: data.password,
        departmentId: parseInt(data.departmentId, 10),
        roleId: parseInt(data.roleId, 10),
        status: data.status,
      };

      await employeeService.create(payload);
      toast.success('Employee created successfully.');
      navigate(ROUTES.EMPLOYEES);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create employee profile.';
      toast.error(msg);
    }
  };

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Add New Employee"
        description="Fill out the fields below to create a new user profile."
        breadcrumbItems={[
          { label: 'Employees', to: ROUTES.EMPLOYEES },
          { label: 'Add Employee' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Profile Details */}
        <FormSection title="Personal Information" subtitle="Name and status configurations">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="emp-first-name"
                fullWidth
                label="First Name"
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
                {...register('firstName', { required: 'First name is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="emp-last-name"
                fullWidth
                label="Last Name"
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
                {...register('lastName', { required: 'Last name is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl size="medium" fullWidth error={!!errors.status}>
                <InputLabel id="emp-create-status-label">Status</InputLabel>
                <Select
                  labelId="emp-create-status-label"
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
        <FormSection title="Account & Contact" subtitle="Authentication and communications setup">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                id="emp-email"
                fullWidth
                label="Email Address"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email', VALIDATION.email)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="emp-phone"
                fullWidth
                label="Phone Number"
                error={!!errors.phone}
                helperText={errors.phone?.message}
                {...register('phone')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="emp-password"
                fullWidth
                label="Initial Password"
                type="password"
                error={!!errors.password}
                helperText={errors.password?.message || 'Must contain at least 8 characters with 1 capital and 1 number'}
                {...register('password', VALIDATION.password)}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Work Assignment */}
        <FormSection title="Work & Hierarchy" subtitle="Assign organizational node and credentials level">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FormControl size="medium" fullWidth error={!!errors.departmentId} disabled={loadingLists}>
                <InputLabel id="emp-create-dept-label">Department</InputLabel>
                <Select
                  labelId="emp-create-dept-label"
                  label="Department"
                  defaultValue=""
                  {...register('departmentId', { required: 'Department assignment is required' })}
                >
                  <MenuItem value="" disabled>Select Department</MenuItem>
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
              <FormControl size="medium" fullWidth error={!!errors.roleId} disabled={loadingLists}>
                <InputLabel id="emp-create-role-label">System Role</InputLabel>
                <Select
                  labelId="emp-create-role-label"
                  label="System Role"
                  defaultValue=""
                  {...register('roleId', { required: 'Role assignment is required' })}
                >
                  <MenuItem value="" disabled>Select Role</MenuItem>
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
          submitLabel="Create Employee"
          onCancel={() => navigate(ROUTES.EMPLOYEES)}
        />
      </Box>
    </Box>
  );
};

export default EmployeeCreatePage;
