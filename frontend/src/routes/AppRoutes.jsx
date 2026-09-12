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
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));
const ChangePasswordPage = lazy(() => import('../pages/auth/ChangePasswordPage'));
const PlaceholderPage = lazy(() => import('../pages/placeholders/PlaceholderPage'));
const ConfigurationPage = lazy(() => import('../pages/settings/ConfigurationPage'));
const ReviewQueuePage = lazy(() => import('../pages/reviews/ReviewQueuePage'));
const CalendarPage = lazy(() => import('../pages/calendar/CalendarPage'));
const KanbanPage = lazy(() => import('../pages/kanban/KanbanPage'));
const AuditLogPage = lazy(() => import('../pages/audit/AuditLogPage'));
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

// Notification Page
const NotificationPage = lazy(() => import('../pages/notifications/NotificationPage'));

// Reports Page
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'));

// Timecard Pages
const TimecardListPage = lazy(() => import('../pages/timecards/TimecardListPage'));
const TimecardCreatePage = lazy(() => import('../pages/timecards/TimecardCreatePage'));

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
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />

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
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
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

        {/* Timecards & Billing Module */}
        <Route
          path={ROUTES.TIMECARDS}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><TimecardListPage /></MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path={ROUTES.TIMECARDS_CREATE}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><TimecardCreatePage /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Reports — Admin, PM, Reviewer, Employee (limited) */}
        <Route
          path={ROUTES.REPORTS}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><ReportsPage /></MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Notifications Module */}
        <Route
          path={ROUTES.NOTIFICATIONS}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout><NotificationPage /></MainLayout>
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

        {/* Configuration — Admin only */}
        <Route
          path={ROUTES.CONFIGURATION}
          element={
            <ProtectedRoute allowedRoles={ADMIN_ROLES}>
              <MainLayout>
                <ConfigurationPage />
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

        {/* Reviews — Reviewer, Admin, PM */}
        <Route
          path={ROUTES.REVIEWS}
          element={
            <ProtectedRoute allowedRoles={['Administrator', 'Project Manager', 'Reviewer']}>
              <MainLayout>
                <ReviewQueuePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Calendar — All authenticated */}
        <Route
          path={ROUTES.CALENDAR}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout>
                <CalendarPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Kanban — All authenticated */}
        <Route
          path={ROUTES.KANBAN}
          element={
            <ProtectedRoute allowedRoles={AUTHENTICATED_ROLES}>
              <MainLayout>
                <KanbanPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Audit Logs — Admin & PM access */}
        <Route
          path={ROUTES.AUDIT_LOGS}
          element={
            <ProtectedRoute allowedRoles={MANAGER_ROLES}>
              <MainLayout>
                <AuditLogPage />
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
