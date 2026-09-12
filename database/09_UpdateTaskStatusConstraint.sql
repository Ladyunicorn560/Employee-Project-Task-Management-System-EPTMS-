USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- Migration: Update Task Status CHECK Constraint for Workflow Support
-- File: database/09_UpdateTaskStatusConstraint.sql
-- ============================================================================

-- 1. Drop existing CHECK constraint first
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Task_Status_Valid')
BEGIN
    ALTER TABLE [dbo].[Task] DROP CONSTRAINT [CK_Task_Status_Valid];
    PRINT N'Dropped existing CK_Task_Status_Valid constraint.';
END;
GO

-- 2. Update existing seeded task statuses
UPDATE [dbo].[Task]
SET [Status] = N'Not Started'
WHERE [Status] IN (N'Created', N'Assigned');
PRINT N'Updated existing seeded task statuses from Created/Assigned to Not Started.';
GO

-- 3. Add updated CHECK constraint with complete task status vocabulary
ALTER TABLE [dbo].[Task]
ADD CONSTRAINT [CK_Task_Status_Valid]
CHECK ([Status] IN (
    N'Not Started',
    N'Assigned',
    N'In Progress',
    N'Waiting for Information',
    N'Blocked',
    N'Ready for Review',
    N'Under Review',
    N'Changes Required',
    N'Completed',
    N'Cancelled'
));
PRINT N'Created updated CK_Task_Status_Valid constraint successfully.';
GO
