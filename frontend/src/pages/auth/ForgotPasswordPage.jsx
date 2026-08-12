import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Typography, InputAdornment, Alert, Divider } from '@mui/material';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import AuthLayout from '../../layouts/AuthLayout';
import AppButton from '../../components/ui/AppButton';
import authService from '../../services/authService';
import { ROUTES } from '../../constants/routes';
import { VALIDATION } from '../../utils/validationUtils';

/**
 * ForgotPasswordPage
 * Page for requesting password reset links.
 */
const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resetToken, setResetToken] = useState(''); // Shown in dev mode for ease of testing

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ mode: 'onBlur' });

  const onSubmit = async ({ email }) => {
    setErrorMsg('');
    setSuccessMsg('');
    setResetToken('');
    try {
      const response = await authService.forgotPassword(email.trim());
      setSuccessMsg('If the email exists, a password reset link has been generated.');
      
      // If backend returns the token (which we do for testing convenience)
      if (response.data && response.data.token) {
        setResetToken(response.data.token);
      }
      
      toast.success('Password reset request submitted successfully.');
    } catch (err) {
      const serverMsg = err?.response?.data?.message;
      setErrorMsg(serverMsg || 'Failed to submit password reset request. Please try again.');
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
          Reset your password
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter your registered email address and we'll send you a password reset link.
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

      {resetToken && (
        <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2, fontSize: '0.8125rem', wordBreak: 'break-all' }}>
          <strong>[Dev Mode Token Helper]</strong><br />
          Reset Link: <a href={`${window.location.origin}${ROUTES.RESET_PASSWORD}?token=${resetToken}`}>{`${window.location.origin}${ROUTES.RESET_PASSWORD}?token=${resetToken}`}</a>
        </Alert>
      )}

      {/* Form */}
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <TextField
          id="forgot-email"
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
                  <EmailOutlinedIcon sx={{ color: 'text.disabled', fontSize: 19 }} />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 3 }}
          {...register('email', VALIDATION.email)}
        />

        <AppButton
          id="forgot-submit-btn"
          type="submit"
          variant="primary"
          fullWidth
          loading={isSubmitting}
          size="large"
          sx={{ mb: 2.5, py: 1.25 }}
        >
          Send Reset Link
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

export default ForgotPasswordPage;
