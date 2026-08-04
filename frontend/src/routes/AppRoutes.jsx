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

// Employee Pages
const EmployeeListPage = lazy(() => import('../pages/employees/EmployeeListPage'));
const EmployeeDetailsPage = lazy(() => import('../pages/employees/EmployeeDetailsPage'));
const EmployeeCreatePage = lazy(() => import('../pages/employees/EmployeeCreatePage'));
const EmployeeEditPage = lazy(() => import('../pages/employees/EmployeeEditPage'));

// Department Pages
const DepartmentListPage = lazy(() => import('../pages/departments/DepartmentListPage'));
const DepartmentDetailsPage = lazy(() => import('../pages/departments/DepartmentDetailsPage'));
const DepartmentCreatePage = lazy(() => import('../pages/departments/DepartmentCreatePage'));
const DepartmentEditPage = lazy(() => import('../pages/departments/DepartmentEditPage'));

// Role Pages
const RoleListPage = lazy(() => import('../pages/roles/RoleListPage'));
const RoleDetailsPage = lazy(() => import('../pages/roles/RoleDetailsPage'));
const RoleCreatePage = lazy(() => import('../pages/roles/RoleCreatePage'));
const RoleEditPage = lazy(() => import('../pages/roles/RoleEditPage'));

// Project Pages
const ProjectListPage = lazy(() => import('../pages/projects/ProjectListPage'));
const ProjectDetailsPage = lazy(() => import('../pages/projects/ProjectDetailsPage'));
const ProjectCreatePage = lazy(() => import('../pages/projects/ProjectCreatePage'));
const ProjectEditPage = lazy(() => import('../pages/projects/ProjectEditPage'));

// Milestone Pages
const MilestoneListPage = lazy(() => import('../pages/milestones/MilestoneListPage'));
const MilestoneDetailsPage = lazy(() => import('../pages/milestones/MilestoneDetailsPage'));
const MilestoneCreatePage = lazy(() => import('../pages/milestones/MilestoneCreatePage'));
const MilestoneEditPage = lazy(() => import('../pages/milestones/MilestoneEditPage'));

// Task Pages
const TaskListPage = lazy(() => import('../pages/tasks/TaskListPage'));
const TaskDetailsPage = lazy(() => import('../pages/tasks/TaskDetailsPage'));
const TaskCreatePage = lazy(() => import('../pages/tasks/TaskCreatePage'));
const TaskEditPage = lazy(() => import('../pages/tasks/TaskEditPage'));

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

        {/* Employees Module */}
        <Route
          path={ROUTES.EMPLOYEES}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><EmployeeListPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.EMPLOYEES}/create`}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout><EmployeeCreatePage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.EMPLOYEES}/:id`}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><EmployeeDetailsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.EMPLOYEES}/:id/edit`}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout><EmployeeEditPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Departments Module */}
        <Route
          path={ROUTES.DEPARTMENTS}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><DepartmentListPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.DEPARTMENTS}/create`}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout><DepartmentCreatePage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.DEPARTMENTS}/:id`}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><DepartmentDetailsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.DEPARTMENTS}/:id/edit`}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout><DepartmentEditPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Roles Module */}
        <Route
          path={ROUTES.ROLES}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout><RoleListPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.ROLES}/create`}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout><RoleCreatePage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.ROLES}/:id`}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout><RoleDetailsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.ROLES}/:id/edit`}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout><RoleEditPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Projects Module */}
        <Route
          path={ROUTES.PROJECTS}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><ProjectListPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.PROJECTS}/create`}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><ProjectCreatePage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.PROJECTS}/:id`}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><ProjectDetailsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.PROJECTS}/:id/edit`}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><ProjectEditPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Milestones Module */}
        <Route
          path={ROUTES.MILESTONES}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><MilestoneListPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.MILESTONES}/create`}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><MilestoneCreatePage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.MILESTONES}/:id`}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><MilestoneDetailsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.MILESTONES}/:id/edit`}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><MilestoneEditPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Tasks Module */}
        <Route
          path={ROUTES.TASKS}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><TaskListPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.TASKS}/create`}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout><TaskCreatePage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.TASKS}/:id`}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><TaskDetailsPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={`${ROUTES.TASKS}/:id/edit`}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><TaskEditPage /></MainLayout>
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
