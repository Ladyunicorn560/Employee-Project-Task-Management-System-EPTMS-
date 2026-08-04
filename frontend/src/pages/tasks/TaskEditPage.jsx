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

import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import employeeService from '../../services/employeeService';
import useAuth from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { toInputDate } from '../../utils/dateUtils';

/**
 * TaskEditPage
 * Page for updating task parameters.
 * Restricts input fields dynamically: Employees can only edit Status & Actual Hours.
 */
const TaskEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
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

  const statusVal = watch('status');

  const loadData = useCallback(async () => {
    setLoadingInitial(true);
    setLoadError(false);
    setForbiddenError(false);
    try {
      // 1. Load active employees for assignee dropdown
      const empRes = await employeeService.getAll({ limit: 100 });
      setEmployees((empRes.data?.data || []).filter((e) => e.status === 'Active'));

      // 2. Load task details
      const msData = await taskService.getById(id);
      if (msData) {
        setTask(msData);
        // Load associated project to check PM ownership
        const projData = await projectService.getById(msData.projectId);
        setProject(projData);

        // Access Rule Check: Employees can only edit if assigned to
        const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
        const isPmOwner =
          user?.roleName === ROLES.PROJECT_MANAGER &&
          projData.projectManager?.id === user?.id;
        const isAssignedEmployee =
          user?.roleName === ROLES.EMPLOYEE &&
          msData.assignedEmployee?.id === user?.id;

        if (!isAdmin && !isPmOwner && !isAssignedEmployee) {
          setForbiddenError(true);
          return;
        }

        reset({
          title: msData.taskTitle || '',
          description: msData.description || '',
          assignedTo: msData.assignedEmployee?.id || '',
          priority: msData.priority || 'Low',
          status: msData.status || 'Pending',
          dueDate: toInputDate(msData.dueDate) || '',
          completedDate: toInputDate(msData.completedDate) || '',
          estimatedHours: msData.estimatedHours || 0,
          actualHours: msData.actualHours || 0,
        });
      } else {
        setLoadError(true);
      }
    } catch (err) {
      console.error('Failed to load task edit details:', err);
      setLoadError(true);
    } finally {
      setLoadingInitial(false);
    }
  }, [id, reset, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Window unload warn
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
      navigate(`${ROUTES.TASKS}/${id}`);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Build role-aware payload to prevent employee modification issues if they try to edit locked fields
      const isEmployee = user?.roleName === ROLES.EMPLOYEE;
      let payload = {};

      if (isEmployee) {
        // Employees can only update status & hours
        payload = {
          status: data.status,
          actualHours: parseFloat(data.actualHours || 0),
          completedDate: data.status === 'Completed' ? (data.completedDate || new Date().toISOString().split('T')[0]) : null,
        };
      } else {
        payload = {
          title: data.title.trim(),
          description: data.description.trim() || null,
          assignedTo: data.assignedTo ? parseInt(data.assignedTo, 10) : null,
          priority: data.priority,
          status: data.status,
          dueDate: data.dueDate,
          estimatedHours: parseFloat(data.estimatedHours || 0),
          actualHours: parseFloat(data.actualHours || 0),
          completedDate: data.status === 'Completed' ? (data.completedDate || new Date().toISOString().split('T')[0]) : null,
        };
      }

      await taskService.update(id, payload);
      toast.success('Task details updated successfully.');
      reset(data); // clear dirty state
      navigate(`${ROUTES.TASKS}/${id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update task details.';
      toast.error(msg);
    }
  };

  if (loadingInitial) {
    return <PageLoader message="Loading task file..." />;
  }

  if (forbiddenError) {
    return (
      <Box>
        <PageHeader title="Edit Task" breadcrumbItems={[{ label: 'Tasks', to: ROUTES.TASKS }, { label: 'Edit' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Access denied. You are only authorized to update tasks you are assigned to or that belong to projects you manage.
        </Alert>
      </Box>
    );
  }

  if (loadError || !task) {
    return (
      <Box>
        <PageHeader title="Edit Task" breadcrumbItems={[{ label: 'Tasks', to: ROUTES.TASKS }, { label: 'Edit' }]} />
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load task details. The record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  const isEmployee = user?.roleName === ROLES.EMPLOYEE;

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Edit Task Details"
        description={`Milestone: ${task.milestoneTitle || '—'}`}
        breadcrumbItems={[
          { label: 'Tasks', to: ROUTES.TASKS },
          { label: 'Edit' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Core details */}
        <FormSection title="Task Parameters" subtitle="Specify title, notes, and task urgency" disabled={isEmployee}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                id="task-edit-title"
                fullWidth
                label="Task Title"
                disabled={isEmployee}
                error={!!errors.title}
                helperText={errors.title?.message}
                {...register('title', { required: 'Task title is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!errors.priority} disabled={isEmployee}>
                <InputLabel id="task-edit-priority">Priority</InputLabel>
                <Select
                  labelId="task-edit-priority"
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
            <Grid item xs={12}>
              <TextField
                id="task-edit-desc"
                fullWidth
                multiline
                rows={3}
                label="Description"
                disabled={isEmployee}
                {...register('description')}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Resources and scheduling */}
        <FormSection title="Resource & Work Management" subtitle="Update assignee, timelines, and logged actual hours">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.assignedTo} disabled={isEmployee}>
                <InputLabel id="task-edit-assignee">Assigned Employee</InputLabel>
                <Select
                  labelId="task-edit-assignee"
                  label="Assigned Employee"
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
            <Grid item xs={12} sm={6}>
              <TextField
                id="task-edit-due-date"
                fullWidth
                type="date"
                label="Due Date"
                disabled={isEmployee}
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
                {...register('dueDate', { required: 'Due date is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.status}>
                <InputLabel id="task-edit-status-label">Status</InputLabel>
                <Select
                  labelId="task-edit-status-label"
                  label="Status"
                  defaultValue="Pending"
                  {...register('status', { required: 'Status is required' })}
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Under Review">Under Review</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
                {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
              </FormControl>
            </Grid>
            {statusVal === 'Completed' && (
              <Grid item xs={12} sm={6}>
                <TextField
                  id="task-edit-completed-date"
                  fullWidth
                  type="date"
                  label="Completed Date"
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={!!errors.completedDate}
                  helperText={errors.completedDate?.message}
                  {...register('completedDate')}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                id="task-edit-esthours"
                fullWidth
                type="number"
                label="Estimated Hours"
                disabled={isEmployee}
                slotProps={{ htmlInput: { min: 0 } }}
                error={!!errors.estimatedHours}
                helperText={errors.estimatedHours?.message}
                {...register('estimatedHours', {
                  min: { value: 0, message: 'Estimated hours cannot be negative' },
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="task-edit-acthours"
                fullWidth
                type="number"
                label="Actual Hours Logged"
                slotProps={{ htmlInput: { min: 0 } }}
                error={!!errors.actualHours}
                helperText={errors.actualHours?.message}
                {...register('actualHours', {
                  min: { value: 0, message: 'Logged hours cannot be negative' },
                })}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Form actions cancel / submit row */}
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
        message="You have unsaved edits. Are you sure you want to discard them and return to the task details overview?"
        confirmLabel="Discard"
        cancelLabel="Keep Editing"
        confirmColor="error"
        variant="warning"
        onConfirm={() => navigate(`${ROUTES.TASKS}/${id}`)}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </Box>
  );
};

export default TaskEditPage;
