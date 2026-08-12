import { useState, useEffect, useCallback } from 'react';
import {
  Box, MenuItem, Select, FormControl, InputLabel, Typography,
  IconButton, Tooltip, Chip, Paper, Stack, Divider, Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import TodayRoundedIcon from '@mui/icons-material/TodayRounded';

import PageHeader from '../../components/common/PageHeader';
import projectService from '../../services/projectService';
import milestoneService from '../../services/milestoneService';
import taskService from '../../services/taskService';
import useAuth from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const PRIORITY_COLORS = {
  Critical: { bg: '#D32F2F', light: '#FFEBEE' },
  High:     { bg: '#ED6C02', light: '#FFF3E0' },
  Medium:   { bg: '#0288D1', light: '#E1F5FE' },
  Low:      { bg: '#2E7D32', light: '#E8F5E9' },
};

const CalendarPage = () => {
  const navigate  = useNavigate();
  const { user }  = useAuth();
  const isEmployee = user?.roleName === ROLES.EMPLOYEE;
  const isReviewer = user?.roleName === ROLES.REVIEWER;

  const [projects,             setProjects]             = useState([]);
  const [milestones,           setMilestones]           = useState([]);
  const [tasks,                setTasks]                = useState([]);
  // '' = All Projects
  const [selectedProjectId,    setSelectedProjectId]    = useState('');
  // '' = All Milestones
  const [selectedMilestoneId,  setSelectedMilestoneId]  = useState('');
  const [loadingProjects,      setLoadingProjects]      = useState(false);
  const [loadingMilestones,    setLoadingMilestones]    = useState(false);
  const [currentDate,          setCurrentDate]          = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  /* ── 1. Fetch Projects on mount ───────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      setLoadingProjects(true);
      try {
        const assignedEmployeeId = (isEmployee || isReviewer) ? user?.id : undefined;
        const res  = await projectService.getAll({ limit: 100, assignedEmployeeId });
        const list = res.data || [];
        setProjects(list);
        // Default to "All Projects" (no auto-selection)
        setSelectedProjectId('');
      } catch (err) {
        console.error('Failed to load projects for calendar:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    load();
  }, [isEmployee, isReviewer, user?.id]);

  /* ── 2. Fetch Milestones when project changes ─────────────────────── */
  useEffect(() => {
    setSelectedMilestoneId(''); // reset to "All Milestones" on project change

    if (!selectedProjectId) {
      // All Projects → clear milestone list (we'll show tasks via getAll)
      setMilestones([]);
      return;
    }

    const load = async () => {
      setLoadingMilestones(true);
      try {
        const res  = await milestoneService.getByProjectId(selectedProjectId, { limit: 100 });
        const list = res.data || [];
        setMilestones(list);
        // Default to "All Milestones" (no auto-select to first)
      } catch (err) {
        console.error('Failed to load milestones for calendar:', err);
      } finally {
        setLoadingMilestones(false);
      }
    };
    load();
  }, [selectedProjectId]);

  /* ── 3. Fetch Tasks when project/milestone changes ────────────────── */
  const fetchTasks = useCallback(async () => {
    try {
      if (selectedMilestoneId) {
        // Specific milestone selected
        const res = await taskService.getByMilestoneId(selectedMilestoneId, { limit: 500 });
        setTasks(res.data || []);
      } else if (selectedProjectId) {
        // Specific project, All Milestones
        const res = await taskService.getAll({ projectId: selectedProjectId, limit: 500 });
        setTasks(res.data || []);
      } else {
        // All Projects, All Milestones
        const res = await taskService.getAll({ limit: 500 });
        setTasks(res.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch tasks for calendar:', err);
      setTasks([]);
    }
  }, [selectedProjectId, selectedMilestoneId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  /* ── Calendar Math ────────────────────────────────────────────────── */
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays     = new Date(year, month + 1, 0).getDate();

  const calendarCells = [
    ...Array(firstDayIndex).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  // Pad last row to complete 7-column grid
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  // All milestones shown on calendar (filtered by selected project or all)
  const visibleMilestones = selectedMilestoneId
    ? milestones.filter((m) => m.id === selectedMilestoneId)
    : milestones;

  const getItemsForDay = (day) => {
    if (!day) return [];
    const cellStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const matchedTasks = tasks
      .filter((t) => t.dueDate && t.dueDate.startsWith(cellStr))
      .map((t) => ({ ...t, type: 'task' }));

    const matchedMs = visibleMilestones
      .filter((m) => m.dueDate?.startsWith(cellStr))
      .map((m) => ({ ...m, type: 'milestone' }));

    return [...matchedMs, ...matchedTasks];
  };

  const isToday = (day) => {
    if (!day) return false;
    const cellStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return cellStr === todayStr;
  };

  /** True if this calendar cell date is in the past (before today) */
  const isPastDay = (day) => {
    if (!day) return false;
    const cellStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return cellStr < todayStr;
  };

  /** Count overdue (non-completed, non-cancelled) tasks on a given day */
  const getOverdueCountForDay = (day) => {
    if (!day || !isPastDay(day)) return 0;
    const cellStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(
      (t) =>
        t.dueDate &&
        t.dueDate.startsWith(cellStr) &&
        t.status !== 'Completed' &&
        t.status !== 'Cancelled'
    ).length;
  };

  const monthLabel = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalEvents = tasks.length + visibleMilestones.length;

  return (
    <Box>
      <PageHeader
        title="Calendar"
        description="Schedule planner displaying milestones and task deadlines on a monthly timeline."
        breadcrumbItems={[{ label: 'Calendar' }]}
      />

      {/* ── Control Bar ─────────────────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
        }}
      >
        {/* Project Selector */}
        <FormControl
          size="small"
          disabled={loadingProjects}
          sx={{ minWidth: 210, flex: '1 1 210px', maxWidth: 300 }}
        >
          <InputLabel id="cal-project-label">Project</InputLabel>
          <Select
            labelId="cal-project-label"
            id="cal-project-select"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            label="Project"
          >
            <MenuItem value=""><em>All Projects</em></MenuItem>
            {projects.map((p) => (
              <MenuItem key={p.id} value={p.id}>{p.projectName}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Milestone Selector */}
        <FormControl
          size="small"
          disabled={loadingMilestones}
          sx={{ minWidth: 210, flex: '1 1 210px', maxWidth: 300 }}
        >
          <InputLabel id="cal-ms-label">Milestone</InputLabel>
          <Select
            labelId="cal-ms-label"
            id="cal-ms-select"
            value={selectedMilestoneId}
            onChange={(e) => setSelectedMilestoneId(e.target.value)}
            label="Milestone"
          >
            <MenuItem value=""><em>All Milestones</em></MenuItem>
            {milestones.map((m) => (
              <MenuItem key={m.id} value={m.id}>{m.milestoneTitle}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Spacer */}
        <Box sx={{ flex: '1 1 auto' }} />

        {/* Legend */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: 'wrap', gap: 1 }}>
          <Chip
            size="small"
            icon={<FlagRoundedIcon sx={{ fontSize: '0.8rem !important' }} />}
            label="Milestone"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.72rem' }}
          />
          {Object.entries(PRIORITY_COLORS).map(([priority, colors]) => (
            <Chip
              key={priority}
              size="small"
              label={priority}
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
                backgroundColor: colors.bg,
                color: '#fff',
                border: 'none',
              }}
            />
          ))}
        </Stack>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* Month Navigation */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconButton
            size="small"
            id="cal-prev-month"
            onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <ArrowBackIosNewRoundedIcon fontSize="small" />
          </IconButton>
          <Box sx={{ minWidth: 160, textAlign: 'center' }}>
            <Typography variant="subtitle1" fontWeight={700}>{monthLabel}</Typography>
          </Box>
          <IconButton
            size="small"
            id="cal-next-month"
            onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <ArrowForwardIosRoundedIcon fontSize="small" />
          </IconButton>
          <Tooltip title="Go to today">
            <IconButton
              size="small"
              id="cal-today-btn"
              onClick={() => {
                const now = new Date();
                setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
              }}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
            >
              <TodayRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {/* ── Summary bar ───────────────────────────────────────────── */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <CalendarMonthRoundedIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
        <Typography variant="body2" color="text.secondary">
          <strong>{totalEvents}</strong> deadline{totalEvents !== 1 ? 's' : ''} shown
          {selectedProjectId
            ? <> for <strong>{projects.find((p) => p.id === selectedProjectId)?.projectName}</strong></>
            : ' across all projects'}
          {selectedMilestoneId
            ? <> · <strong>{milestones.find((m) => m.id === selectedMilestoneId)?.milestoneTitle}</strong></>
            : ' · all milestones'}
        </Typography>
      </Stack>

      {/* ── Full-Width Calendar Grid ───────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}
      >
        {/* Day-of-Week Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            backgroundColor: 'primary.main',
          }}
        >
          {DAYS_SHORT.map((d, i) => (
            <Box
              key={d}
              sx={{
                py: 1.25,
                px: 1,
                borderRight: i < 6 ? '1px solid rgba(255,255,255,0.15)' : 'none',
              }}
            >
              {/* Short label on small screens, full on bigger */}
              <Typography
                variant="caption"
                fontWeight={700}
                color="white"
                sx={{ display: { xs: 'block', sm: 'none' }, textAlign: 'center' }}
              >
                {d.slice(0, 1)}
              </Typography>
              <Typography
                variant="caption"
                fontWeight={700}
                color="white"
                sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'center', letterSpacing: 0.5 }}
              >
                {DAYS_OF_WEEK[i]}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Calendar Cell Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {calendarCells.map((day, idx) => {
            const dayItems  = getItemsForDay(day);
            const isWeekend = idx % 7 === 0 || idx % 7 === 6;
            const todayCell = isToday(day);
            const overdueCount = getOverdueCountForDay(day);

            return (
              <Box
                key={idx}
                sx={{
                  minHeight: { xs: 80, sm: 110, md: 130 },
                  borderBottom: '1px solid',
                  borderRight: idx % 7 !== 6 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  p: { xs: 0.5, sm: 1, md: 1.5 },
                  backgroundColor: !day
                    ? 'action.hover'
                    : todayCell
                    ? '#E3F2FD'
                    : overdueCount > 0
                    ? '#FFF5F5' // soft red background for overdue cell
                    : isWeekend
                    ? 'rgba(0,0,0,0.018)'
                    : 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                  position: 'relative',
                  transition: 'background-color 0.15s',
                  boxShadow: overdueCount > 0 ? 'inset 0 0 4px rgba(211,47,47,0.05)' : 'none',
                }}
              >
                {day && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.25 }}>
                    {overdueCount > 0 ? (
                      <Tooltip title={`${overdueCount} Overdue Task(s)`} arrow>
                        <Chip
                          label="OVERDUE"
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '0.58rem',
                            fontWeight: 800,
                            backgroundColor: '#D32F2F',
                            color: '#FFF',
                            px: 0.5,
                            border: 'none',
                            borderRadius: '4px',
                            '& .MuiChip-label': { px: 0.5 }
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Box />
                    )}
                    <Box
                      sx={{
                        width: 26,
                        height: 26,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: todayCell ? 'primary.main' : 'transparent',
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={todayCell ? 800 : 600}
                        sx={{
                          color: todayCell ? '#fff' : isWeekend ? 'text.secondary' : 'text.primary',
                          lineHeight: 1,
                          fontSize: '0.8rem',
                        }}
                      >
                        {day}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Events */}
                {dayItems.map((item, ki) => {
                  if (item.type === 'milestone') {
                    return (
                      <Tooltip key={ki} title={`Milestone deadline: ${item.milestoneTitle}`} arrow>
                        <Box
                          onClick={() => navigate(`${ROUTES.PROJECTS}/${item.projectId}`)}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.4,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            px: 0.75,
                            py: 0.4,
                            borderRadius: 1.5,
                            backgroundColor: 'primary.main',
                            color: '#fff',
                            cursor: 'pointer',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            textOverflow: 'ellipsis',
                            '&:hover': { filter: 'brightness(0.9)' },
                          }}
                        >
                          <FlagRoundedIcon sx={{ fontSize: '0.7rem', flexShrink: 0 }} />
                          <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.milestoneTitle}
                          </Box>
                        </Box>
                      </Tooltip>
                    );
                  }

                  const colors = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.Low;
                  const isTaskOverdue = item.status !== 'Completed' && item.status !== 'Cancelled' && isPastDay(day);

                  return (
                    <Tooltip
                      key={ki}
                      title={`${item.taskTitle} · ${item.priority} priority · ${item.status}${isTaskOverdue ? ' (OVERDUE)' : ''}`}
                      arrow
                    >
                      <Box
                        onClick={() => navigate(`${ROUTES.TASKS}/${item.id}`)}
                        sx={{
                          fontSize: '0.68rem',
                          fontWeight: 600,
                          px: 0.75,
                          py: 0.4,
                          borderRadius: 1.5,
                          color: '#fff',
                          backgroundColor: colors.bg,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                          opacity: item.status === 'Completed' ? 0.55 : 1,
                          textDecoration: item.status === 'Completed' ? 'line-through' : 'none',
                          borderLeft: isTaskOverdue ? '4px solid #B71C1C' : 'none', // dark red stripe for overdue tasks
                          boxShadow: isTaskOverdue ? '0 0 3px rgba(183,28,28,0.6)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          '&:hover': { filter: 'brightness(0.88)' },
                        }}
                      >
                        {isTaskOverdue && (
                          <Typography component="span" variant="caption" sx={{ color: '#FFEAEA', fontSize: '0.6rem', fontWeight: 800, flexShrink: 0 }}>
                            [!]
                          </Typography>
                        )}
                        <Box sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                          {item.taskTitle}
                        </Box>
                      </Box>
                    </Tooltip>
                  );
                })}
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
};

export default CalendarPage;
