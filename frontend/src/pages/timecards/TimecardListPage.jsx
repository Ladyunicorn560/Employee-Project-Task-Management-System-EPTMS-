import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell,
  TableBody, Button, Chip, TextField, MenuItem, FormControl,
  InputLabel, Select, InputAdornment, Stack, Card, CardContent,
  Grid, CircularProgress, Alert, TablePagination
} from '@mui/material';

import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import RequestQuoteRoundedIcon from '@mui/icons-material/RequestQuoteRounded';
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HourglassEmptyRoundedIcon from '@mui/icons-material/HourglassEmptyRounded';

import timecardService from '../../services/timecardService';
import projectService from '../../services/projectService';
import TimecardDetailsModal from './TimecardDetailsModal';
import FinancialBillingReportModal from './FinancialBillingReportModal';
import { ROUTES } from '../../constants/routes';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

const STATUS_CHIPS = {
  Submitted: { label: 'Pending Manager (Stage 1)', color: 'warning' },
  ManagerApproved: { label: 'Pending Financial Approval (Stage 2)', color: 'info' },
  FinancialApproved: { label: 'Financial Approved', color: 'success' },
  ManagerRejected: { label: 'Manager Rejected', color: 'error' },
  FinancialRejected: { label: 'Financial Rejected', color: 'error' },
  Draft: { label: 'Draft', color: 'default' }
};

const TimecardListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [timecards, setTimecards] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);

  // Selected Modal State
  const [selectedTimecard, setSelectedTimecard] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Selected Project Billing Modal State
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [projectsList, setProjectsList] = useState([]);

  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const [missingTimecards, setMissingTimecards] = useState([]);

  useEffect(() => {
    fetchTimecards();
    fetchProjects();
    if (isEmployee) {
      fetchMissingTimecards();
    }
  }, [page, limit, statusFilter]);

  const fetchMissingTimecards = async () => {
    try {
      const res = await timecardService.getMissing();
      setMissingTimecards(res.data || []);
    } catch (e) {
      console.error('Failed to fetch missing timecards:', e);
    }
  };

  const fetchTimecards = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await timecardService.getAll({
        page: page + 1,
        limit,
        status: statusFilter || undefined,
        search: search || undefined
      });

      setTimecards(res.data || []);
      setTotalCount(res.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load timecards');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await projectService.getAll({ limit: 100 });
      setProjectsList(res.data || res.items || []);
    } catch (e) {
      // ignore non-critical project dropdown error
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchTimecards();
  };

  const handleOpenDetails = async (timecardId) => {
    try {
      const details = await timecardService.getById(timecardId);
      setSelectedTimecard(details);
      setDetailsModalOpen(true);
    } catch (err) {
      setError('Failed to fetch timecard details');
    }
  };

  const handleOpenBillingReport = (projId) => {
    setSelectedProjectId(projId);
    setBillingModalOpen(true);
  };

  const isManagerOrAdmin = user?.roleName === ROLES.ADMINISTRATOR || user?.roleName === ROLES.PROJECT_MANAGER;

  return (
    <Box sx={{ pb: 5 }}>
      {/* Top Title Bar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>
            Timecard & Financial Billing Management
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Weekly project timecard submissions with 2-Level Manager & Financial Owner approvals
          </Typography>
        </Box>

        <Stack direction="row" spacing={2}>
          {isManagerOrAdmin && projectsList.length > 0 && (
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="project-billing-select-label">View Project Billing</InputLabel>
              <Select
                labelId="project-billing-select-label"
                label="View Project Billing"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleOpenBillingReport(e.target.value);
                  }
                }}
              >
                {projectsList.map((p) => {
                  const pId = p.id || p.ProjectID;
                  const pName = p.projectName || p.ProjectName;
                  return (
                    <MenuItem key={pId} value={pId}>
                      {pName} (ID: #{pId})
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          )}

          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={() => navigate(ROUTES.TIMECARDS_CREATE)}
            sx={{
              background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
              fontWeight: 700,
              borderRadius: 2
            }}
          >
            Submit New Timecard
          </Button>
        </Stack>
      </Box>

      {/* Missing Timecards Alert Widget for Employee */}
      {isEmployee && missingTimecards.length > 0 && (
        <Paper sx={{ p: 2.5, mb: 3, borderRadius: 3, border: '1px solid #FFE0B2', backgroundColor: '#FFF3E0' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#E65100', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <HourglassEmptyRoundedIcon /> Missing Timecard Submissions Detected ({missingTimecards.length})
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
            You have unsubmitted timecards for the following past working weeks:
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {missingTimecards.map((m) => (
              <Chip
                key={m.weekStartDate}
                label={`Week ${m.weekStartDate} to ${m.weekEndDate}`}
                color="warning"
                variant="outlined"
                onClick={() => navigate(`${ROUTES.TIMECARDS}/create?startDate=${m.weekStartDate}`)}
                sx={{ fontWeight: 700, cursor: 'pointer' }}
              />
            ))}
          </Stack>
        </Paper>
      )}

      {/* KPI Overview Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '5px solid #1E88E5' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Total Submissions
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E88E5' }}>
                {totalCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '5px solid #F57C00' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Stage 1: Pending Manager
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#F57C00' }}>
                {timecards.filter(t => t.Status === 'Submitted').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card variant="outlined" sx={{ borderRadius: 3, borderLeft: '5px solid #2E7D32' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Stage 2: Financial Approved
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                {timecards.filter(t => t.Status === 'FinancialApproved').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, borderRadius: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by employee name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchRoundedIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
              />
            </form>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter Status"
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="Submitted">Pending Manager (Stage 1)</MenuItem>
                <MenuItem value="ManagerApproved">Pending Financial (Stage 2)</MenuItem>
                <MenuItem value="FinancialApproved">Financial Approved</MenuItem>
                <MenuItem value="ManagerRejected">Manager Rejected</MenuItem>
                <MenuItem value="FinancialRejected">Financial Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="text" color="inherit" onClick={() => { setStatusFilter(''); setSearch(''); setPage(0); }}>
              Reset Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Timecard Table */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Table>
              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Employee</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Week Period</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total Hours</TableCell>
                  {!isEmployee && <TableCell align="right" sx={{ fontWeight: 700 }}>Financial Billing (₹)</TableCell>}
                  <TableCell sx={{ fontWeight: 700 }}>Workflow Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {timecards.length > 0 ? (
                  timecards.map((row) => {
                    const chip = STATUS_CHIPS[row.Status] || { label: row.Status, color: 'default' };
                    const isRejected = row.Status === 'ManagerRejected' || row.Status === 'FinancialRejected';
                    const isMyTimecard = isEmployee || user?.id === row.EmployeeID;

                    return (
                      <TableRow key={row.TimecardID} hover>
                        <TableCell sx={{ fontWeight: 700 }}>#{row.TimecardID}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {row.EmployeeFirstName} {row.EmployeeLastName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {row.EmployeeEmail}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(row.WeekStartDate).toLocaleDateString()} – {new Date(row.WeekEndDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: '#1E88E5' }}>
                          {row.TotalHours} hrs
                        </TableCell>
                        {!isEmployee && (
                          <TableCell align="right" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                            ₹{row.TotalAmount ?? '—'}
                          </TableCell>
                        )}
                        <TableCell>
                          <Chip label={chip.label} color={chip.color} size="small" sx={{ fontWeight: 600 }} />
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<VisibilityRoundedIcon />}
                              onClick={() => handleOpenDetails(row.TimecardID)}
                            >
                              Details
                            </Button>
                            {isRejected && isMyTimecard && (
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                onClick={() => navigate(`${ROUTES.TIMECARDS}/create?editId=${row.TimecardID}`)}
                              >
                                Edit & Resend
                              </Button>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        No timecards found matching current criteria.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={limit}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setLimit(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* Details & Approval Dialog */}
      <TimecardDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        timecard={selectedTimecard}
        onRefresh={fetchTimecards}
      />

      {/* Project Financial Billing Report Dialog */}
      <FinancialBillingReportModal
        open={billingModalOpen}
        onClose={() => setBillingModalOpen(false)}
        projectId={selectedProjectId}
      />
    </Box>
  );
};

export default TimecardListPage;
