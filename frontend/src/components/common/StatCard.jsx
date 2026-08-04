import { Box, Card, CardContent, Typography, Skeleton, Tooltip } from '@mui/material';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded';
import TrendingFlatRoundedIcon from '@mui/icons-material/TrendingFlatRounded';

/**
 * StatCard
 * Dashboard statistics card component.
 * Extracted from DashboardPage for reuse across all dashboard sections.
 *
 * @param {string} label - Metric label (e.g., "Total Employees")
 * @param {string|number} value - Metric value
 * @param {ComponentType} icon - MUI Icon component
 * @param {string} color - Hex color for icon background tint
 * @param {string} subtext - Secondary descriptor text
 * @param {number} trend - Optional trend value (positive=up, negative=down, 0=flat)
 * @param {string} trendLabel - Label for the trend (e.g., "vs last month")
 * @param {boolean} loading - Show skeleton while data loads
 * @param {string} tooltip - Optional tooltip text on hover
 * @param {function} onClick - Optional click handler
 */
const StatCard = ({
  label,
  value,
  icon: Icon,
  color = '#1976D2',
  subtext,
  trend,
  trendLabel,
  loading = false,
  tooltip,
  onClick,
}) => {
  const hasTrend = trend !== undefined && trend !== null;
  const trendPositive = trend > 0;
  const trendNeutral = trend === 0;

  const TrendIcon = trendNeutral
    ? TrendingFlatRoundedIcon
    : trendPositive
    ? TrendingUpRoundedIcon
    : TrendingDownRoundedIcon;

  const trendColor = trendNeutral
    ? 'text.secondary'
    : trendPositive
    ? 'success.main'
    : 'error.main';

  const card = (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        '&:hover': onClick
          ? { transform: 'translateY(-2px)', boxShadow: '0px 8px 24px rgba(0,0,0,0.12)' }
          : {},
      }}
    >
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        {loading ? (
          <>
            <Skeleton variant="rounded" width={48} height={48} sx={{ mb: 2, borderRadius: 2 }} />
            <Skeleton variant="text" width="60%" height={20} />
            <Skeleton variant="text" width="40%" height={40} sx={{ mt: 0.5 }} />
            <Skeleton variant="text" width="50%" height={16} sx={{ mt: 0.5 }} />
          </>
        ) : (
          <>
            {/* Icon */}
            <Box
              sx={{
                width: 52,
                height: 52,
                borderRadius: 2.5,
                backgroundColor: `${color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                border: `1.5px solid ${color}28`,
              }}
            >
              {Icon && <Icon sx={{ fontSize: 26, color }} />}
            </Box>

            {/* Label */}
            <Typography
              variant="overline"
              sx={{
                color: 'text.secondary',
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                display: 'block',
                mb: 0.5,
              }}
            >
              {label}
            </Typography>

            {/* Value */}
            <Typography
              variant="h4"
              fontWeight={800}
              color="text.primary"
              sx={{ lineHeight: 1.1, mb: 0.75, letterSpacing: '-0.5px' }}
            >
              {value ?? '—'}
            </Typography>

            {/* Subtext + Trend */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              {subtext && (
                <Typography variant="caption" color="text.secondary">
                  {subtext}
                </Typography>
              )}
              {hasTrend && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <TrendIcon sx={{ fontSize: 14, color: trendColor }} />
                  <Typography variant="caption" sx={{ color: trendColor, fontWeight: 600 }}>
                    {Math.abs(trend)}%{trendLabel ? ` ${trendLabel}` : ''}
                  </Typography>
                </Box>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );

  if (tooltip && !loading) {
    return <Tooltip title={tooltip} placement="top" arrow>{card}</Tooltip>;
  }

  return card;
};

export default StatCard;
