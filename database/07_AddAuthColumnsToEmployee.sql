USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ============================================================================
-- Migration: Add Authentication & Lockout Columns to dbo.Employee
-- ============================================================================

BEGIN TRY
    BEGIN TRANSACTION;

    -- Add PasswordHash column if not exists
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Employee') AND name = N'PasswordHash')
    BEGIN
        ALTER TABLE [dbo].[Employee] ADD [PasswordHash] NVARCHAR(255) NULL;
    END;

    -- Add LastLoginDate column if not exists
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Employee') AND name = N'LastLoginDate')
    BEGIN
        ALTER TABLE [dbo].[Employee] ADD [LastLoginDate] DATETIME2(7) NULL;
    END;

    -- Add FailedLoginAttempts column if not exists
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Employee') AND name = N'FailedLoginAttempts')
    BEGIN
        ALTER TABLE [dbo].[Employee] ADD [FailedLoginAttempts] INT NOT NULL CONSTRAINT [DF_Employee_FailedLoginAttempts] DEFAULT (0);
    END;

    -- Add LockoutUntil column if not exists
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Employee') AND name = N'LockoutUntil')
    BEGIN
        ALTER TABLE [dbo].[Employee] ADD [LockoutUntil] DATETIME2(7) NULL;
    END;

    -- Add PasswordChangedAt column if not exists
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.Employee') AND name = N'PasswordChangedAt')
    BEGIN
        ALTER TABLE [dbo].[Employee] ADD [PasswordChangedAt] DATETIME2(7) NULL;
    END;

    COMMIT TRANSACTION;
    PRINT N'Successfully added authentication columns to dbo.Employee!';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- ----------------------------------------------------------------------------
-- Create Filtered Index for Fast Authentication Lookups
-- ----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Employee_Email_Status' AND object_id = OBJECT_ID(N'dbo.Employee'))
BEGIN
    CREATE NONCLUSTERED INDEX [IX_Employee_Email_Status]
    ON [dbo].[Employee] ([Email] ASC, [Status] ASC)
    INCLUDE ([EmployeeID], [FirstName], [LastName], [DepartmentID], [RoleID], [PasswordHash], [FailedLoginAttempts], [LockoutUntil], [PasswordChangedAt])
    WHERE [IsDeleted] = 0;
    PRINT N'Successfully created IX_Employee_Email_Status index!';
END;
GO
