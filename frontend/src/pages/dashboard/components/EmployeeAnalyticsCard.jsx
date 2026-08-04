import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, Typography, Divider, Box, Alert } from '@mui/material';
import { BarChart } from '../../../components/common/AnalyticsCharts';
import dashboardService from '../../../services/dashboardService';
import PageLoader from '../../../components/ui/PageLoader';

/**
 * EmployeeAnalyticsCard
 * Visualizes employee assigned tasks workload distribution.
 */
const EmployeeAnalyticsCard = ({ filters }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      // filters: departmentId
      const res = await dashboardService.getEmployeeAnalytics({
        departmentId: filters.departmentId || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load employee workload:', err);
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
        <PageLoader message="Loading workload charts..." />
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card sx={{ height: '100%', minHeight: 280 }}>
        <CardContent>
          <Alert severity="error">Failed to load employee productivity charts.</Alert>
        </CardContent>
      </Card>
    );
  }

  const list = data.employees || [];
  // Take top 6 employees with the highest task counts to display on workload chart
  const topEmployees = [...list]
    .sort((a, b) => (b.assignedTasks || 0) - (a.assignedTasks || 0))
    .slice(0, 6);

  const barData = topEmployees.map((emp, index) => {
    const colors = ['#1976D2', '#26A69A', '#7B1FA2', '#2E7D32', '#F57C00', '#D32F2F'];
    return {
      label: emp.employeeName.split(' ')[0], // just first name to fit labels
      value: emp.assignedTasks || 0,
      color: colors[index % colors.length],
    };
  });

  return (
    <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} gutterBottom>
          Employee Workload Distribution
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
          Comparing assigned tasks across top performing members
        </Typography>
        <Divider sx={{ mb: 2.5 }} />

        {barData.length === 0 ? (
          <Box sx={{ py: 6, textAlignment: 'center', display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" color="text.secondary">No workload data available.</Typography>
          </Box>
        ) : (
          <BarChart data={barData} height={180} />
        )}
      </CardContent>
    </Card>
  );
};

export default EmployeeAnalyticsCard;
