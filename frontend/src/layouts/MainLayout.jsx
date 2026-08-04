import { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import Sidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { lsGet, lsSet, STORAGE_KEYS } from '../utils/storageUtils';

/**
 * MainLayout
 * Primary application shell for all authenticated pages.
 * Composes Sidebar + Navbar + main content area + Footer.
 *
 * @param {ReactNode} children - Page content
 */
const MainLayout = ({ children }) => {
  // Persist sidebar collapsed state across page refreshes
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => lsGet(STORAGE_KEYS.SIDEBAR_COLLAPSED, false)
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSidebarToggle = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      lsSet(STORAGE_KEYS.SIDEBAR_COLLAPSED, next);
      return next;
    });
  };

  const handleMobileClose = () => setMobileOpen(false);
  const handleMobileOpen = () => setMobileOpen(true);

  const sidebarW = sidebarCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* ─── Sidebar ─────────────────────────────────────────────── */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* ─── Main Content Area ───────────────────────────────────── */}
      <Box
        component="main"
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          width: { md: `calc(100% - ${sidebarW}px)` },
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Top Navbar */}
        <Navbar
          sidebarCollapsed={sidebarCollapsed}
          onMobileMenuOpen={handleMobileOpen}
        />

        {/* Toolbar spacer to push content below fixed AppBar */}
        <Toolbar sx={{ minHeight: 64 }} />

        {/* Page Content */}
        <Box
          sx={{
            flex: 1,
            px: { xs: 2, sm: 3, md: 4 },
            py: { xs: 2, sm: 3 },
            overflowY: 'auto',
          }}
        >
          {children}
        </Box>

        {/* Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default MainLayout;
