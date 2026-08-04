import { Box, Typography } from '@mui/material';
import AppBreadcrumbs from './AppBreadcrumbs';

/**
 * PageHeader
 * Reusable header component containing title, description, breadcrumbs,
 * and an optional right-aligned action section.
 *
 * @param {string} title - Page main header title
 * @param {string} description - Brief description of the page context
 * @param {Array} breadcrumbItems - Array of {label, to} for breadcrumbs trail
 * @param {ReactNode} action - Optional action buttons/controls (e.g. "Add Employee")
 */
const PageHeader = ({ title, description, breadcrumbItems = [], action }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbItems.length > 0 && (
        <AppBreadcrumbs items={breadcrumbItems} />
      )}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            color="text.primary"
            sx={{ letterSpacing: '-0.5px', mb: 0.5 }}
          >
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        {action && (
          <Box sx={{ flexShrink: 0, alignSelf: { xs: 'stretch', sm: 'auto' } }}>
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;
