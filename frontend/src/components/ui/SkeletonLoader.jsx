import { Box, Skeleton, Card, CardContent } from '@mui/material';

/**
 * SkeletonLoader
 * Content skeleton for cards and list items.
 *
 * @param {number} count - Number of skeleton cards to render (default: 3)
 * @param {'card'|'list'|'table'} variant - Layout type (default: 'card')
 */
const SkeletonLoader = ({ count = 3, variant = 'card' }) => {
  if (variant === 'list') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {Array.from({ length: count }).map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" height={20} />
              <Skeleton variant="text" width="40%" height={16} />
            </Box>
            <Skeleton variant="rounded" width={60} height={24} />
          </Box>
        ))}
      </Box>
    );
  }

  if (variant === 'table') {
    return (
      <Box>
        {Array.from({ length: count }).map((_, i) => (
          <Box
            key={i}
            sx={{ display: 'flex', gap: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Skeleton variant="text" width="25%" />
            <Skeleton variant="text" width="25%" />
            <Skeleton variant="text" width="20%" />
            <Skeleton variant="rounded" width={60} height={22} />
          </Box>
        ))}
      </Box>
    );
  }

  // Default: card
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 2 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} sx={{ p: 0 }}>
          <CardContent>
            <Skeleton variant="rounded" height={40} width={40} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="50%" height={18} sx={{ mt: 0.5 }} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};

export default SkeletonLoader;
