import { Box, Typography } from '@mui/material';

/**
 * PieChart (Donut style)
 * Renders standard visual status percentages.
 *
 * @param {Array<{ label: string, value: number, color: string }>} data
 * @param {number} size
 */
export const PieChart = ({ data = [], size = 180 }) => {
  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  if (total === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, height: size }}>
        <Typography variant="body2" color="text.secondary">No records found</Typography>
      </Box>
    );
  }

  let accumulatedPercent = 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', gap: 3.5, justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(0,0,0,0.03)" strokeWidth="8" />
        {data.map((item, index) => {
          const val = item.value || 0;
          if (val === 0) return null;
          const percentage = (val / total) * 100;
          const strokeDasharray = `${(percentage / 100) * 251.2} 251.2`;
          const strokeDashoffset = `${251.2 - (accumulatedPercent / 100) * 251.2}`;
          accumulatedPercent += percentage;

          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={item.color || '#757575'}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 50 50)"
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
          );
        })}
        {/* Central Label */}
        <text x="50%" y="48%" textAnchor="middle" fontSize="12" fontWeight="800" fill="#333" dominantBaseline="middle">
          {total}
        </text>
        <text x="50%" y="62%" textAnchor="middle" fontSize="6.5" fontWeight="600" fill="#999" dominantBaseline="middle">
          Total Items
        </text>
      </svg>

      {/* Legend Block */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {data.map((item, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {item.label}: <strong style={{ color: '#2c3e50' }}>{item.value}</strong> ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * BarChart
 * Renders workload vertical grids.
 *
 * @param {Array<{ label: string, value: number, color: string }>} data
 * @param {number} height
 */
export const BarChart = ({ data = [], height = 180 }) => {
  const maxVal = Math.max(...data.map((item) => item.value || 0), 1);

  return (
    <Box sx={{ width: '100%', pt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-around',
          height,
          borderBottom: '2.5px solid',
          borderColor: 'divider',
          px: 1,
          pb: 1,
        }}
      >
        {data.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ pb: 4 }}>No records found</Typography>
        ) : (
          data.map((item, index) => {
            const val = item.value || 0;
            const barHeight = `${(val / maxVal) * 80}%`;
            return (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: `${100 / data.length}%`,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <Typography variant="caption" color="text.primary" fontWeight={700} sx={{ mb: 0.5, fontSize: '0.7rem' }}>
                  {val}
                </Typography>
                <Box
                  sx={{
                    width: { xs: 16, sm: 22, md: 28 },
                    height: barHeight,
                    backgroundColor: item.color || '#1976D2',
                    borderRadius: '5px 5px 0 0',
                    transition: 'height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': { filter: 'brightness(1.15)' },
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  sx={{ mt: 1, maxWidth: '85%', fontSize: '0.62rem', fontWeight: 600, textTransform: 'capitalize' }}
                >
                  {item.label}
                </Typography>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

/**
 * LineChart
 * Renders spline curve projections.
 *
 * @param {Array<{ label: string, value: number }>} data
 * @param {number} height
 */
export const LineChart = ({ data = [], height = 180 }) => {
  const maxVal = Math.max(...data.map((item) => item.value || 0), 1);

  if (data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4, height }}>
        <Typography variant="body2" color="text.secondary">No records found</Typography>
      </Box>
    );
  }

  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1 || 1)) * 100;
      const y = 90 - (item.value / maxVal) * 80;
      return `${x},${y}`;
    })
    .join(' ');

  const fillPoints = `0,90 ${points} 100,90`;

  return (
    <Box sx={{ width: '100%', pt: 2 }}>
      <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="line-gradient-card" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1976D2" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1976D2" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <polygon points={fillPoints} fill="url(#line-gradient-card)" />
        <polyline points={points} fill="none" stroke="#1976D2" strokeWidth="2.5" strokeLinecap="round" />
        {data.map((item, index) => {
          const x = (index / (data.length - 1 || 1)) * 100;
          const y = 90 - (item.value / maxVal) * 80;
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="2"
              fill="#FFFFFF"
              stroke="#1976D2"
              strokeWidth="2"
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </svg>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, borderTop: '1px solid', borderColor: 'divider', pt: 1 }}>
        {data.map((item, idx) => (
          <Typography key={idx} variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 600 }}>
            {item.label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};
