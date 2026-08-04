import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Grid, Typography, Divider, Alert, Tabs, Tab,
} from '@mui/material';
import KeyboardArrowLeftRoundedIcon from '@mui/icons-material/KeyboardArrowLeftRounded';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';

import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import ProgressBar from '../../components/common/ProgressBar';
import AppButton from '../../components/ui/AppButton';
import PageLoader from '../../components/ui/PageLoader';
import EmptyState from '../../components/ui/EmptyState';

import useAuth from '../../hooks/useAuth';
import milestoneService from '../../services/milestoneService';
import projectService from '../../services/projectService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import { formatDate } from '../../utils/dateUtils';

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
 * MilestoneDetailsPage
 * Renders overview details for a milestone, alongside tabs for tasks and reviews placeholders.
 */
const MilestoneDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);

  const [milestone, setMilestone] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const msData = await milestoneService.getById(id);
      setMilestone(msData);

      // Load associated project to check PM ownership
      if (msData?.projectId) {
        const projData = await projectService.getById(msData.projectId);
        setProject(projData);
      }
    } catch (err) {
      console.error('Failed to load milestone details:', err);
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
    return <PageLoader message="Loading milestone profile..." />;
  }

  if (error || !milestone) {
    return (
      <Box>
        <AppButton variant="outlined" startIcon={<KeyboardArrowLeftRoundedIcon />} onClick={() => navigate(ROUTES.MILESTONES)}>
          Back to List
        </AppButton>
        <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
          Failed to fetch milestone details. The record does not exist or has been removed.
        </Alert>
      </Box>
    );
  }

  // PM Ownership Check
  const canUserEdit = isAdmin || (isPM && project?.projectManager?.id === user?.id);

  return (
    <Box>
      <PageHeader
        title={milestone.milestoneTitle}
        description={`Associated Project: ${project?.projectName || '—'}`}
        breadcrumbItems={[
          { label: 'Milestones', to: ROUTES.MILESTONES },
          { label: milestone.milestoneTitle },
        ]}
        action={
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <AppButton
              variant="outlined"
              startIcon={<KeyboardArrowLeftRoundedIcon />}
              onClick={() => navigate(ROUTES.MILESTONES)}
            >
              Back to List
            </AppButton>
            {canUserEdit && (
              <AppButton
                variant="primary"
                startIcon={<ModeEditOutlineOutlinedIcon />}
                onClick={() => navigate(`${ROUTES.MILESTONES}/${id}/edit`)}
              >
                Edit Milestone
              </AppButton>
            )}
          </Box>
        }
      />

      {/* Tabs Menu */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="milestone detail sections">
          <Tab label="Overview" />
          <Tab label="Tasks Pipeline" />
          <Tab label="Reviews Summary" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Milestone Details */}
          <Grid item xs={12} md={7}>
            <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <FlagRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Milestone Information
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ mt: 2 }}>
                  <DetailInfoRow label="Title" value={milestone.milestoneTitle} />
                  <DetailInfoRow label="Description" value={milestone.description || 'No description provided.'} />
                  <DetailInfoRow label="Status" value={<StatusChip status={milestone.status} />} />
                  <DetailInfoRow label="Due Date" value={formatDate(milestone.dueDate)} />
                  <DetailInfoRow label="Completed Date" value={formatDate(milestone.completedDate)} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Completion Progress
                </Typography>
                <ProgressBar value={milestone.status === 'Completed' ? 100 : 0} height={10} color="auto" />
              </CardContent>
            </Card>
          </Grid>

          {/* Project Details */}
          <Grid item xs={12} md={5}>
            <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <FolderRoundedIcon color="primary" />
                  <Typography variant="h6" fontWeight={700}>
                    Associated Project
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ mt: 1 }}>
                  <DetailInfoRow label="Project Name" value={project?.projectName} />
                  <DetailInfoRow
                    label="Project Manager"
                    value={
                      project?.projectManager
                        ? `${project.projectManager.firstName} ${project.projectManager.lastName}`
                        : '—'
                    }
                  />
                  <DetailInfoRow label="Department" value={project?.department?.name} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <EmptyState
              title="Tasks Pipeline Placeholder"
              description="Milestone associated tasks list will be fully integrated in Phase 9 & Phase 10."
              icon={TaskAltRoundedIcon}
            />
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <EmptyState
              title="Reviews & Feedbacks Placeholder"
              description="Evaluations, feedback loops, and task approvals are scheduled for future development phase sprints."
              icon={RateReviewRoundedIcon}
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default MilestoneDetailsPage;
