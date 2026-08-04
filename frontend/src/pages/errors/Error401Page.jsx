import { Box, Typography, Button } from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

const Error401Page = () => {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'background.default', px: 3, textAlign: 'center' }}>
      <LockOutlinedIcon sx={{ fontSize: 80, color: 'warning.main', mb: 2, opacity: 0.7 }} />
      <Typography variant="h1" sx={{ fontSize: { xs: '5rem', md: '8rem' }, fontWeight: 800, color: 'warning.main', lineHeight: 1 }}>401</Typography>
      <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ mt: 2, mb: 1 }}>Unauthorized</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, mb: 4 }}>
        You need to be authenticated to access this page. Please sign in with your credentials.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button variant="contained" color="primary" size="large" onClick={() => navigate(ROUTES.LOGIN)}>Sign In</Button>
        <Button variant="outlined" size="large" onClick={() => navigate(-1)}>Go Back</Button>
      </Box>
    </Box>
  );
};

export default Error401Page;
