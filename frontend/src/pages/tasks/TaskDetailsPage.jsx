import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Divider, Alert, Tabs, Tab, Avatar,
} from '@mui/material';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import ChecklistRoundedIcon from '@mui/icons-material/ChecklistRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import AttachFileRoundedIcon from '@mui/icons-material/AttachFileRounded';

import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import PriorityChip from '../../components/common/PriorityChip';
import HoursDisplay from '../../components/common/HoursDisplay';
import AppButton from '../../components/ui/AppButton';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';

import TaskSubtasksTab from './components/TaskSubtasksTab';
import TaskCommentsTab from './components/TaskCommentsTab';
import TaskAttachmentsTab from './components/TaskAttachmentsTab';
import TaskReviewsTab from './components/TaskReviewsTab';

import useAuth from '../../hooks/useAuth';
import taskService from '../../services/taskService';
import projectService from '../../services/projectService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

const DetailInfoRow = ({ label, value }) => (
  <Box sx={{ display: 'flex', py: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
    <Typography variant="body2" color="text.secondary" sx={{ width: 180, fontWeight: 500, flexShrink: 0 }}>
      {label}
    </Typography>
    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600 }}>
      {value ?? '—'}
    </Typography>
  </Box>
);

/**
 * TaskDetailsPage
 * Renders complete task overview card, hours totals, and tabs for Subtasks, Comments, Attachments, and Reviews.
 */
const TaskDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await taskService.getById(id);
      setTask(data);

      if (data?.projectId) {
        const projData = await projectService.getById(data.projectId);
        setProject(projData);
      }
    } catch (err) {
      console.error('Failed to load task details:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return <PageLoader message="Loading task file..." />;
  }

  if (error || !task) {
    return (
      <Box>
        <AppButton variant="outlined" startIcon={<KeyboardArrowLeftRoundedIcon />} onClick={() => navigate(ROUTES.TASKS)}>
          Back to List
        </AppButton>
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          Failed to fetch task details. The record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  // Edit Permissions: Admin, PM managing the project, or Assigned employee
  const isAssigned = task.assignedEmployee?.id === user?.id;
  const canManageTasks = isAdmin || (isPM && project?.projectManager?.id === user?.id);
  const canUserEdit = canManageTasks || (isEmployee && isAssigned);

  const assigneeInitial = task.assignedEmployee?.firstName?.[0] || 'U';

  return (
    <Box>
      <PageHeader
        title={task.taskTitle}
        description={`Milestone: ${task.milestoneTitle || '—'} / Project: ${task.projectName || '—'}`}
        breadcrumbItems={[
          { label: 'Tasks', to: ROUTES.TASKS },
          { label: task.taskTitle },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <AppButton
              variant="outlined"
              startIcon={<KeyboardArrowLeftRoundedIcon />}
              onClick={() => navigate(ROUTES.TASKS)}
            >
              Back to List
            </AppButton>
            {canUserEdit && (
              <AppButton
                variant="primary"
                startIcon={<ModeEditOutlineOutlinedIcon />}
                onClick={() => navigate(`${ROUTES.TASKS}/${id}/edit`)}
              >
                Edit Task
              </AppButton>
            )}
          </Box>
        }
      />

      {/* Detail Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="task details tabs">
          <Tab label="Overview" />
          <Tab label="Subtasks" />
          <Tab label="Comments" />
          <Tab label="Attachments" />
          <Tab label="Reviews" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Main Info Card */}
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <TaskAltRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Task Information
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ mt: 2 }}>
                  <DetailInfoRow label="Title" value={task.taskTitle} />
                  <DetailInfoRow label="Description" value={task.description || 'No description provided.'} />
                  <DetailInfoRow label="Priority" value={<PriorityChip priority={task.priority} size="medium" />} />
                  <DetailInfoRow label="Status" value={<StatusChip status={task.status} />} />
                  <DetailInfoRow 
                    label="Due Date" 
                    value={
                      (() => {
                        const isTaskOverdue = task.status !== 'Completed' && task.status !== 'Cancelled' && task.dueDate && new Date(task.dueDate) < new Date();
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography 
                              variant="body2" 
                              color={isTaskOverdue ? 'error.main' : 'text.primary'} 
                              fontWeight={isTaskOverdue ? 600 : 500}
                              sx={{ m: 0 }}
                            >
                              {formatDate(task.dueDate)}
                            </Typography>
                            {isTaskOverdue && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: 'error.main',
                                  fontWeight: 800,
                                  backgroundColor: '#FFF5F5',
                                  px: 0.75,
                                  py: 0.2,
                                  borderRadius: '4px',
                                  border: '1px solid',
                                  borderColor: 'error.light',
                                  textTransform: 'uppercase',
                                  fontSize: '0.62rem',
                                  letterSpacing: 0.5
                                }}
                              >
                                Overdue
                              </Typography>
                            )}
                          </Box>
                        );
                      })()
                    } 
                  />
                  <DetailInfoRow label="Completed Date" value={formatDate(task.completedDate)} />
                  <DetailInfoRow label="Created On" value={formatDateTime(task.createdDate)} />
                  <DetailInfoRow label="Last Updated" value={task.updatedDate ? formatDateTime(task.updatedDate) : '—'} />
                </Box>
              </CardContent>
            </Card>
 
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Task Hours Allocated
                </Typography>
                <HoursDisplay estimated={task.estimatedHours} actual={task.actualHours} />
              </CardContent>
            </Card>
          </Grid>
 
          {/* Assignee and Project Node info */}
          <Grid item xs={12} md={5}>
            {/* Assignee & Reviewer Card */}
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                  Assigned Employee
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {task.assignedEmployee ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: 'primary.main', fontWeight: 700 }}>
                      {assigneeInitial}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {task.assignedEmployee.firstName} {task.assignedEmployee.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {task.assignedEmployee.email}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Unassigned task
                  </Typography>
                )}

                <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 4, mb: 2 }}>
                  Designated Reviewer
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {task.reviewer ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: 'secondary.main', fontWeight: 700 }}>
                      {task.reviewer.firstName?.[0] || 'R'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {task.reviewer.firstName} {task.reviewer.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {task.reviewer.email}
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No reviewer assigned
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <FolderRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Organizational Node
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ mt: 1 }}>
                  <DetailInfoRow label="Project Name" value={task.projectName} />
                  <DetailInfoRow label="Milestone Title" value={task.milestoneTitle} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <TaskSubtasksTab task={task} />
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <TaskCommentsTab task={task} />
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <TaskAttachmentsTab task={task} />
          </CardContent>
        </Card>
      )}

      {tabValue === 4 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <TaskReviewsTab task={task} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default TaskDetailsPage;
