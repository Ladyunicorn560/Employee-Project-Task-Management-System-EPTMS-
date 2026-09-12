-- ============================================================================
-- Migration 14: Add EstimatedHours and ActualHours to dbo.Task
-- Description: Adds column definitions for tracking hours allocated directly on tasks.
-- ============================================================================

USE [EPTMS_DB];
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Task') AND name = N'EstimatedHours')
BEGIN
    ALTER TABLE [dbo].[Task] ADD [EstimatedHours] DECIMAL(6, 2) NULL;
    PRINT N'Added EstimatedHours column to dbo.Task.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Task') AND name = N'ActualHours')
BEGIN
    ALTER TABLE [dbo].[Task] ADD [ActualHours] DECIMAL(6, 2) NULL;
    PRINT N'Added ActualHours column to dbo.Task.';
END;
GO
