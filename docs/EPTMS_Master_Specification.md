# Employee Project & Task Management System (EPTMS)
## Comprehensive Master Specification Document

**Version:** 1.0  
**Status:** Draft  
**Prepared By:** Business Analyst  
**Target Audience:** Software Development Team, Architects, QA & Testing Teams, DevOps Engineers, UI/UX Designers, Project Managers  

---

## Table of Contents
1. [Executive Summary & Document Control](#1-executive-summary--document-control)
2. [Business Requirements Document (BRD)](#2-business-requirements-document-brd)
3. [Software Requirements Specification (SRS)](#3-software-requirements-specification-srs)
4. [Functional Specification Document (FSD)](#4-functional-specification-document-fsd)
5. [UI/UX Design Specification](#5-uiux-design-specification)
6. [Workflow & State Transition Document](#6-workflow--state-transition-document)
7. [Security & Permission Matrix](#7-security--permission-matrix)
8. [Notification & Email Template Specification](#8-notification--email-template-specification)
9. [Reporting & Dashboard Specification](#9-reporting--dashboard-specification)
10. [System Integration Specification](#10-system-integration-specification)
11. [Infrastructure, Deployment & CI/CD Guide](#11-infrastructure-deployment--cicd-guide)
12. [Test Strategy & Test Cases Specification](#12-test-strategy--test-cases-specification)
13. [Technical Design Document (TDD)](#13-technical-design-document-tdd)
14. [Database Design & Data Dictionary](#14-database-design--data-dictionary)
15. [REST API Specification](#15-rest-api-specification)
16. [Future Enhancements Roadmap](#16-future-enhancements-roadmap)

---

## 1. Executive Summary & Document Control

The **Employee Project & Task Management System (EPTMS)** is a web-based enterprise application designed to help organisations plan projects, assign work, monitor progress, validate completed work, and generate management reports. 

EPTMS provides a single platform where every employee can create work items while maintaining visibility, accountability, and governance across all levels of the organization.

### Key Objectives
* Enable employees to create standalone tasks or project-linked tasks.
* Provide project planning with timelines, milestones, and project managers.
* Enforce **mandatory reviewer validation** before any task can be marked as Completed.
* Offer live dashboards, reporting, automated notifications, and complete audit logging.

---

## 2. Business Requirements Document (BRD)

### 2.1 Scope Definition
#### In Scope
* User Management & Role-Based Access Control (RBAC)
* Project Management & Progress Tracking
* Milestone Management
* Task & Subtask Management
* Review & Approval Workflow
* Comments & File Attachments
* Notifications (In-App, Email, Microsoft Teams)
* Dashboards & Analytics
* Reporting (PDF & Excel Exports)
* Audit Trail Logging

#### Out of Scope
* Payroll management
* Attendance tracking
* Leave management
* Recruitment and hiring

### 2.2 User Roles & Primary Capabilities
* **Administrator:** Manage users, departments, master data, permissions, notifications, workflows, project archiving, and edit completed tasks.
* **Project Manager:** Create/edit/delete draft projects, assign members, set milestones/tasks, assign reviewers, monitor/close projects, generate reports.
* **Employee:** View assigned projects/tasks, create standalone tasks and subtasks, update progress, upload files, add comments, submit for review.
* **Reviewer:** Review assigned tasks, approve/reject/request changes, add review comments.

### 2.3 Core Business Workflow
```
[Project] ──> [Milestone] ──> [Task] ──> [Subtask]
                                │
                        Employee Completes Task
                                │
                        [Ready for Review]
                                │
                    ┌───────────┴───────────┐
             Reviewer Approves      Reviewer Requests Changes
                    │                       │
               [Completed]           [In Progress]
```

---

## 3. Software Requirements Specification (SRS)

### 3.1 Functional Requirements (FR)
| ID | Requirement Description |
| :--- | :--- |
| **FR-001** | System shall allow authorised users to log in securely. |
| **FR-002** | System shall support Administrator, Project Manager, Employee, and Reviewer roles. |
| **FR-003** | Users shall create projects with start/end dates and assign a Project Manager. |
| **FR-004** | Projects shall contain milestones, tasks, and subtasks. |
| **FR-005** | Employees may create standalone tasks or project tasks. |
| **FR-006** | Each task shall have at least one Assignee and one Reviewer. |
| **FR-007** | Employees shall upload attachments and post comments. |
| **FR-008** | Employees shall submit completed work for review. |
| **FR-009** | Reviewers shall approve or request changes with comments. |
| **FR-010** | Only reviewer approval moves a task to Completed state. |
| **FR-011** | Project progress shall be calculated automatically from approved tasks. |
| **FR-012** | System shall maintain complete audit history. |
| **FR-013** | Dashboards shall display KPIs, metrics, and workload. |
| **FR-014** | Reports shall export to Microsoft Excel and PDF. |

---

## 4. Functional Specification Document (FSD)

### 4.1 Screen Specifications
| Screen Name | Purpose | Key Functions Available |
| :--- | :--- | :--- |
| **Dashboard** | Displays KPIs, pending reviews, overdue tasks, project health, and notifications. | Create, View, Edit, Search, Filter, Export |
| **Project List** | Search, filter, create, edit, archive, and export projects. | Create, View, Edit, Search, Filter, Export |
| **Project Details** | Overview, members, milestones, tasks, documents, activity, and reports. | Create, View, Edit, Search, Filter, Export |
| **Task List** | Filter by project, assignee, reviewer, priority, and status. | Create, View, Edit, Search, Filter, Export |
| **Task Details** | General information, comments, attachments, subtasks, and review history. | Create, View, Edit, Search, Filter, Export |
| **Review Queue** | Reviewer queue to approve work or request changes. | Create, View, Edit, Search, Filter, Export |
| **Administration** | Manage users, departments, roles, permissions, and system configuration. | Create, View, Edit, Search, Filter, Export |

### 4.2 Field Validation Rules
| Field Name | Validation Rule |
| :--- | :--- |
| **Project Name** | Mandatory, must be unique across system |
| **Project Start Date** | Cannot be greater than End Date |
| **Task Title** | Mandatory |
| **Assignee** | Mandatory |
| **Reviewer** | Mandatory |
| **Due Date** | Cannot be before Start Date |
| **Progress** | Numeric, range `0` - `100`% only |

### 4.3 Error Message Standards
| Scenario | Error Message Rendered |
| :--- | :--- |
| **Reviewer missing** | `"Please select a reviewer."` |
| **Assignee missing** | `"Please assign the task."` |
| **Invalid dates** | `"End Date must be after Start Date."` |
| **Duplicate project** | `"Project name already exists."` |

---

## 5. UI/UX Design Specification

### 5.1 Design Principles & Global Layout
* **Principles:** Responsive web application, clean dashboard-first layout, consistent navigation, accessibility (WCAG compliant), minimal clicks for common actions.
* **Global Layout Structure:**
  * **Header:** Logo, Global Search Bar, Notifications Menu, User Profile & Settings.
  * **Left Navigation:** Dashboard, Projects, Tasks, Calendar, Reports, Administration.
  * **Main Content Area:** Contextual screen views & tables.
  * **Footer:** Version details and copyright info.

### 5.2 Screen Catalogue & Navigation Flow
```
Login ──> Dashboard
            ├──> Projects ──> Project Details ──> Tasks ──> Task Details
            ├──> Calendar (Month/Week/Day view) & Kanban (Drag-and-drop board)
            ├──> Reports
            └──> Administration (Admin Only)
```

### 5.3 Dashboard Widgets
* My Tasks
* Projects in Progress
* Pending Reviews
* Overdue Tasks
* Project Health Score
* Recent Activity Feed
* System Notifications
* Upcoming Deadlines

### 5.4 Colour & Icon Standard Guidelines
| Indicator Color | Semantic Meaning |
| :--- | :--- |
| 🟢 **Green** | Completed / Healthy |
| 🟡 **Amber** | At Risk / Pending Attention |
| 🔴 **Red** | Overdue / Blocked / Critical |
| 🔵 **Blue** | Information / Active |
| ⚪ **Grey** | Draft / Archived |

---

## 6. Workflow & State Transition Document

### 6.1 Project Lifecycle & Transitions
* **States:** `Draft` ➔ `Planned` ➔ `Active` ➔ `On Hold` ➔ `Completed` ➔ `Archived`

| Current State | Action | Next State | Performed By |
| :--- | :--- | :--- | :--- |
| **Draft** | Submit | Planned | Project Manager |
| **Planned** | Start Project | Active | Project Manager |
| **Active** | Pause | On Hold | Project Manager |
| **On Hold** | Resume | Active | Project Manager |
| **Active** | Close | Completed | Project Manager |
| **Completed** | Archive | Archived | Administrator |

### 6.2 Task Lifecycle & State Transitions
* **Full Workflow:** `Created` ➔ `Assigned` ➔ `In Progress` ➔ `Ready for Review` ➔ `Under Review` ➔ `Completed` (or `Rejected / Changes Required`) ➔ `Cancelled`

| Current State | Action Trigger | Next State | Actor | Notification Recipient |
| :--- | :--- | :--- | :--- | :--- |
| **Created** | Assign | Assigned | Creator | Assignee |
| **Assigned** | Start Work | In Progress | Assignee | Creator |
| **In Progress** | Submit | Ready for Review | Assignee | Reviewer |
| **Ready for Review** | Open Review | Under Review | Reviewer | Assignee |
| **Under Review** | Approve | Completed | Reviewer | Creator & Assignee |
| **Under Review** | Request Changes | Rejected / Changes Required | Reviewer | Assignee |
| **Changes Required** | Resubmit | Ready for Review | Assignee | Reviewer |
| **Any Active State** | Cancel | Cancelled | Project Manager | All Stakeholders |

---

## 7. Security & Permission Matrix

### 7.1 Role-Based Access Control (RBAC) Permission Matrix
| Feature / Action | Admin | Project Manager | Employee | Reviewer |
| :--- | :---: | :---: | :---: | :---: |
| **View Dashboard** | ✔ | ✔ | ✔ | ✔ |
| **Create Project** | ✔ | ✔ | ✖ | ✖ |
| **Edit Project** | ✔ | ✔ | ✖ | ✖ |
| **Archive Project** | ✔ | ✔ | ✖ | ✖ |
| **Create Task** | ✔ | ✔ | ✔ | ✖ |
| **Assign Task** | ✔ | ✔ | ✔ | ✖ |
| **Assign Reviewer** | ✔ | ✔ | ✔ | ✖ |
| **Update Assigned Task** | ✔ | ✔ | ✔ | ✖ |
| **Submit for Review** | ✔ | ✔ | ✔ | ✖ |
| **Approve Task** | ✖ | ✖ | ✖ | ✔ |
| **Request Changes** | ✖ | ✖ | ✖ | ✔ |
| **Manage Users** | ✔ | ✖ | ✖ | ✖ |
| **Manage Roles** | ✔ | ✖ | ✖ | ✖ |
| **View Reports** | ✔ | ✔ | Limited | Limited |
| **Export Reports** | ✔ | ✔ | ✔ | ✔ |
| **View Audit Logs** | ✔ | ✔ | ✖ | ✖ |
| **System Configuration** | ✔ | ✖ | ✖ | ✖ |

### 7.2 Data Protection & Security Controls
* **Authentication:** Microsoft Entra ID (Azure AD) or Local Authentication with JWT tokens and optional Multi-Factor Authentication (MFA). Automatic session timeout on inactivity.
* **Authorisation:** Task edits restricted to assigned employees; approvals restricted to assigned reviewers. Completed tasks locked as read-only (admin exception).
* **Encryption & Defense:** HTTPS/TLS encryption in transit, SQL injection & XSS prevention via server-side input validation, secure file upload checks, encrypted password hashing.

---

## 8. Notification & Email Template Specification

### 8.1 Channels & Event Triggers
Channels supported: **In-App Alerts, Email, Microsoft Teams, Dashboard Cards**.

| Event Trigger | Recipient(s) | Delivery Channels |
| :--- | :--- | :--- |
| **Task Assigned** | Assignee | Email, In-App, Teams |
| **Reviewer Assigned** | Reviewer | Email, In-App |
| **Submitted for Review** | Reviewer | Email, In-App, Teams |
| **Task Approved** | Creator & Assignee | Email, In-App |
| **Changes Requested** | Assignee | Email, In-App |
| **Task Overdue** | Assignee & Project Manager | Email, Teams |
| **Milestone Completed** | Project Team | In-App, Email |
| **Project Completed** | Project Team | Email, Dashboard |

### 8.2 Standard Email Templates
* **Task Assignment:** Welcomes assignee with project, due date, priority.
* **Task Submitted for Review:** Alerts reviewer to open task review queue.
* **Task Approved:** Notifies task completion.
* **Changes Requested:** Details reviewer feedback and comments for resubmission.

### 8.3 Reminders & Escalation Rules
* **Reminder Schedule:** 7 days before due date, 2 days before due date, on due date, daily while overdue, and review reminder every 24 hours until completed.
* **Escalations:**
  * Overdue tasks escalate to Project Manager after **1 day**.
  * Pending reviews escalate to Project Manager after **2 days**.
  * Critical tasks escalate **immediately** when overdue.
  * Projects overdue by > **7 days** escalate to Administrator.

---

## 9. Reporting & Dashboard Specification

### 9.1 Dashboard & KPI Catalogue
* **Dashboards:** Executive Dashboard, PM Dashboard, Employee Dashboard, Reviewer Dashboard, Administrator Dashboard.
* **Key Metrics & Visualizations:** Projects by status (Pie chart), Tasks by status (Bar chart), Overdue Tasks table, Average Review Time, Employee Workload heatmap, Project Health Score, Gantt Timeline.
* **Standard Reports & Formats:** Project Status (Daily PDF/Excel), Task Status (Daily PDF/Excel), Overdue Tasks (Daily Excel), Employee Workload (Weekly PDF/Excel), Review Queue (Daily Excel), Audit Trail (On Demand CSV/Excel).

---

## 10. System Integration Specification

### 10.1 Integration Architecture & External Systems
```
Client UI ──> EPTMS REST API ──> Business Services
                                     │
    ┌────────────────┬───────────────┼───────────────┬────────────────┐
    ▼                ▼               ▼               ▼                ▼
Microsoft      Microsoft        SharePoint /     SMTP / MS 365     Power BI &
Entra ID       Teams            Blob Storage     Email             Calendar APIs
(Auth/SSO)     (Webhooks)       (Attachments)    (Notifications)   (Analytics/Reminders)
```

### 10.2 Integration Catalogue
| System | Purpose | Protocol | Direction | Auth Method |
| :--- | :--- | :--- | :--- | :--- |
| **Microsoft Entra ID** | User Authentication & SSO | OAuth 2.0 / OpenID Connect | Inbound | SSO |
| **Microsoft Teams** | Automated Channel Notifications | REST / Webhook | Outbound | OAuth 2.0 |
| **SharePoint** | Document & File Storage | REST API | Bi-directional | OAuth 2.0 |
| **SMTP / Microsoft 365**| Email Delivery | SMTP / Graph API | Outbound | Service Account |
| **Power BI** | Enterprise Reporting & Analytics | REST API | Outbound | Service Principal |
| **Calendar Services** | Task Reminders & Sync | Graph API | Bi-directional | OAuth 2.0 |

### 10.3 Integration Error Handling Matrix
| Scenario | System Action | Automatic Retry |
| :--- | :--- | :---: |
| **Authentication failure** | Log error and return HTTP 401 | ✖ |
| **Service unavailable** | Enqueue payload in retry message queue | ✔ |
| **Validation error** | Return detailed error payload | ✖ |
| **Network Timeout** | Exponential backoff retry | ✔ |
| **Unexpected exception** | Log trace and alert Administrator | ✖ |

---

## 11. Infrastructure, Deployment & CI/CD Guide

### 11.1 Environment Strategy
* **Development:** Internal feature development and developer sandbox.
* **Test:** Functional, integration, and regression testing by QA Team.
* **UAT (User Acceptance Testing):** Business validation and sign-off by Business Stakeholders.
* **Production:** High-availability live operations for all enterprise users.

### 11.2 CI/CD Pipeline Flow
```
Source Control (Git)
   └──> Build Stage
         └──> Static Code Analysis (SonarQube)
               └──> Unit Tests Execution
                     └──> Artifact Packaging
                           └──> Deploy to Test Environment
                                 └──> Deploy to UAT Environment
                                       └──> Approval Gate
                                             └──> Deploy to Production
```

### 11.3 Backup, Recovery & Disaster Runbook
* **Full Database Backup:** Executed daily.
* **Transaction Log Backup:** Executed hourly.
* **Backup Retention & Restore Testing:** Automated retention policy with regular automated restore verification tests.
* **Release & Rollback:** Versioned releases, pre-deployment validation, post-deployment smoke tests, and automated rollback scripts to restore previous stable versions.

---

## 12. Test Strategy & Test Cases Specification

### 12.1 Test Levels & Responsibilities
* **Unit Testing:** Developers
* **Integration Testing:** Developers & QA
* **System & Regression Testing:** QA Team
* **User Acceptance Testing (UAT):** Business Users
* **Performance & Load Testing:** Performance Testing Team
* **Security & Penetration Testing:** Security Audit Team

### 12.2 Sample Functional Test Cases Matrix
| TC ID | Test Scenario | Expected Result | Priority | Status |
| :--- | :--- | :--- | :---: | :---: |
| **TC-001** | Create Project | Project created successfully in Draft state | High | Draft |
| **TC-002** | Assign Task | Task assigned to employee with notification | High | Draft |
| **TC-003** | Submit Task for Review | Status changes to Ready for Review; Reviewer notified | High | Draft |
| **TC-004** | Approve Task | Task marked Completed; project progress recalculated | High | Draft |
| **TC-005** | Reject Task | Status updates to Changes Required with comments | High | Draft |
| **TC-006** | Upload Attachment | File validated & stored successfully | Medium | Draft |
| **TC-007** | User Login | Authorised access granted with valid JWT token | Critical | Draft |
| **TC-008** | Export Report | PDF/Excel report generated & downloaded | Medium | Draft |

### 12.3 Defect Lifecycle Flow
`New` ➔ `Assigned` ➔ `In Progress` ➔ `Fixed` ➔ `Retest` ➔ `Closed` (or `Reopened`)

---

## 13. Technical Design Document (TDD)

### 13.1 Recommended Technology Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript, Material UI (MUI) |
| **Backend API** | ASP.NET Core Web API (.NET 9) |
| **Auth** | Microsoft Entra ID / JWT Bearer Tokens |
| **Database** | Microsoft SQL Server |
| **ORM** | Entity Framework Core (EF Core) |
| **File Storage** | Azure Blob Storage or SharePoint |
| **Hosting** | Azure App Service / IIS, Azure SQL Database |

---

## 14. Database Design & Data Dictionary

### 14.1 Logical ERD Relationships
* `Department (1)` ─── `(*) Employee`
* `Role (1)` ─── `(*) Employee`
* `Project (1)` ─── `(*) Milestone`
* `Project (1)` ─── `(*) Task`
* `Milestone (1)` ─── `(*) Task`
* `Task (1)` ─── `(*) Subtask`
* `Task (1)` ─── `(*) Comment`
* `Task (1)` ─── `(*) Attachment`
* `Task (1)` ─── `(1) Review`
* `Employee (1)` ─── `(*) Task (Assignee)`
* `Employee (1)` ─── `(*) Task (Creator)`
* `Employee (1)` ─── `(*) Review (Reviewer)`
* `Task (1)` ─── `(*) AuditLog`

### 14.2 Core Data Dictionary
* **Employee:** `EmployeeID` (PK), `DepartmentID` (FK), `RoleID` (FK), `FirstName`, `LastName`, `Email`.
* **Project:** `ProjectID` (PK), `ProjectName` (Unique), `ProjectManagerID` (FK), `StartDate`, `EndDate`, `Status`.
* **Task:** `TaskID` (PK), `ProjectID` (FK, Nullable), `MilestoneID` (FK, Nullable), `AssignedTo` (FK, Mandatory), `ReviewerID` (FK, Mandatory), `Title`, `Priority`, `Status`, `DueDate`.
* **Subtask:** `SubtaskID` (PK), `TaskID` (FK), `Title`, `IsCompleted`.
* **Review:** `ReviewID` (PK), `TaskID` (FK), `ReviewerID` (FK), `Status`, `Comments`, `ReviewedDate`.
* **AuditLog:** `AuditID` (PK), `EntityName`, `EntityID`, `Action`, `ChangedBy`, `Timestamp`.

---

## 15. REST API Specification

### 15.1 Endpoints Overview (`/api/v1`)
* `POST /api/v1/auth/login` - User Authentication
* `POST /api/v1/auth/logout` - Logout Session
* `GET /api/v1/projects` - List Projects
* `POST /api/v1/projects` - Create Project
* `GET /api/v1/tasks` - List Tasks
* `POST /api/v1/tasks` - Create Task
* `POST /api/v1/tasks/{id}/submit-review` - Submit Task for Review
* `POST /api/v1/tasks/{id}/approve` - Approve Task (Reviewer)
* `POST /api/v1/tasks/{id}/reject` - Request Changes (Reviewer)

---

## 16. Future Enhancements Roadmap
1. AI Task Recommendations & Workload Balancing
2. OCR Document Extraction
3. Microsoft Outlook & Teams Chatbot Integration
4. Jira & ServiceNow Integration
5. Time Tracking & SLA Management
6. Recurring Projects and Tasks
7. Risk & Issue Register
8. Budget Tracking & Mobile Native App
