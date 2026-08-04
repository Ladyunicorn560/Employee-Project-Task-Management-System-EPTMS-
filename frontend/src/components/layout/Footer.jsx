import { Box, Typography, Divider } from '@mui/material';

/**
 * Footer
 * Simple application footer shown at the bottom of the main content area.
 */
const Footer = () => {
  const year = new Date().getFullYear();
  const appName = import.meta.env.VITE_APP_NAME || 'EPTMS';
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 2,
        px: 3,
      }}
    >
      <Divider sx={{ mb: 2 }} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Typography variant="caption" color="text.disabled">
          © {year} {appName}. All rights reserved.
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Version {version}
        </Typography>
      </Box>
    </Box>
  );
};

export default Footer;
