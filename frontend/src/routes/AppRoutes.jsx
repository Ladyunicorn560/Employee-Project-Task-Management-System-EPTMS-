import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';

// Components
import ProtectedRoute from '../components/common/ProtectedRoute';
import MainLayout from '../layouts/MainLayout';
import PageLoader from '../components/ui/PageLoader';

// Constants
import { ROUTES } from '../constants/routes';
import { MANAGER_ROLES, ADMIN_ROLES, AUTHENTICATED_ROLES } from '../constants/roles';

// Lazy-loaded pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ChangePasswordPage = lazy(() => import('../pages/auth/ChangePasswordPage'));
const PlaceholderPage = lazy(() => import('../pages/placeholders/PlaceholderPage'));
const Error401Page = lazy(() => import('../pages/errors/Error401Page'));
const Error403Page = lazy(() => import('../pages/errors/Error403Page'));
const Error404Page = lazy(() => import('../pages/errors/Error404Page'));
const Error500Page = lazy(() => import('../pages/errors/Error500Page'));

// MUI Icons for placeholder pages
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import CorporateFareRoundedIcon from '@mui/icons-material/CorporateFareRounded';
import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded';
import FolderRoundedIcon from '@mui/icons-material/FolderRounded';
import TaskAltRoundedIcon from '@mui/icons-material/TaskAltRounded';
import AssessmentRoundedIcon from '@mui/icons-material/AssessmentRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import RateReviewRoundedIcon from '@mui/icons-material/RateReviewRounded';

/**
 * AppRoutes
 * Centralized React Router v7 route configuration.
 * All protected routes are wrapped with ProtectedRoute + MainLayout.
 * Lazy loading with Suspense for code-splitting.
 */
const AppRoutes = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ─── Public Routes ──────────────────────────────────── */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />

        {/* ─── Error Routes (standalone, no layout) ───────────── */}
        <Route path={ROUTES.ERROR_401} element={<Error401Page />} />
        <Route path={ROUTES.ERROR_403} element={<Error403Page />} />
        <Route path={ROUTES.ERROR_404} element={<Error404Page />} />
        <Route path={ROUTES.ERROR_500} element={<Error500Page />} />

        {/* ─── Protected Routes (inside MainLayout) ───────────── */}

        {/* Root → Dashboard */}
        <Route
          path={ROUTES.ROOT}
          element={
            <ProtectedRoute>
              <Navigate to={ROUTES.DASHBOARD} replace />
            </ProtectedRoute>
          }
        />

        {/* Dashboard — All authenticated roles */}
        <Route
          path={ROUTES.DASHBOARD}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><DashboardPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Employees — Admin + PM */}
        <Route
          path={ROUTES.EMPLOYEES}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout>
                <PlaceholderPage
                  title="Employees"
                  description="Manage employee records, onboarding, and profiles. Full implementation coming in Phase 2."
                  icon={PeopleAltRoundedIcon}
                  phase="Phase 2"
                  module="People"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Departments — Admin only */}
        <Route
          path={ROUTES.DEPARTMENTS}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout>
                <PlaceholderPage
                  title="Departments"
                  description="Configure and manage company departments and organizational structure. Coming in Phase 3."
                  icon={CorporateFareRoundedIcon}
                  phase="Phase 3"
                  module="Organization"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Roles — Admin only */}
        <Route
          path={ROUTES.ROLES}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout>
                <PlaceholderPage
                  title="Roles & Permissions"
                  description="Manage system roles and access permissions. Coming in Phase 3."
                  icon={AdminPanelSettingsRoundedIcon}
                  phase="Phase 3"
                  module="Organization"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Projects — All authenticated */}
        <Route
          path={ROUTES.PROJECTS}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout>
                <PlaceholderPage
                  title="Projects"
                  description="Create and manage projects with milestones, members, and timelines. Coming in Phase 4."
                  icon={FolderRoundedIcon}
                  phase="Phase 4"
                  module="Work"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Tasks — All authenticated */}
        <Route
          path={ROUTES.TASKS}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout>
                <PlaceholderPage
                  title="Tasks"
                  description="Track tasks, subtasks, comments, and attachments. Coming in Phase 5."
                  icon={TaskAltRoundedIcon}
                  phase="Phase 5"
                  module="Work"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Reports — Admin, PM, Reviewer */}
        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute allowedRoles={[...MANAGER_ROLES, 'Reviewer']}>
              <MainLayout>
                <PlaceholderPage
                  title="Reports"
                  description="Generate and export employee, project, and task reports. Coming in Phase 9."
                  icon={AssessmentRoundedIcon}
                  phase="Phase 9"
                  module="Analytics"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Profile — All authenticated */}
        <Route
          path={ROUTES.PROFILE}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout>
                <PlaceholderPage
                  title="My Profile"
                  description="View and update your personal profile and account settings."
                  icon={PersonRoundedIcon}
                  phase="Phase 2"
                  module="Account"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Settings — Admin only */}
        <Route
          path={ROUTES.SETTINGS}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout>
                <PlaceholderPage
                  title="Settings"
                  description="Configure system-wide settings and preferences."
                  icon={SettingsRoundedIcon}
                  phase="Phase 10"
                  module="Administration"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Change Password — All authenticated */}
        <Route
          path={ROUTES.CHANGE_PASSWORD}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout>
                <ChangePasswordPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Reviews — Reviewer and Admin */}
        <Route
          path="/reviews"
          element={
            <ProtectedRoute allowedRoles={['Reviewer', 'Administrator']}>
              <MainLayout>
                <PlaceholderPage
                  title="Reviews"
                  description="Manage task reviews and approvals. Coming in Phase 6."
                  icon={RateReviewRoundedIcon}
                  phase="Phase 6"
                  module="Work"
                />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* ─── Catch-All → 404 ────────────────────────────────── */}
        <Route path="*" element={<Navigate to={ROUTES.ERROR_404} replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
