USE [EPTMS_DB];
GO

-- Employee FKs
ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [FK_Employee_Department]
    FOREIGN KEY ([DepartmentID]) REFERENCES [dbo].[Department] ([DepartmentID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Employee] ADD CONSTRAINT [FK_Employee_Role]
    FOREIGN KEY ([RoleID]) REFERENCES [dbo].[Role] ([RoleID]) ON DELETE NO ACTION;

-- Project FKs
ALTER TABLE [dbo].[Project] ADD CONSTRAINT [FK_Project_Employee_ProjectManager]
    FOREIGN KEY ([ProjectManagerID]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

-- ProjectMember FKs
ALTER TABLE [dbo].[ProjectMember] ADD CONSTRAINT [FK_ProjectMember_Project]
    FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project] ([ProjectID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[ProjectMember] ADD CONSTRAINT [FK_ProjectMember_Employee]
    FOREIGN KEY ([EmployeeID]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

-- Milestone FKs
ALTER TABLE [dbo].[Milestone] ADD CONSTRAINT [FK_Milestone_Project]
    FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project] ([ProjectID]) ON DELETE NO ACTION;

-- Task FKs
ALTER TABLE [dbo].[Task] ADD CONSTRAINT [FK_Task_Project]
    FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project] ([ProjectID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Task] ADD CONSTRAINT [FK_Task_Milestone]
    FOREIGN KEY ([MilestoneID]) REFERENCES [dbo].[Milestone] ([MilestoneID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Task] ADD CONSTRAINT [FK_Task_Employee_AssignedTo]
    FOREIGN KEY ([AssignedTo]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Task] ADD CONSTRAINT [FK_Task_Employee_Reviewer]
    FOREIGN KEY ([ReviewerID]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Task] ADD CONSTRAINT [FK_Task_Employee_CreatedBy]
    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

-- Subtask FKs
ALTER TABLE [dbo].[Subtask] ADD CONSTRAINT [FK_Subtask_Task]
    FOREIGN KEY ([TaskID]) REFERENCES [dbo].[Task] ([TaskID]) ON DELETE NO ACTION;

-- Review FKs
ALTER TABLE [dbo].[Review] ADD CONSTRAINT [FK_Review_Task]
    FOREIGN KEY ([TaskID]) REFERENCES [dbo].[Task] ([TaskID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Review] ADD CONSTRAINT [FK_Review_Employee_Reviewer]
    FOREIGN KEY ([ReviewerID]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

-- Comment FKs
ALTER TABLE [dbo].[Comment] ADD CONSTRAINT [FK_Comment_Task]
    FOREIGN KEY ([TaskID]) REFERENCES [dbo].[Task] ([TaskID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Comment] ADD CONSTRAINT [FK_Comment_Employee]
    FOREIGN KEY ([EmployeeID]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

-- Attachment FKs
ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [FK_Attachment_Task]
    FOREIGN KEY ([TaskID]) REFERENCES [dbo].[Task] ([TaskID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Attachment] ADD CONSTRAINT [FK_Attachment_Employee_UploadedBy]
    FOREIGN KEY ([UploadedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

-- Notification FKs
ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [FK_Notification_Employee_Recipient]
    FOREIGN KEY ([RecipientID]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [FK_Notification_Employee_TriggeredBy]
    FOREIGN KEY ([TriggeredByID]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [FK_Notification_Task]
    FOREIGN KEY ([TaskID]) REFERENCES [dbo].[Task] ([TaskID]) ON DELETE NO ACTION;

ALTER TABLE [dbo].[Notification] ADD CONSTRAINT [FK_Notification_Project]
    FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project] ([ProjectID]) ON DELETE NO ACTION;

-- AuditLog FK
ALTER TABLE [dbo].[AuditLog] ADD CONSTRAINT [FK_AuditLog_Employee_ChangedBy]
    FOREIGN KEY ([ChangedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]) ON DELETE NO ACTION;

-- Audit Header FKs (CreatedBy references Employee)
ALTER TABLE [dbo].[Department]    ADD CONSTRAINT [FK_Department_Employee_CreatedBy]    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Role]          ADD CONSTRAINT [FK_Role_Employee_CreatedBy]          FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Employee]      ADD CONSTRAINT [FK_Employee_Employee_CreatedBy]      FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Project]       ADD CONSTRAINT [FK_Project_Employee_CreatedBy]       FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[ProjectMember] ADD CONSTRAINT [FK_ProjectMember_Employee_CreatedBy]    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Milestone]     ADD CONSTRAINT [FK_Milestone_Employee_CreatedBy]     FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Subtask]       ADD CONSTRAINT [FK_Subtask_Employee_CreatedBy]       FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Review]        ADD CONSTRAINT [FK_Review_Employee_CreatedBy]        FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Comment]       ADD CONSTRAINT [FK_Comment_Employee_CreatedBy]       FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Attachment]    ADD CONSTRAINT [FK_Attachment_Employee_CreatedBy]    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
ALTER TABLE [dbo].[Notification]  ADD CONSTRAINT [FK_Notification_Employee_CreatedBy]    FOREIGN KEY ([CreatedBy]) REFERENCES [dbo].[Employee] ([EmployeeID]);
GO
