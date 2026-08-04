import { Box, Typography, Button } from '@mui/material';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const Error500Page = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default', px: 3, textAlign: 'center' }}>
      <BugReportOutlinedIcon sx={{ fontSize: 80, color: 'error.light', mb: 2, opacity: 0.8 }} />
      <Typography variant="h1" sx={{ fontSize: { xs: '5rem', md: '8rem' }, fontWeight: 800, color: 'error.main', lineHeight: 1 }}>500</Typography>
      <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mt: 2, mb: 1 }}>Internal Server Error</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, mb: 4 }}>
        Something went wrong on our end. Please try again or contact your system administrator.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="error" size="large" onClick={() => window.location.reload()}>Retry</Button>
        <Button variant="outlined" size="large" onClick={() => navigate(ROUTES.DASHBOARD)}>Go to Dashboard</Button>
      </Box>
    </Box>
  );
};

export default Error500Page;
