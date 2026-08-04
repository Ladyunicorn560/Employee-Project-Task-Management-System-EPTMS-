import { Box, Typography, Grid, Card, CardContent, Divider, Chip } from '@mui/material';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import useAuth from '../../hooks/useAuth';

/**
 * DashboardPage
 * Phase 1 shell: Welcome message + stat cards + recent activity placeholder.
 * Charts and live data will be added in Phase 2.
 */

// ─── Stat Card ─────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="overline" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mt: 0.5 }}>
            {value}
          </Typography>
          {subtext && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtext}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2.5,
            backgroundColor: `${color}18`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 26, color }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

// ─── Activity Placeholder ──────────────────────────────────────────────────
const ActivityItem = ({ text, time, type }) => {
  const colors = { task: '#1976D2', project: '#26A69A', employee: '#ED6C02' };
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, py: 1.5 }}>
      <Box
        sx={{
          width: 8, height: 8, borderRadius: '50%',
          backgroundColor: colors[type] || '#CBD5E0',
          mt: 0.75, flexShrink: 0,
        }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" color="text.primary">{text}</Typography>
        <Typography variant="caption" color="text.disabled">{time}</Typography>
      </Box>
    </Box>
  );
};

// ─── Dashboard Page ────────────────────────────────────────────────────────
const DashboardPage = () => {
  const { user } = useAuth();

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'User';
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Total Employees', value: '—', icon: PeopleAltRoundedIcon, color: '#1976D2', subtext: 'Loading from API...' },
    { label: 'Active Projects', value: '—', icon: FolderRoundedIcon, color: '#26A69A', subtext: 'Loading from API...' },
    { label: 'Open Tasks', value: '—', icon: TaskAltRoundedIcon, color: '#ED6C02', subtext: 'Loading from API...' },
    { label: 'Completed Tasks', value: '—', icon: CheckCircleOutlineRoundedIcon, color: '#2E7D32', subtext: 'Loading from API...' },
  ];

  const activities = [
    { text: 'Dashboard data will load from the backend API in Phase 2.', time: 'Just now', type: 'task' },
    { text: 'Recent projects, tasks, and notifications will appear here.', time: 'Pending', type: 'project' },
    { text: 'Employee activity feed will be integrated in Phase 2.', time: 'Pending', type: 'employee' },
  ];

  return (
    <Box>
      {/* ─── Welcome Header ─────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {greeting}, {firstName} 👋
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your workspace.
        </Typography>
        <Chip
          label="Phase 1 — Foundation Complete"
          size="small"
          color="primary"
          variant="outlined"
          sx={{ mt: 1, fontWeight: 600 }}
        />
      </Box>

      {/* ─── Stat Cards ─────────────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* ─── Recent Activity ─────────────────────────────────── */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Live activity feed will be available in Phase 2.
              </Typography>
              <Divider sx={{ mb: 1 }} />
              {activities.map((a, i) => (
                <ActivityItem key={i} {...a} />
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Quick Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Project progress charts will be added in Phase 2.
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {[
                { label: 'Role', value: user?.roleName || '—' },
                { label: 'Department', value: user?.departmentName || '—' },
                { label: 'Email', value: user?.email || '—' },
                { label: 'API Status', value: 'Connected ✓' },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2" fontWeight={600} color="text.primary">{value}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
