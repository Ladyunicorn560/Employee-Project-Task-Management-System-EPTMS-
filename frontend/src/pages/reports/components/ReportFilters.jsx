import { useState, useEffect } from 'react';
import { Box, Grid, MenuItem, Select, FormControl, InputLabel, TextField } from '@mui/material';
import departmentService from '../../../services/departmentService';
import projectService from '../../../services/projectService';
import employeeService from '../../../services/employeeService';

/**
 * ReportFilters
 * Renders dynamically adjusted inputs based on report selection to customize export parameters.
 *
 * @param {string} reportType - projects | employees | tasks | milestones | reviews | notifications
 * @param {object} filters - Active parameters state
 * @param {function} onFilterChange - Updates filters handler
 */
const ReportFilters = ({ reportType, filters, onFilterChange }) => {
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    const fetchSelectOptions = async () => {
      try {
        const [deptRes, projRes, empRes] = await Promise.all([
          departmentService.getAll(),
          projectService.getAll({ limit: 100 }),
          employeeService.getAll({ limit: 100 }),
        ]);
        setDepartments(deptRes.data?.data || []);
        setProjects(projRes.data?.data || []);
        setEmployees((empRes.data?.data || []).filter((e) => e.status === 'Active'));
      } catch (err) {
        console.error('Failed to load filters select fields options:', err);
      }
    };
    fetchSelectOptions();
  }, []);

  const handleChange = (field) => (e) => {
    onFilterChange({ ...filters, [field]: e.target.value });
  };

  const isProjects = reportType === 'projects';
  const isTasks = reportType === 'tasks';
  const isMilestones = reportType === 'milestones';
  const isEmployees = reportType === 'employees';
  const isReviews = reportType === 'reviews';
  const isNotifications = reportType === 'notifications';

  return (
    <Box sx={{ mb: 1.5 }}>
      <Grid container spacing={2}>
        {/* Date Ranges (Relevant for projects, tasks, milestones, reviews) */}
        {!isEmployees && !isNotifications && (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.startDate || ''}
                onChange={handleChange('startDate')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                value={filters.endDate || ''}
                onChange={handleChange('endDate')}
              />
            </Grid>
          </>
        )}

        {/* Project Select (Relevant for tasks, milestones, reviews) */}
        {(isTasks || isMilestones || isReviews) && (
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel id="report-filter-proj-label">Select Project</InputLabel>
              <Select
                labelId="report-filter-proj-label"
                value={filters.projectId || ''}
                onChange={handleChange('projectId')}
                label="Select Project"
              >
                <MenuItem value="">All Projects</MenuItem>
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.projectName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Department Select (Relevant for projects, employees) */}
        {(isProjects || isEmployees) && (
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel id="report-filter-dept-label">Filter Department</InputLabel>
              <Select
                labelId="report-filter-dept-label"
                value={filters.departmentId || ''}
                onChange={handleChange('departmentId')}
                label="Filter Department"
              >
                <MenuItem value="">All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Status Select (Relevant for projects, tasks, milestones, reviews) */}
        {(isProjects || isTasks || isMilestones || isReviews) && (
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel id="report-filter-status-label">Status</InputLabel>
              <Select
                labelId="report-filter-status-label"
                value={filters.status || ''}
                onChange={handleChange('status')}
                label="Status"
              >
                <MenuItem value="">All Statuses</MenuItem>
                {isProjects && (
                  <>
                    <MenuItem value="Active">Active</MenuItem>
                    <MenuItem value="Planning">Planning</MenuItem>
                    <MenuItem value="On Hold">On Hold</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </>
                )}
                {isTasks && (
                  <>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Under Review">Under Review</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </>
                )}
                {isMilestones && (
                  <>
                    <MenuItem value="Not Started">Not Started</MenuItem>
                    <MenuItem value="In Progress">In Progress</MenuItem>
                    <MenuItem value="Completed">Completed</MenuItem>
                  </>
                )}
                {isReviews && (
                  <>
                    <MenuItem value="Pending">Pending</MenuItem>
                    <MenuItem value="Approved">Approved</MenuItem>
                    <MenuItem value="Rejected">Rejected</MenuItem>
                    <MenuItem value="Changes Required">Changes Required</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Assignee / Employee Select (Relevant for tasks) */}
        {isTasks && (
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel id="report-filter-emp-label">Assignee</InputLabel>
              <Select
                labelId="report-filter-emp-label"
                value={filters.assignedEmployeeId || ''}
                onChange={handleChange('assignedEmployeeId')}
                label="Assignee"
              >
                <MenuItem value="">All Employees</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Priority Select (Relevant for tasks) */}
        {isTasks && (
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel id="report-filter-priority-label">Priority</InputLabel>
              <Select
                labelId="report-filter-priority-label"
                value={filters.priority || ''}
                onChange={handleChange('priority')}
                label="Priority"
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="Low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}

        {/* Reviewer Select (Relevant for reviews) */}
        {isReviews && (
          <Grid item xs={12} sm={6}>
            <FormControl size="small" fullWidth>
              <InputLabel id="report-filter-rev-label">Reviewer</InputLabel>
              <Select
                labelId="report-filter-rev-label"
                value={filters.reviewerId || ''}
                onChange={handleChange('reviewerId')}
                label="Reviewer"
              >
                <MenuItem value="">All Reviewers</MenuItem>
                {employees.map((emp) => (
                  <MenuItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default ReportFilters;
