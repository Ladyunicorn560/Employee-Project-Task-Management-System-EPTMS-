import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Button, TextField,
  Select, MenuItem, FormControl, InputLabel, IconButton,
  Card, CardContent, Divider, Stack, Alert, Table, TableHead,
  TableRow, TableCell, TableBody, Chip
} from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import AttachMoneyRoundedIcon from '@mui/icons-material/AttachMoneyRounded';

import useAuth from '../../hooks/useAuth';
import projectService from '../../services/projectService';
import employeeService from '../../services/employeeService';
import timecardService from '../../services/timecardService';
import taskService from '../../services/taskService';
import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';

const WORK_MODES = ['Office', 'Client Site', 'WFH', 'Leave', 'Public Holiday'];

// Helper to get current week's Monday & Sunday dates
const getCurrentWeekBounds = () => {
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + 1; // Monday
  const last = first + 6; // Sunday

  const monday = new Date(curr.setDate(first)).toISOString().split('T')[0];
  const sunday = new Date(curr.setDate(last)).toISOString().split('T')[0];

  return { monday, sunday };
};

const TimecardCreatePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('editId');
  const { user } = useAuth();
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;

  const { monday, sunday } = getCurrentWeekBounds();
  const todayStr = new Date().toISOString().split('T')[0];

  const [weekStartDate, setWeekStartDate] = useState(monday);
  const [weekEndDate, setWeekEndDate] = useState(sunday);
  const [managerId, setManagerId] = useState('');

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [projectTasks, setProjectTasks] = useState({});

  const [entries, setEntries] = useState([
    {
      projectId: '',
      taskId: '',
      workDate: monday,
      workMode: 'Office',
      hoursWorked: 8.0,
      description: '',
      hourlyRate: 50.0
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDropdowns();
  }, []);

  const fetchTasksForProject = useCallback(async (projId) => {
    if (!projId || projectTasks[projId]) return;
    try {
      const res = await taskService.getAll({ projectId: projId, limit: 100 });
      const taskList = res.data || res.items || [];
      setProjectTasks((prev) => ({ ...prev, [projId]: taskList }));
    } catch (err) {
      console.error(`Failed to fetch tasks for project ${projId}:`, err);
    }
  }, [projectTasks]);

  const fetchDropdowns = async () => {
    try {
      setLoading(true);
      const [projRes, empRes] = await Promise.all([
        projectService.getAll({ limit: 100 }),
        employeeService.getAll({ limit: 100 })
      ]);

      const projList = projRes.data || projRes.items || [];
      const empList = empRes.data || empRes.items || [];

      setProjects(projList);
      setEmployees(empList);

      // Default manager to assigned employee manager or first PM/Admin
      if (user?.manager?.id) {
        setManagerId(user.manager.id);
      } else if (empList.length > 0) {
        const pm = empList.find((e) => {
          const rName = e.roleName || e.role?.name || e.RoleName;
          return rName === 'Project Manager' || rName === 'Administrator';
        });
        const defaultMgr = pm || empList[0];
        if (defaultMgr) setManagerId(defaultMgr.id || defaultMgr.EmployeeID);
      }

      // Check if editing an existing rejected timecard
      if (editId) {
        const tcData = await timecardService.getById(editId);
        if (tcData) {
          if (tcData.WeekStartDate) setWeekStartDate(tcData.WeekStartDate.substring(0, 10));
          if (tcData.WeekEndDate) setWeekEndDate(tcData.WeekEndDate.substring(0, 10));
          if (tcData.ManagerID) setManagerId(tcData.ManagerID);

          if (Array.isArray(tcData.entries) && tcData.entries.length > 0) {
            const mappedEntries = tcData.entries.map((e) => {
              const pId = e.projectId || e.ProjectID;
              if (pId) fetchTasksForProject(pId);
              return {
                projectId: pId || '',
                taskId: e.taskId || e.TaskID || '',
                workDate: (e.workDate || e.WorkDate || monday).substring(0, 10),
                workMode: e.workMode || e.WorkMode || 'Office',
                hoursWorked: parseFloat(e.hoursWorked || e.HoursWorked || 8.0),
                description: e.description || e.Description || '',
                hourlyRate: parseFloat(e.hourlyRate || e.HourlyRate || 50.0)
              };
            });
            setEntries(mappedEntries);
          }
        }
      }
    } catch (err) {
      setError('Failed to load initial timecard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    const firstProj = projects[0];
    const firstProjId = firstProj?.id || firstProj?.ProjectID || '';
    if (firstProjId) fetchTasksForProject(firstProjId);

    setEntries([
      ...entries,
      {
        projectId: firstProjId,
        taskId: '',
        workDate: weekStartDate <= todayStr ? weekStartDate : todayStr,
        workMode: 'Office',
        hoursWorked: 8.0,
        description: '',
        hourlyRate: 50.0
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const handleEntryChange = (index, field, value) => {
    const updated = [...entries];
    updated[index][field] = value;

    if (field === 'projectId' && value) {
      fetchTasksForProject(value);
      updated[index].taskId = '';
    }

    if (field === 'workMode') {
      if (value === 'Public Holiday' || value === 'Leave') {
        updated[index].taskId = '0';
        if (!updated[index].description) {
          updated[index].description = value;
        }
      }
    }

    setEntries(updated);
  };

  // 1-Week Past limit helper (cannot submit older than 1 week prior to current week)
  const getMinAllowedWeekStartDate = () => {
    const curr = new Date();
    const minDate = new Date(curr.setDate(curr.getDate() - curr.getDay() - 7));
    return minDate.toISOString().split('T')[0];
  };
  const minAllowedDate = getMinAllowedWeekStartDate();

  // Calculations
  const totalHours = entries.reduce((sum, e) => sum + (parseFloat(e.hoursWorked) || 0), 0);
  const totalAmount = entries.reduce((sum, e) => {
    const hrs = parseFloat(e.hoursWorked) || 0;
    const rate = parseFloat(e.hourlyRate) || 50.0;
    return sum + (hrs * rate);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');

      if (!managerId) {
        setError('Please select an assigned manager for Level-1 approval');
        setSubmitting(false);
        return;
      }

      // Check future dates validation
      if (weekStartDate > todayStr) {
        setError('Cannot submit a timecard for future week dates');
        setSubmitting(false);
        return;
      }

      // Check 1-week past limit validation
      if (weekStartDate < minAllowedDate) {
        setError(`Employees cannot submit timecards older than 1 week past (Earliest allowed week start: ${minAllowedDate})`);
        setSubmitting(false);
        return;
      }

      // Validate mandatory fields for entries
      for (let i = 0; i < entries.length; i++) {
        const row = entries[i];
        if (!row.projectId) {
          setError(`Row ${i + 1}: Project selection is mandatory.`);
          setSubmitting(false);
          return;
        }
        if (row.taskId === '' || row.taskId === null || row.taskId === undefined) {
          setError(`Row ${i + 1}: Task selection (or Others/Holiday) is mandatory.`);
          setSubmitting(false);
          return;
        }
        if (!row.workDate) {
          setError(`Row ${i + 1}: Work Date is mandatory.`);
          setSubmitting(false);
          return;
        }
        if (row.workDate > todayStr) {
          setError(`Row ${i + 1}: Future work date (${row.workDate}) is not allowed.`);
          setSubmitting(false);
          return;
        }
        if (!row.workMode) {
          setError(`Row ${i + 1}: Work Mode is mandatory.`);
          setSubmitting(false);
          return;
        }
        if (!row.hoursWorked || parseFloat(row.hoursWorked) <= 0) {
          setError(`Row ${i + 1}: Hours worked must be greater than 0.`);
          setSubmitting(false);
          return;
        }
        if (!row.description || !row.description.trim()) {
          setError(`Row ${i + 1}: Description notes are mandatory.`);
          setSubmitting(false);
          return;
        }
      }

      const payload = {
        weekStartDate,
        weekEndDate,
        managerId: parseInt(managerId, 10),
        entries: entries.map((e) => ({
          projectId: parseInt(e.projectId, 10),
          taskId: e.taskId === '0' || e.taskId === 0 ? 0 : parseInt(e.taskId, 10),
          workDate: e.workDate,
          workMode: e.workMode,
          hoursWorked: parseFloat(e.hoursWorked),
          description: e.description.trim()
        }))
      };

      if (editId) {
        await timecardService.update(editId, payload);
      } else {
        await timecardService.submit(payload);
      }

      navigate(ROUTES.TIMECARDS);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit timecard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      {/* Top Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(ROUTES.TIMECARDS)} sx={{ border: '1px solid #E2E8F0' }}>
            <ArrowBackRoundedIcon />
          </IconButton>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B' }}>
              {editId ? 'Edit & Resubmit Timecard' : 'Submit Weekly Timecard'}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Log project hours and submit for Stage 1 Manager Approval & Stage 2 Financial Clearance
            </Typography>
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Main Grid Entries */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Timecard Week Period & Approver
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Week Start Date"
                    value={weekStartDate}
                    onChange={(e) => setWeekStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ min: minAllowedDate, max: todayStr }}
                    helperText={`Earliest allowed: ${minAllowedDate}`}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Week End Date"
                    value={weekEndDate}
                    onChange={(e) => setWeekEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Assigned Manager</InputLabel>
                    <Select
                      value={managerId}
                      label="Assigned Manager"
                      onChange={(e) => setManagerId(e.target.value)}
                    >
                      {employees.map((emp) => {
                        const eId = emp.id || emp.EmployeeID;
                        const fName = emp.firstName || emp.FirstName || '';
                        const lName = emp.lastName || emp.LastName || '';
                        const rName = emp.roleName || emp.role?.name || emp.RoleName || 'Employee';
                        return (
                          <MenuItem key={eId} value={eId}>
                            {fName} {lName} ({rName})
                          </MenuItem>
                        );
                      })}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Project Entries (All Fields Mandatory)
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddRoundedIcon />}
                  onClick={handleAddRow}
                  size="small"
                >
                  Add Entry Row
                </Button>
              </Box>

              <Table size="small" sx={{ mb: 2 }}>
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, width: '22%' }}>Project *</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '20%' }}>Task *</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '15%' }}>Date *</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '15%' }}>Work Mode *</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: '10%' }}>Hours *</TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '18%' }}>Description *</TableCell>
                    <TableCell align="center" sx={{ width: '4%' }}></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entries.map((row, idx) => {
                    const tasksForSelectedProj = projectTasks[row.projectId] || [];
                    const isHolidayOrLeave = row.workMode === 'Public Holiday' || row.workMode === 'Leave';

                    return (
                      <TableRow key={idx} sx={{ backgroundColor: isHolidayOrLeave ? '#F1F5F9' : 'inherit' }}>
                        <TableCell>
                          <FormControl fullWidth size="small" required>
                            <Select
                              value={row.projectId}
                              onChange={(e) => handleEntryChange(idx, 'projectId', e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>Select Project</MenuItem>
                              {projects.map((p) => {
                                const pId = p.id || p.ProjectID;
                                const pName = p.projectName || p.ProjectName;
                                return (
                                  <MenuItem key={pId} value={pId}>
                                    {pName}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" required disabled={!row.projectId || isHolidayOrLeave}>
                            <Select
                              value={isHolidayOrLeave ? '0' : row.taskId}
                              onChange={(e) => handleEntryChange(idx, 'taskId', e.target.value)}
                              displayEmpty
                            >
                              <MenuItem value="" disabled>
                                {row.projectId ? 'Select Task' : 'Select Project First'}
                              </MenuItem>
                              <MenuItem value="0" sx={{ fontStyle: 'italic', fontWeight: 600, color: 'primary.main' }}>
                                Others
                              </MenuItem>
                              {tasksForSelectedProj.map((t) => {
                                const tId = t.id || t.TaskID;
                                const tTitle = t.taskTitle || t.Title;
                                return (
                                  <MenuItem key={tId} value={tId}>
                                    {tTitle}
                                  </MenuItem>
                                );
                              })}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="date"
                            size="small"
                            fullWidth
                            value={row.workDate}
                            onChange={(e) => handleEntryChange(idx, 'workDate', e.target.value)}
                            inputProps={{ max: todayStr }}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl fullWidth size="small" required>
                            <Select
                              value={row.workMode}
                              onChange={(e) => handleEntryChange(idx, 'workMode', e.target.value)}
                            >
                              {WORK_MODES.map((wm) => (
                                <MenuItem key={wm} value={wm}>
                                  {wm}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell align="right">
                          <TextField
                            type="number"
                            size="small"
                            inputProps={{ step: '0.25', min: '0.25', max: '24' }}
                            value={row.hoursWorked}
                            onChange={(e) => handleEntryChange(idx, 'hoursWorked', e.target.value)}
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            fullWidth
                            placeholder="Detailed work notes..."
                            value={row.description}
                            onChange={(e) => handleEntryChange(idx, 'description', e.target.value)}
                            required
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            disabled={entries.length === 1}
                            onClick={() => handleRemoveRow(idx)}
                          >
                            <DeleteOutlineRoundedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Right Summary Card */}
          <Grid item xs={12} md={3}>
            <Card variant="outlined" sx={{ borderRadius: 3, position: 'sticky', top: 90 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
                  Timecard Summary
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeRoundedIcon fontSize="small" /> Total Hours
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1E88E5' }}>
                      {totalHours.toFixed(2)} hrs
                    </Typography>
                  </Box>

                  {!isEmployee && (
                    <>
                      <Divider />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <AttachMoneyRoundedIcon fontSize="small" /> Est. Cost & Billing
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#2E7D32' }}>
                          ₹{totalAmount.toFixed(2)}
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Divider />

                  <Box sx={{ backgroundColor: '#F8FAFC', p: 1.5, borderRadius: 2 }}>
                    <Typography variant="caption" color="textSecondary" display="block">
                      Approval Workflow
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                      1. Manager Approval $\rightarrow$ 2. Project Owner Clearance
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={<SendRoundedIcon />}
                  disabled={submitting || totalHours === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
                    py: 1.5,
                    fontWeight: 700
                  }}
                >
                  {submitting
                    ? 'Submitting...'
                    : editId
                    ? 'Resubmit Timecard'
                    : 'Submit Weekly Timecard'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default TimecardCreatePage;
