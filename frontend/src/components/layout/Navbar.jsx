import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Avatar, Menu, MenuItem, Divider, Badge,
  Tooltip, ListItemIcon, Chip,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyRoundedIcon from '@mui/icons-material/KeyRounded';

import useAuth from '../../hooks/useAuth';
import ConfirmDialog from '../common/ConfirmDialog';
import { ROUTES } from '../../constants/routes';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';
import { ROLES } from '../../constants/roles';
import notificationService from '../../services/notificationService';
import CircleIcon from '@mui/icons-material/Circle';
import { formatDate } from '../../utils/dateUtils';

/**
 * Navbar
 * Top AppBar with:
 * - Responsive sidebar offset
 * - Notification bell with badge
 * - User profile dropdown (Profile, Change Password, Settings [Admin], Sign Out)
 * - Logout ConfirmDialog
 * - Auto-fetches current user via refreshUser() on mount
 */
const Navbar = ({ sidebarCollapsed, onMobileMenuOpen }) => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuOpen = Boolean(anchorEl);

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const notifOpen = Boolean(notifAnchorEl);

  const fetchUnreadAndPreview = async () => {
    try {
      const [unreadRes, previewRes] = await Promise.all([
        notificationService.getAll({ limit: 1, isRead: false }),
        notificationService.getAll({ limit: 5 }),
      ]);
      setUnreadCount(unreadRes.pagination?.total || 0);
      setNotifications(previewRes.data || []);
    } catch (err) {
      console.error('Failed to load notifications preview:', err);
    }
  };

  const handleNotifOpen = (e) => setNotifAnchorEl(e.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const handleMarkAllNotifsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleNotifItemClick = async (notif) => {
    handleNotifClose();
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        console.error(err);
      }
    }
    if (notif.taskId) {
      navigate(`${ROUTES.TASKS}/${notif.taskId}`);
    } else if (notif.projectId) {
      navigate(`${ROUTES.PROJECTS}/${notif.projectId}`);
    } else {
      navigate(ROUTES.NOTIFICATIONS);
    }
  };

  // Fetch fresh user profile on mount (restores after page refresh)
  useEffect(() => {
    if (user) {
      refreshUser?.();
      fetchUnreadAndPreview();
    }
    
    window.addEventListener('unread-notifications-update', fetchUnreadAndPreview);
    const interval = setInterval(fetchUnreadAndPreview, 30000);

    return () => {
      window.removeEventListener('unread-notifications-update', fetchUnreadAndPreview);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogoutRequest = () => {
    handleMenuClose();
    setLogoutDialogOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate(ROUTES.LOGIN, { replace: true });
    } finally {
      setLoggingOut(false);
      setLogoutDialogOpen(false);
    }
  };

  const userInitial = user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email || 'User';

  const isAdmin = user?.roleName === ROLES.ADMINISTRATOR;

  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${sidebarW}px)` },
          ml: { md: `${sidebarW}px` },
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), margin 0.25s cubic-bezier(0.4,0,0.2,1)',
          zIndex: (theme) => theme.zIndex.drawer - 1,
        }}
      >
        <Toolbar sx={{ minHeight: 64, px: { xs: 2, sm: 3 } }}>
          {/* Mobile Menu Toggle */}
          <IconButton
            edge="start"
            onClick={onMobileMenuOpen}
            sx={{ mr: 2, display: { md: 'none' }, color: 'text.secondary' }}
          >
            <MenuRoundedIcon />
          </IconButton>

          {/* App name + version */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', fontSize: { xs: '1rem', sm: '1.05rem' } }}>
              EPTMS
            </Typography>
            <Chip
              label={`v${import.meta.env.VITE_APP_VERSION || '1.0.0'}`}
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: '0.62rem', fontWeight: 700, display: { xs: 'none', sm: 'flex' } }}
            />
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Notification Bell */}
          <IconButton onClick={handleNotifOpen} sx={{ color: 'text.secondary', mr: 1 }}>
            <Badge badgeContent={unreadCount} color="error" max={99}>
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>

          {/* Notifications Dropdown Preview Menu */}
          <Menu
            anchorEl={notifAnchorEl}
            open={notifOpen}
            onClose={handleNotifClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              sx: { mt: 1, minWidth: 320, maxWidth: 360, borderRadius: 2, border: '1px solid', borderColor: 'divider' },
            }}
          >
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" fontWeight={700}>Notifications</Typography>
              {unreadCount > 0 && (
                <Typography
                  variant="caption"
                  color="primary"
                  sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                  onClick={handleMarkAllNotifsRead}
                >
                  Mark all read
                </Typography>
              )}
            </Box>
            <Divider />

            <Box sx={{ maxHeight: 320, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No notifications</Typography>
                </Box>
              ) : (
                notifications.map((notif) => (
                  <MenuItem
                    key={notif.id}
                    onClick={() => handleNotifItemClick(notif)}
                    sx={{
                      py: 1.5,
                      px: 2,
                      display: 'flex',
                      gap: 1.5,
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                      whiteSpace: 'normal',
                      alignItems: 'flex-start',
                      backgroundColor: !notif.isRead ? 'rgba(25,118,210,0.01)' : 'transparent',
                    }}
                  >
                    {!notif.isRead && (
                      <CircleIcon sx={{ fontSize: 8, color: 'primary.main', mt: 0.75, flexShrink: 0 }} />
                    )}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        fontWeight={!notif.isRead ? 700 : 400}
                        color={!notif.isRead ? 'text.primary' : 'text.secondary'}
                        sx={{ lineHeight: 1.4 }}
                      >
                        {notif.message}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                        {formatDate(notif.createdDate)}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))
              )}
            </Box>

            <Divider />
            <MenuItem
              onClick={() => { handleNotifClose(); navigate(ROUTES.NOTIFICATIONS); }}
              sx={{ py: 1.25, justifyContent: 'center', color: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}
            >
              View All Notifications
            </MenuItem>
          </Menu>

          {/* User Avatar + Dropdown */}
          <Box
            id="navbar-user-menu-trigger"
            onClick={handleMenuOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              borderRadius: 2,
              px: 1,
              py: 0.5,
              transition: 'background-color 0.15s ease',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' },
            }}
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                background: 'linear-gradient(135deg, #1976D2, #1565C0)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              {userInitial}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.2 }}>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                {user?.roleName || '—'}
              </Typography>
            </Box>
            <KeyboardArrowDownRoundedIcon
              sx={{
                color: 'text.secondary',
                fontSize: 18,
                display: { xs: 'none', sm: 'block' },
                transform: menuOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s ease',
              }}
            />
          </Box>

          {/* User Dropdown Menu */}
          <Menu
            anchorEl={anchorEl}
            open={menuOpen}
            onClose={handleMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              elevation: 3,
              sx: { mt: 1, minWidth: 220, borderRadius: 2, border: '1px solid', borderColor: 'divider' },
            }}
          >
            {/* User Info Header */}
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>{displayName}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email || ''}</Typography>
              {user?.departmentName && (
                <Chip
                  label={user.departmentName}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 0.75, height: 20, fontSize: '0.65rem', color: 'text.secondary', borderColor: 'divider', display: 'flex', width: 'fit-content' }}
                />
              )}
            </Box>
            <Divider />

            <MenuItem onClick={() => { handleMenuClose(); navigate(ROUTES.PROFILE); }} sx={{ py: 1.25 }}>
              <ListItemIcon><PersonOutlineRoundedIcon fontSize="small" /></ListItemIcon>
              My Profile
            </MenuItem>

            <MenuItem onClick={() => { handleMenuClose(); navigate(ROUTES.CHANGE_PASSWORD); }} sx={{ py: 1.25 }}>
              <ListItemIcon><KeyRoundedIcon fontSize="small" /></ListItemIcon>
              Change Password
            </MenuItem>

            {isAdmin && (
              <MenuItem onClick={() => { handleMenuClose(); navigate(ROUTES.SETTINGS); }} sx={{ py: 1.25 }}>
                <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
                Settings
              </MenuItem>
            )}

            <Divider />

            <MenuItem onClick={handleLogoutRequest} sx={{ py: 1.25, color: 'error.main' }}>
              <ListItemIcon><LogoutRoundedIcon fontSize="small" color="error" /></ListItemIcon>
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* ─── Logout Confirm Dialog ─────────────────────────── */}
      <ConfirmDialog
        open={logoutDialogOpen}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to enter your credentials to sign back in."
        confirmLabel="Sign Out"
        cancelLabel="Stay Signed In"
        confirmColor="error"
        variant="logout"
        loading={loggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={() => setLogoutDialogOpen(false)}
      />
    </>
  );
};

export default Navbar;
