USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Add ManagerID to dbo.Employee if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.Employee') AND name = N'ManagerID'
)
BEGIN
    ALTER TABLE [dbo].[Employee]
    ADD [ManagerID] INT NULL;
END;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE object_id = OBJECT_ID(N'dbo.FK_Employee_Manager')
)
BEGIN
    ALTER TABLE [dbo].[Employee]
    ADD CONSTRAINT [FK_Employee_Manager]
    FOREIGN KEY ([ManagerID]) REFERENCES [dbo].[Employee] ([EmployeeID]);
END;
GO

-- 2. Add WorkMode to dbo.TimecardEntry if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.TimecardEntry') AND name = N'WorkMode'
)
BEGIN
    ALTER TABLE [dbo].[TimecardEntry]
    ADD [WorkMode] NVARCHAR(50) NOT NULL CONSTRAINT [DF_TimecardEntry_WorkMode] DEFAULT (N'Office');
END;
GO

-- 3. Add TotalAmount to dbo.Project if not exists
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.Project') AND name = N'TotalAmount'
)
BEGIN
    ALTER TABLE [dbo].[Project]
    ADD [TotalAmount] DECIMAL(14, 2) NOT NULL CONSTRAINT [DF_Project_TotalAmount] DEFAULT (0.00);
END;
GO
