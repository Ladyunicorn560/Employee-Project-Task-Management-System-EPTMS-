import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, TextField, Typography, InputAdornment, IconButton, Alert, Divider } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import AuthLayout from '../../layouts/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import authService from '../../services/authService';
import { ROUTES } from '../../constants/routes';

/**
 * ResetPasswordPage
 * Page for entering a new password with the reset token.
 */
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' });

  const newPassword = watch('newPassword');

  useEffect(() => {
    if (!token) {
      setErrorMsg('Invalid request. The password reset token is missing from the link URL.');
    }
  }, [token]);

  const onSubmit = async ({ newPassword }) => {
    if (!token) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await authService.resetPassword(token, newPassword);
      setSuccessMsg('Your password has been successfully reset. Redirecting to login...');
      toast.success('Password reset successfully.');
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 3000);
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      setErrorMsg(serverMsg || 'Failed to reset password. The link may have expired.');
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
          <LockResetOutlinedIcon sx={{ color: '#fff', fontSize: 22 }} />
        </Box>
        <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
          Create new password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please enter your new password below.
        </Typography>
      </Box>

      {/* Messages */}
      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.8125rem' }}>
          {errorMsg}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.8125rem' }}>
          {successMsg}
        </Alert>
      )}

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* New Password */}
        <TextField
          id="reset-new-password"
          fullWidth
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          error={!!errors.newPassword}
          helperText={errors.newPassword?.message}
          disabled={!token}
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
                    disabled={!token}
                  >
                    {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 2 }}
          {...register('newPassword', {
            required: 'New password is required',
            minLength: { value: 8, message: 'Password must be at least 8 characters' },
            validate: {
              hasUpper: (value) => /[A-Z]/.test(value) || 'Password must contain at least one uppercase letter',
              hasDigit: (value) => /[0-9]/.test(value) || 'Password must contain at least one number',
              hasSpecial: (value) => /[^A-Za-z0-9]/.test(value) || 'Password must contain at least one special character',
            }
          })}
        />

        {/* Confirm Password */}
        <TextField
          id="reset-confirm-password"
          fullWidth
          label="Confirm New Password"
          type={showConfirmPassword ? 'text' : 'password'}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          disabled={!token}
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
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                    disabled={!token}
                  >
                    {showConfirmPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 3 }}
          {...register('confirmPassword', {
            required: 'Please confirm your new password',
            validate: (value) => value === newPassword || 'Passwords do not match',
          })}
        />

        <AppButton
          id="reset-submit-btn"
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          disabled={!token}
          size="large"
          sx={{ mb: 2.5, py: 1.25 }}
        >
          Reset Password
        </AppButton>

        <Divider sx={{ my: 2.5 }}>
          <Typography variant="caption" color="text.disabled">
            OR
          </Typography>
        </Divider>

        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Typography
            variant="body2"
            color="primary"
            sx={{
              cursor: 'pointer',
              fontWeight: 600,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
            onClick={() => navigate(ROUTES.LOGIN)}
          >
            Back to Sign In
          </Typography>
        </Box>
      </Box>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
