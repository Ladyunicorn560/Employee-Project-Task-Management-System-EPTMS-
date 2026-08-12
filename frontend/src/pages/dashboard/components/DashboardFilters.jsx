import { useState, useEffect } from 'react';
import { Box, Grid, MenuItem, Select, FormControl, InputLabel, TextField } from '@mui/material';
import departmentService from '../../../services/departmentService';
import projectService from '../../../services/projectService';
import AppButton from '../../../components/ui/AppButton';

/**
 * DashboardFilters
 * Shared filters row for analytics date scopes and project selection filters.
 *
 * @param {object} filters - Current filter states
 * @param {function} onFilterChange - Callback update handler
 */
const DashboardFilters = ({ filters, onFilterChange }) => {
  const [departments, setDepartments] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptRes, projRes] = await Promise.all([
          departmentService.getAll(),
          projectService.getAll({ limit: 100 }),
        ]);
        setDepartments(deptRes.data || []);
        setProjects(projRes.data || []);
      } catch (err) {
        console.error('Failed to load dashboard filter lists:', err);
      }
    };
    fetchOptions();
  }, []);

  const handleChange = (field) => (e) => {
    onFilterChange({ ...filters, [field]: e.target.value });
  };

  const handleClear = () => {
    onFilterChange({
      departmentId: '',
      projectId: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters =
    filters.departmentId || filters.projectId || filters.startDate || filters.endDate;

  return (
    <Box sx={{ p: 2.5, mb: 3, border: '1px solid', borderColor: 'divider', borderRadius: 3, backgroundColor: 'background.paper' }}>
      <Grid container spacing={2} alignItems="center">
        {/* Department Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl size="small" fullWidth sx={{ minWidth: 175 }}>
            <InputLabel id="dash-dept-filter-label">Filter Department</InputLabel>
            <Select
              labelId="dash-dept-filter-label"
              value={filters.departmentId}
              onChange={handleChange('departmentId')}
              label="Filter Department"
            >
              <MenuItem value="">All Departments</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.departmentName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Project Filter */}
        <Grid item xs={12} sm={6} md={3}>
          <FormControl size="small" fullWidth sx={{ minWidth: 160 }}>
            <InputLabel id="dash-proj-filter-label">Filter Project</InputLabel>
            <Select
              labelId="dash-proj-filter-label"
              value={filters.projectId}
              onChange={handleChange('projectId')}
              label="Filter Project"
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

        {/* Start Date */}
        <Grid item xs={12} sm={6} md={2.25}>
          <TextField
            fullWidth
            type="date"
            label="Start Date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.startDate}
            onChange={handleChange('startDate')}
          />
        </Grid>

        {/* End Date */}
        <Grid item xs={12} sm={6} md={2.25}>
          <TextField
            fullWidth
            type="date"
            label="End Date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={filters.endDate}
            onChange={handleChange('endDate')}
          />
        </Grid>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Grid item xs={12} md={1.5}>
            <AppButton variant="outlined" size="small" fullWidth onClick={handleClear}>
              Clear
            </AppButton>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardFilters;
