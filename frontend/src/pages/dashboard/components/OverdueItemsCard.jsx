import { useState, useEffect, useCallback } from 'react';
import {
  Card, CardContent, Typography, Divider, Box, Chip, Tooltip,
  Alert, IconButton, Collapse, List, ListItem, ListItemAvatar,
  ListItemText, Avatar, Badge,
} from '@mui/material';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

import { useNavigate } from 'react-router-dom';
import dashboardService from '../../../services/dashboardService';

/**
 * OverdueItemsCard
 * Displays a unified list of all overdue items:
 *   - Overdue tasks (past their due date)
 *   - Overdue reviews (pending > 24 hours)
 *
 * Role-scoped: each user sees only their relevant overdue items.
 */
const OverdueItemsCard = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await dashboardService.getOverdueItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[OverdueItemsCard] Failed to fetch overdue items:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const overdueTasks = items.filter((i) => i.type === 'task');
  const overdueReviews = items.filter((i) => i.type === 'review');
  const totalCount = items.length;

  const formatOverdueLabel = (item) => {
    if (item.type === 'task') {
      const days = item.daysOverdue;
      return days === 1 ? '1 day overdue' : `${days} days overdue`;
    }
    const hrs = item.hoursOverdue;
    if (hrs >= 48) return `${Math.floor(hrs / 24)} days pending`;
    return `${hrs} hours pending`;
  };

  return (
    <Card
      sx={{
        border: '1px solid',
        borderColor: totalCount > 0 ? 'error.light' : 'divider',
        borderRadius: 3,
        background: totalCount > 0
          ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)'
          : 'background.paper',
        transition: 'border-color 0.3s',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 36, height: 36, borderRadius: '10px',
                backgroundColor: totalCount > 0 ? '#FEE2E2' : 'action.hover',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <WarningAmberRoundedIcon
                fontSize="small"
                sx={{ color: totalCount > 0 ? 'error.main' : 'text.disabled' }}
              />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Overdue Items
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tasks past due + Reviews pending &gt; 24 hrs
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {totalCount > 0 && (
              <Badge badgeContent={totalCount} color="error" max={99}>
                <Box sx={{ width: 20 }} />
              </Badge>
            )}
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={fetchItems} disabled={loading}>
                <RefreshRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={expanded ? 'Collapse' : 'Expand'}>
              <IconButton size="small" onClick={() => setExpanded((p) => !p)}>
                {expanded ? <ExpandLessRoundedIcon fontSize="small" /> : <ExpandMoreRoundedIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Summary chips */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <Chip
            icon={<TaskAltRoundedIcon sx={{ fontSize: '0.85rem !important' }} />}
            label={`${overdueTasks.length} overdue task${overdueTasks.length !== 1 ? 's' : ''}`}
            size="small"
            onClick={() => navigate('/tasks?filter=overdue')}
            sx={{
              backgroundColor: overdueTasks.length > 0 ? '#FEE2E2' : 'action.hover',
              color: overdueTasks.length > 0 ? 'error.dark' : 'text.disabled',
              fontWeight: 700,
              fontSize: '0.72rem',
              cursor: 'pointer',
            }}
          />
          <Chip
            icon={<RateReviewRoundedIcon sx={{ fontSize: '0.85rem !important' }} />}
            label={`${overdueReviews.length} overdue review${overdueReviews.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{
              backgroundColor: overdueReviews.length > 0 ? '#FFF3E0' : 'action.hover',
              color: overdueReviews.length > 0 ? 'warning.dark' : 'text.disabled',
              fontWeight: 700,
              fontSize: '0.72rem',
            }}
          />
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Collapse in={expanded}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2, mb: 1.5 }}>
              Failed to load overdue items. Please refresh.
            </Alert>
          )}

          {!loading && !error && totalCount === 0 && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="success.main" fontWeight={600}>
                🎉 All caught up! No overdue items.
              </Typography>
              <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                All tasks are on time and reviews are up to date.
              </Typography>
            </Box>
          )}

          {!loading && totalCount > 0 && (
            <List disablePadding dense>
              {items.map((item, idx) => {
                const isTask = item.type === 'task';
                const label = formatOverdueLabel(item);

                return (
                  <ListItem
                    key={`${item.type}-${item.id}`}
                    disableGutters
                    onClick={() => navigate(isTask ? `/tasks/${item.id}` : `/tasks`)}
                    sx={{
                      py: 1.25,
                      px: 1.5,
                      mb: 1,
                      borderRadius: 2,
                      cursor: 'pointer',
                      backgroundColor: isTask ? 'rgba(211, 47, 47, 0.04)' : 'rgba(245, 124, 0, 0.04)',
                      border: '1px solid',
                      borderColor: isTask ? 'rgba(211, 47, 47, 0.12)' : 'rgba(245, 124, 0, 0.12)',
                      transition: 'background-color 0.2s',
                      '&:hover': {
                        backgroundColor: isTask ? 'rgba(211, 47, 47, 0.08)' : 'rgba(245, 124, 0, 0.08)',
                      },
                    }}
                  >
                    <ListItemAvatar sx={{ minWidth: 42 }}>
                      <Avatar
                        sx={{
                          width: 32, height: 32,
                          backgroundColor: isTask ? '#FEE2E2' : '#FFF3E0',
                        }}
                      >
                        {isTask
                          ? <TaskAltRoundedIcon sx={{ fontSize: '1rem', color: 'error.main' }} />
                          : <RateReviewRoundedIcon sx={{ fontSize: '1rem', color: 'warning.main' }} />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 280 }}>
                          {item.title}
                        </Typography>
                      }
                      secondary={
                        <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, mt: 0.25 }}>
                          <Typography variant="caption" color="text.secondary" component="span" noWrap>
                            {item.projectName}
                            {isTask
                              ? ` · ${item.assigneeName}`
                              : ` · Reviewer: ${item.reviewerName}`}
                          </Typography>
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <AccessTimeRoundedIcon sx={{ fontSize: '0.7rem', color: isTask ? 'error.main' : 'warning.main' }} />
                            <Typography
                              variant="caption"
                              component="span"
                              sx={{
                                color: isTask ? 'error.main' : 'warning.main',
                                fontWeight: 700,
                                fontSize: '0.68rem',
                                textTransform: 'uppercase',
                                letterSpacing: 0.3,
                              }}
                            >
                              {label}
                            </Typography>
                          </Box>
                        </Box>
                      }
                    />
                    <Chip
                      label={isTask ? 'Task' : 'Review'}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        backgroundColor: isTask ? '#FEE2E2' : '#FFF3E0',
                        color: isTask ? 'error.dark' : 'warning.dark',
                        ml: 1,
                      }}
                    />
                  </ListItem>
                );
              })}
            </List>
          )}

          {loading && (
            <Box sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.disabled">
                Loading overdue items...
              </Typography>
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default OverdueItemsCard;
