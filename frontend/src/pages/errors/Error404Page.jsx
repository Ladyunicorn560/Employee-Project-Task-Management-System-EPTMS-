import { Box, Typography, Button } from '@mui/material';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const Error404Page = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default', px: 3, textAlign: 'center' }}>
      <SearchOffRoundedIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h1" sx={{ fontSize: { xs: '5rem', md: '8rem' }, fontWeight: 800, color: 'primary.main', lineHeight: 1 }}>404</Typography>
      <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mt: 2, mb: 1 }}>Page Not Found</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, mb: 4 }}>
        The page you're looking for doesn't exist or has been moved. Check the URL or return to the dashboard.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" size="large" onClick={() => navigate(ROUTES.DASHBOARD)}>Go to Dashboard</Button>
        <Button variant="outlined" size="large" onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    </Box>
  );
};

export default Error404Page;
