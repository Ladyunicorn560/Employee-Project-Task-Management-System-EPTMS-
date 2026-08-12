import { useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, TextField, FormControlLabel,
  Checkbox, FormControl, RadioGroup, Radio, Alert
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import PageHeader from '../../components/common/PageHeader';
import AppButton from '../../components/ui/AppButton';
import authService from '../../services/authService';
import useAuth from '../../hooks/useAuth';

/**
 * ConfigurationPage
 * Lightweight administration and personal preference page.
 * Displays session stats, system settings, password management, and app version.
 */
const ConfigurationPage = () => {
  const { user } = useAuth();
  const [passwordError, setPasswordError] = useState('');

  // 1. Notification Preferences (saved in localStorage)
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('eptms_notification_prefs');
    return saved ? JSON.parse(saved) : { emailAlerts: true, inAppUpdates: true, projectStatusAlerts: false };
  });

  const handleNotificationChange = (field) => (e) => {
    const updated = { ...notifications, [field]: e.target.checked };
    setNotifications(updated);
    localStorage.setItem('eptms_notification_prefs', JSON.stringify(updated));
    toast.success('Notification preferences updated.');
  };

  // 2. Theme Preference (saved in localStorage)
  const [themePref, setThemePref] = useState(() => {
    return localStorage.getItem('eptms_theme_pref') || 'light';
  });

  const handleThemeChange = (e) => {
    const val = e.target.value;
    setThemePref(val);
    localStorage.setItem('eptms_theme_pref', val);
    toast.success(`Theme preference updated to ${val}.`);
  };

  // 3. Change Password Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onBlur',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmitPassword = async (data) => {
    setPasswordError('');
    if (data.newPassword !== data.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success('Password changed successfully.');
      reset();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to change password. Please check your credentials.';
      setPasswordError(msg);
    }
  };

  return (
    <Box>
      <PageHeader
        title="System Configuration"
        description="Manage personal security parameters, application preferences, and view deployment diagnostics."
        breadcrumbItems={[
          { label: 'Administration' },
          { label: 'Configuration' }
        ]}
      />

      <Grid container spacing={3}>
        {/* Left Side Settings Form Panel */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Card 1: Change Password */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Change Password</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Update your account security key. Avoid reusing recent passwords.
                  </Typography>

                  {passwordError && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                      {passwordError}
                    </Alert>
                  )}

                  <Box component="form" onSubmit={handleSubmit(onSubmitPassword)} noValidate>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          type="password"
                          size="small"
                          error={!!errors.currentPassword}
                          helperText={errors.currentPassword?.message}
                          {...register('currentPassword', { required: 'Current password is required' })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          type="password"
                          size="small"
                          error={!!errors.newPassword}
                          helperText={errors.newPassword?.message}
                          {...register('newPassword', {
                            required: 'New password is required',
                            minLength: { value: 8, message: 'Password must be at least 8 characters' }
                          })}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          type="password"
                          size="small"
                          error={!!errors.confirmPassword}
                          helperText={errors.confirmPassword?.message}
                          {...register('confirmPassword', { required: 'Please confirm your new password' })}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <AppButton
                          type="submit"
                          variant="primary"
                          loading={isSubmitting}
                          sx={{ minWidth: 150, float: 'right' }}
                        >
                          Update Password
                        </AppButton>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 2: System & Notifications Preferences */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 1.5 }}>System & Notification Preferences</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Toggle active alerts channel specifications and display styling configurations.
                  </Typography>

                  <Grid container spacing={4}>
                    {/* Notification Toggles */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Alert Channels</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={notifications.emailAlerts}
                              onChange={handleNotificationChange('emailAlerts')}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight={500}>Email Notifications</Typography>
                              <Typography variant="caption" color="text.secondary">Get immediate email alerts for task assignments</Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={notifications.inAppUpdates}
                              onChange={handleNotificationChange('inAppUpdates')}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight={500}>In-App Notifications</Typography>
                              <Typography variant="caption" color="text.secondary">Show real-time alerts inside the dashboard</Typography>
                            </Box>
                          }
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={notifications.projectStatusAlerts}
                              onChange={handleNotificationChange('projectStatusAlerts')}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2" fontWeight={500}>Status Change Alerts</Typography>
                              <Typography variant="caption" color="text.secondary">Notify me when milestones or projects update status</Typography>
                            </Box>
                          }
                        />
                      </Box>
                    </Grid>

                    {/* Theme selector */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Theme Mode Preference</Typography>
                      <FormControl component="fieldset">
                        <RadioGroup value={themePref} onChange={handleThemeChange}>
                          <FormControlLabel value="light" control={<Radio color="primary" />} label={
                            <Box>
                              <Typography variant="body2" fontWeight={500}>Light Theme</Typography>
                              <Typography variant="caption" color="text.secondary">Default clean layout rendering</Typography>
                            </Box>
                          } sx={{ mb: 1 }} />
                          <FormControlLabel value="dark" control={<Radio color="primary" />} label={
                            <Box>
                              <Typography variant="body2" fontWeight={500}>Dark Mode (Beta)</Typography>
                              <Typography variant="caption" color="text.secondary">Low contrast night palette specs</Typography>
                            </Box>
                          } sx={{ mb: 1 }} />
                          <FormControlLabel value="system" control={<Radio color="primary" />} label={
                            <Box>
                              <Typography variant="body2" fontWeight={500}>System Default</Typography>
                              <Typography variant="caption" color="text.secondary">Match operating system preference</Typography>
                            </Box>
                          } />
                        </RadioGroup>
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>

        {/* Right Side Diagnostics Panel */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3}>
            {/* Card 3: Session Information */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Active Session Information</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Logged Account</Typography>
                      <Typography variant="body2" fontWeight={600}>{user ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Guest User'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email Identity</Typography>
                      <Typography variant="body2" fontWeight={600}>{user?.email || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Designated Role</Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main">{user?.roleName || '—'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Session Expiry Target</Typography>
                      <Typography variant="body2" fontWeight={600}>8 Hours (Standard Refresh Window)</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 4: Password Policy */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>Active Password Policy</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    For security purposes, EPTMS accounts must maintain key standards:
                  </Typography>
                  <Box component="ul" sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1, fontSize: '0.85rem', color: 'text.secondary' }}>
                    <li>Must be at least <strong>8 characters</strong> in length.</li>
                    <li>Should contain upper and lower case characters.</li>
                    <li>Requires at least one numeric digit (0-9).</li>
                    <li>Requires one special symbol character (e.g. !, @, #, etc).</li>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Card 5: App Version & Diagnostics */}
            <Grid item xs={12}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Application Specs & Diagnostics</Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Application Version</Typography>
                      <Typography variant="body2" fontWeight={600}>v1.0.0 (Release-Build)</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Environment Mode</Typography>
                      <Typography variant="body2" fontWeight={600} color="success.main">development</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Backend Endpoint</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', mt: 0.25 }}>http://localhost:5000/api/v1</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Database Provider</Typography>
                      <Typography variant="body2" fontWeight={600}>Microsoft SQL Server (Online)</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfigurationPage;
