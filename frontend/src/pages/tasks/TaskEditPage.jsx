import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box, Grid, TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Alert,
} from '@mui/material';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/forms/FormSection';
import FormActions from '../../components/forms/FormActions';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageLoader from '../../components/ui/PageLoader';

import projectService from '../../services/projectService';
import taskService from '../../services/taskService';
import memberService from '../../services/memberService';
import useAuth from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { toInputDate } from '../../utils/dateUtils';

/**
 * TaskEditPage
 * Allows editing details of an existing milestone task.
 * Enforces role-based permissions (Employees can only update progress/actual hours).
 */
const TaskEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;

  // State
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [projectAssignees, setProjectAssignees] = useState([]);
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [forbiddenError, setForbiddenError] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    mode: 'onBlur',
  });

  const statusVal = watch('status');

  const loadData = useCallback(async () => {
    setLoadingInitial(true);
    setLoadError(false);
    setForbiddenError(false);
    try {
      // 1. Fetch task details
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

        // Fetch valid project assignees (Project Manager + Project Members)
        const membersData = await memberService.getProjectMembers(msData.projectId);
        const list = [];
        if (projData?.projectManager) {
          list.push({
            id: projData.projectManager.id,
            firstName: projData.projectManager.firstName,
            lastName: projData.projectManager.lastName,
            department: projData.department,
            roleInProject: 'Project Manager',
          });
        }
        if (membersData) {
          membersData.forEach((m) => {
            if (m.employee && m.employee.status === 'Active' && !list.some((x) => x.id === m.employee.id)) {
              list.push({
                id: m.employee.id,
                firstName: m.employee.firstName,
                lastName: m.employee.lastName,
                department: m.employee.department,
                roleInProject: m.roleInProject || 'Member',
              });
            }
          });
        }
        setProjectAssignees(list);

        reset({
          title: msData.taskTitle || '',
          description: msData.description || '',
          assignedTo: msData.assignedEmployee?.id || '',
          reviewerId: msData.reviewerId || '',
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
        // Employees can ONLY edit status, logged hours, and mandatory status comment
        payload = {
          status: data.status,
          actualHours: parseFloat(data.actualHours || 0),
          comment: data.comment || undefined,
        };
      } else {
        // PM / Admin full parameters
        payload = {
          taskTitle: data.title.trim(),
          description: data.description ? data.description.trim() : null,
          assignedEmployeeId: data.assignedTo ? parseInt(data.assignedTo, 10) : null,
          reviewerId: data.reviewerId ? parseInt(data.reviewerId, 10) : null,
          priority: data.priority,
          status: data.status,
          comment: data.comment || undefined,
          dueDate: data.dueDate,
          estimatedHours: parseFloat(data.estimatedHours || 0),
          actualHours: parseFloat(data.actualHours || 0),
          completedDate: data.status === 'Completed' ? data.completedDate : null,
        };
      }

      await taskService.update(id, payload);
      toast.success('Task details updated successfully.');
      navigate(`${ROUTES.TASKS}/${id}`);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update task details.';
      toast.error(msg);
    }
  };

  if (loadingInitial) {
    return <PageLoader />;
  }

  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load the requested task. It may not exist or database is offline.</Alert>
      </Box>
    );
  }

  if (forbiddenError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. You do not have permissions to modify this task. Tasks can only be edited by Admins, the Project Manager of the project, or the Assigned Employee.
        </Alert>
      </Box>
    );
  }

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
                error={!isEmployee && !!errors.title}
                helperText={!isEmployee ? errors.title?.message : undefined}
                {...register('title', { required: !isEmployee ? 'Task title is required' : false })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Controller
                name="priority"
                control={control}
                rules={{ required: !isEmployee ? 'Priority is required' : false }}
                render={({ field }) => (
                  <FormControl fullWidth error={!isEmployee && !!errors.priority} disabled={isEmployee}>
                    <InputLabel id="task-edit-priority">Priority</InputLabel>
                    <Select {...field} labelId="task-edit-priority" label="Priority">
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Low">Low</MenuItem>
                    </Select>
                    {!isEmployee && errors.priority && <FormHelperText>{errors.priority.message}</FormHelperText>}
                  </FormControl>
                )}
              />
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
            <Grid item xs={12} md={6}>
              <Controller
                name="assignedTo"
                control={control}
                rules={{ required: !isEmployee ? 'Assigned employee is required' : false }}
                render={({ field }) => (
                  <FormControl fullWidth error={!isEmployee && !!errors.assignedTo} disabled={isEmployee}>
                    <InputLabel id="task-edit-assignee">Assigned Employee</InputLabel>
                    <Select {...field} labelId="task-edit-assignee" label="Assigned Employee">
                      <MenuItem value="">Select Employee</MenuItem>
                      {projectAssignees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.roleInProject})
                        </MenuItem>
                      ))}
                    </Select>
                    {!isEmployee && errors.assignedTo && <FormHelperText>{errors.assignedTo.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Controller
                name="reviewerId"
                control={control}
                rules={{ required: !isEmployee ? 'Assigned reviewer is required' : false }}
                render={({ field }) => (
                  <FormControl fullWidth error={!isEmployee && !!errors.reviewerId} disabled={isEmployee}>
                    <InputLabel id="task-edit-reviewer">Assigned Reviewer</InputLabel>
                    <Select {...field} labelId="task-edit-reviewer" label="Assigned Reviewer">
                      <MenuItem value="">Select Reviewer</MenuItem>
                      {projectAssignees.map((emp) => (
                        <MenuItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.roleInProject})
                        </MenuItem>
                      ))}
                    </Select>
                    {!isEmployee && errors.reviewerId && <FormHelperText>{errors.reviewerId.message}</FormHelperText>}
                  </FormControl>
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="task-edit-due-date"
                fullWidth
                type="date"
                label="Due Date"
                disabled={isEmployee}
                slotProps={{ inputLabel: { shrink: true } }}
                error={!isEmployee && !!errors.dueDate}
                helperText={!isEmployee ? errors.dueDate?.message : undefined}
                {...register('dueDate', { required: !isEmployee ? 'Due date is required' : false })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {(() => {
                const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
                const isPmOwner = user?.roleName === ROLES.PROJECT_MANAGER && project?.projectManager?.id === user?.id;
                const isReviewerForTask = isAdmin || isPmOwner || task?.reviewerId === user?.id || task?.reviewer?.id === user?.id;
                const isCurrentlyUnderReview = task?.status === 'Under Review';

                return (
                  <Controller
                    name="status"
                    control={control}
                    rules={{ required: 'Status is required' }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.status} disabled={isCurrentlyUnderReview && !isReviewerForTask}>
                        <InputLabel id="task-edit-status-label">Status</InputLabel>
                        <Select {...field} labelId="task-edit-status-label" label="Status">
                          <MenuItem value="Not Started">Not Started</MenuItem>
                          <MenuItem value="Assigned">Assigned</MenuItem>
                          <MenuItem value="In Progress">In Progress</MenuItem>
                          <MenuItem value="Waiting for Information">Waiting for Information</MenuItem>
                          <MenuItem value="Blocked">Blocked</MenuItem>
                          <MenuItem value="Ready for Review">Ready for Review</MenuItem>
                          <MenuItem value="Under Review" disabled={!isReviewerForTask}>
                            {!isReviewerForTask ? 'Under Review (Reviewer Only)' : 'Under Review'}
                          </MenuItem>
                          <MenuItem value="Changes Required">Changes Required</MenuItem>
                          <MenuItem value="Completed">Completed</MenuItem>
                          <MenuItem value="Cancelled" disabled={isEmployee}>
                            {isEmployee ? 'Cancelled (Manager Approval Required)' : 'Cancelled'}
                          </MenuItem>
                        </Select>
                        {errors.status && <FormHelperText>{errors.status.message}</FormHelperText>}
                        {isCurrentlyUnderReview && !isReviewerForTask && (
                          <FormHelperText sx={{ color: 'warning.main' }}>
                            Task is currently Under Review. Status can only be updated by the assigned Reviewer.
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                );
              })()}
            </Grid>

            {statusVal && statusVal !== task?.status && (
              <Grid item xs={12}>
                <TextField
                  id="task-edit-status-comment"
                  fullWidth
                  multiline
                  rows={2}
                  label="Comment (Required for Status Change)"
                  placeholder="Explain the reason for updating the task status..."
                  error={!!errors.comment}
                  helperText={errors.comment?.message || 'Status changes require a tracked comment.'}
                  {...register('comment', {
                    validate: (val) =>
                      statusVal === task?.status || (val && val.trim().length > 0) || 'Comment is mandatory when changing status.',
                  })}
                />
              </Grid>
            )}

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
