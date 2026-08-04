import { Box, Typography, Card, CardContent, Avatar } from '@mui/material';
import ReviewStatusChip from '../../../components/common/ReviewStatusChip';
import { formatDate } from '../../../utils/dateUtils';

/**
 * ReviewTimeline
 * Renders review iterations as an enterprise timeline layout.
 *
 * @param {Array<object>} reviews - Reviews list ordered by iteration descending
 */
const ReviewTimeline = ({ reviews = [] }) => {
  return (
    <Box sx={{ position: 'relative', pl: 3.5, '&::before': { content: '""', position: 'absolute', left: 15, top: 12, bottom: 12, width: '2.5px', backgroundColor: 'divider' } }}>
      {reviews.map((rev) => {
        const reviewer = rev.reviewer || {};
        const reviewerName = reviewer.firstName ? `${reviewer.firstName} ${reviewer.lastName}` : 'System';
        const reviewerInitial = reviewer.firstName?.[0] || 'R';

        return (
          <Box key={rev.id} sx={{ position: 'relative', mb: 3.5, '&:last-child': { mb: 0 } }}>
            {/* Timeline bullet dot */}
            <Box
              sx={{
                position: 'absolute',
                left: -33,
                top: 4,
                width: 14,
                height: 14,
                borderRadius: '50%',
                backgroundColor: 'background.paper',
                border: '3px solid',
                borderColor:
                  rev.status === 'Approved'
                    ? 'success.main'
                    : rev.status === 'Rejected'
                    ? 'error.main'
                    : rev.status === 'Changes Required'
                    ? 'warning.main'
                    : 'info.main',
                zIndex: 1,
              }}
            />

            {/* Iteration Card */}
            <Card variant="outlined" sx={{ borderRadius: 2.5, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', justifyBetween: 'center', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700} color="primary">
                      Iteration #{rev.iteration}
                    </Typography>
                    <ReviewStatusChip status={rev.status} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Requested: {formatDate(rev.createdDate)}
                  </Typography>
                </Box>

                {/* Reviewer Details */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1, borderRadius: 2, backgroundColor: 'action.hover' }}>
                  <Avatar sx={{ width: 30, height: 30, fontSize: '0.8rem', bgcolor: 'primary.light', fontWeight: 700 }}>
                    {reviewerInitial}
                  </Avatar>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={500}>
                      DESIGNATED REVIEWER
                    </Typography>
                    <Typography variant="body2" fontWeight={600} color="text.primary">
                      {reviewerName} ({reviewer.email})
                    </Typography>
                  </Box>
                </Box>

                {/* Review Comments */}
                {rev.comments ? (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" fontWeight={500} sx={{ mb: 0.5 }}>
                      REVIEW NOTES / FEEDBACK
                    </Typography>
                    <Typography variant="body2" color="text.primary" sx={{ fontStyle: 'italic', whiteSpace: 'pre-wrap', pl: 1.5, borderLeft: '3.5px solid', borderColor: 'divider' }}>
                      {rev.comments}
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                    No review comments provided yet.
                  </Typography>
                )}

                {/* Outcome date info */}
                {rev.reviewedDate && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography variant="caption" color="text.disabled">
                      Reviewed on: {formatDate(rev.reviewedDate)}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        );
      })}
    </Box>
  );
};

export default ReviewTimeline;
