import { Box, Typography, Button, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import AppBreadcrumbs from '../../components/common/AppBreadcrumbs';

/**
 * PlaceholderPage
 * Generic placeholder for all unimplemented module pages.
 * Receives title, description, icon, and badge props.
 *
 * @param {string} title - Page heading
 * @param {string} description - What this module will do
 * @param {ReactNode} icon - MUI icon component
 * @param {string} phase - Which phase will implement this (e.g. "Phase 2")
 * @param {string} module - Module label for breadcrumb
 */
const PlaceholderPage = ({
  title = 'Coming Soon',
  description = 'This module will be implemented in a future phase.',
  icon: Icon,
  phase = 'Future Phase',
  module,
}) => {
  const navigate = useNavigate();

  const breadcrumbItems = [];
  if (module) {
    breadcrumbItems.push({ label: module });
  }
  breadcrumbItems.push({ label: title });

  return (
    <Box>
      {/* Breadcrumb */}
      <AppBreadcrumbs items={breadcrumbItems} />

      {/* Main Card */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          px: 3,
        }}
      >
        {/* Icon */}
        {Icon && (
          <Box
            sx={{
              width: 96,
              height: 96,
              borderRadius: '28px',
              background: 'linear-gradient(135deg, rgba(25,118,210,0.12) 0%, rgba(38,166,154,0.12) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              border: '2px solid',
              borderColor: 'primary.light',
              borderOpacity: 0.3,
            }}
          >
            <Icon sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
        )}

        {/* Phase Badge */}
        <Chip
          label={phase}
          color="primary"
          variant="outlined"
          size="small"
          sx={{ mb: 2, fontWeight: 700, letterSpacing: '0.04em' }}
        />

        {/* Title */}
        <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
          {title}
        </Typography>

        {/* Description */}
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 480, lineHeight: 1.7, mb: 4 }}
        >
          {description}
        </Typography>

        {/* Back to Dashboard */}
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(ROUTES.DASHBOARD)}
          size="large"
          sx={{ px: 4 }}
        >
          Back to Dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default PlaceholderPage;
