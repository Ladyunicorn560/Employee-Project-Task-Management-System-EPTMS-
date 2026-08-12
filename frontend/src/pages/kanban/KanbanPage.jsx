import { useState, useEffect, useCallback } from 'react';
import {
  Box, Grid, MenuItem, Select, FormControl, InputLabel, Typography, Card, CardContent,
  Avatar, Tooltip, IconButton, Menu, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';

import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/ui/AppButton';
import PriorityChip from '../../components/common/PriorityChip';
import projectService from '../../services/projectService';
import milestoneService from '../../services/milestoneService';
import taskService from '../../services/taskService';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { toast } from 'react-toastify';
import { formatDate } from '../../utils/dateUtils';

const KANBAN_COLUMNS = [
  { id: 'todo', label: 'To Do / Pending', statuses: ['Not Started', 'Assigned', 'Blocked', 'Pending', 'Changes Required'] },
  { id: 'inprogress', label: 'In Progress', statuses: ['In Progress'] },
  { id: 'underreview', label: 'Under Review', statuses: ['Ready for Review', 'Under Review'] },
  { id: 'completed', label: 'Completed', statuses: ['Completed'] }
];

const KanbanPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const isReviewer = user?.roleName === ROLES.REVIEWER;

  const [projects, setProjects] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('');

  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingMilestones, setLoadingMilestones] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Card Menu State
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [activeTask, setActiveTask] = useState(null);

  // 1. Fetch Projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const assignedEmployeeId = isEmployee || isReviewer ? user?.id : undefined;
        const res = await projectService.getAll({ limit: 100, assignedEmployeeId });
        setProjects(res.data || []);
        // Do NOT auto-select first project – default to "All Projects"
      } catch (err) {
        console.error('Failed to load projects for kanban:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchProjects();
  }, [isEmployee, isReviewer, user?.id]);

  // 2. Fetch Milestones when project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setMilestones([]);
      setSelectedMilestoneId('');
      return;
    }
    const fetchMilestones = async () => {
      setLoadingMilestones(true);
      try {
        const res = await milestoneService.getByProjectId(selectedProjectId, { limit: 100 });
        setMilestones(res.data || []);
        setSelectedMilestoneId(''); // default to "All Milestones"
      } catch (err) {
        console.error('Failed to load milestones for kanban:', err);
      } finally {
        setLoadingMilestones(false);
      }
    };
    fetchMilestones();
  }, [selectedProjectId]);

  // 3. Fetch Tasks — uses global taskService.getAll with optional project/milestone filters
  const fetchTasksForKanban = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const assignedEmployeeId = isEmployee || isReviewer ? user?.id : undefined;
      const res = await taskService.getAll({
        projectId: selectedProjectId || undefined,
        milestoneId: selectedMilestoneId || undefined,
        assignedEmployeeId,
        limit: 200,
      });
      setTasks(res.data || []);
    } catch (err) {
      console.error('Failed to fetch tasks for kanban:', err);
    } finally {
      setLoadingTasks(false);
    }
  }, [selectedProjectId, selectedMilestoneId, isEmployee, isReviewer, user?.id]);

  useEffect(() => {
    fetchTasksForKanban();
  }, [fetchTasksForKanban]);

  const handleMenuOpen = (e, task) => {
    setMenuAnchor(e.currentTarget);
    setActiveTask(task);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setActiveTask(null);
  };

  const handleUpdateStatus = async (status) => {
    if (!activeTask) return;
    handleMenuClose();
    try {
      await taskService.update(activeTask.id, {
        ...activeTask,
        status,
        completedDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : null
      });
      toast.success(`Task status updated to ${status}.`);
      fetchTasksForKanban();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update task status.';
      toast.error(msg);
    }
  };

  const getTasksByColumn = (col) => {
    return tasks.filter((t) => col.statuses.includes(t.status));
  };

  return (
    <Box>
      <PageHeader
        title="Kanban Board"
        description="Agile project board showing task pipelines grouped by lifecycle stage status."
        breadcrumbItems={[{ label: 'Work' }, { label: 'Kanban' }]}
      />

      {/* Selectors Bar */}
      <Card sx={{ mb: 4, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <FormControl size="small" fullWidth disabled={loadingProjects}>
                <InputLabel id="kanban-project-label">Project</InputLabel>
                <Select
                  labelId="kanban-project-label"
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  label="Project"
                >
                  <MenuItem value=""><em>All Projects</em></MenuItem>
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.projectName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <FormControl size="small" fullWidth disabled={loadingMilestones || !selectedProjectId}>
                <InputLabel id="kanban-ms-label">Milestone</InputLabel>
                <Select
                  labelId="kanban-ms-label"
                  value={selectedMilestoneId}
                  onChange={(e) => setSelectedMilestoneId(e.target.value)}
                  label="Milestone"
                >
                  <MenuItem value=""><em>All Milestones</em></MenuItem>
                  {milestones.map((m) => (
                    <MenuItem key={m.id} value={m.id}>{m.milestoneTitle}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Kanban Board Grid */}
      <Grid container spacing={2.5} sx={{ minHeight: '60vh' }}>
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = getTasksByColumn(col);
          return (
            <Grid item xs={12} sm={6} md={3} key={col.id}>
              <Box
                sx={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'divider',
                  minHeight: '100%',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2
                }}
              >
                {/* Column Title Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 0.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                    {col.label}
                  </Typography>
                  <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', fontWeight: 700, backgroundColor: 'primary.light', color: 'primary.dark' }}>
                    {colTasks.length}
                  </Avatar>
                </Box>

                {/* Cards List container */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, overflowY: 'auto' }}>
                  {loadingTasks ? (
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center', color: 'text.disabled' }}>
                      <Typography variant="caption">Loading...</Typography>
                    </Box>
                  ) : colTasks.length === 0 ? (
                    <Box sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center', color: 'text.disabled' }}>
                      <Typography variant="caption">Empty Column</Typography>
                    </Box>
                  ) : (
                    colTasks.map((task) => (
                      <Card
                        key={task.id}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          boxShadow: 'none',
                          transition: 'box-shadow 0.2s ease',
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
                          cursor: 'pointer',
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              sx={{ flex: 1, mr: 1, cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                              onClick={() => navigate(`${ROUTES.TASKS}/${task.id}`)}
                            >
                              {task.taskTitle}
                            </Typography>
                            {!isReviewer && (
                              <IconButton size="small" onClick={(e) => handleMenuOpen(e, task)} sx={{ ml: 'auto' }}>
                                <MoreVertRoundedIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                            <PriorityChip priority={task.priority} size="small" />
                            {task.dueDate && (
                              <Typography variant="caption" color="text.secondary">
                                Due: {formatDate(task.dueDate)}
                              </Typography>
                            )}
                          </Box>

                          {task.assignedEmployee && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                              {task.assignedEmployee.firstName} {task.assignedEmployee.lastName}
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Task Status Update Context Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Typography variant="overline" sx={{ px: 2, py: 1, display: 'block', color: 'text.secondary' }}>
          Update Status
        </Typography>
        <Divider />
        {['Not Started', 'Assigned', 'In Progress', 'Ready for Review', 'Under Review', 'Changes Required', 'Completed', 'Cancelled'].map((s) => (
          <MenuItem key={s} onClick={() => handleUpdateStatus(s)} dense>
            {s}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem onClick={() => { handleMenuClose(); navigate(`${ROUTES.TASKS}/${activeTask?.id}`); }} dense>
          <VisibilityOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        {!isEmployee && !isReviewer && (
          <MenuItem onClick={() => { handleMenuClose(); navigate(`${ROUTES.TASKS}/${activeTask?.id}/edit`); }} dense>
            <ModeEditOutlineOutlinedIcon fontSize="small" sx={{ mr: 1 }} /> Edit Task
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
};

export default KanbanPage;
