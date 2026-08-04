import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar, Toolbar, IconButton, Typography, Box,
  Avatar, Menu, MenuItem, Divider, Badge,
  Tooltip, ListItemIcon,
} from '@mui/material';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

import useAuth from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from './Sidebar';

/**
 * Navbar (Top AppBar)
 * Displays app bar with:
 * - Mobile hamburger toggle
 * - Page breadcrumb / app name
 * - Notification bell
 * - User avatar + dropdown menu
 *
 * @param {boolean} sidebarCollapsed - Whether sidebar is collapsed
 * @param {function} onMobileMenuOpen - Open mobile sidebar drawer
 */
const Navbar = ({ sidebarCollapsed, onMobileMenuOpen }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);

  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = async () => {
    handleMenuClose();
    await logout();
    navigate(ROUTES.LOGIN);
  };

  const userInitial = user?.firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.email || 'User';

  return (
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
          sx={{ mr: 2, display: { md: 'none' }, color: 'text.primary' }}
        >
          <MenuRoundedIcon />
        </IconButton>

        {/* App Name / Page Context */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              fontSize: { xs: '1rem', sm: '1.1rem' },
            }}
          >
            {import.meta.env.VITE_APP_NAME || 'EPTMS'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              backgroundColor: 'primary.main',
              color: '#fff',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              fontWeight: 600,
              fontSize: '0.65rem',
              letterSpacing: '0.04em',
              display: { xs: 'none', sm: 'inline-block' },
            }}
          >
            v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
          </Typography>
        </Box>

        <Box sx={{ flex: 1 }} />

        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton sx={{ color: 'text.secondary', mr: 1 }}>
            <Badge badgeContent={0} color="error">
              <NotificationsNoneRoundedIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* User Avatar + Menu */}
        <Box
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
            sx: { mt: 1, minWidth: 200, borderRadius: 2, border: '1px solid', borderColor: 'divider' },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>{displayName}</Typography>
            <Typography variant="caption" color="text.secondary">{user?.email || ''}</Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); navigate(ROUTES.PROFILE); }} sx={{ py: 1.25 }}>
            <ListItemIcon><PersonOutlineRoundedIcon fontSize="small" /></ListItemIcon>
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { handleMenuClose(); navigate(ROUTES.SETTINGS); }} sx={{ py: 1.25 }}>
            <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ py: 1.25, color: 'error.main' }}>
            <ListItemIcon><LogoutRoundedIcon fontSize="small" color="error" /></ListItemIcon>
            Sign Out
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
