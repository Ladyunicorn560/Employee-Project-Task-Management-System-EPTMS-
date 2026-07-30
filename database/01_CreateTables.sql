USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Table: dbo.Department
IF OBJECT_ID(N'dbo.Department', N'U') IS NOT NULL DROP TABLE dbo.Department;
GO

CREATE TABLE [dbo].[Department] (
    [DepartmentID]     INT IDENTITY(1, 1) NOT NULL,
    [DepartmentName]   NVARCHAR(150)      NOT NULL,
    [Description]      NVARCHAR(MAX)      NULL,
    [IsDeleted]        BIT                NOT NULL CONSTRAINT [DF_Department_IsDeleted] DEFAULT (0),
    [CreatedBy]        INT                NULL,
    [CreatedDate]      DATETIME2(7)       NOT NULL CONSTRAINT [DF_Department_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]        INT                NULL,
    [UpdatedDate]      DATETIME2(7)       NULL,
    [DeletedBy]        INT                NULL,
    [DeletedDate]      DATETIME2(7)       NULL,

    CONSTRAINT [PK_Department] PRIMARY KEY CLUSTERED ([DepartmentID] ASC),
    CONSTRAINT [CK_Department_DepartmentName_NotBlank] CHECK (LEN(LTRIM(RTRIM([DepartmentName]))) > 0)
);
GO

-- 2. Table: dbo.Role
IF OBJECT_ID(N'dbo.Role', N'U') IS NOT NULL DROP TABLE dbo.Role;
GO

CREATE TABLE [dbo].[Role] (
    [RoleID]           INT IDENTITY(1, 1) NOT NULL,
    [RoleName]         NVARCHAR(100)      NOT NULL,
    [Description]      NVARCHAR(MAX)      NULL,
    [Permissions]      NVARCHAR(MAX)      NULL,
    [IsDeleted]        BIT                NOT NULL CONSTRAINT [DF_Role_IsDeleted] DEFAULT (0),
    [CreatedBy]        INT                NULL,
    [CreatedDate]      DATETIME2(7)       NOT NULL CONSTRAINT [DF_Role_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]        INT                NULL,
    [UpdatedDate]      DATETIME2(7)       NULL,
    [DeletedBy]        INT                NULL,
    [DeletedDate]      DATETIME2(7)       NULL,

    CONSTRAINT [PK_Role] PRIMARY KEY CLUSTERED ([RoleID] ASC),
    CONSTRAINT [CK_Role_RoleName_NotBlank] CHECK (LEN(LTRIM(RTRIM([RoleName]))) > 0)
);
GO

-- 3. Table: dbo.Employee
IF OBJECT_ID(N'dbo.Employee', N'U') IS NOT NULL DROP TABLE dbo.Employee;
GO

CREATE TABLE [dbo].[Employee] (
    [EmployeeID]          INT IDENTITY(1, 1) NOT NULL,
    [DepartmentID]        INT                NOT NULL,
    [RoleID]              INT                NOT NULL,
    [FirstName]           NVARCHAR(100)      NOT NULL,
    [LastName]            NVARCHAR(100)      NOT NULL,
    [Email]               NVARCHAR(256)      NOT NULL,
    [Phone]               NVARCHAR(20)       NULL,
    [PasswordHash]        NVARCHAR(255)      NULL,
    [LastLoginDate]       DATETIME2(7)       NULL,
    [FailedLoginAttempts] INT                NOT NULL CONSTRAINT [DF_Employee_FailedLoginAttempts] DEFAULT (0),
    [LockoutUntil]        DATETIME2(7)       NULL,
    [PasswordChangedAt]   DATETIME2(7)       NULL,
    [Status]              NVARCHAR(30)       NOT NULL CONSTRAINT [DF_Employee_Status] DEFAULT (N'Active'),
    [IsDeleted]           BIT                NOT NULL CONSTRAINT [DF_Employee_IsDeleted] DEFAULT (0),
    [CreatedBy]           INT                NULL,
    [CreatedDate]         DATETIME2(7)       NOT NULL CONSTRAINT [DF_Employee_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]           INT                NULL,
    [UpdatedDate]         DATETIME2(7)       NULL,
    [DeletedBy]           INT                NULL,
    [DeletedDate]         DATETIME2(7)       NULL,

    CONSTRAINT [PK_Employee] PRIMARY KEY CLUSTERED ([EmployeeID] ASC),
    CONSTRAINT [CK_Employee_FirstName_NotBlank] CHECK (LEN(LTRIM(RTRIM([FirstName]))) > 0),
    CONSTRAINT [CK_Employee_LastName_NotBlank]  CHECK (LEN(LTRIM(RTRIM([LastName]))) > 0),
    CONSTRAINT [CK_Employee_Email_NotBlank]     CHECK (LEN(LTRIM(RTRIM([Email]))) > 0),
    CONSTRAINT [CK_Employee_Status_Valid]       CHECK ([Status] IN (N'Active', N'Inactive', N'Suspended'))
);
GO

-- 4. Table: dbo.Project
IF OBJECT_ID(N'dbo.Project', N'U') IS NOT NULL DROP TABLE dbo.Project;
GO

CREATE TABLE [dbo].[Project] (
    [ProjectID]          INT IDENTITY(1, 1) NOT NULL,
    [ProjectName]        NVARCHAR(200)      NOT NULL,
    [Description]        NVARCHAR(MAX)      NULL,
    [ProjectManagerID]   INT                NOT NULL,
    [StartDate]          DATE               NOT NULL,
    [EndDate]            DATE               NOT NULL,
    [ActualEndDate]      DATE               NULL,
    [Status]             NVARCHAR(30)       NOT NULL CONSTRAINT [DF_Project_Status] DEFAULT (N'Draft'),
    [ProgressPercentage] DECIMAL(5, 2)     NOT NULL CONSTRAINT [DF_Project_ProgressPercentage] DEFAULT (0.00),
    [IsDeleted]          BIT                NOT NULL CONSTRAINT [DF_Project_IsDeleted] DEFAULT (0),
    [CreatedBy]          INT                NULL,
    [CreatedDate]        DATETIME2(7)       NOT NULL CONSTRAINT [DF_Project_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]          INT                NULL,
    [UpdatedDate]        DATETIME2(7)       NULL,
    [DeletedBy]          INT                NULL,
    [DeletedDate]        DATETIME2(7)       NULL,

    CONSTRAINT [PK_Project] PRIMARY KEY CLUSTERED ([ProjectID] ASC),
    CONSTRAINT [CK_Project_ProjectName_NotBlank] CHECK (LEN(LTRIM(RTRIM([ProjectName]))) > 0),
    CONSTRAINT [CK_Project_Dates_Valid]          CHECK ([EndDate] >= [StartDate]),
    CONSTRAINT [CK_Project_Progress_Range]       CHECK ([ProgressPercentage] BETWEEN 0.00 AND 100.00),
    CONSTRAINT [CK_Project_Status_Valid]         CHECK ([Status] IN (N'Draft', N'Planned', N'Active', N'On Hold', N'Completed', N'Archived'))
);
GO

-- 5. Table: dbo.ProjectMember
IF OBJECT_ID(N'dbo.ProjectMember', N'U') IS NOT NULL DROP TABLE dbo.ProjectMember;
GO

CREATE TABLE [dbo].[ProjectMember] (
    [ProjectMemberID]  INT IDENTITY(1, 1) NOT NULL,
    [ProjectID]        INT                NOT NULL,
    [EmployeeID]       INT                NOT NULL,
    [RoleInProject]    NVARCHAR(100)      NULL,
    [JoinedDate]       DATETIME2(7)       NOT NULL CONSTRAINT [DF_ProjectMember_JoinedDate] DEFAULT (SYSUTCDATETIME()),
    [IsDeleted]        BIT                NOT NULL CONSTRAINT [DF_ProjectMember_IsDeleted] DEFAULT (0),
    [CreatedBy]        INT                NULL,
    [CreatedDate]      DATETIME2(7)       NOT NULL CONSTRAINT [DF_ProjectMember_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]        INT                NULL,
    [UpdatedDate]      DATETIME2(7)       NULL,
    [DeletedBy]        INT                NULL,
    [DeletedDate]      DATETIME2(7)       NULL,

    CONSTRAINT [PK_ProjectMember] PRIMARY KEY CLUSTERED ([ProjectMemberID] ASC)
);
GO

-- 6. Table: dbo.Milestone
IF OBJECT_ID(N'dbo.Milestone', N'U') IS NOT NULL DROP TABLE dbo.Milestone;
GO

CREATE TABLE [dbo].[Milestone] (
    [MilestoneID]     INT IDENTITY(1, 1) NOT NULL,
    [ProjectID]       INT                NOT NULL,
    [MilestoneTitle]  NVARCHAR(200)      NOT NULL,
    [Description]     NVARCHAR(MAX)      NULL,
    [DueDate]         DATE               NOT NULL,
    [CompletedDate]   DATE               NULL,
    [Status]          NVARCHAR(30)       NOT NULL CONSTRAINT [DF_Milestone_Status] DEFAULT (N'Not Started'),
    [IsDeleted]       BIT                NOT NULL CONSTRAINT [DF_Milestone_IsDeleted] DEFAULT (0),
    [CreatedBy]       INT                NULL,
    [CreatedDate]     DATETIME2(7)       NOT NULL CONSTRAINT [DF_Milestone_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]       INT                NULL,
    [UpdatedDate]     DATETIME2(7)       NULL,
    [DeletedBy]       INT                NULL,
    [DeletedDate]     DATETIME2(7)       NULL,

    CONSTRAINT [PK_Milestone] PRIMARY KEY CLUSTERED ([MilestoneID] ASC),
    CONSTRAINT [CK_Milestone_Title_NotBlank] CHECK (LEN(LTRIM(RTRIM([MilestoneTitle]))) > 0),
    CONSTRAINT [CK_Milestone_Status_Valid]   CHECK ([Status] IN (N'Not Started', N'In Progress', N'Completed'))
);
GO

-- 7. Table: dbo.Task
IF OBJECT_ID(N'dbo.Task', N'U') IS NOT NULL DROP TABLE dbo.Task;
GO

CREATE TABLE [dbo].[Task] (
    [TaskID]             INT IDENTITY(1, 1) NOT NULL,
    [ProjectID]          INT                NULL,
    [MilestoneID]        INT                NULL,
    [Title]              NVARCHAR(200)      NOT NULL,
    [Description]        NVARCHAR(MAX)      NULL,
    [Priority]           NVARCHAR(20)       NOT NULL CONSTRAINT [DF_Task_Priority] DEFAULT (N'Medium'),
    [Status]             NVARCHAR(30)       NOT NULL CONSTRAINT [DF_Task_Status] DEFAULT (N'Created'),
    [StartDate]          DATE               NOT NULL,
    [DueDate]            DATE               NOT NULL,
    [CompletedDate]      DATE               NULL,
    [ProgressPercentage] DECIMAL(5, 2)     NOT NULL CONSTRAINT [DF_Task_ProgressPercentage] DEFAULT (0.00),
    [AssignedTo]         INT                NOT NULL,
    [ReviewerID]         INT                NOT NULL,
    [IsDeleted]          BIT                NOT NULL CONSTRAINT [DF_Task_IsDeleted] DEFAULT (0),
    [CreatedBy]          INT                NOT NULL,
    [CreatedDate]        DATETIME2(7)       NOT NULL CONSTRAINT [DF_Task_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]          INT                NULL,
    [UpdatedDate]        DATETIME2(7)       NULL,
    [DeletedBy]          INT                NULL,
    [DeletedDate]        DATETIME2(7)       NULL,

    CONSTRAINT [PK_Task] PRIMARY KEY CLUSTERED ([TaskID] ASC),
    CONSTRAINT [CK_Task_Title_NotBlank]  CHECK (LEN(LTRIM(RTRIM([Title]))) > 0),
    CONSTRAINT [CK_Task_Dates_Valid]     CHECK ([DueDate] >= [StartDate]),
    CONSTRAINT [CK_Task_Progress_Range]  CHECK ([ProgressPercentage] BETWEEN 0.00 AND 100.00),
    CONSTRAINT [CK_Task_Priority_Valid]  CHECK ([Priority] IN (N'Low', N'Medium', N'High', N'Critical')),
    CONSTRAINT [CK_Task_Status_Valid]    CHECK ([Status] IN (N'Created', N'Assigned', N'In Progress', N'Ready for Review', N'Under Review', N'Completed', N'Changes Required', N'Cancelled')),
    CONSTRAINT [CK_Task_SelfReviewGuard] CHECK ([AssignedTo] <> [ReviewerID])
);
GO

-- 8. Table: dbo.Subtask
IF OBJECT_ID(N'dbo.Subtask', N'U') IS NOT NULL DROP TABLE dbo.Subtask;
GO

CREATE TABLE [dbo].[Subtask] (
    [SubtaskID]        INT IDENTITY(1, 1) NOT NULL,
    [TaskID]           INT                NOT NULL,
    [Title]            NVARCHAR(200)      NOT NULL,
    [IsCompleted]      BIT                NOT NULL CONSTRAINT [DF_Subtask_IsCompleted] DEFAULT (0),
    [CompletedDate]    DATETIME2(7)       NULL,
    [IsDeleted]        BIT                NOT NULL CONSTRAINT [DF_Subtask_IsDeleted] DEFAULT (0),
    [CreatedBy]        INT                NULL,
    [CreatedDate]      DATETIME2(7)       NOT NULL CONSTRAINT [DF_Subtask_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]        INT                NULL,
    [UpdatedDate]      DATETIME2(7)       NULL,
    [DeletedBy]        INT                NULL,
    [DeletedDate]      DATETIME2(7)       NULL,

    CONSTRAINT [PK_Subtask] PRIMARY KEY CLUSTERED ([SubtaskID] ASC),
    CONSTRAINT [CK_Subtask_Title_NotBlank] CHECK (LEN(LTRIM(RTRIM([Title]))) > 0)
);
GO

-- 9. Table: dbo.Review
IF OBJECT_ID(N'dbo.Review', N'U') IS NOT NULL DROP TABLE dbo.Review;
GO

CREATE TABLE [dbo].[Review] (
    [ReviewID]         INT IDENTITY(1, 1) NOT NULL,
    [TaskID]           INT                NOT NULL,
    [ReviewerID]       INT                NOT NULL,
    [Iteration]        INT                NOT NULL CONSTRAINT [DF_Review_Iteration] DEFAULT (1),
    [Status]           NVARCHAR(30)       NOT NULL,
    [Comments]         NVARCHAR(MAX)      NULL,
    [ReviewedDate]     DATETIME2(7)       NOT NULL CONSTRAINT [DF_Review_ReviewedDate] DEFAULT (SYSUTCDATETIME()),
    [IsDeleted]        BIT                NOT NULL CONSTRAINT [DF_Review_IsDeleted] DEFAULT (0),
    [CreatedBy]        INT                NULL,
    [CreatedDate]      DATETIME2(7)       NOT NULL CONSTRAINT [DF_Review_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]        INT                NULL,
    [UpdatedDate]      DATETIME2(7)       NULL,
    [DeletedBy]        INT                NULL,
    [DeletedDate]      DATETIME2(7)       NULL,

    CONSTRAINT [PK_Review] PRIMARY KEY CLUSTERED ([ReviewID] ASC),
    CONSTRAINT [CK_Review_Status_Valid]    CHECK ([Status] IN (N'Approved', N'Changes Requested')),
    CONSTRAINT [CK_Review_Iteration_Valid] CHECK ([Iteration] >= 1)
);
GO

-- 10. Table: dbo.Comment
IF OBJECT_ID(N'dbo.Comment', N'U') IS NOT NULL DROP TABLE dbo.Comment;
GO

CREATE TABLE [dbo].[Comment] (
    [CommentID]        INT IDENTITY(1, 1) NOT NULL,
    [TaskID]           INT                NOT NULL,
    [EmployeeID]       INT                NOT NULL,
    [CommentText]      NVARCHAR(MAX)      NOT NULL,
    [IsDeleted]        BIT                NOT NULL CONSTRAINT [DF_Comment_IsDeleted] DEFAULT (0),
    [CreatedBy]        INT                NULL,
    [CreatedDate]      DATETIME2(7)       NOT NULL CONSTRAINT [DF_Comment_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]        INT                NULL,
    [UpdatedDate]      DATETIME2(7)       NULL,
    [DeletedBy]        INT                NULL,
    [DeletedDate]      DATETIME2(7)       NULL,

    CONSTRAINT [PK_Comment] PRIMARY KEY CLUSTERED ([CommentID] ASC),
    CONSTRAINT [CK_Comment_Text_NotBlank] CHECK (LEN(LTRIM(RTRIM([CommentText]))) > 0)
);
GO

-- 11. Table: dbo.Attachment
IF OBJECT_ID(N'dbo.Attachment', N'U') IS NOT NULL DROP TABLE dbo.Attachment;
GO

CREATE TABLE [dbo].[Attachment] (
    [AttachmentID]     INT IDENTITY(1, 1) NOT NULL,
    [TaskID]           INT                NOT NULL,
    [UploadedBy]       INT                NOT NULL,
    [FileName]         NVARCHAR(255)      NOT NULL,
    [FilePath]         NVARCHAR(1000)     NOT NULL,
    [FileSize]         BIGINT             NULL,
    [FileType]         NVARCHAR(100)      NULL,
    [IsDeleted]        BIT                NOT NULL CONSTRAINT [DF_Attachment_IsDeleted] DEFAULT (0),
    [CreatedBy]        INT                NULL,
    [CreatedDate]      DATETIME2(7)       NOT NULL CONSTRAINT [DF_Attachment_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]        INT                NULL,
    [UpdatedDate]      DATETIME2(7)       NULL,
    [DeletedBy]        INT                NULL,
    [DeletedDate]      DATETIME2(7)       NULL,

    CONSTRAINT [PK_Attachment] PRIMARY KEY CLUSTERED ([AttachmentID] ASC),
    CONSTRAINT [CK_Attachment_FileName_NotBlank] CHECK (LEN(LTRIM(RTRIM([FileName]))) > 0),
    CONSTRAINT [CK_Attachment_FilePath_NotBlank] CHECK (LEN(LTRIM(RTRIM([FilePath]))) > 0)
);
GO

-- 12. Table: dbo.Notification
IF OBJECT_ID(N'dbo.Notification', N'U') IS NOT NULL DROP TABLE dbo.Notification;
GO

CREATE TABLE [dbo].[Notification] (
    [NotificationID]   INT IDENTITY(1, 1) NOT NULL,
    [RecipientID]      INT                NOT NULL,
    [TriggeredByID]    INT                NULL,
    [TaskID]           INT                NULL,
    [ProjectID]        INT                NULL,
    [NotificationType] NVARCHAR(50)       NOT NULL,
    [Message]          NVARCHAR(MAX)      NOT NULL,
    [DeliveryChannel]  NVARCHAR(30)       NOT NULL CONSTRAINT [DF_Notification_DeliveryChannel] DEFAULT (N'In-App'),
    [IsRead]           BIT                NOT NULL CONSTRAINT [DF_Notification_IsRead] DEFAULT (0),
    [ReadDate]         DATETIME2(7)       NULL,
    [IsDeleted]        BIT                NOT NULL CONSTRAINT [DF_Notification_IsDeleted] DEFAULT (0),
    [CreatedBy]        INT                NULL,
    [CreatedDate]      DATETIME2(7)       NOT NULL CONSTRAINT [DF_Notification_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]        INT                NULL,
    [UpdatedDate]      DATETIME2(7)       NULL,
    [DeletedBy]        INT                NULL,
    [DeletedDate]      DATETIME2(7)       NULL,

    CONSTRAINT [PK_Notification] PRIMARY KEY CLUSTERED ([NotificationID] ASC),
    CONSTRAINT [CK_Notification_Message_NotBlank] CHECK (LEN(LTRIM(RTRIM([Message]))) > 0),
    CONSTRAINT [CK_Notification_Channel_Valid]   CHECK ([DeliveryChannel] IN (N'In-App', N'Email', N'Teams', N'Dashboard'))
);
GO

-- 13. Table: dbo.AuditLog
IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NOT NULL DROP TABLE dbo.AuditLog;
GO

CREATE TABLE [dbo].[AuditLog] (
    [AuditID]          BIGINT IDENTITY(1, 1) NOT NULL,
    [EntityName]       NVARCHAR(100)         NOT NULL,
    [EntityID]         INT                   NOT NULL,
    [Action]           NVARCHAR(50)          NOT NULL,
    [ChangedBy]        INT                   NULL,
    [OldValues]        NVARCHAR(MAX)         NULL,
    [NewValues]        NVARCHAR(MAX)         NULL,
    [IPAddress]        NVARCHAR(50)          NULL,
    [CreatedDate]      DATETIME2(7)          NOT NULL CONSTRAINT [DF_AuditLog_CreatedDate] DEFAULT (SYSUTCDATETIME()),

    CONSTRAINT [PK_AuditLog] PRIMARY KEY CLUSTERED ([AuditID] ASC)
);
GO
