import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Divider, Box, Alert } from '@mui/material';
import { PieChart } from '../../../components/common/AnalyticsCharts';
import dashboardService from '../../../services/dashboardService';
import PageLoader from '../../../components/ui/PageLoader';

/**
 * NotificationAnalyticsCard
 * Visualizes system events types notifications.
 */
const NotificationAnalyticsCard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await dashboardService.getNotificationAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load notification analytics:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PageLoader message="Loading notification charts..." />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card sx={{ height: '100%', minHeight: 280 }}>
        <CardContent>
          <Alert severity="error">Failed to load notification analytics.</Alert>
        </CardContent>
      </Card>
    );
  }

  const typeMap = data.byType || {};
  const pieData = [
    { label: 'Assigned Alert', value: typeMap['Task Assigned'] || 0, color: '#1976D2' },
    { label: 'Review Requests', value: typeMap['Review Request'] || 0, color: '#F57C00' },
    { label: 'Review Approved', value: typeMap['Review Approved'] || 0, color: '#2E7D32' },
    { label: 'Review Rejected', value: typeMap['Review Rejected'] || 0, color: '#D32F2F' },
  ].filter((item) => item.value > 0);

  return (
    <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          System Event Alerts Breakdown
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Total logged alerts: {data.totalNotifications || 0}
        </Typography>
        <Divider sx={{ mb: 2.5 }} />

        {pieData.length === 0 ? (
          <Box sx={{ py: 6, textAlignment: 'center', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">No event notifications logged.</Typography>
          </Box>
        ) : (
          <PieChart data={pieData} size={150} />
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationAnalyticsCard;
