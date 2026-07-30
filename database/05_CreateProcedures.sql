USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Stored Procedure: sp_RecalculateTaskProgress
IF OBJECT_ID(N'dbo.sp_RecalculateTaskProgress', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RecalculateTaskProgress;
GO

CREATE PROCEDURE dbo.sp_RecalculateTaskProgress
    @TaskID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TotalSubtasks INT = 0;
    DECLARE @CompletedSubtasks INT = 0;
    DECLARE @NewProgress DECIMAL(5, 2) = 0.00;

    SELECT 
        @TotalSubtasks = COUNT(*),
        @CompletedSubtasks = SUM(CASE WHEN [IsCompleted] = 1 THEN 1 ELSE 0 END)
    FROM dbo.Subtask
    WHERE [TaskID] = @TaskID AND [IsDeleted] = 0;

    IF @TotalSubtasks > 0
    BEGIN
        SET @NewProgress = CAST((@CompletedSubtasks * 100.0) / @TotalSubtasks AS DECIMAL(5, 2));

        UPDATE dbo.Task
        SET 
            [ProgressPercentage] = @NewProgress,
            [UpdatedDate] = SYSUTCDATETIME()
        WHERE [TaskID] = @TaskID;
    END;
END;
GO

-- 2. Stored Procedure: sp_RecalculateProjectProgress
IF OBJECT_ID(N'dbo.sp_RecalculateProjectProgress', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_RecalculateProjectProgress;
GO

CREATE PROCEDURE dbo.sp_RecalculateProjectProgress
    @ProjectID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @TotalTasks INT = 0;
    DECLARE @CompletedTasks INT = 0;
    DECLARE @NewProgress DECIMAL(5, 2) = 0.00;

    SELECT 
        @TotalTasks = COUNT(*),
        @CompletedTasks = SUM(CASE WHEN [Status] = N'Completed' THEN 1 ELSE 0 END)
    FROM dbo.Task
    WHERE [ProjectID] = @ProjectID AND [IsDeleted] = 0;

    IF @TotalTasks > 0
    BEGIN
        SET @NewProgress = CAST((@CompletedTasks * 100.0) / @TotalTasks AS DECIMAL(5, 2));
    END;

    UPDATE dbo.Project
    SET 
        [ProgressPercentage] = @NewProgress,
        [UpdatedDate] = SYSUTCDATETIME()
    WHERE [ProjectID] = @ProjectID;
END;
GO

-- 3. Stored Procedure: sp_SoftDeleteTask
IF OBJECT_ID(N'dbo.sp_SoftDeleteTask', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SoftDeleteTask;
GO

CREATE PROCEDURE dbo.sp_SoftDeleteTask
    @TaskID INT,
    @DeletedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();

        -- Soft delete task
        UPDATE dbo.Task 
        SET IsDeleted = 1, DeletedBy = @DeletedBy, DeletedDate = @Now 
        WHERE TaskID = @TaskID;

        -- Soft delete child subtasks
        UPDATE dbo.Subtask 
        SET IsDeleted = 1, DeletedBy = @DeletedBy, DeletedDate = @Now 
        WHERE TaskID = @TaskID;

        -- Soft delete comments
        UPDATE dbo.Comment 
        SET IsDeleted = 1, DeletedBy = @DeletedBy, DeletedDate = @Now 
        WHERE TaskID = @TaskID;

        -- Soft delete attachments
        UPDATE dbo.Attachment 
        SET IsDeleted = 1, DeletedBy = @DeletedBy, DeletedDate = @Now 
        WHERE TaskID = @TaskID;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- 4. Stored Procedure: sp_SoftDeleteProject
IF OBJECT_ID(N'dbo.sp_SoftDeleteProject', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_SoftDeleteProject;
GO

CREATE PROCEDURE dbo.sp_SoftDeleteProject
    @ProjectID INT,
    @DeletedBy INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;
        DECLARE @Now DATETIME2(7) = SYSUTCDATETIME();

        -- Soft delete project
        UPDATE dbo.Project 
        SET IsDeleted = 1, DeletedBy = @DeletedBy, DeletedDate = @Now 
        WHERE ProjectID = @ProjectID;

        -- Soft delete milestones
        UPDATE dbo.Milestone 
        SET IsDeleted = 1, DeletedBy = @DeletedBy, DeletedDate = @Now 
        WHERE ProjectID = @ProjectID;

        -- Soft delete project members
        UPDATE dbo.ProjectMember 
        SET IsDeleted = 1, DeletedBy = @DeletedBy, DeletedDate = @Now 
        WHERE ProjectID = @ProjectID;

        -- Soft delete all child tasks and sub-entities
        DECLARE @TaskID INT;
        DECLARE task_cursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT TaskID FROM dbo.Task WHERE ProjectID = @ProjectID;

        OPEN task_cursor;
        FETCH NEXT FROM task_cursor INTO @TaskID;

        WHILE @@FETCH_STATUS = 0
        BEGIN
            EXEC dbo.sp_SoftDeleteTask @TaskID = @TaskID, @DeletedBy = @DeletedBy;
            FETCH NEXT FROM task_cursor INTO @TaskID;
        END;

        CLOSE task_cursor;
        DEALLOCATE task_cursor;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
