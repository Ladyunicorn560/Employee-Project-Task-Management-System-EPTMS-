import { Box, Paper, Typography } from '@mui/material';

/**
 * AuthLayout
 * Centered two-panel layout for Login and other auth screens.
 * Left panel: branding/illustration
 * Right panel: auth form card
 *
 * @param {ReactNode} children - Auth form content
 */
const AuthLayout = ({ children }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: 'background.default',
      }}
    >
      {/* ─── Left Branding Panel ─────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 45%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1A237E 0%, #1976D2 55%, #26A69A 100%)',
          px: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative circles */}
        <Box sx={{
          position: 'absolute', top: -80, right: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -60, left: -60,
          width: 240, height: 240, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
        }} />

        {/* Logo mark */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '20px',
            backgroundColor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}
        >
          <Typography variant="h4" sx={{ color: '#fff', fontWeight: 800 }}>
            E
          </Typography>
        </Box>

        <Typography variant="h3" sx={{ color: '#fff', fontWeight: 800, textAlign: 'center', mb: 2, lineHeight: 1.25 }}>
          EPTMS
        </Typography>
        <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.75)', textAlign: 'center', fontWeight: 400, lineHeight: 1.6, maxWidth: 320 }}>
          Employee Project & Task Management System
        </Typography>

        <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 2, width: '100%', maxWidth: 320 }}>
          {[
            '✦  Manage projects end-to-end',
            '✦  Track tasks and milestones',
            '✦  Role-based access control',
            '✦  Real-time activity reporting',
          ].map((text) => (
            <Typography
              key={text}
              variant="body2"
              sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}
            >
              {text}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* ─── Right Form Panel ─────────────────────────────────────── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2, sm: 4, md: 6 },
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 440,
            p: { xs: 3, sm: 4 },
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
};

export default AuthLayout;
