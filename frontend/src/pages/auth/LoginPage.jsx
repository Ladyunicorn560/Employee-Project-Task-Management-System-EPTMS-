import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, TextField, Typography, InputAdornment,
  IconButton, Alert, Divider, CircularProgress,
} from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import AuthLayout from '../../layouts/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import useAuth from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { VALIDATION } from '../../utils/validationUtils';

/**
 * LoginPage
 * Public authentication screen.
 * On success, redirects to the previously attempted route or /dashboard.
 */
const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const from = location.state?.from?.pathname || ROUTES.DASHBOARD;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async ({ email, password }) => {
    setLoginError('');
    try {
      await login(email.trim(), password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.message || 'Invalid email or password. Please try again.';
      setLoginError(message);
    }
  };

  return (
    <AuthLayout>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
          Sign in to EPTMS
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your credentials to access the management system.
        </Typography>
      </Box>

      {/* Error Alert */}
      {loginError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
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
          autoFocus
          error={!!errors.email}
          helperText={errors.email?.message}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlinedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2.5 }}
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
                  <LockOutlinedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((p) => !p)} edge="end" size="small">
                    {showPassword
                      ? <VisibilityOffOutlinedIcon fontSize="small" />
                      : <VisibilityOutlinedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 3 }}
          {...register('password', VALIDATION.password)}
        />

        {/* Submit */}
        <AppButton
          id="login-submit-btn"
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          size="large"
          sx={{ mb: 2 }}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </AppButton>

        <Divider sx={{ my: 2 }}>
          <Typography variant="caption" color="text.disabled">
            Employee Project & Task Management System
          </Typography>
        </Divider>

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', textAlign: 'center' }}>
          Contact your administrator if you cannot access your account.
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default LoginPage;
