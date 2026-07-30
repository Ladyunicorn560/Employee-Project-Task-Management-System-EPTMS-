USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- Migration: Add DepartmentID to dbo.Project & Update Status CHECK Constraint
-- File: database/08_AddDepartmentToProject.sql
-- ============================================================================

-- Step 1: Add DepartmentID as NULL initially
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Project') AND name = N'DepartmentID')
BEGIN
    ALTER TABLE [dbo].[Project] ADD [DepartmentID] INT NULL;
    PRINT N'Added DepartmentID column (NULLable) to dbo.Project.';
END;
GO

-- Step 2: Populate valid DepartmentID values for existing project records
UPDATE p
SET p.[DepartmentID] = e.[DepartmentID]
FROM [dbo].[Project] p
INNER JOIN [dbo].[Employee] e ON p.[ProjectManagerID] = e.[EmployeeID]
WHERE p.[DepartmentID] IS NULL;
GO

-- Fallback for any unmapped project
DECLARE @DefaultDeptID INT = (SELECT TOP 1 DepartmentID FROM dbo.Department WHERE IsDeleted = 0 ORDER BY DepartmentID ASC);
UPDATE [dbo].[Project] SET [DepartmentID] = @DefaultDeptID WHERE [DepartmentID] IS NULL;
GO

-- Step 3: Alter DepartmentID to NOT NULL
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Project') AND name = N'DepartmentID' AND is_nullable = 1)
BEGIN
    ALTER TABLE [dbo].[Project] ALTER COLUMN [DepartmentID] INT NOT NULL;
    PRINT N'Altered DepartmentID to NOT NULL.';
END;
GO

-- Step 4: Add Foreign Key FK_Project_Department if not exists
IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Project_Department')
BEGIN
    ALTER TABLE [dbo].[Project] 
    ADD CONSTRAINT [FK_Project_Department] 
    FOREIGN KEY ([DepartmentID]) REFERENCES [dbo].[Department]([DepartmentID]);
    PRINT N'Created foreign key FK_Project_Department.';
END;
GO

-- Step 5: Update Status vocabulary for existing projects if needed (e.g. Draft/Planned -> Planning)
UPDATE [dbo].[Project] SET [Status] = N'Planning' WHERE [Status] IN (N'Draft', N'Planned');
GO

-- Step 6: Update CHECK constraint for Status
IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_Project_Status_Valid')
BEGIN
    ALTER TABLE [dbo].[Project] DROP CONSTRAINT [CK_Project_Status_Valid];
END;
GO

ALTER TABLE [dbo].[Project] 
ADD CONSTRAINT [CK_Project_Status_Valid] 
CHECK ([Status] IN (N'Planning', N'Active', N'On Hold', N'Completed', N'Cancelled', N'Archived'));
PRINT N'Updated CK_Project_Status_Valid constraint with status vocabulary.';
GO
