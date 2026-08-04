import { Box, Typography, Button } from '@mui/material';
import ManageSearchRoundedIcon from '@mui/icons-material/ManageSearchRounded';

/**
 * NoData
 * Displayed when a search/filter returns zero results.
 * Distinct from EmptyState — implies the user actively searched for something.
 *
 * @param {string} title - Heading
 * @param {string} description - Helper message
 * @param {string} clearLabel - Clear button text
 * @param {function} onClear - Clear filters handler
 */
const NoData = ({
  title = 'No results found',
  description = 'We couldn\'t find anything matching your search. Try different keywords or clear your filters.',
  clearLabel = 'Clear Filters',
  onClear,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 6, md: 10 },
        px: 4,
        textAlign: 'center',
      }}
    >
      {/* Icon Container */}
      <Box
        sx={{
          position: 'relative',
          width: 100,
          height: 100,
          mb: 3,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(94,114,228,0.10) 0%, rgba(94,114,228,0.03) 70%)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: '16px',
            borderRadius: '50%',
            backgroundColor: 'rgba(94,114,228,0.09)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ManageSearchRoundedIcon sx={{ fontSize: 34, color: '#5E72E4' }} />
        </Box>
      </Box>

      <Typography variant="h6" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ maxWidth: 360, lineHeight: 1.75, mb: onClear ? 3.5 : 0 }}
      >
        {description}
      </Typography>

      {onClear && (
        <Button
          variant="outlined"
          color="primary"
          onClick={onClear}
          size="medium"
          sx={{ px: 3.5, borderRadius: 2.5 }}
        >
          {clearLabel}
        </Button>
      )}
    </Box>
  );
};

export default NoData;
