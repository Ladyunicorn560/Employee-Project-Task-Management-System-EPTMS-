import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Box, Grid, TextField, MenuItem, Select, FormControl, InputLabel, FormHelperText, Alert,
} from '@mui/material';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import FormSection from '../../components/forms/FormSection';
import FormActions from '../../components/forms/FormActions';
import PageLoader from '../../components/ui/PageLoader';

import projectService from '../../services/projectService';
import milestoneService from '../../services/milestoneService';
import employeeService from '../../services/employeeService';
import taskService from '../../services/taskService';
import { ROUTES } from '../../constants/routes';

/**
 * TaskCreatePage
 * Renders create form for milestone tasks.
 */
const TaskCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMilestoneId = searchParams.get('milestoneId');

  // Dropdown lists
  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMilestones, setLoadingMilestones] = useState(false);

  // Selected values (cascade)
  const [selectedProj, setSelectedProj] = useState('');
  const [selectedMS, setSelectedMS] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
      assignedTo: '',
      priority: 'Low',
      status: 'Pending',
      dueDate: '',
      estimatedHours: 0,
    },
  });

  // 1. Initial Load: Projects, Employees, and preloaded milestone details
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingInitial(true);
      try {
        const [projRes, empRes] = await Promise.all([
          projectService.getAll({ limit: 100 }),
          employeeService.getAll({ limit: 100 }),
        ]);

        setProjects(projRes.data?.data || []);
        setEmployees((empRes.data?.data || []).filter((e) => e.status === 'Active'));

        // If a milestoneId is provided, pre-select project and milestone
        if (initialMilestoneId) {
          const msData = await milestoneService.getById(initialMilestoneId);
          if (msData) {
            setSelectedProj(msData.projectId);
            // Fetch milestones for that project to populate list
            const msRes = await milestoneService.getByProjectId(msData.projectId, { limit: 100 });
            setMilestones(msRes.data?.data || []);
            setSelectedMS(initialMilestoneId);
          }
        }
      } catch (err) {
        console.error('Failed to load initial task create fields:', err);
        toast.error('Failed to load employee list options.');
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchInitialData();
  }, [initialMilestoneId]);

  // 2. Cascade load milestones if project selection changes manually
  const handleProjectChange = async (e) => {
    const projId = e.target.value;
    setSelectedProj(projId);
    setSelectedMS('');
    setMilestones([]);
    setLoadingMilestones(true);
    try {
      const res = await milestoneService.getByProjectId(projId, { limit: 100 });
      setMilestones(res.data?.data || []);
    } catch (err) {
      console.error('Failed to load milestones for project:', err);
    } finally {
      setLoadingMilestones(false);
    }
  };

  const onSubmit = async (data) => {
    if (!selectedMS) {
      toast.error('Please select a target milestone first.');
      return;
    }
    try {
      const payload = {
        title: data.title.trim(),
        description: data.description.trim() || null,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo, 10) : null,
        priority: data.priority,
        status: data.status,
        dueDate: data.dueDate,
        estimatedHours: parseFloat(data.estimatedHours || 0),
      };

      await taskService.createInMilestone(selectedMS, payload);
      toast.success('Task created successfully.');
      navigate(ROUTES.TASKS);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create task.';
      toast.error(msg);
    }
  };

  if (loadingInitial) {
    return <PageLoader message="Initializing task create form..." />;
  }

  return (
    <Box sx={{ maxWidth: 800 }}>
      <PageHeader
        title="Add Milestone Task"
        description="Launch a new action item under project milestone timeline nodes."
        breadcrumbItems={[
          { label: 'Tasks', to: ROUTES.TASKS },
          { label: 'Create' },
        ]}
      />

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Cascade project selectors */}
        <FormSection title="Organizational Bounds" subtitle="Assign target project and milestone">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!!initialMilestoneId}>
                <InputLabel id="task-create-proj-select">Select Project</InputLabel>
                <Select
                  labelId="task-create-proj-select"
                  value={selectedProj}
                  onChange={handleProjectChange}
                  label="Select Project"
                >
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.projectName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!!initialMilestoneId || loadingMilestones || !selectedProj}>
                <InputLabel id="task-create-ms-select">Select Milestone</InputLabel>
                <Select
                  labelId="task-create-ms-select"
                  value={selectedMS}
                  onChange={(e) => setSelectedMS(e.target.value)}
                  label="Select Milestone"
                >
                  {milestones.map((m) => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.milestoneTitle}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </FormSection>

        {/* Task details */}
        <FormSection title="Task Parameters" subtitle="Specify title, notes, and task urgency">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={8}>
              <TextField
                id="task-create-title"
                fullWidth
                label="Task Title"
                error={!!errors.title}
                helperText={errors.title?.message}
                {...register('title', { required: 'Task title is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth error={!!errors.priority}>
                <InputLabel id="task-create-priority">Priority</InputLabel>
                <Select
                  labelId="task-create-priority"
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
                id="task-create-desc"
                fullWidth
                multiline
                rows={3}
                label="Description"
                {...register('description')}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Work settings and assignee */}
        <FormSection title="Resource Assignment" subtitle="Allocate assignee and project schedule estimations">
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.assignedTo}>
                <InputLabel id="task-create-assignee">Assigned Employee</InputLabel>
                <Select
                  labelId="task-create-assignee"
                  label="Assigned Employee"
                  defaultValue=""
                  {...register('assignedTo')}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.department?.name})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="task-create-due-date"
                fullWidth
                type="date"
                label="Due Date"
                slotProps={{ inputLabel: { shrink: true } }}
                error={!!errors.dueDate}
                helperText={errors.dueDate?.message}
                {...register('dueDate', { required: 'Due date is required' })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="task-create-esthours"
                fullWidth
                type="number"
                label="Estimated Hours"
                slotProps={{ htmlInput: { min: 0 } }}
                error={!!errors.estimatedHours}
                helperText={errors.estimatedHours?.message}
                {...register('estimatedHours', {
                  min: { value: 0, message: 'Hours cannot be negative' },
                })}
              />
            </Grid>
          </Grid>
        </FormSection>

        {/* Form Action row */}
        <FormActions
          loading={isSubmitting}
          submitLabel="Create Task"
          onCancel={() => navigate(ROUTES.TASKS)}
        />
      </Box>
    </Box>
  );
};

export default TaskCreatePage;
