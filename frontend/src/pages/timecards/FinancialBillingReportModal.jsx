import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Table, TableHead, TableRow,
  TableCell, TableBody, Paper, CircularProgress, Alert, Stack, Card, CardContent
} from '@mui/material';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import timecardService from '../../services/timecardService';

const FinancialBillingReportModal = ({ open, onClose, projectId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (open && projectId) {
      fetchReport();
    }
  }, [open, projectId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await timecardService.getProjectBillingSummary(projectId);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load billing report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #004D40 0%, #00796B 100%)', color: '#fff', py: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RequestQuoteRoundedIcon fontSize="large" />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Project Financial & Billing Summary Report
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              Project Owner Financial Clearance & Per-Hour Costing
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {data && !loading && (
          <Box>
            {/* KPI Summary Cards */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
              <Card variant="outlined" sx={{ flex: 1, backgroundColor: '#E0F2F1', borderColor: '#80CBC4' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Project Name
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#004D40' }}>
                    {data.projectName}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Manager: {data.projectManagerName} • Owner: {data.projectOwnerName}
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ flex: 1, backgroundColor: '#E3F2FD', borderColor: '#90CAF9' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Project Hours Worked
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1565C0' }}>
                    {data.totalProjectHours} <span style={{ fontSize: '1rem' }}>hrs</span>
                  </Typography>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ flex: 1, backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Financial Billing Output
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                    ₹{data.totalProjectBilling?.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>

            {/* Employee Cost Breakdown Table */}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
              Employee Costing & Hours Worked Breakdown
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#F1F5F9' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Employee Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Hours Worked</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Per-Hour Cost Rate (₹/hr)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total Billing Output (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.employeeBreakdown && data.employeeBreakdown.length > 0 ? (
                    data.employeeBreakdown.map((row, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonRoundedIcon fontSize="small" color="action" />
                            {row.EmployeeName}
                          </Box>
                        </TableCell>
                        <TableCell>{row.EmployeeEmail}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>
                          {row.TotalHoursWorked} hrs
                        </TableCell>
                        <TableCell align="right">₹{row.CostingRatePerHour}/hr</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                          ₹{row.TotalBillingAmount?.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        No timecard entries logged for this project yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close Report
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FinancialBillingReportModal;
