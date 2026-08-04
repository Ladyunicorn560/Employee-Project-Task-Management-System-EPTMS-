import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, MenuItem, Select,
  FormControl, InputLabel, TextField, FormHelperText, IconButton,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { toast } from 'react-toastify';

import AppButton from '../../../components/ui/AppButton';
import employeeService from '../../../services/employeeService';
import projectService from '../../../services/projectService';

/**
 * ProjectMemberDialog
 * Modal popup to assign an employee as a project member.
 *
 * @param {boolean} open
 * @param {number} projectId
 * @param {Array<number>} assignedMemberIds - Array of employee IDs already assigned (to filter them out)
 * @param {function} onClose
 * @param {function} onSuccess - Callback triggered on successful addition
 */
const ProjectMemberDialog = ({ open, projectId, assignedMemberIds = [], onClose, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      employeeId: '',
      roleInProject: 'Team Member',
    },
  });

  // Fetch active employees on dialog mount
  useEffect(() => {
    if (!open) return;
    const fetchEmployeesList = async () => {
      setLoading(true);
      try {
        const res = await employeeService.getAll({ limit: 100 });
        const list = res.data?.data || [];
        // Filter out employees who are:
        // 1. Inactive or Suspended
        // 2. Already assigned as project member
        const unassigned = list.filter(
          (emp) => emp.status === 'Active' && !assignedMemberIds.includes(emp.id)
        );
        setEmployees(unassigned);
      } catch (err) {
        console.error('Failed to fetch unassigned employees list:', err);
        toast.error('Failed to load employees selection list.');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeesList();
  }, [open, assignedMemberIds]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        employeeId: parseInt(data.employeeId, 10),
        roleInProject: data.roleInProject.trim(),
      };
      await projectService.addMember(projectId, payload);
      toast.success('Team member assigned successfully.');
      reset();
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to assign project member.';
      toast.error(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Assign Team Member
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ p: 3, pt: 1, display: 'flex', flexDirection: 'column', gap: 3.5 }}>
          {/* Employee dropdown */}
          <FormControl fullWidth error={!!errors.employeeId} disabled={loading || isSubmitting}>
            <InputLabel id="assign-member-select-label">Select Employee</InputLabel>
            <Select
              labelId="assign-member-select-label"
              label="Select Employee"
              defaultValue=""
              {...register('employeeId', { required: 'Please select an employee' })}
            >
              {employees.length === 0 ? (
                <MenuItem value="" disabled>
                  {loading ? 'Loading employees...' : 'No available active employees'}
                </MenuItem>
              ) : (
                employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.department?.name})
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.employeeId && <FormHelperText>{errors.employeeId.message}</FormHelperText>}
          </FormControl>

          {/* Role in Project input */}
          <TextField
            id="assign-member-role"
            fullWidth
            label="Role in Project"
            error={!!errors.roleInProject}
            helperText={errors.roleInProject?.message || 'e.g. Lead QA, Senior Frontend Developer'}
            disabled={isSubmitting}
            {...register('roleInProject', { required: 'Project role label is required' })}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1.5, gap: 1 }}>
          <AppButton variant="outlined" onClick={handleClose} disabled={isSubmitting} fullWidth>
            Cancel
          </AppButton>
          <AppButton variant="primary" type="submit" loading={isSubmitting} fullWidth>
            Assign Member
          </AppButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ProjectMemberDialog;
