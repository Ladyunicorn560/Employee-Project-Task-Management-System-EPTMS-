import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, TextField, Typography, InputAdornment,
  IconButton, Alert, Divider, FormControlLabel, Checkbox,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockPersonOutlinedIcon from '@mui/icons-material/LockPersonOutlined';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import AuthLayout from '../../layouts/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import useAuth from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { VALIDATION } from '../../utils/validationUtils';

/**
 * LoginPage
 * Full backend-integrated login form.
 * Features: Remember Me, password visibility, specific error messages,
 * account lockout handling, toast notifications.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, getRememberedEmail } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLocked, setIsLocked] = useState(false);

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' });

  // Pre-fill remembered email on mount
  useEffect(() => {
    const remembered = getRememberedEmail?.();
    if (remembered) {
      setValue('email', remembered);
      setValue('rememberMe', true);
    }
  }, [getRememberedEmail, setValue]);

  const onSubmit = async ({ email, password, rememberMe }) => {
    setLoginError('');
    setIsLocked(false);
    try {
      await login(email.trim(), password, rememberMe);
      toast.success('Welcome back! You have signed in successfully.', {
        icon: '👋',
        autoClose: 3000,
      });
      navigate(from, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const code = err?.response?.data?.errorCode;
      const serverMsg = err?.response?.data?.message;

      if (status === 423 || code === 'ACCOUNT_LOCKED') {
        setIsLocked(true);
        setLoginError(
          'Your account has been temporarily locked after 5 failed attempts. Please try again in 15 minutes.'
        );
      } else if (status === 403 || code === 'ACCOUNT_DISABLED') {
        setLoginError(
          serverMsg || 'Your account is inactive or suspended. Please contact your administrator.'
        );
      } else if (status === 401 || code === 'INVALID_CREDENTIALS') {
        setLoginError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setLoginError(serverMsg || 'Unable to sign in. Please try again later.');
      }
    }
  };

  return (
    <AuthLayout>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #1976D2 0%, #1565C0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2.5,
            boxShadow: '0 4px 14px rgba(25,118,210,0.3)',
          }}
        >
          <LockPersonOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
          Sign in to your account
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your credentials to access the EPTMS platform.
        </Typography>
      </Box>

      {/* Error Alert */}
      {loginError && (
        <Alert
          severity={isLocked ? 'warning' : 'error'}
          sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.8125rem' }}
          icon={isLocked ? undefined : undefined}
        >
          {loginError}
        </Alert>
      )}

      {/* Login Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Email */}
        <TextField
          id="login-email"
          fullWidth
          label="Email Address"
          type="email"
          autoComplete="email"
          autoFocus={!getRememberedEmail?.()}
          error={!!errors.email}
          helperText={errors.email?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: 'text.disabled', fontSize: 19 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
          {...register('email', VALIDATION.email)}
        />

        {/* Password */}
        <TextField
          id="login-password"
          fullWidth
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={!!errors.password}
          helperText={errors.password?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon sx={{ color: 'text.disabled', fontSize: 19 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((p) => !p)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <VisibilityOffOutlinedIcon fontSize="small" />
                      : <VisibilityOutlinedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1.5 }}
          {...register('password', VALIDATION.password)}
        />

        {/* Remember Me */}
        <FormControlLabel
          control={
            <Checkbox
              id="login-remember-me"
              size="small"
              color="primary"
              {...register('rememberMe')}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Remember my email
            </Typography>
          }
          sx={{ mb: 2.5, ml: -0.5 }}
        />

        {/* Submit */}
        <AppButton
          id="login-submit-btn"
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          size="large"
          sx={{ mb: 2, py: 1.25 }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </AppButton>

        {/* Feature-flagged Quick Demo Logins for Public Portfolio Deployment */}
        {import.meta.env.VITE_ENABLE_DEMO_MODE === 'true' && (
          <Box
            sx={{
              mt: 2.5,
              mb: 2.5,
              p: 2,
              borderRadius: 2,
              bgcolor: 'action.hover',
              border: '1px dashed',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1} textAlign="center">
              Quick Demo Roles (Click to sign in):
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
              <AppButton
                size="small"
                variant="outlined"
                onClick={async () => {
                  setLoginError('');
                  try {
                    await login('admin@eptms-demo.com', 'Admin@123456', false);
                    toast.success('Welcome back! You have signed in as Admin.', { autoClose: 2000 });
                    navigate(ROUTES.DASHBOARD, { replace: true });
                  } catch {
                    setLoginError('Unable to sign in. Please try again later.');
                  }
                }}
              >
                Admin
              </AppButton>
              <AppButton
                size="small"
                variant="outlined"
                onClick={async () => {
                  setLoginError('');
                  try {
                    await login('manager@eptms-demo.com', 'Manager@123456', false);
                    toast.success('Welcome back! You have signed in as Manager.', { autoClose: 2000 });
                    navigate(ROUTES.DASHBOARD, { replace: true });
                  } catch {
                    setLoginError('Unable to sign in. Please try again later.');
                  }
                }}
              >
                Manager
              </AppButton>
              <AppButton
                size="small"
                variant="outlined"
                onClick={async () => {
                  setLoginError('');
                  try {
                    await login('employee@eptms-demo.com', 'Employee@123456', false);
                    toast.success('Welcome back! You have signed in as Employee.', { autoClose: 2000 });
                    navigate(ROUTES.DASHBOARD, { replace: true });
                  } catch {
                    setLoginError('Unable to sign in. Please try again later.');
                  }
                }}
              >
                Employee
              </AppButton>
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2.5 }}>
          <Typography variant="caption" color="text.disabled">
            Employee Project & Task Management System
          </Typography>
        </Divider>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography
            variant="caption"
            color="primary"
            sx={{
              cursor: 'pointer',
              textDecoration: 'underline',
              '&:hover': { color: 'primary.dark' }
            }}
            onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}
          >
            Forgot your password? Reset it here.
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
