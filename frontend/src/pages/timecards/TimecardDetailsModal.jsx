import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, Chip, Table, TableHead, TableRow,
  TableCell, TableBody, TextField, Divider, Paper, Stack, Alert
} from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import timecardService from '../../services/timecardService';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

const STATUS_CHIPS = {
  Submitted: { label: 'Pending Manager (Stage 1)', color: 'warning' },
  ManagerApproved: { label: 'Pending Financial Approval (Stage 2)', color: 'info' },
  FinancialApproved: { label: 'Financial Billing Approved', color: 'success' },
  ManagerRejected: { label: 'Manager Rejected', color: 'error' },
  FinancialRejected: { label: 'Financial Rejected', color: 'error' },
  Draft: { label: 'Draft', color: 'default' }
};

const TimecardDetailsModal = ({ open, onClose, timecard, onRefresh }) => {
  const { user } = useAuth();
  const [managerComments, setManagerComments] = useState('');
  const [financialComments, setFinancialComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  if (!timecard) return null;

  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const isManagerOrAdmin = user?.roleName === ROLES.ADMINISTRATOR || user?.roleName === ROLES.PROJECT_MANAGER;
  const isProjectOwnerOrAdmin = user?.roleName === ROLES.ADMINISTRATOR || user?.roleName === ROLES.PROJECT_MANAGER;

  const handleManagerAction = async (approve) => {
    try {
      setSubmitting(true);
      setActionError('');
      if (approve) {
        await timecardService.approveManager(timecard.TimecardID, managerComments);
      } else {
        await timecardService.rejectManager(timecard.TimecardID, managerComments);
      }
      onRefresh?.();
      onClose();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinancialAction = async (approve) => {
    try {
      setSubmitting(true);
      setActionError('');
      if (approve) {
        await timecardService.approveFinancial(timecard.TimecardID, financialComments);
      } else {
        await timecardService.rejectFinancial(timecard.TimecardID, financialComments);
      }
      onRefresh?.();
      onClose();
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = STATUS_CHIPS[timecard.Status] || { label: timecard.Status, color: 'default' };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ background: 'linear-gradient(135deg, #1A237E 0%, #283593 100%)', color: '#fff', py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AccessTimeRoundedIcon />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Weekly Timecard #{timecard.TimecardID}
            </Typography>
          </Box>
          <Chip label={statusConfig.label} color={statusConfig.color} sx={{ fontWeight: 700 }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {actionError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {actionError}
          </Alert>
        )}

        {/* Employee & Week Info */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} justifyContent="space-between">
            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Employee
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {timecard.EmployeeFirstName} {timecard.EmployeeLastName}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {timecard.EmployeeEmail} • {timecard.DepartmentName || 'Department'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Week Period
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {timecard.WeekStartDate ? new Date(timecard.WeekStartDate).toLocaleDateString() : '—'} to{' '}
                {timecard.WeekEndDate ? new Date(timecard.WeekEndDate).toLocaleDateString() : '—'}
              </Typography>
            </Box>

            <Box>
              <Typography variant="caption" color="textSecondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Totals
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1976D2' }}>
                {timecard.TotalHours} hrs {!isEmployee && timecard.TotalAmount !== undefined && `(₹${timecard.TotalAmount})`}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Project Timecard Entries Table */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          Logged Projects & Daily Breakdown
        </Typography>
        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
          <Table size="small">
            <TableHead sx={{ backgroundColor: '#F1F5F9' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Work Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Work Mode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Project</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Task</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '30%' }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Hours</TableCell>
                {!isEmployee && <TableCell align="right" sx={{ fontWeight: 700 }}>Cost Rate (₹/hr)</TableCell>}
                {!isEmployee && <TableCell align="right" sx={{ fontWeight: 700 }}>Billing Output (₹)</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {timecard.entries && timecard.entries.length > 0 ? (
                timecard.entries.map((entry) => (
                  <TableRow key={entry.TimecardEntryID} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      {new Date(entry.WorkDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.WorkMode || entry.workMode || 'Office'}
                        size="small"
                        variant="outlined"
                        color="primary"
                        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#1E88E5' }}>
                      {entry.ProjectName} (ID: #{entry.ProjectID})
                    </TableCell>
                    <TableCell>{entry.TaskTitle || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '0.85rem' }}>
                        {entry.Description || entry.description || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      {entry.HoursWorked} hrs
                    </TableCell>
                    {!isEmployee && <TableCell align="right">₹{entry.HourlyRate}/hr</TableCell>}
                    {!isEmployee && (
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#2E7D32' }}>
                        ₹{entry.BillingAmount}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isEmployee ? 6 : 8} align="center" sx={{ py: 2 }}>
                    No detail entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* Approval History & Status */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          2-Stage Approval Audit Trail
        </Typography>
        <Stack spacing={2} sx={{ mb: 2 }}>
          {/* Stage 1: Manager */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: timecard.ManagerApprovedDate ? '#A5D6A7' : '#E0E0E0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonRoundedIcon fontSize="small" /> Stage 1: Manager Approval
              </Typography>
              {timecard.ManagerApprovedDate ? (
                <Chip icon={<CheckCircleRoundedIcon />} label="Approved" color="success" size="small" />
              ) : timecard.Status === 'ManagerRejected' ? (
                <Chip icon={<CancelRoundedIcon />} label="Rejected" color="error" size="small" />
              ) : (
                <Chip label="Pending" color="warning" size="small" />
              )}
            </Box>
            {timecard.ManagerFirstName && (
              <Typography variant="caption" display="block">
                Manager: <strong>{timecard.ManagerFirstName} {timecard.ManagerLastName}</strong>
              </Typography>
            )}
            {timecard.ManagerComments && (
              <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: '#424242' }}>
                "{timecard.ManagerComments}"
              </Typography>
            )}
          </Paper>

          {/* Stage 2: Project Owner Financial */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: timecard.FinancialApprovedDate ? '#90CAF9' : '#E0E0E0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                <RequestQuoteRoundedIcon fontSize="small" /> Stage 2: Project Owner Financial Billing Clearance
              </Typography>
              {timecard.FinancialApprovedDate ? (
                <Chip icon={<CheckCircleRoundedIcon />} label="Financial Approved" color="success" size="small" />
              ) : timecard.Status === 'FinancialRejected' ? (
                <Chip icon={<CancelRoundedIcon />} label="Financial Rejected" color="error" size="small" />
              ) : (
                <Chip label="Pending Clearance" color="info" size="small" />
              )}
            </Box>
            {timecard.FinancialFirstName && (
              <Typography variant="caption" display="block">
                Financial Approver: <strong>{timecard.FinancialFirstName} {timecard.FinancialLastName}</strong>
              </Typography>
            )}
            {timecard.FinancialComments && (
              <Typography variant="body2" sx={{ mt: 0.5, fontStyle: 'italic', color: '#424242' }}>
                "{timecard.FinancialComments}"
              </Typography>
            )}
          </Paper>
        </Stack>

        {/* Action Controls for Managers (Stage 1) */}
        {isManagerOrAdmin && timecard.Status === 'Submitted' && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#FFF8E1', borderRadius: 2, border: '1px solid #FFE082' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#B76E00' }}>
              Level 1 Action: Manager Review
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Enter review comments for employee..."
              value={managerComments}
              onChange={(e) => setManagerComments(e.target.value)}
              sx={{ mb: 1.5, backgroundColor: '#fff' }}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelRoundedIcon />}
                disabled={submitting}
                onClick={() => handleManagerAction(false)}
              >
                Reject Timecard
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleRoundedIcon />}
                disabled={submitting}
                onClick={() => handleManagerAction(true)}
              >
                Approve (Move to Stage 2)
              </Button>
            </Stack>
          </Box>
        )}

        {/* Action Controls for Project Owner / Finance (Stage 2) */}
        {isProjectOwnerOrAdmin && timecard.Status === 'ManagerApproved' && (
          <Box sx={{ mt: 3, p: 2, backgroundColor: '#E3F2FD', borderRadius: 2, border: '1px solid #90CAF9' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#1565C0' }}>
              Level 2 Action: Project Owner Financial Billing Clearance
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Enter financial approval/billing comments..."
              value={financialComments}
              onChange={(e) => setFinancialComments(e.target.value)}
              sx={{ mb: 1.5, backgroundColor: '#fff' }}
            />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelRoundedIcon />}
                disabled={submitting}
                onClick={() => handleFinancialAction(false)}
              >
                Reject Billing
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RequestQuoteRoundedIcon />}
                disabled={submitting}
                onClick={() => handleFinancialAction(true)}
              >
                Approve Financial Billing (₹{timecard.TotalAmount})
              </Button>
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TimecardDetailsModal;
