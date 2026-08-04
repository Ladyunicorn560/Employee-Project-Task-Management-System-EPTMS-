import { Box, Typography, Button } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

/**
 * NoData
 * Displayed when a search/filter yields no results.
 * Distinct from EmptyState — this implies the user searched for something.
 *
 * @param {string} title - Main heading
 * @param {string} description - Subtext
 * @param {string} clearLabel - Button label to clear filters
 * @param {function} onClear - Handler to reset filters
 */
const NoData = ({
  title = 'No results found',
  description = 'Try adjusting your search or filters.',
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
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      <SearchOffIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />

      <Typography variant="h6" color="text.primary" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mb: onClear ? 3 : 0 }}>
        {description}
      </Typography>

      {onClear && (
        <Button variant="outlined" color="primary" onClick={onClear} size="medium">
          {clearLabel}
        </Button>
      )}
    </Box>
  );
};

export default NoData;
