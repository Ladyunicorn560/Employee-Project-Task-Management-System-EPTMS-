USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- Migration: Expand dbo.Subtask Schema for Status, Priority, Assignee & DueDate
-- File: database/10_ExpandSubtaskSchema.sql
-- ============================================================================

-- 1. Add Description column if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Subtask') AND name = N'Description')
BEGIN
    ALTER TABLE [dbo].[Subtask] ADD [Description] NVARCHAR(MAX) NULL;
    PRINT N'Added Description column to dbo.Subtask.';
END;
GO

-- 2. Add AssignedTo column if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Subtask') AND name = N'AssignedTo')
BEGIN
    ALTER TABLE [dbo].[Subtask] ADD [AssignedTo] INT NULL;
    PRINT N'Added AssignedTo column to dbo.Subtask.';
END;
GO

-- 3. Add FK_Subtask_Employee foreign key
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Subtask_Employee')
BEGIN
    ALTER TABLE [dbo].[Subtask] 
    ADD CONSTRAINT [FK_Subtask_Employee] 
    FOREIGN KEY ([AssignedTo]) REFERENCES [dbo].[Employee]([EmployeeID]);
    PRINT N'Created foreign key FK_Subtask_Employee.';
END;
GO

-- 4. Add Priority column if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Subtask') AND name = N'Priority')
BEGIN
    ALTER TABLE [dbo].[Subtask] ADD [Priority] NVARCHAR(20) NOT NULL CONSTRAINT [DF_Subtask_Priority] DEFAULT (N'Medium');
    PRINT N'Added Priority column to dbo.Subtask.';
END;
GO

-- 5. Add Status column if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Subtask') AND name = N'Status')
BEGIN
    ALTER TABLE [dbo].[Subtask] ADD [Status] NVARCHAR(30) NOT NULL CONSTRAINT [DF_Subtask_Status] DEFAULT (N'Not Started');
    PRINT N'Added Status column to dbo.Subtask.';
END;
GO

-- Synchronize Status from IsCompleted for existing records
UPDATE [dbo].[Subtask] SET [Status] = N'Completed' WHERE [IsCompleted] = 1;
GO

-- 6. Add DueDate column if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Subtask') AND name = N'DueDate')
BEGIN
    ALTER TABLE [dbo].[Subtask] ADD [DueDate] DATE NULL;
    PRINT N'Added DueDate column to dbo.Subtask.';
END;
GO

-- 7. Add EstimatedHours and ActualHours columns if not exists
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Subtask') AND name = N'EstimatedHours')
BEGIN
    ALTER TABLE [dbo].[Subtask] ADD [EstimatedHours] DECIMAL(6, 2) NULL;
    PRINT N'Added EstimatedHours column to dbo.Subtask.';
END;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Subtask') AND name = N'ActualHours')
BEGIN
    ALTER TABLE [dbo].[Subtask] ADD [ActualHours] DECIMAL(6, 2) NULL;
    PRINT N'Added ActualHours column to dbo.Subtask.';
END;
GO

-- 8. Add CHECK Constraints for Priority & Status
IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Subtask_Priority_Valid')
BEGIN
    ALTER TABLE [dbo].[Subtask] 
    ADD CONSTRAINT [CK_Subtask_Priority_Valid] 
    CHECK ([Priority] IN (N'Low', N'Medium', N'High', N'Critical'));
    PRINT N'Created CK_Subtask_Priority_Valid constraint.';
END;

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Subtask_Status_Valid')
BEGIN
    ALTER TABLE [dbo].[Subtask] 
    ADD CONSTRAINT [CK_Subtask_Status_Valid] 
    CHECK ([Status] IN (N'Not Started', N'In Progress', N'Blocked', N'Completed', N'Cancelled'));
    PRINT N'Created CK_Subtask_Status_Valid constraint.';
END;
GO
