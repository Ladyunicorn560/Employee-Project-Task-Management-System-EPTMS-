import { Box, Typography, Button } from '@mui/material';
import BlockRoundedIcon from '@mui/icons-material/BlockRounded';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const Error403Page = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default', px: 3, textAlign: 'center' }}>
      <BlockRoundedIcon sx={{ fontSize: 80, color: 'error.main', mb: 2, opacity: 0.7 }} />
      <Typography variant="h1" sx={{ fontSize: { xs: '5rem', md: '8rem' }, fontWeight: 800, color: 'error.main', lineHeight: 1 }}>403</Typography>
      <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mt: 2, mb: 1 }}>Access Forbidden</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, mb: 4 }}>
        You don't have permission to access this page. Contact your administrator if you believe this is a mistake.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" size="large" onClick={() => navigate(ROUTES.DASHBOARD)}>Go to Dashboard</Button>
        <Button variant="outlined" size="large" onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    </Box>
  );
};

export default Error403Page;
