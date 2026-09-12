import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Divider, Alert, Tabs, Tab, Chip,
} from '@mui/material';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';

import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import ProgressBar from '../../components/common/ProgressBar';
import DateRangeDisplay from '../../components/common/DateRangeDisplay';
import AppButton from '../../components/ui/AppButton';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';

import useAuth from '../../hooks/useAuth';
import projectService from '../../services/projectService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

import ProjectMembersTab from './components/ProjectMembersTab';
import ProjectMilestonesTab from './components/ProjectMilestonesTab';
import ProjectTasksTab from './components/ProjectTasksTab';

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
 * ProjectDetailsPage
 * Renders complete project overview and prepares tab placeholders for Members, Milestones, and Tasks.
 */
const ProjectDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

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
      const data = await projectService.getById(id);
      setProject(data);
    } catch (err) {
      console.error('Failed to load project details:', err);
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
    return <PageLoader message="Loading project file..." />;
  }

  if (error || !project) {
    return (
      <Box>
        <AppButton variant="outlined" startIcon={<KeyboardArrowLeftRoundedIcon />} onClick={() => navigate(ROUTES.PROJECTS)}>
          Back to List
        </AppButton>
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          Failed to fetch project details. The record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  const projectManagerName = project.projectManager
    ? `${project.projectManager.firstName} ${project.projectManager.lastName}`
    : '—';

  // PM Ownership Check: PM can only edit projects they manage
  const canUserEdit = isAdmin || (isPM && project.projectManager?.id === user?.id);

  return (
    <Box>
      <PageHeader
        title={project.projectName}
        description={`Department: ${project.department?.name || '—'}`}
        breadcrumbItems={[
          { label: 'Projects', to: ROUTES.PROJECTS },
          { label: project.projectName },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <AppButton
              variant="outlined"
              startIcon={<KeyboardArrowLeftRoundedIcon />}
              onClick={() => navigate(ROUTES.PROJECTS)}
            >
              Back to List
            </AppButton>
            {canUserEdit && (
              <AppButton
                variant="primary"
                startIcon={<ModeEditOutlineOutlinedIcon />}
                onClick={() => navigate(`${ROUTES.PROJECTS}/${id}/edit`)}
              >
                Edit Project
              </AppButton>
            )}
          </Box>
        }
      />

      {/* Tabs Menu */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="project detail sections">
          <Tab label="Overview" />
          <Tab label="Team Members" />
          <Tab label="Milestones" />
          <Tab label="Tasks" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Main Info */}
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <FolderRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Project Overview
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ mt: 2 }}>
                  <DetailInfoRow label="Project Name" value={project.projectName} />
                  <DetailInfoRow label="Description" value={project.description || 'No description provided.'} />
                  <DetailInfoRow
                    label="Timeline"
                    value={
                      <DateRangeDisplay 
                        startDate={project.startDate} 
                        endDate={project.endDate} 
                        isOverdue={project.status !== 'Completed' && project.endDate && new Date(project.endDate) < new Date()}
                      />
                    }
                  />
                  <DetailInfoRow label="Status" value={<StatusChip status={project.status} />} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Project Track Progress
                </Typography>
                <ProgressBar value={project.progressPercentage} height={10} color="auto" />
              </CardContent>
            </Card>
          </Grid>

          {/* Side Info */}
          <Grid item xs={12} md={5}>
            {/* Project Manager details */}
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <PeopleAltRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Project Manager
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ mt: 1 }}>
                  <DetailInfoRow label="Manager Name" value={projectManagerName} />
                  <DetailInfoRow label="Manager Email" value={project.projectManager?.email} />
                </Box>
              </CardContent>
            </Card>

            {/* Financial & Profit/Loss Summary Card (Hidden for Employees) */}
            {!isEmployee && (
              <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Financial & Profit / Loss Summary
                    </Typography>
                    {project.profitLoss !== undefined && (
                      <Chip
                        label={project.isProfit ? `Profit +₹${Number(project.profitLoss).toLocaleString()}` : `Loss -₹${Math.abs(Number(project.profitLoss)).toLocaleString()}`}
                        color={project.isProfit ? 'success' : 'error'}
                        sx={{ fontWeight: 800 }}
                      />
                    )}
                  </Box>
                  <Divider />
                  <Box sx={{ mt: 1 }}>
                    <DetailInfoRow label="Total Amount (Budget)" value={`₹${Number(project.totalAmount || project.TotalAmount || 0).toLocaleString()}`} />
                    <DetailInfoRow label="Total Incurred Cost (Timecards)" value={`₹${Number(project.totalIncurredCost || project.TotalIncurredCost || 0).toLocaleString()}`} />
                    <DetailInfoRow label="Other Expenses" value={`₹${Number(project.otherExpenses || project.OtherExpenses || 0).toLocaleString()}`} />
                    <DetailInfoRow
                      label="Remaining Budget Balance"
                      value={
                        <Typography variant="body2" sx={{ fontWeight: 800, color: (project.remainingBudget || 0) >= 0 ? '#2E7D32' : '#D32F2F' }}>
                          ₹{Number(project.remainingBudget || 0).toLocaleString()}
                        </Typography>
                      }
                    />
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Audit details */}
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                  System Audit Information
                </Typography>
                <Divider />
                <Box sx={{ mt: 1 }}>
                  <DetailInfoRow label="Created Date" value={formatDateTime(project.createdDate)} />
                  <DetailInfoRow label="Last Updated" value={project.updatedDate ? formatDateTime(project.updatedDate) : 'Never updated'} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <ProjectMembersTab project={project} />
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <ProjectMilestonesTab project={project} />
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <ProjectTasksTab project={project} />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProjectDetailsPage;
