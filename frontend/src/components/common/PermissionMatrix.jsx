import { Box, Card, CardContent, Typography, Grid, FormControlLabel, Checkbox, Divider, Switch } from '@mui/material';

const PERMISSION_GROUPS = [
  {
    category: 'Dashboard',
    permissions: [{ key: 'dashboard_view', label: 'Access Overview Dashboard' }],
  },
  {
    category: 'Employee Management',
    permissions: [
      { key: 'employee_view', label: 'View Employees List' },
      { key: 'employee_create', label: 'Add New Employees' },
      { key: 'employee_edit', label: 'Edit Employee Records' },
      { key: 'employee_delete', label: 'Delete Employee Records' },
    ],
  },
  {
    category: 'Department Management',
    permissions: [
      { key: 'department_view', label: 'View Departments' },
      { key: 'department_create', label: 'Add Departments' },
      { key: 'department_edit', label: 'Edit Departments' },
      { key: 'department_delete', label: 'Delete Departments' },
    ],
  },
  {
    category: 'Role & Policy Rules',
    permissions: [
      { key: 'role_view', label: 'View Roles & Access Policies' },
      { key: 'role_create', label: 'Create Custom Access Roles' },
      { key: 'role_edit', label: 'Edit Roles & Permissions Matrix' },
      { key: 'role_delete', label: 'Delete Custom Roles' },
    ],
  },
  {
    category: 'Project Management',
    permissions: [
      { key: 'project_view', label: 'View Project Files' },
      { key: 'project_create', label: 'Add New Projects' },
      { key: 'project_edit', label: 'Edit Projects' },
      { key: 'project_delete', label: 'Delete Projects' },
      { key: 'project_manage', label: 'Manage Members & Timelines' },
    ],
  },
  {
    category: 'Task Workflow',
    permissions: [
      { key: 'task_view', label: 'View Tasks List' },
      { key: 'task_create', label: 'Create Work Tasks' },
      { key: 'task_edit', label: 'Edit Tasks' },
      { key: 'task_delete', label: 'Delete Tasks' },
      { key: 'task_execute', label: 'Execute/Update Assigned Tasks' },
    ],
  },
  {
    category: 'Task Audits & Reviews',
    permissions: [
      { key: 'task_review', label: 'Perform Code/Task Reviews' },
      { key: 'task_approve', label: 'Approve or Reject Task Delivery' },
    ],
  },
  {
    category: 'Notifications & Feeds',
    permissions: [
      { key: 'notification_view', label: 'Receive System Feeds' },
      { key: 'notification_manage', label: 'Configure System Feeds' },
    ],
  },
  {
    category: 'Reports & Analytics',
    permissions: [
      { key: 'report_view', label: 'View Analytics Reports' },
      { key: 'report_generate', label: 'Export Reports' },
    ],
  },
];

/**
 * PermissionMatrix
 * Checkbox grid for role permissions management.
 * Supports a global "All Permissions" super-user override.
 *
 * @param {object} value - Active permissions mapping (e.g. { all: true } or { task_create: true })
 * @param {function} onChange - Triggered with updated permissions object on toggle
 * @param {boolean} disabled - Read-only mode
 */
const PermissionMatrix = ({ value = {}, onChange, disabled = false }) => {
  const isSuperUser = !!value.all;

  const handleSuperUserToggle = (e) => {
    if (disabled) return;
    const checked = e.target.checked;
    if (checked) {
      onChange?.({ all: true });
    } else {
      onChange?.({});
    }
  };

  const handlePermissionToggle = (key) => (e) => {
    if (disabled) return;
    const checked = e.target.checked;
    const updated = { ...value };

    if (checked) {
      updated[key] = true;
    } else {
      delete updated[key];
    }
    onChange?.(updated);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Super User Administrator Checkbox */}
      <Card sx={{ border: '1.5px solid', borderColor: isSuperUser ? 'primary.main' : 'divider', borderRadius: 3, backgroundColor: isSuperUser ? 'rgba(25,118,210,0.02)' : 'background.paper', transition: 'all 0.15s ease' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item xs={12} sm={8}>
              <Typography variant="subtitle1" fontWeight={700} color={isSuperUser ? 'primary.main' : 'text.primary'}>
                Super User Mode (All Permissions)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Grant absolute database control. Overrides all individual permission nodes.
              </Typography>
            </Grid>
            <Grid item>
              <Switch
                checked={isSuperUser}
                onChange={handleSuperUserToggle}
                disabled={disabled}
                color="primary"
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Permission Categories Grid */}
      <Grid container spacing={3}>
        {PERMISSION_GROUPS.map((group) => (
          <Grid item xs={12} md={6} key={group.category}>
            <Card sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" gutterBottom>
                  {group.category}
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {group.permissions.map((p) => {
                    const isChecked = isSuperUser || !!value[p.key];
                    return (
                      <FormControlLabel
                        key={p.key}
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={handlePermissionToggle(p.key)}
                            disabled={disabled || isSuperUser}
                            size="small"
                          />
                        }
                        label={
                          <Typography
                            variant="body2"
                            color={isChecked ? 'text.primary' : 'text.secondary'}
                            sx={{ fontSize: '0.85rem', fontWeight: isChecked ? 500 : 400 }}
                          >
                            {p.label}
                          </Typography>
                        }
                      />
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PermissionMatrix;
export { PERMISSION_GROUPS };
