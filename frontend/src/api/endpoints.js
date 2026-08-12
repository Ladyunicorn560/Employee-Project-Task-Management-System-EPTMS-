/**
 * EPTMS API Endpoint Constants
 * Single source of truth for all backend API paths.
 * Base URL is configured via VITE_API_BASE_URL in .env
 *
 * Usage:
 *   import { API } from '../api/endpoints';
 *   axiosInstance.post(API.AUTH.LOGIN, payload)
 */

export const API = {
  // ─── Auth ──────────────────────────────────────────────────────────
  AUTH: {
    LOGIN: '/auth/login',
    ME: '/auth/me',
    LOGOUT: '/auth/logout',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // ─── Employees ─────────────────────────────────────────────────────
  EMPLOYEES: {
    BASE: '/employees',
    BY_ID: (id) => `/employees/${id}`,
  },

  // ─── Departments ───────────────────────────────────────────────────
  DEPARTMENTS: {
    BASE: '/departments',
    BY_ID: (id) => `/departments/${id}`,
  },

  // ─── Roles ─────────────────────────────────────────────────────────
  ROLES: {
    BASE: '/roles',
    BY_ID: (id) => `/roles/${id}`,
  },

  // ─── Projects ──────────────────────────────────────────────────────
  PROJECTS: {
    BASE: '/projects',
    BY_ID: (id) => `/projects/${id}`,
    MEMBERS: (id) => `/projects/${id}/members`,
    MILESTONES: (id) => `/projects/${id}/milestones`,
    TASKS: (id) => `/projects/${id}/tasks`,
  },

  // ─── Tasks ─────────────────────────────────────────────────────────
  TASKS: {
    BASE: '/tasks',
    BY_ID: (id) => `/tasks/${id}`,
    SUBTASKS: (id) => `/tasks/${id}/subtasks`,
    COMMENTS: (id) => `/tasks/${id}/comments`,
    ATTACHMENTS: (id) => `/tasks/${id}/attachments`,
    REVIEWS: (id) => `/tasks/${id}/reviews`,
  },

  // ─── Subtasks ──────────────────────────────────────────────────────
  SUBTASKS: {
    BASE: '/subtasks',
    BY_ID: (id) => `/subtasks/${id}`,
  },

  // ─── Milestones ────────────────────────────────────────────────────
  MILESTONES: {
    BASE: '/milestones',
    BY_ID: (id) => `/milestones/${id}`,
  },

  // ─── Comments ──────────────────────────────────────────────────────
  COMMENTS: {
    BASE: '/comments',
    BY_ID: (id) => `/comments/${id}`,
  },

  // ─── Attachments ───────────────────────────────────────────────────
  ATTACHMENTS: {
    BASE: '/attachments',
    BY_ID: (id) => `/attachments/${id}`,
  },

  // ─── Reviews ───────────────────────────────────────────────────────
  REVIEWS: {
    BASE: '/reviews',
    BY_ID: (id) => `/reviews/${id}`,
  },

  // ─── Notifications ─────────────────────────────────────────────────
  NOTIFICATIONS: {
    BASE: '/notifications',
    BY_ID: (id) => `/notifications/${id}`,
    MARK_READ: (id) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },

  // ─── Dashboard ─────────────────────────────────────────────────
  DASHBOARD: {
    BASE: '/dashboard',
    OVERVIEW: '/dashboard/overview',
    PROJECTS: '/dashboard/projects',
    TASKS: '/dashboard/tasks',
    EMPLOYEES: '/dashboard/employees',
    NOTIFICATIONS: '/dashboard/notifications',
    OVERDUE: '/dashboard/overdue',
  },

  // ─── Reports ───────────────────────────────────────────────────────
  REPORTS: {
    BASE: '/reports',
    EMPLOYEE: '/reports/employee',
    PROJECT: '/reports/project',
    TASK: '/reports/task',
  },
};
