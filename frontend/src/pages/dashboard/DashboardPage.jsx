import { Box, Typography, Grid, Card, CardContent, Divider, Chip, LinearProgress, Tooltip } from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import PlayCircleOutlineRoundedIcon from '@mui/icons-material/PlayCircleOutlineRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import IconButton from '@mui/material/IconButton';

import useAuth from '../../hooks/useAuth';
import useDashboard from '../../hooks/useDashboard';
import StatCard from '../../components/common/StatCard';
import ErrorState from '../../components/ui/ErrorState';

// ─── Mini Metric Row ───────────────────────────────────────────────────────────
const MetricRow = ({ label, value, color = 'text.primary', loading }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="body2" fontWeight={700} color={color}>
      {loading ? '—' : (value ?? 0)}
    </Typography>
  </Box>
);

// ─── Progress Bar Row ──────────────────────────────────────────────────────────
const ProgressRow = ({ label, value, color = 'primary', loading }) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" fontWeight={700}>
        {loading ? '—' : `${value ?? 0}%`}
      </Typography>
    </Box>
    <LinearProgress
      variant={loading ? 'indeterminate' : 'determinate'}
      value={loading ? undefined : (value ?? 0)}
      color={color}
      sx={{ height: 6, borderRadius: 3 }}
    />
  </Box>
);

// ─── Dashboard Page ────────────────────────────────────────────────────────────
/**
 * DashboardPage
 * Live dashboard integrated with GET /api/v1/dashboard/overview.
 * Displays: employees, projects, tasks, milestones.
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const { overview, loading, error, refetch } = useDashboard();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'User';

  // Stat cards config
  const primaryStats = [
    {
      label: 'Total Employees',
      value: overview?.employees?.total ?? '—',
      icon: PeopleAltRoundedIcon,
      color: '#1976D2',
      subtext: `${overview?.employees?.active ?? 0} active`,
      tooltip: 'Total registered employees in the system',
    },
    {
      label: 'Active Projects',
      value: overview?.projects?.active ?? '—',
      icon: FolderRoundedIcon,
      color: '#26A69A',
      subtext: `${overview?.projects?.total ?? 0} total`,
      tooltip: 'Projects currently in Active status',
    },
    {
      label: 'Tasks Completed',
      value: overview?.tasks?.completed ?? '—',
      icon: TaskAltRoundedIcon,
      color: '#2E7D32',
      subtext: `${overview?.tasks?.completionRate ?? 0}% completion rate`,
      tooltip: 'Tasks with Completed status',
    },
    {
      label: 'Milestones Done',
      value: overview?.milestones?.completed ?? '—',
      icon: FlagRoundedIcon,
      color: '#7B1FA2',
      subtext: `of ${overview?.milestones?.total ?? 0} total`,
      tooltip: 'Milestones marked as completed',
    },
  ];

  const secondaryStats = [
    {
      label: 'Tasks In Progress',
      value: overview?.tasks?.inProgress ?? '—',
      icon: PlayCircleOutlineRoundedIcon,
      color: '#1976D2',
      subtext: 'Currently in progress',
    },
    {
      label: 'Overdue Tasks',
      value: overview?.tasks?.overdue ?? '—',
      icon: WarningAmberRoundedIcon,
      color: '#D32F2F',
      subtext: 'Past due date',
      tooltip: 'Tasks that are past their due date and not completed',
    },
    {
      label: 'Avg Project Progress',
      value: overview ? `${overview.projects.averageProgress}%` : '—',
      icon: TrendingUpRoundedIcon,
      color: '#26A69A',
      subtext: 'Across all active projects',
    },
  ];

  return (
    <Box>
      {/* ─── Welcome Header ───────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} color="text.primary" sx={{ letterSpacing: '-0.5px' }}>
            {greeting}, {firstName} 👋
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Here's your workspace overview for today.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
            <Chip label={user?.roleName || '—'} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
            {user?.departmentName && (
              <Chip label={user.departmentName} size="small" variant="outlined" sx={{ color: 'text.secondary', borderColor: 'divider' }} />
            )}
          </Box>
        </Box>
        <Tooltip title="Refresh dashboard">
          <IconButton onClick={refetch} disabled={loading} size="small" sx={{ mt: 0.5 }}>
            <RefreshRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ─── Error State ──────────────────────────────────────── */}
      {error && (
        <Card sx={{ mb: 3 }}>
          <ErrorState
            title="Failed to load dashboard"
            message="Unable to fetch dashboard data from the server. Please check the backend connection and try again."
            onRetry={refetch}
          />
        </Card>
      )}

      {/* ─── Primary Stat Cards ───────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {primaryStats.map((stat) => (
          <Grid item xs={12} sm={6} xl={3} key={stat.label}>
            <StatCard {...stat} loading={loading && !error} />
          </Grid>
        ))}
      </Grid>

      {/* ─── Secondary Stat Cards ─────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {secondaryStats.map((stat) => (
          <Grid item xs={12} sm={6} md={4} key={stat.label}>
            <StatCard {...stat} loading={loading && !error} />
          </Grid>
        ))}
      </Grid>

      {/* ─── Detail Cards ─────────────────────────────────────── */}
      <Grid container spacing={3}>
        {/* Project Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Project Overview</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Status distribution across all projects
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <MetricRow label="Active" value={overview?.projects?.active} loading={loading} />
              <MetricRow label="Planning" value={overview?.projects?.planning} loading={loading} />
              <MetricRow label="On Hold" value={overview?.projects?.onHold} loading={loading} color="warning.main" />
              <MetricRow label="Completed" value={overview?.projects?.completed} loading={loading} color="success.main" />
              <Box sx={{ mt: 2 }}>
                <ProgressRow
                  label="Average Progress"
                  value={overview?.projects?.averageProgress}
                  color="primary"
                  loading={loading}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Task & Milestone Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>Task & Milestone Status</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Current task pipeline and milestone progress
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <MetricRow label="Total Tasks" value={overview?.tasks?.total} loading={loading} />
              <MetricRow label="In Progress" value={overview?.tasks?.inProgress} loading={loading} color="primary.main" />
              <MetricRow label="Under Review" value={overview?.tasks?.underReview} loading={loading} />
              <MetricRow label="Overdue" value={overview?.tasks?.overdue} loading={loading} color="error.main" />
              <MetricRow label="Blocked" value={overview?.tasks?.blocked} loading={loading} color="warning.main" />
              <Box sx={{ mt: 2 }}>
                <ProgressRow
                  label="Task Completion Rate"
                  value={overview?.tasks?.completionRate}
                  color="success"
                  loading={loading}
                />
                <ProgressRow
                  label={`Milestones (${overview?.milestones?.completed ?? 0} / ${overview?.milestones?.total ?? 0})`}
                  value={overview?.milestones?.total > 0
                    ? Math.round((overview.milestones.completed / overview.milestones.total) * 100)
                    : 0}
                  color="secondary"
                  loading={loading}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
