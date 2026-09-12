USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Add ProjectOwnerID to dbo.Project if it does not exist
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.Project') AND name = N'ProjectOwnerID'
)
BEGIN
    ALTER TABLE [dbo].[Project] 
    ADD [ProjectOwnerID] INT NULL;
END;
GO

-- Add FK for ProjectOwnerID if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE object_id = OBJECT_ID(N'dbo.FK_Project_Employee_ProjectOwnerID')
)
BEGIN
    ALTER TABLE [dbo].[Project]
    ADD CONSTRAINT [FK_Project_Employee_ProjectOwnerID]
    FOREIGN KEY ([ProjectOwnerID]) REFERENCES [dbo].[Employee] ([EmployeeID]);
END;
GO

-- 2. Add HourlyRate to dbo.Employee if it does not exist
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.Employee') AND name = N'HourlyRate'
)
BEGIN
    ALTER TABLE [dbo].[Employee] 
    ADD [HourlyRate] DECIMAL(10, 2) NOT NULL CONSTRAINT [DF_Employee_HourlyRate] DEFAULT (50.00);
END;
GO

-- 3. Add HourlyRate to dbo.ProjectMember if it does not exist
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.ProjectMember') AND name = N'HourlyRate'
)
BEGIN
    ALTER TABLE [dbo].[ProjectMember] 
    ADD [HourlyRate] DECIMAL(10, 2) NULL;
END;
GO

-- 4. Create Table dbo.Timecard
IF OBJECT_ID(N'dbo.Timecard', N'U') IS NOT NULL 
    DROP TABLE dbo.Timecard;
GO

CREATE TABLE [dbo].[Timecard] (
    [TimecardID]            INT IDENTITY(1, 1) NOT NULL,
    [EmployeeID]            INT                NOT NULL,
    [WeekStartDate]         DATE               NOT NULL,
    [WeekEndDate]           DATE               NOT NULL,
    [TotalHours]            DECIMAL(7, 2)      NOT NULL CONSTRAINT [DF_Timecard_TotalHours] DEFAULT (0.00),
    [TotalAmount]           DECIMAL(12, 2)     NOT NULL CONSTRAINT [DF_Timecard_TotalAmount] DEFAULT (0.00),
    [Status]                NVARCHAR(30)       NOT NULL CONSTRAINT [DF_Timecard_Status] DEFAULT (N'Submitted'),
    [ManagerID]             INT                NULL,
    [ManagerApprovedDate]   DATETIME2(7)       NULL,
    [ManagerComments]       NVARCHAR(MAX)      NULL,
    [FinancialApprovedByID] INT                NULL,
    [FinancialApprovedDate] DATETIME2(7)       NULL,
    [FinancialComments]     NVARCHAR(MAX)      NULL,
    [IsDeleted]             BIT                NOT NULL CONSTRAINT [DF_Timecard_IsDeleted] DEFAULT (0),
    [CreatedBy]             INT                NULL,
    [CreatedDate]           DATETIME2(7)       NOT NULL CONSTRAINT [DF_Timecard_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]             INT                NULL,
    [UpdatedDate]           DATETIME2(7)       NULL,
    [DeletedBy]             INT                NULL,
    [DeletedDate]           DATETIME2(7)       NULL,

    CONSTRAINT [PK_Timecard] PRIMARY KEY CLUSTERED ([TimecardID] ASC),
    CONSTRAINT [FK_Timecard_Employee] FOREIGN KEY ([EmployeeID]) REFERENCES [dbo].[Employee] ([EmployeeID]),
    CONSTRAINT [FK_Timecard_Manager] FOREIGN KEY ([ManagerID]) REFERENCES [dbo].[Employee] ([EmployeeID]),
    CONSTRAINT [FK_Timecard_FinancialApprovedBy] FOREIGN KEY ([FinancialApprovedByID]) REFERENCES [dbo].[Employee] ([EmployeeID]),
    CONSTRAINT [CK_Timecard_Status_Valid] CHECK ([Status] IN (N'Draft', N'Submitted', N'ManagerApproved', N'FinancialApproved', N'ManagerRejected', N'FinancialRejected'))
);
GO

-- 5. Create Table dbo.TimecardEntry
IF OBJECT_ID(N'dbo.TimecardEntry', N'U') IS NOT NULL 
    DROP TABLE dbo.TimecardEntry;
GO

CREATE TABLE [dbo].[TimecardEntry] (
    [TimecardEntryID]       INT IDENTITY(1, 1) NOT NULL,
    [TimecardID]            INT                NOT NULL,
    [ProjectID]             INT                NOT NULL,
    [TaskID]                INT                NULL,
    [WorkDate]              DATE               NOT NULL,
    [HoursWorked]           DECIMAL(5, 2)      NOT NULL,
    [HourlyRate]            DECIMAL(10, 2)     NOT NULL CONSTRAINT [DF_TimecardEntry_HourlyRate] DEFAULT (0.00),
    [BillingAmount]         DECIMAL(12, 2)     NOT NULL CONSTRAINT [DF_TimecardEntry_BillingAmount] DEFAULT (0.00),
    [Description]           NVARCHAR(500)      NULL,
    [IsDeleted]             BIT                NOT NULL CONSTRAINT [DF_TimecardEntry_IsDeleted] DEFAULT (0),
    [CreatedBy]             INT                NULL,
    [CreatedDate]           DATETIME2(7)       NOT NULL CONSTRAINT [DF_TimecardEntry_CreatedDate] DEFAULT (SYSUTCDATETIME()),
    [UpdatedBy]             INT                NULL,
    [UpdatedDate]           DATETIME2(7)       NULL,

    CONSTRAINT [PK_TimecardEntry] PRIMARY KEY CLUSTERED ([TimecardEntryID] ASC),
    CONSTRAINT [FK_TimecardEntry_Timecard] FOREIGN KEY ([TimecardID]) REFERENCES [dbo].[Timecard] ([TimecardID]),
    CONSTRAINT [FK_TimecardEntry_Project] FOREIGN KEY ([ProjectID]) REFERENCES [dbo].[Project] ([ProjectID]),
    CONSTRAINT [FK_TimecardEntry_Task] FOREIGN KEY ([TaskID]) REFERENCES [dbo].[Task] ([TaskID])
);
GO

-- 6. Create Indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Timecard_EmployeeID_Week')
    CREATE INDEX [IX_Timecard_EmployeeID_Week] ON [dbo].[Timecard] ([EmployeeID], [WeekStartDate]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TimecardEntry_TimecardID')
    CREATE INDEX [IX_TimecardEntry_TimecardID] ON [dbo].[TimecardEntry] ([TimecardID]);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TimecardEntry_ProjectID')
    CREATE INDEX [IX_TimecardEntry_ProjectID] ON [dbo].[TimecardEntry] ([ProjectID]);
GO

-- 7. View: dbo.vw_ProjectBillingSummary
IF OBJECT_ID(N'dbo.vw_ProjectBillingSummary', N'V') IS NOT NULL
    DROP VIEW dbo.vw_ProjectBillingSummary;
GO

CREATE VIEW [dbo].[vw_ProjectBillingSummary] AS
SELECT 
    p.[ProjectID],
    p.[ProjectName],
    p.[ProjectManagerID],
    pm.[FirstName] + N' ' + pm.[LastName] AS [ProjectManagerName],
    p.[ProjectOwnerID],
    po.[FirstName] + N' ' + po.[LastName] AS [ProjectOwnerName],
    e.[EmployeeID],
    e.[FirstName] + N' ' + e.[LastName] AS [EmployeeName],
    e.[Email] AS [EmployeeEmail],
    SUM(te.[HoursWorked]) AS [TotalHoursWorked],
    te.[HourlyRate] AS [CostingRatePerHour],
    SUM(te.[BillingAmount]) AS [TotalBillingAmount],
    t.[Status] AS [TimecardStatus]
FROM [dbo].[TimecardEntry] te
INNER JOIN [dbo].[Timecard] t ON te.[TimecardID] = t.[TimecardID]
INNER JOIN [dbo].[Project] p ON te.[ProjectID] = p.[ProjectID]
INNER JOIN [dbo].[Employee] e ON t.[EmployeeID] = e.[EmployeeID]
LEFT JOIN [dbo].[Employee] pm ON p.[ProjectManagerID] = pm.[EmployeeID]
LEFT JOIN [dbo].[Employee] po ON p.[ProjectOwnerID] = po.[EmployeeID]
WHERE te.[IsDeleted] = 0 AND t.[IsDeleted] = 0
GROUP BY p.[ProjectID], p.[ProjectName], p.[ProjectManagerID], pm.[FirstName], pm.[LastName], p.[ProjectOwnerID], po.[FirstName], po.[LastName], e.[EmployeeID], e.[FirstName], e.[LastName], e.[Email], te.[HourlyRate], t.[Status];
GO
