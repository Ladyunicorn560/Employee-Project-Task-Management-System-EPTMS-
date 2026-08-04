import { useState } from 'react';
import {
  Box, TextField, Typography, InputAdornment, IconButton,
  Alert, Card, CardContent, LinearProgress, Grid,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';
import AppButton from '../../components/ui/AppButton';
import authService from '../../services/authService';
import { ROUTES } from '../../constants/routes';

// ─── Password Strength Calculator ─────────────────────────────────────────────
const calcStrength = (password = '') => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0–5
};

const STRENGTH_CONFIG = [
  { label: '', color: 'transparent', value: 0 },
  { label: 'Very Weak', color: '#D32F2F', value: 20 },
  { label: 'Weak', color: '#ED6C02', value: 40 },
  { label: 'Fair', color: '#F9A825', value: 60 },
  { label: 'Strong', color: '#2E7D32', value: 80 },
  { label: 'Very Strong', color: '#1565C0', value: 100 },
];

const StrengthBar = ({ password }) => {
  const score = calcStrength(password);
  const config = STRENGTH_CONFIG[score];

  if (!password) return null;

  return (
    <Box sx={{ mt: 1, mb: 0.5 }}>
      <LinearProgress
        variant="determinate"
        value={config.value}
        sx={{
          height: 5,
          borderRadius: 3,
          backgroundColor: '#E2E8F0',
          '& .MuiLinearProgress-bar': {
            backgroundColor: config.color,
            borderRadius: 3,
            transition: 'all 0.3s ease',
          },
        }}
      />
      {config.label && (
        <Typography variant="caption" sx={{ color: config.color, fontWeight: 600, mt: 0.5, display: 'block' }}>
          Password strength: {config.label}
        </Typography>
      )}
    </Box>
  );
};

// ─── Requirement Check Item ────────────────────────────────────────────────────
const RequirementItem = ({ met, label }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
    <CheckCircleOutlineRoundedIcon
      sx={{ fontSize: 14, color: met ? 'success.main' : 'text.disabled', transition: 'color 0.2s' }}
    />
    <Typography variant="caption" sx={{ color: met ? 'success.main' : 'text.disabled', transition: 'color 0.2s' }}>
      {label}
    </Typography>
  </Box>
);

// ─── Change Password Page ──────────────────────────────────────────────────────
/**
 * ChangePasswordPage
 * Dedicated page for authenticated users to change their password.
 * Route: /change-password
 *
 * Integrates: PUT /api/v1/auth/change-password
 */
const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const [show, setShow] = useState({ current: false, newPw: false, confirm: false });
  const [submitError, setSubmitError] = useState('');

  const toggle = (field) => setShow((prev) => ({ ...prev, [field]: !prev[field] }));

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' });

  const newPassword = watch('newPassword', '');
  const confirmPassword = watch('confirmPassword', '');

  // Password requirements
  const reqs = {
    length: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword && confirmPassword && newPassword === confirmPassword,
  };

  const onSubmit = async ({ currentPassword, newPassword: newPw }) => {
    setSubmitError('');
    try {
      await authService.changePassword({ currentPassword, newPassword: newPw });
      toast.success('Password changed successfully. Please use your new password next time you sign in.', {
        autoClose: 5000,
      });
      reset();
      navigate(ROUTES.DASHBOARD);
    } catch (err) {
      const code = err?.response?.data?.errorCode;
      const msg = err?.response?.data?.message;

      if (code === 'INCORRECT_CURRENT_PASSWORD') {
        setSubmitError('The current password you entered is incorrect. Please try again.');
      } else {
        setSubmitError(msg || 'Failed to change password. Please try again.');
      }
    }
  };

  return (
    <Box>
      <AppBreadcrumbs
        items={[{ label: 'Profile', to: ROUTES.PROFILE }, { label: 'Change Password' }]}
      />

      <Box sx={{ maxWidth: 600 }}>
        {/* Page Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
            }}
          >
            <KeyRoundedIcon sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Change Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Update your account password to keep it secure.
            </Typography>
          </Box>
        </Box>

        <Card>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            {submitError && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontSize: '0.8125rem' }}>
                {submitError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Current Password */}
              <TextField
                id="cp-current"
                fullWidth
                label="Current Password"
                type={show.current ? 'text' : 'password'}
                autoComplete="current-password"
                error={!!errors.currentPassword}
                helperText={errors.currentPassword?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: 'text.disabled', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggle('current')} size="small" edge="end" tabIndex={-1}>
                          {show.current
                            ? <VisibilityOffOutlinedIcon fontSize="small" />
                            : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ mb: 3 }}
                {...register('currentPassword', { required: 'Current password is required' })}
              />

              {/* New Password */}
              <TextField
                id="cp-new"
                fullWidth
                label="New Password"
                type={show.newPw ? 'text' : 'password'}
                autoComplete="new-password"
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: 'text.disabled', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggle('newPw')} size="small" edge="end" tabIndex={-1}>
                          {show.newPw
                            ? <VisibilityOffOutlinedIcon fontSize="small" />
                            : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: { value: 8, message: 'Password must be at least 8 characters' },
                  validate: {
                    hasUpper: (v) => /[A-Z]/.test(v) || 'Must contain at least one uppercase letter',
                    hasNumber: (v) => /[0-9]/.test(v) || 'Must contain at least one number',
                  },
                })}
              />

              {/* Strength Bar */}
              <StrengthBar password={newPassword} />

              {/* Password Requirements */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.75, mt: 1.5, mb: 3 }}>
                <RequirementItem met={reqs.length} label="At least 8 characters" />
                <RequirementItem met={reqs.upper} label="One uppercase letter" />
                <RequirementItem met={reqs.number} label="One number" />
                <RequirementItem met={reqs.special} label="One special character" />
              </Box>

              {/* Confirm Password */}
              <TextField
                id="cp-confirm"
                fullWidth
                label="Confirm New Password"
                type={show.confirm ? 'text' : 'password'}
                autoComplete="new-password"
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlinedIcon sx={{ color: 'text.disabled', fontSize: 19 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggle('confirm')} size="small" edge="end" tabIndex={-1}>
                          {show.confirm
                            ? <VisibilityOffOutlinedIcon fontSize="small" />
                            : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ mb: 1 }}
                {...register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (val) => val === newPassword || 'Passwords do not match',
                })}
              />

              {/* Match indicator */}
              {confirmPassword && (
                <RequirementItem met={reqs.match} label={reqs.match ? 'Passwords match ✓' : 'Passwords do not match'} />
              )}

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <AppButton
                  id="cp-submit-btn"
                  type="submit"
                  variant="primary"
                  loading={isSubmitting}
                  sx={{ flex: 1 }}
                >
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </AppButton>
                <AppButton
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                  sx={{ flex: 1 }}
                >
                  Cancel
                </AppButton>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Alert severity="info" sx={{ mt: 2.5, borderRadius: 2, fontSize: '0.8rem' }}>
          After changing your password, you will remain signed in. Use the new password the next time you sign in.
        </Alert>
      </Box>
    </Box>
  );
};

export default ChangePasswordPage;
