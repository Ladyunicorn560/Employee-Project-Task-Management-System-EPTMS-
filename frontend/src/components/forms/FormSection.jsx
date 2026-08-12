import { Card, CardContent, Typography, Box, Divider } from '@mui/material';

/**
 * FormSection
 * Enterprise layout card wrapper for grouping inputs together.
 *
 * @param {string} title - Section header title
 * @param {string} subtitle - Subtitle describing section contents
 * @param {ReactNode} children - Form fields inside the card
 * @param {object} sx - Card style overrides
 */
const FormSection = ({ title, subtitle, children, sx = {} }) => {
  return (
    <Card
      elevation={0}
      sx={{
        mb: 3,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        ...sx,
      }}
    >
      {(title || subtitle) && (
        <Box sx={{ px: 3, py: 2.5 }}>
          {title && (
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              {title}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
      {(title || subtitle) && <Divider />}
      <CardContent sx={{ p: 3 }}>
        {children}
      </CardContent>
    </Card>
  );
};

export default FormSection;
