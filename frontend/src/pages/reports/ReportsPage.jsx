import { useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CardActions, Divider, Button } from '@mui/material';
import FolderZipRoundedIcon from '@mui/icons-material/FolderZipRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import NotificationsActiveRoundedIcon from '@mui/icons-material/NotificationsActiveRounded';
import DownloadForOfflineRoundedIcon from '@mui/icons-material/DownloadForOfflineRounded';

import PageHeader from '../../components/common/PageHeader';
import ExportDialog from './components/ExportDialog';

/**
 * ReportsPage
 * Secondary analytics dashboard displaying primary report formats (Projects, Employees, Tasks, Milestones, Reviews, Notifications)
 * and triggering customizable exports.
 */
const ReportsPage = () => {
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState({ type: '', title: '' });

  const handleOpenExport = (type, title) => {
    setSelectedReport({ type, title });
    setExportOpen(true);
  };

  const reportCards = [
    {
      type: 'projects',
      title: 'Projects Summary Report',
      description: 'Comprehensive analysis of project start/end dates, current status, average progress rates, and project manager designations.',
      icon: <FolderZipRoundedIcon sx={{ fontSize: 36, color: '#26A69A' }} />,
    },
    {
      type: 'employees',
      title: 'Employees Workload Report',
      description: 'Summary of employee roles, department bounds, counts of open vs. completed tasks, and pending review requests.',
      icon: <PeopleAltRoundedIcon sx={{ fontSize: 36, color: '#1976D2' }} />,
    },
    {
      type: 'tasks',
      title: 'Task Status Report',
      description: 'Complete breakdown of task priorities (High/Medium/Low), current status, assignees, and estimated vs. actual logged hours.',
      icon: <TaskAltRoundedIcon sx={{ fontSize: 36, color: '#2E7D32' }} />,
    },
    {
      type: 'milestones',
      title: 'Milestones Progress Report',
      description: 'Progress tracker showing milestone titles, project alignment, and counts of completed milestones.',
      icon: <FlagRoundedIcon sx={{ fontSize: 36, color: '#7B1FA2' }} />,
    },
    {
      type: 'reviews',
      title: 'Review Audit History',
      description: 'Full iteration details logs showing reviewer details, review outcome statuses (Approved, Rejected), and comments.',
      icon: <RateReviewRoundedIcon sx={{ fontSize: 36, color: '#F57C00' }} />,
    },
    {
      type: 'notifications',
      title: 'Notifications Analytics',
      description: 'Channel metrics log displaying notification counts by type (Task Assigned, Review Request) and delivery status.',
      icon: <NotificationsActiveRoundedIcon sx={{ fontSize: 36, color: '#E53935' }} />,
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Reports & Exports"
        description="Generate, filter, and export customized PDF, Excel, and CSV documents from EPTMS collections."
        breadcrumbItems={[{ label: 'Reports' }]}
      />

      <Grid container spacing={3}>
        {reportCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.type}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 3,
                transition: 'all 0.15s ease',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
                  transform: 'translateY(-2px)',
                  borderColor: 'primary.light',
                },
              }}
            >
              <CardContent sx={{ p: 3.5, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  {card.icon}
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'text.primary', fontSize: '1.05rem', lineHeight: 1.2 }}>
                    {card.title}
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, minHeight: 72 }}>
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 3, pb: 3, pt: 0 }}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  startIcon={<DownloadForOfflineRoundedIcon />}
                  onClick={() => handleOpenExport(card.type, card.title)}
                  sx={{
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 1,
                  }}
                >
                  Configure Export
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Export Dialog */}
      <ExportDialog
        open={exportOpen}
        reportType={selectedReport.type}
        title={selectedReport.title}
        onClose={() => setExportOpen(false)}
      />
    </Box>
  );
};

export default ReportsPage;
