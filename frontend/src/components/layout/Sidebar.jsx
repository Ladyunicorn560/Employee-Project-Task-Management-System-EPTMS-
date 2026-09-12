import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Tooltip, Divider, Typography,
  Collapse,
} from '@mui/material';

import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import FlagRoundedIcon from '@mui/icons-material/FlagRounded';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import ViewKanbanRoundedIcon from '@mui/icons-material/ViewKanbanRounded';
import ListAltRoundedIcon from '@mui/icons-material/ListAltRounded';

import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';

import { ROUTES } from '../../constants/routes';
import { ROLES } from '../../constants/roles';
import useAuth from '../../hooks/useAuth';

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_COLLAPSED_WIDTH = 70;

// ─── Role-Based Navigation Config ─────────────────────────────────────────────
const ALL_NAV_ITEMS = {
  [ROLES.ADMINISTRATOR]: [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardRoundedIcon, path: ROUTES.DASHBOARD },
    { id: 'projects', label: 'Projects', icon: FolderRoundedIcon, path: ROUTES.PROJECTS },
    { id: 'tasks', label: 'Tasks', icon: TaskAltRoundedIcon, path: ROUTES.TASKS },
    { id: 'timecards', label: 'Timecards', icon: AccessTimeRoundedIcon, path: ROUTES.TIMECARDS },
    { id: 'calendar', label: 'Calendar', icon: CalendarMonthRoundedIcon, path: ROUTES.CALENDAR },
    { id: 'kanban', label: 'Kanban', icon: ViewKanbanRoundedIcon, path: ROUTES.KANBAN },
    { id: 'reviews', label: 'Review Queue', icon: RateReviewRoundedIcon, path: ROUTES.REVIEWS },
    { id: 'reports', label: 'Reports', icon: AssessmentRoundedIcon, path: ROUTES.REPORTS },
    { id: 'div-system', divider: true, label: 'Administration' },
    { id: 'employees', label: 'Employees', icon: PeopleAltRoundedIcon, path: ROUTES.EMPLOYEES },
    { id: 'departments', label: 'Departments', icon: CorporateFareRoundedIcon, path: ROUTES.DEPARTMENTS },
    { id: 'roles', label: 'Roles', icon: AdminPanelSettingsRoundedIcon, path: ROUTES.ROLES },
    { id: 'configuration', label: 'Configuration', icon: SettingsRoundedIcon, path: ROUTES.CONFIGURATION },
    { id: 'audit-logs', label: 'Audit Logs', icon: ListAltRoundedIcon, path: ROUTES.AUDIT_LOGS },
  ],
  [ROLES.PROJECT_MANAGER]: [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardRoundedIcon, path: ROUTES.DASHBOARD },
    { id: 'projects', label: 'Projects', icon: FolderRoundedIcon, path: ROUTES.PROJECTS },
    { id: 'tasks', label: 'Tasks', icon: TaskAltRoundedIcon, path: ROUTES.TASKS },
    { id: 'timecards', label: 'Timecards', icon: AccessTimeRoundedIcon, path: ROUTES.TIMECARDS },
    { id: 'calendar', label: 'Calendar', icon: CalendarMonthRoundedIcon, path: ROUTES.CALENDAR },
    { id: 'kanban', label: 'Kanban', icon: ViewKanbanRoundedIcon, path: ROUTES.KANBAN },
    { id: 'reviews', label: 'Review Queue', icon: RateReviewRoundedIcon, path: ROUTES.REVIEWS },
    { id: 'reports', label: 'Reports', icon: AssessmentRoundedIcon, path: ROUTES.REPORTS },
    { id: 'audit-logs', label: 'Audit Logs', icon: ListAltRoundedIcon, path: ROUTES.AUDIT_LOGS },
  ],
  [ROLES.EMPLOYEE]: [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardRoundedIcon, path: ROUTES.DASHBOARD },
    { id: 'projects', label: 'Projects', icon: FolderRoundedIcon, path: ROUTES.PROJECTS },
    { id: 'tasks', label: 'Tasks', icon: TaskAltRoundedIcon, path: ROUTES.TASKS },
    { id: 'timecards', label: 'Timecards', icon: AccessTimeRoundedIcon, path: ROUTES.TIMECARDS },
    { id: 'calendar', label: 'Calendar', icon: CalendarMonthRoundedIcon, path: ROUTES.CALENDAR },
    { id: 'kanban', label: 'Kanban', icon: ViewKanbanRoundedIcon, path: ROUTES.KANBAN },
    { id: 'reports', label: 'Reports', icon: AssessmentRoundedIcon, path: ROUTES.REPORTS },
  ],
  [ROLES.REVIEWER]: [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardRoundedIcon, path: ROUTES.DASHBOARD },
    { id: 'projects', label: 'Projects', icon: FolderRoundedIcon, path: ROUTES.PROJECTS },
    { id: 'tasks', label: 'Tasks', icon: TaskAltRoundedIcon, path: ROUTES.TASKS },
    { id: 'timecards', label: 'Timecards', icon: AccessTimeRoundedIcon, path: ROUTES.TIMECARDS },
    { id: 'calendar', label: 'Calendar', icon: CalendarMonthRoundedIcon, path: ROUTES.CALENDAR },
    { id: 'kanban', label: 'Kanban', icon: ViewKanbanRoundedIcon, path: ROUTES.KANBAN },
    { id: 'reviews', label: 'Review Queue', icon: RateReviewRoundedIcon, path: ROUTES.REVIEWS },
    { id: 'reports', label: 'Reports', icon: AssessmentRoundedIcon, path: ROUTES.REPORTS },
  ],
};

// ─── Sidebar Component ─────────────────────────────────────────────────────────
const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [openSubMenus, setOpenSubMenus] = useState({});

  // Get nav items for current role (fallback to Employee)
  const navItems = ALL_NAV_ITEMS[user?.roleName] || ALL_NAV_ITEMS[ROLES.EMPLOYEE];

  const isActive = (path) => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleNavClick = (item) => {
    if (item.children) {
      setOpenSubMenus((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
      return;
    }
    if (item.path) {
      navigate(item.path);
      onMobileClose?.();
    }
  };

  const userInitial = user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email || 'User';

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#1A237E', color: '#FFFFFF', overflowX: 'hidden', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>

      {/* ─── Brand Header ───────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', px: collapsed ? 1 : 2.5, py: 2, minHeight: 64, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(66,165,245,0.4)' }}>
              <Typography variant="body1" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>E</Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>EPTMS</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem' }}>Management System</Typography>
            </Box>
          </Box>
        )}
        {collapsed && (
          <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg, #42A5F5 0%, #1976D2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(66,165,245,0.4)' }}>
            <Typography variant="body1" sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>E</Typography>
          </Box>
        )}
        <IconButton onClick={onToggle} size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)' }, ml: collapsed ? 0 : 1 }}>
          {collapsed ? <MenuRoundedIcon fontSize="small" /> : <ChevronLeftRoundedIcon fontSize="small" />}
        </IconButton>
      </Box>

      {/* ─── Role Badge ─────────────────────────────────────── */}
      {!collapsed && user?.roleName && (
        <Box sx={{ mx: 2, mt: 1.5, mb: 0.5, px: 1.5, py: 0.75, borderRadius: 1.5, backgroundColor: 'rgba(66,165,245,0.15)', border: '1px solid rgba(66,165,245,0.25)' }}>
          <Typography variant="caption" sx={{ color: '#90CAF9', fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {user.roleName}
          </Typography>
        </Box>
      )}

      {/* ─── Navigation ─────────────────────────────────────── */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1 }}>
        <List disablePadding>
          {navItems.map((item) => {
            if (item.divider) {
              return (
                <Box key={item.id}>
                  {!collapsed ? (
                    <Typography variant="overline" sx={{ display: 'block', px: 2.5, pt: 2, pb: 0.5, color: 'rgba(255,255,255,0.35)', fontSize: '0.62rem', letterSpacing: '0.1em' }}>
                      {item.label}
                    </Typography>
                  ) : (
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1, mx: 1.5 }} />
                  )}
                </Box>
              );
            }

            const Icon = item.icon;
            const active = isActive(item.path);
            const hasChildren = item.children?.length > 0;
            const subOpen = openSubMenus[item.id];

            return (
              <Box key={item.id}>
                <Tooltip title={collapsed ? item.label : ''} placement="right" arrow>
                  <ListItem disablePadding sx={{ px: 1, mb: 0.25 }}>
                    <ListItemButton
                      onClick={() => handleNavClick(item)}
                      sx={{
                        borderRadius: 2,
                        minHeight: 44,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        px: collapsed ? 1 : 1.5,
                        backgroundColor: active ? 'rgba(66,165,245,0.18)' : 'transparent',
                        '&:hover': { backgroundColor: active ? 'rgba(66,165,245,0.24)' : 'rgba(255,255,255,0.06)' },
                        position: 'relative',
                        overflow: 'hidden',
                        '&::before': active ? {
                          content: '""', position: 'absolute', left: 0, top: '20%', height: '60%',
                          width: 3, borderRadius: '0 2px 2px 0', backgroundColor: '#42A5F5',
                        } : {},
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: collapsed ? 0 : 36, color: active ? '#42A5F5' : 'rgba(255,255,255,0.55)' }}>
                        <Icon fontSize="small" />
                      </ListItemIcon>
                      {!collapsed && (
                        <>
                          <ListItemText
                            primary={item.label}
                            primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: active ? 600 : 400, color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)' }}
                          />
                          {hasChildren && (subOpen
                            ? <ExpandLessRoundedIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                            : <ExpandMoreRoundedIcon sx={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }} />
                          )}
                        </>
                      )}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>

                {/* Sub-menu support (future) */}
                {hasChildren && !collapsed && (
                  <Collapse in={subOpen} timeout="auto" unmountOnExit>
                    <List disablePadding sx={{ pl: 2 }}>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.path);
                        return (
                          <ListItem key={child.id} disablePadding sx={{ px: 1, mb: 0.25 }}>
                            <ListItemButton
                              onClick={() => { navigate(child.path); onMobileClose?.(); }}
                              sx={{ borderRadius: 2, minHeight: 38, px: 1.5, backgroundColor: childActive ? 'rgba(66,165,245,0.15)' : 'transparent', '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' } }}
                            >
                              {ChildIcon && (
                                <ListItemIcon sx={{ minWidth: 30, color: childActive ? '#42A5F5' : 'rgba(255,255,255,0.45)' }}>
                                  <ChildIcon sx={{ fontSize: 16 }} />
                                </ListItemIcon>
                              )}
                              <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: '0.8125rem', fontWeight: childActive ? 600 : 400, color: childActive ? '#FFFFFF' : 'rgba(255,255,255,0.65)' }} />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </Box>
            );
          })}
        </List>
      </Box>

      {/* ─── User Footer ────────────────────────────────────── */}
      {!collapsed && (
        <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #26A69A, #00796B)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 700, fontSize: '0.8rem' }}>
              {userInitial}
            </Typography>
          </Box>
          <Box sx={{ overflow: 'hidden', flex: 1 }}>
            <Typography variant="caption" sx={{ color: '#fff', fontWeight: 600, display: 'block', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.68rem' }}>
              {user?.departmentName || user?.roleName || '—'}
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <Drawer variant="temporary" open={mobileOpen} onClose={onMobileClose} ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box', border: 'none' } }}>
        {drawerContent}
      </Drawer>
      <Drawer variant="permanent"
        sx={{ display: { xs: 'none', md: 'block' }, width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH, flexShrink: 0, whiteSpace: 'nowrap', '& .MuiDrawer-paper': { width: collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH, boxSizing: 'border-box', overflowX: 'hidden', border: 'none', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' } }}
        open>
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
