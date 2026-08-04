import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Divider, Box, Alert } from '@mui/material';
import { PieChart } from '../../../components/common/AnalyticsCharts';
import dashboardService from '../../../services/dashboardService';
import PageLoader from '../../../components/ui/PageLoader';

/**
 * ProjectAnalyticsCard
 * Visualizes project status distribution and overview metrics.
 */
const ProjectAnalyticsCard = ({ filters }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // filters: departmentId, startDate, endDate
      const res = await dashboardService.getProjectAnalytics({
        departmentId: filters.departmentId || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load project analytics:', err);
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
        <PageLoader message="Loading project charts..." />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card sx={{ height: '100%', minHeight: 280 }}>
        <CardContent>
          <Alert severity="error">Failed to load project distribution.</Alert>
        </CardContent>
      </Card>
    );
  }

  // Map statusDistribution to PieChart dataset
  const statusMap = data.statusDistribution || {};
  const pieData = [
    { label: 'Active', value: statusMap['Active'] || 0, color: '#26A69A' },
    { label: 'Planning', value: statusMap['Planning'] || 0, color: '#1976D2' },
    { label: 'On Hold', value: statusMap['On Hold'] || 0, color: '#F57C00' },
    { label: 'Completed', value: statusMap['Completed'] || 0, color: '#2E7D32' },
  ].filter((item) => item.value > 0); // show only existing segments

  return (
    <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Project Status Distribution
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Total tracked projects: {data.totalProjects || 0}
        </Typography>
        <Divider sx={{ mb: 2.5 }} />

        {pieData.length === 0 ? (
          <Box sx={{ py: 6, textAlignment: 'center', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">No project data matching filters.</Typography>
          </Box>
        ) : (
          <PieChart data={pieData} size={150} />
        )}
      </CardContent>
    </Card>
  );
};

export default ProjectAnalyticsCard;
