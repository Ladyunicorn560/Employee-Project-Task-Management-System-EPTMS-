import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Divider, Box, Alert } from '@mui/material';
import { PieChart } from '../../../components/common/AnalyticsCharts';
import dashboardService from '../../../services/dashboardService';
import PageLoader from '../../../components/ui/PageLoader';

/**
 * TaskAnalyticsCard
 * Visualizes task workload priority distribution.
 */
const TaskAnalyticsCard = ({ filters }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // filters: projectId, startDate, endDate
      const res = await dashboardService.getTaskAnalytics({
        projectId: filters.projectId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load task analytics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PageLoader message="Loading task charts..." />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card sx={{ height: '100%', minHeight: 280 }}>
        <CardContent>
          <Alert severity="error">Failed to load task analytics.</Alert>
        </CardContent>
      </Card>
    );
  }

  const priorityMap = data.byPriority || {};
  const pieData = [
    { label: 'Critical Priority', value: priorityMap['Critical'] || 0, color: '#9C27B0' },
    { label: 'High Priority', value: priorityMap['High'] || 0, color: '#D32F2F' },
    { label: 'Medium Priority', value: priorityMap['Medium'] || 0, color: '#F57C00' },
    { label: 'Low Priority', value: priorityMap['Low'] || 0, color: '#1976D2' },
  ].filter((item) => item.value > 0);

  return (
    <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Task Priority Distribution
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Total tasks logged: {data.totalTasks || 0}
        </Typography>
        <Divider sx={{ mb: 2.5 }} />

        {pieData.length === 0 ? (
          <Box sx={{ py: 6, textAlignment: 'center', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">No task priority data matching filters.</Typography>
          </Box>
        ) : (
          <PieChart data={pieData} size={150} />
        )}
      </CardContent>
    </Card>
  );
};

export default TaskAnalyticsCard;
