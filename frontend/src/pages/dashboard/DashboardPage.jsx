import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Divider, Chip, Tooltip, IconButton, Alert } from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';

import { useNavigate } from 'react-router-dom';

import useAuth from '../../hooks/useAuth';
import useDashboard from '../../hooks/useDashboard';
import StatCard from '../../components/common/StatCard';
import ErrorState from '../../components/ui/ErrorState';

import DashboardFilters from './components/DashboardFilters';
import ProjectAnalyticsCard from './components/ProjectAnalyticsCard';
import TaskAnalyticsCard from './components/TaskAnalyticsCard';
import EmployeeAnalyticsCard from './components/EmployeeAnalyticsCard';
import NotificationAnalyticsCard from './components/NotificationAnalyticsCard';
import OverdueItemsCard from './components/OverdueItemsCard';
import TimecardAnalyticsCard from './components/TimecardAnalyticsCard';
import { ROLES } from '../../constants/roles';

/**
 * DashboardPage
 * Enhanced analytics hub displaying project status pie charts, employee task workloads,
 * status details, filters, and KPI summary stats cards.
 */
const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Filters State
  const [filters, setFilters] = useState({
    departmentId: '',
    projectId: '',
    startDate: '',
    endDate: '',
  });

  const { overview, loading, error, refetch } = useDashboard(filters);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'User';

  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;
  const isPM = user?.roleName === ROLES.PROJECT_MANAGER;
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const isReviewer = user?.roleName === ROLES.REVIEWER;

  // Stat cards configurations
  const primaryStats = isEmployee ? [
    {
      label: 'My Assigned Tasks',
      value: overview?.tasks?.total ?? '—',
      icon: TaskAltRoundedIcon,
      color: '#1976D2',
      subtext: `${overview?.tasks?.inProgress ?? 0} in progress`,
      tooltip: 'Total tasks assigned to you - Click to view',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'My Projects',
      value: overview?.projects?.total ?? '—',
      icon: FolderRoundedIcon,
      color: '#26A69A',
      subtext: `${overview?.projects?.active ?? 0} active projects`,
      tooltip: 'Total projects you are assigned to - Click to view',
      onClick: () => navigate('/projects'),
    },
    {
      label: 'My Task Completion %',
      value: overview?.tasks ? `${overview.tasks.completionRate}%` : '—',
      icon: TaskAltRoundedIcon,
      color: '#2E7D32',
      subtext: `${overview?.tasks?.completed ?? 0} completed`,
      tooltip: 'Your task completion rate percentage - Click to view tasks',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'My Overdue Tasks',
      value: overview?.tasks?.overdue ?? '—',
      icon: WarningAmberRoundedIcon,
      color: '#D32F2F',
      subtext: 'Requires attention',
      tooltip: 'Your assigned tasks past due - Click to view',
      onClick: () => navigate('/tasks?filter=overdue'),
    },
  ] : isPM ? [
    {
      label: 'My Managed Projects',
      value: overview?.projects?.total ?? '—',
      icon: FolderRoundedIcon,
      color: '#26A69A',
      subtext: `${overview?.projects?.active ?? 0} active projects`,
      tooltip: 'Total projects managed by you - Click to view',
      onClick: () => navigate('/projects'),
    },
    {
      label: 'Managed Tasks',
      value: overview?.tasks?.total ?? '—',
      icon: TaskAltRoundedIcon,
      color: '#1976D2',
      subtext: `${overview?.tasks?.inProgress ?? 0} in progress`,
      tooltip: 'Total tasks under your management - Click to view',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'Task Completion %',
      value: overview?.tasks ? `${overview.tasks.completionRate}%` : '—',
      icon: TaskAltRoundedIcon,
      color: '#2E7D32',
      subtext: `${overview?.tasks?.completed ?? 0} of ${overview?.tasks?.total ?? 0} tasks completed`,
      tooltip: 'Overall completion rate for your managed projects',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'Overdue Tasks',
      value: overview?.tasks?.overdue ?? '—',
      icon: WarningAmberRoundedIcon,
      color: '#D32F2F',
      subtext: 'Requires attention',
      tooltip: 'Tasks past due - Click to view',
      onClick: () => navigate('/tasks?filter=overdue'),
    },
  ] : isReviewer ? [
    {
      label: 'My Tasks to Review',
      value: overview?.tasks?.underReview ?? '—',
      icon: TaskAltRoundedIcon,
      color: '#1976D2',
      subtext: `${overview?.tasks?.total ?? 0} total assigned`,
      tooltip: 'Tasks pending review - Click to view',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'My Scoped Projects',
      value: overview?.projects?.active ?? '—',
      icon: FolderRoundedIcon,
      color: '#26A69A',
      subtext: `${overview?.projects?.total ?? 0} total projects`,
      tooltip: 'Active projects under your review scope - Click to view',
      onClick: () => navigate('/projects'),
    },
    {
      label: 'My Task Completion %',
      value: overview?.tasks ? `${overview.tasks.completionRate}%` : '—',
      icon: TaskAltRoundedIcon,
      color: '#2E7D32',
      subtext: `${overview?.tasks?.completed ?? 0} tasks completed`,
      tooltip: 'Completion rate percentage - Click to view tasks',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'My Overdue Tasks',
      value: overview?.tasks?.overdue ?? '—',
      icon: WarningAmberRoundedIcon,
      color: '#D32F2F',
      subtext: 'Requires attention',
      tooltip: 'Tasks past due - Click to view',
      onClick: () => navigate('/tasks?filter=overdue'),
    },
  ] : [
    {
      label: 'Total Employees',
      value: overview?.employees?.total ?? '—',
      icon: PeopleAltRoundedIcon,
      color: '#1976D2',
      subtext: `${overview?.employees?.active ?? 0} active`,
      tooltip: 'Total registered employees - Click to view',
      onClick: () => navigate('/employees'),
    },
    {
      label: 'Active Projects',
      value: overview?.projects?.active ?? '—',
      icon: FolderRoundedIcon,
      color: '#26A69A',
      subtext: `${overview?.projects?.total ?? 0} total projects`,
      tooltip: 'Projects currently active - Click to view',
      onClick: () => navigate('/projects'),
    },
    {
      label: 'Task Completion %',
      value: overview?.tasks ? `${overview.tasks.completionRate}%` : '—',
      icon: TaskAltRoundedIcon,
      color: '#2E7D32',
      subtext: `${overview?.tasks?.completed ?? 0} of ${overview?.tasks?.total ?? 0} tasks completed`,
      tooltip: 'Overall task completion rate - Click to view tasks',
      onClick: () => navigate('/tasks'),
    },
    {
      label: 'Overdue Tasks',
      value: overview?.tasks?.overdue ?? '—',
      icon: WarningAmberRoundedIcon,
      color: '#D32F2F',
      subtext: 'Requires attention',
      tooltip: 'Tasks past due date - Click to view',
      onClick: () => navigate('/tasks?filter=overdue'),
    },
  ];

  return (
    <Box>
      {/* Welcome header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3.5, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            {greeting}, {firstName} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Here's your workspace overview for today.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            <Chip label={user?.roleName || '—'} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
            {user?.departmentName && (
              <Chip label={user.departmentName} size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider' }} />
            )}
            {(user?.manager?.name || user?.manager?.firstName) && (
              <Chip label={`Manager: ${user.manager.name || `${user.manager.firstName || ''} ${user.manager.lastName || ''}`.trim()}`} size="small" color="secondary" variant="outlined" sx={{ fontWeight: 600 }} />
            )}
          </Box>
        </Box>
        <Tooltip title="Refresh metrics">
          <IconButton onClick={refetch} disabled={loading} size="small" sx={{ mt: 0.5 }}>
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Error state */}
      {error && (
        <Card sx={{ mb: 3.5 }}>
          <ErrorState
            title="Failed to load dashboard overview"
            message="Unable to fetch high-level metrics. Verify connection to backend services."
            onRetry={refetch}
          />
        </Card>
      )}

      {/* Filters Bar */}
      <DashboardFilters filters={filters} onFilterChange={setFilters} />

      {/* KPI Cards Row */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {primaryStats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <StatCard {...stat} loading={loading && !error} />
          </Grid>
        ))}
      </Grid>

      {/* Timecards & Financial Billing Card */}
      <Box sx={{ mb: 3.5 }}>
        <TimecardAnalyticsCard timecardData={overview?.timecards} />
      </Box>

      {/* Charts Grid */}
      <Grid container spacing={3} sx={{ mb: 3.5 }}>
        {/* Project Status Donut Chart */}
        <Grid item xs={12} md={6}>
          <ProjectAnalyticsCard filters={filters} />
        </Grid>

        {/* Task Priority Donut Chart */}
        <Grid item xs={12} md={6}>
          <TaskAnalyticsCard filters={filters} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Employee workload Bar Chart (Admins and PMs only) */}
        {!isEmployee && (
          <Grid item xs={12} md={7}>
            <EmployeeAnalyticsCard filters={filters} />
          </Grid>
        )}

        {/* Notification Types Breakdown Chart */}
        <Grid item xs={12} md={isEmployee ? 12 : 5}>
          <NotificationAnalyticsCard />
        </Grid>
      </Grid>

      {/* ── Unified Overdue Items Section ──────────────────────── */}
      <Box sx={{ mt: 3 }}>
        <OverdueItemsCard />
      </Box>
    </Box>
  );
};

export default DashboardPage;
