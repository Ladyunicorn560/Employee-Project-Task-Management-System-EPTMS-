const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class ReportRepository extends BaseRepository {
  _buildRbacClause(roleName, userId, tableAlias = 'p') {
    if (roleName === 'Project Manager') {
      return {
        clause: ` AND (${tableAlias}.[ProjectManagerID] = @RbacUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = ${tableAlias}.[ProjectID] AND pm.[EmployeeID] = @RbacUserId AND pm.[IsDeleted] = 0))`,
        param: { RbacUserId: { type: mssql.Int, value: userId } }
      };
    }
    if (roleName === 'Employee') {
      return {
        clause: ` AND EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = ${tableAlias}.[ProjectID] AND pm.[EmployeeID] = @RbacUserId AND pm.[IsDeleted] = 0)`,
        param: { RbacUserId: { type: mssql.Int, value: userId } }
      };
    }
    return { clause: '', param: {} };
  }

  // ─── Project Summary Report ────────────────────────────────────────────────
  async getProjectReport({ roleName, userId, projectId, departmentId, status, startDate, endDate, page, limit }) {
    let where = 'WHERE p.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: (page - 1) * limit },
      Limit: { type: mssql.Int, value: limit }
    };

    const { clause, param } = this._buildRbacClause(roleName, userId);
    where += clause;
    Object.assign(params, param);

    if (projectId) { where += ' AND p.[ProjectID] = @ProjectId'; params.ProjectId = { type: mssql.Int, value: projectId }; }
    if (departmentId) { where += ' AND p.[DepartmentID] = @DeptId'; params.DeptId = { type: mssql.Int, value: departmentId }; }
    if (status) { where += ' AND p.[Status] = @Status'; params.Status = { type: mssql.NVarChar(50), value: status }; }
    if (startDate) { where += ' AND p.[StartDate] >= @StartDate'; params.StartDate = { type: mssql.Date, value: startDate }; }
    if (endDate) { where += ' AND p.[EndDate] <= @EndDate'; params.EndDate = { type: mssql.Date, value: endDate }; }

    const query = `
      SELECT
        p.[ProjectID],
        p.[ProjectName],
        p.[Status],
        p.[ProgressPercentage],
        p.[StartDate],
        p.[EndDate],
        d.[DepartmentName],
        pm.[FirstName] + ' ' + pm.[LastName] AS ProjectManager,
        pm.[Email] AS ProjectManagerEmail,
        (SELECT COUNT(*) FROM [dbo].[Milestone] m WHERE m.[ProjectID] = p.[ProjectID] AND m.[IsDeleted] = 0) AS TotalMilestones,
        (SELECT COUNT(*) FROM [dbo].[Milestone] m WHERE m.[ProjectID] = p.[ProjectID] AND m.[Status] = 'Completed' AND m.[IsDeleted] = 0) AS CompletedMilestones,
        (SELECT COUNT(*) FROM [dbo].[Task] t INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID] WHERE m.[ProjectID] = p.[ProjectID] AND t.[IsDeleted] = 0) AS TotalTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID] WHERE m.[ProjectID] = p.[ProjectID] AND t.[Status] = 'Completed' AND t.[IsDeleted] = 0) AS CompletedTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID] WHERE m.[ProjectID] = p.[ProjectID] AND t.[Status] <> 'Completed' AND t.[Status] <> 'Cancelled' AND t.[IsDeleted] = 0) AS PendingTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID] WHERE m.[ProjectID] = p.[ProjectID] AND t.[Status] <> 'Completed' AND t.[Status] <> 'Cancelled' AND t.[DueDate] < CAST(SYSUTCDATETIME() AS DATE) AND t.[IsDeleted] = 0) AS OverdueTasks,
        (SELECT COUNT(*) FROM [dbo].[ProjectMember] mem WHERE mem.[ProjectID] = p.[ProjectID] AND mem.[IsDeleted] = 0) AS TeamMemberCount,
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Project] p
      LEFT JOIN [dbo].[Department] d ON p.[DepartmentID] = d.[DepartmentID]
      LEFT JOIN [dbo].[Employee] pm ON p.[ProjectManagerID] = pm.[EmployeeID]
      ${where}
      ORDER BY p.[ProjectID]
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;
    const result = await this.query(query, params);
    const records = result.recordset || [];
    return { total: records[0]?.TotalCount || 0, data: records.map(r => ({ ...r, TotalCount: undefined })) };
  }

  // ─── Employee Workload Report ──────────────────────────────────────────────
  async getEmployeeReport({ roleName, userId, employeeId, departmentId, page, limit }) {
    let where = 'WHERE e.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: (page - 1) * limit },
      Limit: { type: mssql.Int, value: limit }
    };

    if (roleName === 'Employee') { where += ' AND e.[EmployeeID] = @RbacUserId'; params.RbacUserId = { type: mssql.Int, value: userId }; }
    else if (roleName === 'Project Manager') {
      where += ' AND (e.[EmployeeID] = @RbacUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm INNER JOIN [dbo].[Project] p ON pm.[ProjectID] = p.[ProjectID] WHERE pm.[EmployeeID] = e.[EmployeeID] AND p.[ProjectManagerID] = @RbacUserId AND pm.[IsDeleted] = 0))';
      params.RbacUserId = { type: mssql.Int, value: userId };
    }
    if (employeeId) { where += ' AND e.[EmployeeID] = @EmpId'; params.EmpId = { type: mssql.Int, value: employeeId }; }
    if (departmentId) { where += ' AND e.[DepartmentID] = @DeptId'; params.DeptId = { type: mssql.Int, value: departmentId }; }

    const query = `
      SELECT
        e.[EmployeeID],
        e.[FirstName] + ' ' + e.[LastName] AS EmployeeName,
        e.[Email],
        d.[DepartmentName],
        r.[RoleName],
        e.[Status] AS EmployeeStatus,
        (SELECT COUNT(DISTINCT pm.[ProjectID]) FROM [dbo].[ProjectMember] pm WHERE pm.[EmployeeID] = e.[EmployeeID] AND pm.[IsDeleted] = 0) AS AssignedProjects,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[AssignedTo] = e.[EmployeeID] AND t.[IsDeleted] = 0) AS AssignedTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[AssignedTo] = e.[EmployeeID] AND t.[Status] = 'Completed' AND t.[IsDeleted] = 0) AS CompletedTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[AssignedTo] = e.[EmployeeID] AND t.[Status] <> 'Completed' AND t.[Status] <> 'Cancelled' AND t.[IsDeleted] = 0) AS PendingTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[AssignedTo] = e.[EmployeeID] AND t.[Status] <> 'Completed' AND t.[Status] <> 'Cancelled' AND t.[DueDate] < CAST(SYSUTCDATETIME() AS DATE) AND t.[IsDeleted] = 0) AS OverdueTasks,
        (SELECT COUNT(*) FROM [dbo].[Review] rv WHERE rv.[ReviewerID] = e.[EmployeeID] AND rv.[Status] = 'Pending' AND rv.[IsDeleted] = 0) AS ReviewsPending,
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Employee] e
      LEFT JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      LEFT JOIN [dbo].[Role] r ON e.[RoleID] = r.[RoleID]
      ${where}
      ORDER BY AssignedTasks DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;
    const result = await this.query(query, params);
    const records = result.recordset || [];
    return { total: records[0]?.TotalCount || 0, data: records.map(r => ({ ...r, TotalCount: undefined })) };
  }

  // ─── Task Status Report ────────────────────────────────────────────────────
  async getTaskReport({ roleName, userId, projectId, employeeId, status, priority, startDate, endDate, page, limit }) {
    let where = 'WHERE t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: (page - 1) * limit },
      Limit: { type: mssql.Int, value: limit }
    };

    if (roleName === 'Employee') { where += ' AND t.[AssignedTo] = @RbacUserId'; params.RbacUserId = { type: mssql.Int, value: userId }; }
    else if (roleName === 'Project Manager') {
      where += ' AND (p.[ProjectManagerID] = @RbacUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @RbacUserId AND pm.[IsDeleted] = 0))';
      params.RbacUserId = { type: mssql.Int, value: userId };
    } else if (roleName === 'Reviewer') {
      where += ' AND (t.[ReviewerID] = @RbacUserId OR EXISTS (SELECT 1 FROM [dbo].[Review] rv WHERE rv.[TaskID] = t.[TaskID] AND rv.[ReviewerID] = @RbacUserId AND rv.[IsDeleted] = 0))';
      params.RbacUserId = { type: mssql.Int, value: userId };
    }

    if (projectId) { where += ' AND p.[ProjectID] = @ProjectId'; params.ProjectId = { type: mssql.Int, value: projectId }; }
    if (employeeId) { where += ' AND t.[AssignedTo] = @EmpId'; params.EmpId = { type: mssql.Int, value: employeeId }; }
    if (status) { where += ' AND t.[Status] = @Status'; params.Status = { type: mssql.NVarChar(50), value: status }; }
    if (priority) { where += ' AND t.[Priority] = @Priority'; params.Priority = { type: mssql.NVarChar(20), value: priority }; }
    if (startDate) { where += ' AND t.[CreatedDate] >= @StartDate'; params.StartDate = { type: mssql.Date, value: startDate }; }
    if (endDate) { where += ' AND t.[CreatedDate] <= @EndDate'; params.EndDate = { type: mssql.Date, value: endDate }; }

    const query = `
      SELECT
        t.[TaskID],
        t.[Title] AS TaskTitle,
        p.[ProjectName],
        m.[MilestoneTitle],
        t.[Status],
        t.[Priority],
        t.[DueDate],
        t.[CompletedDate],
        e.[FirstName] + ' ' + e.[LastName] AS Assignee,
        e.[Email] AS AssigneeEmail,
        rv.[FirstName] + ' ' + rv.[LastName] AS Reviewer,
        (SELECT TOP 1 rw.[Status] FROM [dbo].[Review] rw WHERE rw.[TaskID] = t.[TaskID] AND rw.[IsDeleted] = 0 ORDER BY rw.[Iteration] DESC) AS LatestReviewStatus,
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] e ON t.[AssignedTo] = e.[EmployeeID]
      LEFT JOIN [dbo].[Employee] rv ON t.[ReviewerID] = rv.[EmployeeID]
      ${where}
      ORDER BY t.[DueDate] ASC, t.[Priority] DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;
    const result = await this.query(query, params);
    const records = result.recordset || [];
    return { total: records[0]?.TotalCount || 0, data: records.map(r => ({ ...r, TotalCount: undefined })) };
  }

  // ─── Milestone Progress Report ─────────────────────────────────────────────
  async getMilestoneReport({ roleName, userId, projectId, status, page, limit }) {
    let where = 'WHERE m.[IsDeleted] = 0 AND p.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: (page - 1) * limit },
      Limit: { type: mssql.Int, value: limit }
    };

    const { clause, param } = this._buildRbacClause(roleName, userId);
    where += clause;
    Object.assign(params, param);

    if (projectId) { where += ' AND p.[ProjectID] = @ProjectId'; params.ProjectId = { type: mssql.Int, value: projectId }; }
    if (status) { where += ' AND m.[Status] = @Status'; params.Status = { type: mssql.NVarChar(50), value: status }; }

    const query = `
      SELECT
        m.[MilestoneID],
        m.[MilestoneTitle],
        m.[Status],
        m.[DueDate],
        p.[ProjectName],
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[MilestoneID] = m.[MilestoneID] AND t.[IsDeleted] = 0) AS TotalTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[MilestoneID] = m.[MilestoneID] AND t.[Status] = 'Completed' AND t.[IsDeleted] = 0) AS CompletedTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[MilestoneID] = m.[MilestoneID] AND t.[Status] <> 'Completed' AND t.[Status] <> 'Cancelled' AND t.[IsDeleted] = 0) AS RemainingTasks,
        CASE
          WHEN (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[MilestoneID] = m.[MilestoneID] AND t.[IsDeleted] = 0) = 0 THEN 0.00
          ELSE CAST(
            (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[MilestoneID] = m.[MilestoneID] AND t.[Status] = 'Completed' AND t.[IsDeleted] = 0) * 100.0
            / (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[MilestoneID] = m.[MilestoneID] AND t.[IsDeleted] = 0)
            AS DECIMAL(5,2)
          )
        END AS ProgressPercentage,
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Milestone] m
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      ${where}
      ORDER BY m.[DueDate] ASC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;
    const result = await this.query(query, params);
    const records = result.recordset || [];
    return { total: records[0]?.TotalCount || 0, data: records.map(r => ({ ...r, TotalCount: undefined })) };
  }

  // ─── Review History Report ─────────────────────────────────────────────────
  async getReviewReport({ roleName, userId, projectId, reviewerId, status, startDate, endDate, page, limit }) {
    let where = 'WHERE rv.[IsDeleted] = 0 AND t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: (page - 1) * limit },
      Limit: { type: mssql.Int, value: limit }
    };

    if (roleName === 'Reviewer') { where += ' AND rv.[ReviewerID] = @RbacUserId'; params.RbacUserId = { type: mssql.Int, value: userId }; }
    else if (roleName === 'Employee') { where += ' AND t.[AssignedTo] = @RbacUserId'; params.RbacUserId = { type: mssql.Int, value: userId }; }
    else if (roleName === 'Project Manager') {
      where += ' AND (p.[ProjectManagerID] = @RbacUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @RbacUserId AND pm.[IsDeleted] = 0))';
      params.RbacUserId = { type: mssql.Int, value: userId };
    }

    if (projectId) { where += ' AND p.[ProjectID] = @ProjectId'; params.ProjectId = { type: mssql.Int, value: projectId }; }
    if (reviewerId) { where += ' AND rv.[ReviewerID] = @ReviewerId'; params.ReviewerId = { type: mssql.Int, value: reviewerId }; }
    if (status) { where += ' AND rv.[Status] = @Status'; params.Status = { type: mssql.NVarChar(30), value: status }; }
    if (startDate) { where += ' AND rv.[ReviewedDate] >= @StartDate'; params.StartDate = { type: mssql.Date, value: startDate }; }
    if (endDate) { where += ' AND rv.[ReviewedDate] <= @EndDate'; params.EndDate = { type: mssql.Date, value: endDate }; }

    const query = `
      SELECT
        rv.[ReviewID],
        t.[Title] AS TaskTitle,
        p.[ProjectName],
        e.[FirstName] + ' ' + e.[LastName] AS Reviewer,
        e.[Email] AS ReviewerEmail,
        rv.[Iteration],
        rv.[Status],
        rv.[ReviewedDate],
        rv.[Comments],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Review] rv
      INNER JOIN [dbo].[Task] t ON rv.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] e ON rv.[ReviewerID] = e.[EmployeeID]
      ${where}
      ORDER BY rv.[ReviewedDate] DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;
    const result = await this.query(query, params);
    const records = result.recordset || [];
    return { total: records[0]?.TotalCount || 0, data: records.map(r => ({ ...r, TotalCount: undefined })) };
  }

  // ─── Notification Summary Report ───────────────────────────────────────────
  async getNotificationReport({ roleName, userId, startDate, endDate, page, limit }) {
    let where = 'WHERE n.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: (page - 1) * limit },
      Limit: { type: mssql.Int, value: limit }
    };

    if (roleName !== 'Administrator') { where += ' AND n.[RecipientID] = @RbacUserId'; params.RbacUserId = { type: mssql.Int, value: userId }; }
    if (startDate) { where += ' AND n.[CreatedDate] >= @StartDate'; params.StartDate = { type: mssql.Date, value: startDate }; }
    if (endDate) { where += ' AND n.[CreatedDate] <= @EndDate'; params.EndDate = { type: mssql.Date, value: endDate }; }

    const query = `
      SELECT
        n.[NotificationID],
        n.[NotificationType],
        r.[FirstName] + ' ' + r.[LastName] AS Recipient,
        r.[Email] AS RecipientEmail,
        n.[Message],
        n.[DeliveryChannel],
        n.[IsRead],
        n.[ReadDate],
        n.[CreatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Notification] n
      INNER JOIN [dbo].[Employee] r ON n.[RecipientID] = r.[EmployeeID]
      ${where}
      ORDER BY n.[CreatedDate] DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;
    const result = await this.query(query, params);
    const records = result.recordset || [];
    return { total: records[0]?.TotalCount || 0, data: records.map(r => ({ ...r, TotalCount: undefined })) };
  }
}

module.exports = new ReportRepository();
