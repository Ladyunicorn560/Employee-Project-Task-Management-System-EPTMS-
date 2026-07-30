USE [EPTMS_DB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. View: vw_ProjectHealthSummary
IF OBJECT_ID(N'dbo.vw_ProjectHealthSummary', N'V') IS NOT NULL
    DROP VIEW dbo.vw_ProjectHealthSummary;
GO

CREATE VIEW dbo.vw_ProjectHealthSummary
AS
SELECT 
    p.ProjectID,
    p.ProjectName,
    p.Status AS ProjectStatus,
    p.StartDate,
    p.EndDate,
    CONCAT(e.FirstName, N' ', e.LastName) AS ProjectManagerName,
    e.Email AS ProjectManagerEmail,
    p.ProgressPercentage AS CalculatedProjectProgress,
    COUNT(t.TaskID) AS TotalTasks,
    SUM(CASE WHEN t.Status = N'Completed' THEN 1 ELSE 0 END) AS ApprovedCompletedTasks,
    SUM(CASE WHEN t.Status = N'Ready for Review' OR t.Status = N'Under Review' THEN 1 ELSE 0 END) AS PendingReviewTasks,
    SUM(CASE WHEN t.DueDate < CAST(GETUTCDATE() AS DATE) AND t.Status NOT IN (N'Completed', N'Cancelled') THEN 1 ELSE 0 END) AS OverdueTasks
FROM dbo.Project p
INNER JOIN dbo.Employee e ON p.ProjectManagerID = e.EmployeeID
LEFT JOIN dbo.Task t ON p.ProjectID = t.ProjectID AND t.IsDeleted = 0
WHERE p.IsDeleted = 0
GROUP BY 
    p.ProjectID, p.ProjectName, p.Status, p.StartDate, p.EndDate, 
    e.FirstName, e.LastName, e.Email, p.ProgressPercentage;
GO

-- 2. View: vw_ReviewerQueue
IF OBJECT_ID(N'dbo.vw_ReviewerQueue', N'V') IS NOT NULL
    DROP VIEW dbo.vw_ReviewerQueue;
GO

CREATE VIEW dbo.vw_ReviewerQueue
AS
SELECT 
    t.TaskID,
    t.Title AS TaskTitle,
    t.Priority,
    t.Status AS TaskStatus,
    t.DueDate,
    t.ProjectID,
    p.ProjectName,
    t.ReviewerID,
    CONCAT(r.FirstName, N' ', r.LastName) AS ReviewerName,
    t.AssignedTo AS AssigneeID,
    CONCAT(a.FirstName, N' ', a.LastName) AS AssigneeName,
    ISNULL(rv.Iteration, 1) AS ReviewIteration,
    t.UpdatedDate AS SubmittedDate
FROM dbo.Task t
INNER JOIN dbo.Employee r ON t.ReviewerID = r.EmployeeID
INNER JOIN dbo.Employee a ON t.AssignedTo = a.EmployeeID
LEFT JOIN dbo.Project p ON t.ProjectID = p.ProjectID
LEFT JOIN dbo.Review rv ON t.TaskID = rv.TaskID AND rv.IsDeleted = 0
WHERE t.IsDeleted = 0 
  AND t.Status IN (N'Ready for Review', N'Under Review');
GO
