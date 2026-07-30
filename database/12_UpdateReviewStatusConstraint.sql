USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- Migration: Update Review Status CHECK Constraint for Review Workflow
-- File: database/12_UpdateReviewStatusConstraint.sql
-- ============================================================================

-- 1. Drop existing CHECK constraint first
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Review_Status_Valid')
BEGIN
    ALTER TABLE [dbo].[Review] DROP CONSTRAINT [CK_Review_Status_Valid];
    PRINT N'Dropped existing CK_Review_Status_Valid constraint.';
END;
GO

-- 2. Update existing seeded review records
UPDATE [dbo].[Review]
SET [Status] = N'Changes Required'
WHERE [Status] = N'Changes Requested';
PRINT N'Updated existing seeded review statuses to Changes Required.';
GO

-- 3. Add updated CHECK constraint with complete review status vocabulary
ALTER TABLE [dbo].[Review]
ADD CONSTRAINT [CK_Review_Status_Valid]
CHECK ([Status] IN (
    N'Pending',
    N'Approved',
    N'Rejected',
    N'Changes Required'
));
PRINT N'Created updated CK_Review_Status_Valid constraint successfully.';
GO
