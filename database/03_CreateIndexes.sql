USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Filtered Unique Indexes (Active non-deleted rows)
CREATE UNIQUE NONCLUSTERED INDEX [UQ_Department_DepartmentName]
ON [dbo].[Department] ([DepartmentName] ASC) WHERE [IsDeleted] = 0;

CREATE UNIQUE NONCLUSTERED INDEX [UQ_Role_RoleName]
ON [dbo].[Role] ([RoleName] ASC) WHERE [IsDeleted] = 0;

CREATE UNIQUE NONCLUSTERED INDEX [UQ_Employee_Email]
ON [dbo].[Employee] ([Email] ASC) WHERE [IsDeleted] = 0;

CREATE UNIQUE NONCLUSTERED INDEX [UQ_Project_ProjectName]
ON [dbo].[Project] ([ProjectName] ASC) WHERE [IsDeleted] = 0;

CREATE UNIQUE NONCLUSTERED INDEX [UQ_ProjectMember_Project_Employee]
ON [dbo].[ProjectMember] ([ProjectID] ASC, [EmployeeID] ASC) WHERE [IsDeleted] = 0;

-- Review Iteration Index
CREATE UNIQUE NONCLUSTERED INDEX [UQ_Review_TaskID_Iteration]
ON [dbo].[Review] ([TaskID] ASC, [Iteration] DESC) WHERE [IsDeleted] = 0;

-- Performance Indexes for Dashboard KPIs & Background Jobs
CREATE NONCLUSTERED INDEX [IX_Task_Status_AssignedTo]
ON [dbo].[Task] ([Status] ASC, [AssignedTo] ASC)
INCLUDE ([Title], [Priority], [DueDate], [ProgressPercentage], [ProjectID])
WHERE [IsDeleted] = 0;

CREATE NONCLUSTERED INDEX [IX_Task_ReviewerID_Status]
ON [dbo].[Task] ([ReviewerID] ASC, [Status] ASC)
INCLUDE ([Title], [Priority], [DueDate], [AssignedTo], [ProjectID])
WHERE [IsDeleted] = 0;

CREATE NONCLUSTERED INDEX [IX_Task_ProjectID_Status]
ON [dbo].[Task] ([ProjectID] ASC, [Status] ASC)
INCLUDE ([Title], [AssignedTo], [ReviewerID], [DueDate], [ProgressPercentage])
WHERE [IsDeleted] = 0;

-- Overdue Tasks Background Job & Alert Scanner
CREATE NONCLUSTERED INDEX [IX_Task_DueDate_Status]
ON [dbo].[Task] ([DueDate] ASC, [Status] ASC)
INCLUDE ([TaskID], [Title], [AssignedTo], [ReviewerID], [ProjectID])
WHERE [IsDeleted] = 0 AND [Status] IN (N'Created', N'Assigned', N'In Progress', N'Ready for Review', N'Under Review', N'Changes Required');

CREATE NONCLUSTERED INDEX [IX_Milestone_ProjectID_Status]
ON [dbo].[Milestone] ([ProjectID] ASC, [Status] ASC)
INCLUDE ([MilestoneTitle], [DueDate])
WHERE [IsDeleted] = 0;

CREATE NONCLUSTERED INDEX [IX_Project_ProjectManagerID_Status]
ON [dbo].[Project] ([ProjectManagerID] ASC, [Status] ASC)
INCLUDE ([ProjectName], [StartDate], [EndDate], [ProgressPercentage])
WHERE [IsDeleted] = 0;

CREATE NONCLUSTERED INDEX [IX_Notification_RecipientID_IsRead]
ON [dbo].[Notification] ([RecipientID] ASC, [IsRead] ASC, [CreatedDate] DESC)
INCLUDE ([NotificationType], [Message], [TaskID], [ProjectID])
WHERE [IsDeleted] = 0;

CREATE NONCLUSTERED INDEX [IX_AuditLog_EntityName_EntityID]
ON [dbo].[AuditLog] ([EntityName] ASC, [EntityID] ASC, [CreatedDate] DESC)
INCLUDE ([Action], [ChangedBy], [IPAddress]);

CREATE NONCLUSTERED INDEX [IX_AuditLog_ChangedBy_CreatedDate]
ON [dbo].[AuditLog] ([ChangedBy] ASC, [CreatedDate] DESC)
INCLUDE ([EntityName], [EntityID], [Action], [IPAddress]);
GO
