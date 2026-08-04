import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, MenuItem, Select,
  FormControl, InputLabel, TextField, FormHelperText, IconButton, Grid,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { toast } from 'react-toastify';

import AppButton from '../../../components/ui/AppButton';
import employeeService from '../../../services/employeeService';
import subtaskService from '../../../services/subtaskService';
import { toInputDate } from '../../../utils/dateUtils';

/**
 * SubtaskDialog
 * Dialog popup to create or edit a task subtask record.
 *
 * @param {boolean} open
 * @param {object} subtask - If editing, the subtask record to preload
 * @param {number} taskId - Parent task ID
 * @param {function} onClose
 * @param {function} onSuccess - Callback triggered on success
 */
const SubtaskDialog = ({ open, subtask, taskId, onClose, onSuccess }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const isEditMode = !!subtask;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
  });

  const statusVal = watch('status');

  // Load active employees list for selection
  useEffect(() => {
    if (!open) return;
    const fetchEmployeesList = async () => {
      setLoading(true);
      try {
        const res = await employeeService.getAll({ limit: 100 });
        setEmployees((res.data?.data || []).filter((e) => e.status === 'Active'));
      } catch (err) {
        console.error('Failed to load employees for subtasks:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeesList();
  }, [open]);

  // Preload subtask details if editing
  useEffect(() => {
    if (open) {
      if (isEditMode && subtask) {
        reset({
          title: subtask.subtaskTitle || '',
          description: subtask.description || '',
          assignedTo: subtask.assignedEmployee?.id || '',
          priority: subtask.priority || 'Low',
          status: subtask.status || 'Pending',
          dueDate: toInputDate(subtask.dueDate) || '',
          estimatedHours: subtask.estimatedHours || 0,
          actualHours: subtask.actualHours || 0,
        });
      } else {
        reset({
          title: '',
          description: '',
          assignedTo: '',
          priority: 'Low',
          status: 'Pending',
          dueDate: '',
          estimatedHours: 0,
          actualHours: 0,
        });
      }
    }
  }, [open, isEditMode, subtask, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        title: data.title.trim(),
        description: data.description.trim() || null,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo, 10) : null,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate,
        estimatedHours: parseFloat(data.estimatedHours || 0),
        actualHours: parseFloat(data.actualHours || 0),
        isCompleted: data.status === 'Completed',
        completedDate: data.status === 'Completed' ? new Date().toISOString().split('T')[0] : null,
      };

      if (isEditMode) {
        await subtaskService.update(subtask.id, payload);
        toast.success('Subtask updated successfully.');
      } else {
        await subtaskService.createInTask(taskId, payload);
        toast.success('Subtask created successfully.');
      }
      reset();
      onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save subtask details.';
      toast.error(msg);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ m: 0, p: 2.5, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {isEditMode ? 'Edit Subtask details' : 'Add Subtask item'}
        <IconButton onClick={handleClose} disabled={isSubmitting} size="small">
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent sx={{ p: 3, pt: 1 }}>
          <Grid container spacing={2.5}>
            {/* Title */}
            <Grid item xs={12}>
              <TextField
                id="subtask-dialog-title"
                fullWidth
                label="Subtask Title"
                error={!!errors.title}
                helperText={errors.title?.message}
                disabled={isSubmitting}
                {...register('title', { required: 'Subtask title is required' })}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                id="subtask-dialog-desc"
                fullWidth
                multiline
                rows={2}
                label="Description"
                disabled={isSubmitting}
                {...register('description')}
              />
            </Grid>

            {/* Assignee select */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.assignedTo} disabled={loading || isSubmitting}>
                <InputLabel id="subtask-dialog-assignee-label">Assignee</InputLabel>
                <Select
                  labelId="subtask-dialog-assignee-label"
                  label="Assignee"
                  defaultValue=""
                  {...register('assignedTo')}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Due Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="subtask-dialog-due-date"
                fullWidth
                type="date"
                label="Due Date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
                disabled={isSubmitting}
                {...register('dueDate', { required: 'Due date is required' })}
              />
            </Grid>

            {/* Status select */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.status} disabled={isSubmitting}>
                <InputLabel id="subtask-dialog-status-label">Status</InputLabel>
                <Select
                  labelId="subtask-dialog-status-label"
                  label="Status"
                  defaultValue="Pending"
                  {...register('status', { required: 'Status is required' })}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
                {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Priority select */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.priority} disabled={isSubmitting}>
                <InputLabel id="subtask-dialog-priority-label">Priority</InputLabel>
                <Select
                  labelId="subtask-dialog-priority-label"
                  label="Priority"
                  defaultValue="Low"
                  {...register('priority', { required: 'Priority is required' })}
                >
                  <MenuItem value="High">High</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="Low">Low</MenuItem>
                </Select>
                {errors.priority && <FormHelperText>{errors.priority.message}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Estimated Hours */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="subtask-dialog-esthours"
                fullWidth
                type="number"
                label="Estimated Hours"
                slotProps={{ htmlInput: { min: 0 } }}
                error={!!errors.estimatedHours}
                helperText={errors.estimatedHours?.message}
                disabled={isSubmitting}
                {...register('estimatedHours', {
                  min: { value: 0, message: 'Hours cannot be negative' },
                })}
              />
            </Grid>

            {/* Actual Hours */}
            <Grid item xs={12} sm={6}>
              <TextField
                id="subtask-dialog-acthours"
                fullWidth
                type="number"
                label="Actual Hours"
                slotProps={{ htmlInput: { min: 0 } }}
                error={!!errors.actualHours}
                helperText={errors.actualHours?.message}
                disabled={isSubmitting}
                {...register('actualHours', {
                  min: { value: 0, message: 'Hours cannot be negative' },
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1.5, gap: 1 }}>
          <AppButton variant="outlined" onClick={handleClose} disabled={isSubmitting} fullWidth>
            Cancel
          </AppButton>
          <AppButton variant="primary" type="submit" loading={isSubmitting} fullWidth>
            {isEditMode ? 'Save Changes' : 'Create Subtask'}
          </AppButton>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default SubtaskDialog;
