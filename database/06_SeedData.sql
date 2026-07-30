USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- EPTMS Database Schema - Phase 5: Seed Data Script
-- Description: Idempotent production-ready seed data for EPTMS_DB.
--              Populates master data and bcrypt password hashes (Password123!)
-- ============================================================================

BEGIN TRY
    BEGIN TRANSACTION;

    -- Valid bcrypt hash for default test password 'Password123!' generated using bcryptjs (cost factor 10)
    DECLARE @DefaultPasswordHash NVARCHAR(255) = N'$2a$10$XlRISk4D5n86xdSbb6gSlO7YRcICA9QwenfdVomgFOAhainv3mgWG';

    -- ----------------------------------------------------------------------------
    -- 1. Seed Departments
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Department WHERE DepartmentName = N'Executive Management')
        INSERT INTO dbo.Department (DepartmentName, Description) VALUES (N'Executive Management', N'Executive leadership and business policy governance');

    IF NOT EXISTS (SELECT 1 FROM dbo.Department WHERE DepartmentName = N'Software Engineering')
        INSERT INTO dbo.Department (DepartmentName, Description) VALUES (N'Software Engineering', N'Application development, architecture, and engineering');

    IF NOT EXISTS (SELECT 1 FROM dbo.Department WHERE DepartmentName = N'Quality Assurance')
        INSERT INTO dbo.Department (DepartmentName, Description) VALUES (N'Quality Assurance', N'Software testing, quality auditing, and compliance');

    IF NOT EXISTS (SELECT 1 FROM dbo.Department WHERE DepartmentName = N'Product Management')
        INSERT INTO dbo.Department (DepartmentName, Description) VALUES (N'Product Management', N'Product roadmap, project delivery, and business requirements');

    IF NOT EXISTS (SELECT 1 FROM dbo.Department WHERE DepartmentName = N'Human Resources')
        INSERT INTO dbo.Department (DepartmentName, Description) VALUES (N'Human Resources', N'Personnel management and organization planning');

    -- Capture Department IDs
    DECLARE @ExecDeptID INT = (SELECT DepartmentID FROM dbo.Department WHERE DepartmentName = N'Executive Management');
    DECLARE @EngDeptID  INT = (SELECT DepartmentID FROM dbo.Department WHERE DepartmentName = N'Software Engineering');
    DECLARE @QADeptID   INT = (SELECT DepartmentID FROM dbo.Department WHERE DepartmentName = N'Quality Assurance');
    DECLARE @PMDeptID   INT = (SELECT DepartmentID FROM dbo.Department WHERE DepartmentName = N'Product Management');

    -- ----------------------------------------------------------------------------
    -- 2. Seed Roles
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Role WHERE RoleName = N'Administrator')
        INSERT INTO dbo.Role (RoleName, Description, Permissions) VALUES (N'Administrator', N'System Administrator with full permissions', N'{"all": true}');

    IF NOT EXISTS (SELECT 1 FROM dbo.Role WHERE RoleName = N'Project Manager')
        INSERT INTO dbo.Role (RoleName, Description, Permissions) VALUES (N'Project Manager', N'Project Manager with project creation and workflow oversight permissions', N'{"project_manage": true, "task_create": true}');

    IF NOT EXISTS (SELECT 1 FROM dbo.Role WHERE RoleName = N'Employee')
        INSERT INTO dbo.Role (RoleName, Description, Permissions) VALUES (N'Employee', N'Standard Employee responsible for executing assigned work items', N'{"task_execute": true, "task_create": true}');

    IF NOT EXISTS (SELECT 1 FROM dbo.Role WHERE RoleName = N'Reviewer')
        INSERT INTO dbo.Role (RoleName, Description, Permissions) VALUES (N'Reviewer', N'Reviewer responsible for evaluating, approving, or requesting task changes', N'{"task_review": true, "task_approve": true}');

    -- Capture Role IDs
    DECLARE @AdminRoleID INT = (SELECT RoleID FROM dbo.Role WHERE RoleName = N'Administrator');
    DECLARE @PMRoleID    INT = (SELECT RoleID FROM dbo.Role WHERE RoleName = N'Project Manager');
    DECLARE @EmpRoleID   INT = (SELECT RoleID FROM dbo.Role WHERE RoleName = N'Employee');
    DECLARE @RevRoleID   INT = (SELECT RoleID FROM dbo.Role WHERE RoleName = N'Reviewer');

    -- ----------------------------------------------------------------------------
    -- 3. Seed Master Employees (Users with Valid Bcrypt Password Hash)
    -- ----------------------------------------------------------------------------
    -- 3.1 Initial Administrator User
    IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE Email = N'admin@eptms.com')
        INSERT INTO dbo.Employee (DepartmentID, RoleID, FirstName, LastName, Email, Phone, PasswordHash, Status)
        VALUES (@ExecDeptID, @AdminRoleID, N'System', N'Administrator', N'admin@eptms.com', N'+1-555-0100', @DefaultPasswordHash, N'Active');
    ELSE
        UPDATE dbo.Employee SET PasswordHash = @DefaultPasswordHash WHERE Email = N'admin@eptms.com' AND (PasswordHash IS NULL OR PasswordHash <> @DefaultPasswordHash);

    -- 3.2 Project Manager User
    IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE Email = N's.connor@eptms.com')
        INSERT INTO dbo.Employee (DepartmentID, RoleID, FirstName, LastName, Email, Phone, PasswordHash, Status)
        VALUES (@PMDeptID, @PMRoleID, N'Sarah', N'Connor', N's.connor@eptms.com', N'+1-555-0101', @DefaultPasswordHash, N'Active');
    ELSE
        UPDATE dbo.Employee SET PasswordHash = @DefaultPasswordHash WHERE Email = N's.connor@eptms.com' AND (PasswordHash IS NULL OR PasswordHash <> @DefaultPasswordHash);

    -- 3.3 Senior Developer (Employee)
    IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE Email = N'a.rivera@eptms.com')
        INSERT INTO dbo.Employee (DepartmentID, RoleID, FirstName, LastName, Email, Phone, PasswordHash, Status)
        VALUES (@EngDeptID, @EmpRoleID, N'Alex', N'Rivera', N'a.rivera@eptms.com', N'+1-555-0102', @DefaultPasswordHash, N'Active');
    ELSE
        UPDATE dbo.Employee SET PasswordHash = @DefaultPasswordHash WHERE Email = N'a.rivera@eptms.com' AND (PasswordHash IS NULL OR PasswordHash <> @DefaultPasswordHash);

    -- 3.4 Lead Reviewer
    IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE Email = N'd.miller@eptms.com')
        INSERT INTO dbo.Employee (DepartmentID, RoleID, FirstName, LastName, Email, Phone, PasswordHash, Status)
        VALUES (@QADeptID, @RevRoleID, N'David', N'Miller', N'd.miller@eptms.com', N'+1-555-0103', @DefaultPasswordHash, N'Active');
    ELSE
        UPDATE dbo.Employee SET PasswordHash = @DefaultPasswordHash WHERE Email = N'd.miller@eptms.com' AND (PasswordHash IS NULL OR PasswordHash <> @DefaultPasswordHash);

    -- 3.5 Frontend Developer (Employee)
    IF NOT EXISTS (SELECT 1 FROM dbo.Employee WHERE Email = N'e.davis@eptms.com')
        INSERT INTO dbo.Employee (DepartmentID, RoleID, FirstName, LastName, Email, Phone, PasswordHash, Status)
        VALUES (@EngDeptID, @EmpRoleID, N'Emily', N'Davis', N'e.davis@eptms.com', N'+1-555-0104', @DefaultPasswordHash, N'Active');
    ELSE
        UPDATE dbo.Employee SET PasswordHash = @DefaultPasswordHash WHERE Email = N'e.davis@eptms.com' AND (PasswordHash IS NULL OR PasswordHash <> @DefaultPasswordHash);

    -- Capture Employee IDs
    DECLARE @AdminUserID INT = (SELECT EmployeeID FROM dbo.Employee WHERE Email = N'admin@eptms.com');
    DECLARE @PMUserID    INT = (SELECT EmployeeID FROM dbo.Employee WHERE Email = N's.connor@eptms.com');
    DECLARE @Dev1UserID  INT = (SELECT EmployeeID FROM dbo.Employee WHERE Email = N'a.rivera@eptms.com');
    DECLARE @RevUserID   INT = (SELECT EmployeeID FROM dbo.Employee WHERE Email = N'd.miller@eptms.com');
    DECLARE @Dev2UserID  INT = (SELECT EmployeeID FROM dbo.Employee WHERE Email = N'e.davis@eptms.com');

    -- Update Audit Header CreatedBy references for bootstrap master tables
    UPDATE dbo.Department SET CreatedBy = @AdminUserID WHERE CreatedBy IS NULL;
    UPDATE dbo.Role       SET CreatedBy = @AdminUserID WHERE CreatedBy IS NULL;
    UPDATE dbo.Employee   SET CreatedBy = @AdminUserID WHERE CreatedBy IS NULL;

    -- ----------------------------------------------------------------------------
    -- 4. Seed Sample Project
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Project WHERE ProjectName = N'Enterprise EPTMS Deployment v1.0')
        INSERT INTO dbo.Project (ProjectName, Description, ProjectManagerID, StartDate, EndDate, Status, ProgressPercentage, CreatedBy)
        VALUES (
            N'Enterprise EPTMS Deployment v1.0',
            N'Implementation and rollout of the Employee Project & Task Management System across all departments.',
            @PMUserID,
            CAST(GETUTCDATE() AS DATE),
            DATEADD(MONTH, 6, CAST(GETUTCDATE() AS DATE)),
            N'Active',
            25.00,
            @PMUserID
        );

    DECLARE @ProjectID INT = (SELECT ProjectID FROM dbo.Project WHERE ProjectName = N'Enterprise EPTMS Deployment v1.0');

    -- ----------------------------------------------------------------------------
    -- 5. Seed Project Members
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.ProjectMember WHERE ProjectID = @ProjectID AND EmployeeID = @PMUserID)
        INSERT INTO dbo.ProjectMember (ProjectID, EmployeeID, RoleInProject, CreatedBy) VALUES (@ProjectID, @PMUserID, N'Project Manager', @AdminUserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.ProjectMember WHERE ProjectID = @ProjectID AND EmployeeID = @Dev1UserID)
        INSERT INTO dbo.ProjectMember (ProjectID, EmployeeID, RoleInProject, CreatedBy) VALUES (@ProjectID, @Dev1UserID, N'Backend Lead Developer', @PMUserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.ProjectMember WHERE ProjectID = @ProjectID AND EmployeeID = @RevUserID)
        INSERT INTO dbo.ProjectMember (ProjectID, EmployeeID, RoleInProject, CreatedBy) VALUES (@ProjectID, @RevUserID, N'QA Lead / Reviewer', @PMUserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.ProjectMember WHERE ProjectID = @ProjectID AND EmployeeID = @Dev2UserID)
        INSERT INTO dbo.ProjectMember (ProjectID, EmployeeID, RoleInProject, CreatedBy) VALUES (@ProjectID, @Dev2UserID, N'Frontend Developer', @PMUserID);

    -- ----------------------------------------------------------------------------
    -- 6. Seed Milestones
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Milestone WHERE ProjectID = @ProjectID AND MilestoneTitle = N'Phase 1 - Database & Core Architecture')
        INSERT INTO dbo.Milestone (ProjectID, MilestoneTitle, Description, DueDate, Status, CreatedBy)
        VALUES (@ProjectID, N'Phase 1 - Database & Core Architecture', N'Database DDL, indexing, audit procedures, and backend structure setup.', DATEADD(MONTH, 1, CAST(GETUTCDATE() AS DATE)), N'In Progress', @PMUserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Milestone WHERE ProjectID = @ProjectID AND MilestoneTitle = N'Phase 2 - UI Dashboard Integration')
        INSERT INTO dbo.Milestone (ProjectID, MilestoneTitle, Description, DueDate, Status, CreatedBy)
        VALUES (@ProjectID, N'Phase 2 - UI Dashboard Integration', N'React frontend, dashboard widget creation, and user workflow integration.', DATEADD(MONTH, 3, CAST(GETUTCDATE() AS DATE)), N'Not Started', @PMUserID);

    DECLARE @Milestone1ID INT = (SELECT MilestoneID FROM dbo.Milestone WHERE ProjectID = @ProjectID AND MilestoneTitle = N'Phase 1 - Database & Core Architecture');
    DECLARE @Milestone2ID INT = (SELECT MilestoneID FROM dbo.Milestone WHERE ProjectID = @ProjectID AND MilestoneTitle = N'Phase 2 - UI Dashboard Integration');

    -- ----------------------------------------------------------------------------
    -- 7. Seed Sample Tasks (Project-Linked & Standalone)
    -- ----------------------------------------------------------------------------
    -- Task 1: Completed Task (Project-linked)
    IF NOT EXISTS (SELECT 1 FROM dbo.Task WHERE Title = N'Setup SQL Server Schema & Seed Scripts')
        INSERT INTO dbo.Task (ProjectID, MilestoneID, Title, Description, Priority, Status, StartDate, DueDate, CompletedDate, ProgressPercentage, AssignedTo, ReviewerID, CreatedBy)
        VALUES (
            @ProjectID, @Milestone1ID,
            N'Setup SQL Server Schema & Seed Scripts',
            N'Design and execute T-SQL DDL for tables, constraints, indexes, views, and seed data.',
            N'High', N'Completed',
            CAST(GETUTCDATE() AS DATE), DATEADD(DAY, 7, CAST(GETUTCDATE() AS DATE)), CAST(GETUTCDATE() AS DATE),
            100.00, @Dev1UserID, @RevUserID, @PMUserID
        );

    -- Task 2: Under Review Task (Project-linked)
    IF NOT EXISTS (SELECT 1 FROM dbo.Task WHERE Title = N'Implement REST API Authentication Service')
        INSERT INTO dbo.Task (ProjectID, MilestoneID, Title, Description, Priority, Status, StartDate, DueDate, ProgressPercentage, AssignedTo, ReviewerID, CreatedBy)
        VALUES (
            @ProjectID, @Milestone1ID,
            N'Implement REST API Authentication Service',
            N'Develop JWT authentication and Entra ID SSO integration service endpoints.',
            N'Critical', N'Under Review',
            CAST(GETUTCDATE() AS DATE), DATEADD(DAY, 14, CAST(GETUTCDATE() AS DATE)),
            100.00, @Dev1UserID, @RevUserID, @PMUserID
        );

    -- Task 3: In Progress Task (Project-linked)
    IF NOT EXISTS (SELECT 1 FROM dbo.Task WHERE Title = N'Design React Task Management UI Component')
        INSERT INTO dbo.Task (ProjectID, MilestoneID, Title, Description, Priority, Status, StartDate, DueDate, ProgressPercentage, AssignedTo, ReviewerID, CreatedBy)
        VALUES (
            @ProjectID, @Milestone2ID,
            N'Design React Task Management UI Component',
            N'Build interactive dashboard cards and review queue UI interface using React and Material UI.',
            N'Medium', N'In Progress',
            CAST(GETUTCDATE() AS DATE), DATEADD(DAY, 21, CAST(GETUTCDATE() AS DATE)),
            50.00, @Dev2UserID, @RevUserID, @PMUserID
        );

    -- Task 4: Standalone Task (No Project)
    IF NOT EXISTS (SELECT 1 FROM dbo.Task WHERE Title = N'Conduct Quarterly Security & Compliance Audit')
        INSERT INTO dbo.Task (ProjectID, MilestoneID, Title, Description, Priority, Status, StartDate, DueDate, ProgressPercentage, AssignedTo, ReviewerID, CreatedBy)
        VALUES (
            NULL, NULL,
            N'Conduct Quarterly Security & Compliance Audit',
            N'Verify system permission matrix, JWT expiration timers, and audit logging compliance.',
            N'High', N'Assigned',
            CAST(GETUTCDATE() AS DATE), DATEADD(DAY, 10, CAST(GETUTCDATE() AS DATE)),
            0.00, @Dev1UserID, @RevUserID, @AdminUserID
        );

    DECLARE @Task1ID INT = (SELECT TaskID FROM dbo.Task WHERE Title = N'Setup SQL Server Schema & Seed Scripts');
    DECLARE @Task2ID INT = (SELECT TaskID FROM dbo.Task WHERE Title = N'Implement REST API Authentication Service');
    DECLARE @Task3ID INT = (SELECT TaskID FROM dbo.Task WHERE Title = N'Design React Task Management UI Component');

    -- ----------------------------------------------------------------------------
    -- 8. Seed Subtasks
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Subtask WHERE TaskID = @Task1ID AND Title = N'Execute DDL scripts on SQL Server')
        INSERT INTO dbo.Subtask (TaskID, Title, IsCompleted, CompletedDate, CreatedBy) VALUES (@Task1ID, N'Execute DDL scripts on SQL Server', 1, SYSUTCDATETIME(), @Dev1UserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Subtask WHERE TaskID = @Task1ID AND Title = N'Verify indexes and constraint performance')
        INSERT INTO dbo.Subtask (TaskID, Title, IsCompleted, CompletedDate, CreatedBy) VALUES (@Task1ID, N'Verify indexes and constraint performance', 1, SYSUTCDATETIME(), @Dev1UserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Subtask WHERE TaskID = @Task2ID AND Title = N'Build JWT Bearer token middleware')
        INSERT INTO dbo.Subtask (TaskID, Title, IsCompleted, CompletedDate, CreatedBy) VALUES (@Task2ID, N'Build JWT Bearer token middleware', 1, SYSUTCDATETIME(), @Dev1UserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Subtask WHERE TaskID = @Task2ID AND Title = N'Add Entra ID OAuth 2.0 endpoint binding')
        INSERT INTO dbo.Subtask (TaskID, Title, IsCompleted, CompletedDate, CreatedBy) VALUES (@Task2ID, N'Add Entra ID OAuth 2.0 endpoint binding', 1, SYSUTCDATETIME(), @Dev1UserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Subtask WHERE TaskID = @Task3ID AND Title = N'Create Review Queue table view')
        INSERT INTO dbo.Subtask (TaskID, Title, IsCompleted, CompletedDate, CreatedBy) VALUES (@Task3ID, N'Create Review Queue table view', 1, SYSUTCDATETIME(), @Dev2UserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Subtask WHERE TaskID = @Task3ID AND Title = N'Add progress bar animation')
        INSERT INTO dbo.Subtask (TaskID, Title, IsCompleted, CompletedDate, CreatedBy) VALUES (@Task3ID, N'Add progress bar animation', 0, NULL, @Dev2UserID);

    -- ----------------------------------------------------------------------------
    -- 9. Seed Review Records (Iteration Aware)
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Review WHERE TaskID = @Task1ID AND Iteration = 1)
        INSERT INTO dbo.Review (TaskID, ReviewerID, Iteration, Status, Comments, CreatedBy)
        VALUES (@Task1ID, @RevUserID, 1, N'Approved', N'Schema, indexes, views, and procedures verified against business requirements. Task approved.', @RevUserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Review WHERE TaskID = @Task2ID AND Iteration = 1)
        INSERT INTO dbo.Review (TaskID, ReviewerID, Iteration, Status, Comments, CreatedBy)
        VALUES (@Task2ID, @RevUserID, 1, N'Approved', N'Auth service code review complete. JWT validation and claims mapping verified.', @RevUserID);

    -- ----------------------------------------------------------------------------
    -- 10. Seed Comments & Attachments
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Comment WHERE TaskID = @Task2ID AND EmployeeID = @Dev1UserID)
        INSERT INTO dbo.Comment (TaskID, EmployeeID, CommentText, CreatedBy)
        VALUES (@Task2ID, @Dev1UserID, N'JWT authentication and Entra ID endpoints are implemented and ready for review queue evaluation.', @Dev1UserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Comment WHERE TaskID = @Task2ID AND EmployeeID = @RevUserID)
        INSERT INTO dbo.Comment (TaskID, EmployeeID, CommentText, CreatedBy)
        VALUES (@Task2ID, @RevUserID, N'Starting review of JWT middleware and authorization filters.', @RevUserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Attachment WHERE TaskID = @Task1ID AND FileName = N'EPTMS_Database_Architecture.pdf')
        INSERT INTO dbo.Attachment (TaskID, UploadedBy, FileName, FilePath, FileSize, FileType, CreatedBy)
        VALUES (@Task1ID, @Dev1UserID, N'EPTMS_Database_Architecture.pdf', N'/uploads/docs/EPTMS_Database_Architecture.pdf', 2450112, N'application/pdf', @Dev1UserID);

    -- ----------------------------------------------------------------------------
    -- 11. Seed Notifications & Audit Logs
    -- ----------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM dbo.Notification WHERE RecipientID = @Dev1UserID AND NotificationType = N'Task_Assigned')
        INSERT INTO dbo.Notification (RecipientID, TriggeredByID, TaskID, ProjectID, NotificationType, Message, DeliveryChannel, IsRead, CreatedBy)
        VALUES (@Dev1UserID, @PMUserID, @Task1ID, @ProjectID, N'Task_Assigned', N'You have been assigned to task: Setup SQL Server Schema & Seed Scripts', N'In-App', 1, @PMUserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.Notification WHERE RecipientID = @RevUserID AND NotificationType = N'Review_Requested')
        INSERT INTO dbo.Notification (RecipientID, TriggeredByID, TaskID, ProjectID, NotificationType, Message, DeliveryChannel, IsRead, CreatedBy)
        VALUES (@RevUserID, @Dev1UserID, @Task2ID, @ProjectID, N'Review_Requested', N'Task submitted for review: Implement REST API Authentication Service', N'In-App', 0, @Dev1UserID);

    IF NOT EXISTS (SELECT 1 FROM dbo.AuditLog WHERE EntityName = N'Project' AND EntityID = @ProjectID)
        INSERT INTO dbo.AuditLog (EntityName, EntityID, Action, ChangedBy, OldValues, NewValues, IPAddress)
        VALUES (N'Project', @ProjectID, N'CREATE', @PMUserID, NULL, N'{"ProjectName": "Enterprise EPTMS Deployment v1.0", "Status": "Active"}', N'127.0.0.1');

    -- Trigger stored procedures to ensure calculated project and task progress percentages match seeded items
    EXEC dbo.sp_RecalculateTaskProgress @TaskID = @Task3ID;
    EXEC dbo.sp_RecalculateProjectProgress @ProjectID = @ProjectID;

    COMMIT TRANSACTION;
    PRINT N'EPTMS_DB Seed Script Executed Successfully with Password Hashes!';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
