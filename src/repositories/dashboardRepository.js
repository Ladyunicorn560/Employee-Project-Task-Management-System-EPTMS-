const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class DashboardRepository extends BaseRepository {
  /**
   * High-level System Overview Metrics
   */
  async getOverviewMetrics({ roleName, userId, departmentId, projectId }) {
    let projectWhere = 'WHERE p.[IsDeleted] = 0';
    let taskWhere = 'WHERE t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0';
    let empWhere = 'WHERE e.[IsDeleted] = 0';
    let msWhere = 'WHERE m.[IsDeleted] = 0 AND p.[IsDeleted] = 0';

    const params = {};

    if (roleName === 'Project Manager') {
      projectWhere += ' AND (p.[ProjectManagerID] = @PMUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @PMUserId AND pm.[IsDeleted] = 0))';
      taskWhere += ' AND (p.[ProjectManagerID] = @PMUserId OR t.[AssignedTo] = @PMUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @PMUserId AND pm.[IsDeleted] = 0))';
      msWhere += ' AND (p.[ProjectManagerID] = @PMUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @PMUserId AND pm.[IsDeleted] = 0))';
      params.PMUserId = { type: mssql.Int, value: userId };
    } else if (roleName === 'Employee') {
      projectWhere += ' AND EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @EmpUserId AND pm.[IsDeleted] = 0)';
      taskWhere += ' AND t.[AssignedTo] = @EmpUserId';
      msWhere += ' AND EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @EmpUserId AND pm.[IsDeleted] = 0)';
      params.EmpUserId = { type: mssql.Int, value: userId };
    } else if (roleName === 'Reviewer') {
      taskWhere += ' AND (t.[ReviewerID] = @RevUserId OR EXISTS (SELECT 1 FROM [dbo].[Review] r WHERE r.[TaskID] = t.[TaskID] AND r.[ReviewerID] = @RevUserId AND r.[IsDeleted] = 0))';
      params.RevUserId = { type: mssql.Int, value: userId };
    }

    if (departmentId) {
      empWhere += ' AND e.[DepartmentID] = @DeptId';
      projectWhere += ' AND p.[DepartmentID] = @DeptId';
      params.DeptId = { type: mssql.Int, value: departmentId };
    }

    if (projectId) {
      taskWhere += ' AND p.[ProjectID] = @ProjId';
      msWhere += ' AND p.[ProjectID] = @ProjId';
      params.ProjId = { type: mssql.Int, value: projectId };
    }

    const overviewQuery = `
      -- Employees
      SELECT 
        COUNT(*) AS TotalEmployees,
        COUNT(CASE WHEN e.[Status] = N'Active' THEN 1 END) AS ActiveEmployees
      FROM [dbo].[Employee] e
      ${empWhere};

      -- Projects
      SELECT 
        COUNT(*) AS TotalProjects,
        COUNT(CASE WHEN p.[Status] = N'Active' THEN 1 END) AS ActiveProjects,
        COUNT(CASE WHEN p.[Status] = N'Completed' THEN 1 END) AS CompletedProjects,
        COUNT(CASE WHEN p.[Status] = N'On Hold' THEN 1 END) AS OnHoldProjects,
        COUNT(CASE WHEN p.[Status] = N'Planning' THEN 1 END) AS PlanningProjects,
        AVG(CAST(p.[ProgressPercentage] AS FLOAT)) AS AverageProjectProgress
      FROM [dbo].[Project] p
      ${projectWhere};

      -- Tasks
      SELECT 
        COUNT(*) AS TotalTasks,
        COUNT(CASE WHEN t.[Status] = N'Completed' THEN 1 END) AS CompletedTasks,
        COUNT(CASE WHEN t.[Status] = N'In Progress' THEN 1 END) AS InProgressTasks,
        COUNT(CASE WHEN t.[Status] = N'Not Started' THEN 1 END) AS NotStartedTasks,
        COUNT(CASE WHEN t.[Status] = N'Blocked' THEN 1 END) AS BlockedTasks,
        COUNT(CASE WHEN t.[Status] = N'Under Review' OR t.[Status] = N'Ready for Review' THEN 1 END) AS UnderReviewTasks,
        COUNT(CASE WHEN t.[Status] <> N'Completed' AND t.[Status] <> N'Cancelled' AND t.[DueDate] < CAST(SYSUTCDATETIME() AS DATE) THEN 1 END) AS OverdueTasks
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      ${taskWhere};

      -- Milestones
      SELECT 
        COUNT(*) AS TotalMilestones,
        COUNT(CASE WHEN m.[Status] = N'Completed' THEN 1 END) AS CompletedMilestones,
        COUNT(CASE WHEN m.[Status] = N'In Progress' THEN 1 END) AS InProgressMilestones
      FROM [dbo].[Milestone] m
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      ${msWhere};
    `;

    const result = await this.query(overviewQuery, params);
    const emps = result.recordsets[0][0] || {};
    const projs = result.recordsets[1][0] || {};
    const tasks = result.recordsets[2][0] || {};
    const mss = result.recordsets[3][0] || {};

    return {
      employees: {
        total: emps.TotalEmployees || 0,
        active: emps.ActiveEmployees || 0
      },
      projects: {
        total: projs.TotalProjects || 0,
        active: projs.ActiveProjects || 0,
        completed: projs.CompletedProjects || 0,
        onHold: projs.OnHoldProjects || 0,
        planning: projs.PlanningProjects || 0,
        averageProgress: parseFloat((projs.AverageProjectProgress || 0).toFixed(2))
      },
      tasks: {
        total: tasks.TotalTasks || 0,
        completed: tasks.CompletedTasks || 0,
        inProgress: tasks.InProgressTasks || 0,
        notStarted: tasks.NotStartedTasks || 0,
        blocked: tasks.BlockedTasks || 0,
        underReview: tasks.UnderReviewTasks || 0,
        overdue: tasks.OverdueTasks || 0,
        completionRate: tasks.TotalTasks > 0 ? parseFloat(((tasks.CompletedTasks / tasks.TotalTasks) * 100).toFixed(2)) : 0
      },
      milestones: {
        total: mss.TotalMilestones || 0,
        completed: mss.CompletedMilestones || 0,
        inProgress: mss.InProgressMilestones || 0
      }
    };
  }

  /**
   * Project Analytics & Progress Distributions
   */
  async getProjectAnalytics({ roleName, userId, departmentId, startDate, endDate }) {
    let whereClause = 'WHERE p.[IsDeleted] = 0';
    const params = {};

    if (roleName === 'Project Manager') {
      whereClause += ' AND (p.[ProjectManagerID] = @PMUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @PMUserId AND pm.[IsDeleted] = 0))';
      params.PMUserId = { type: mssql.Int, value: userId };
    } else if (roleName === 'Employee') {
      whereClause += ' AND EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @EmpUserId AND pm.[IsDeleted] = 0)';
      params.EmpUserId = { type: mssql.Int, value: userId };
    }

    if (departmentId) {
      whereClause += ' AND p.[DepartmentID] = @DeptId';
      params.DeptId = { type: mssql.Int, value: departmentId };
    }

    if (startDate) {
      whereClause += ' AND p.[StartDate] >= @StartDate';
      params.StartDate = { type: mssql.Date, value: startDate };
    }

    if (endDate) {
      whereClause += ' AND p.[EndDate] <= @EndDate';
      params.EndDate = { type: mssql.Date, value: endDate };
    }

    const queryStr = `
      SELECT 
        p.[ProjectID],
        p.[ProjectName],
        p.[Status],
        p.[ProgressPercentage],
        p.[StartDate],
        p.[EndDate],
        d.[DepartmentName],
        pm.[FirstName] + ' ' + pm.[LastName] AS ProjectManagerName,
        (SELECT COUNT(*) FROM [dbo].[Task] t INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID] WHERE m.[ProjectID] = p.[ProjectID] AND t.[IsDeleted] = 0) AS TotalTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID] WHERE m.[ProjectID] = p.[ProjectID] AND t.[Status] = N'Completed' AND t.[IsDeleted] = 0) AS CompletedTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID] WHERE m.[ProjectID] = p.[ProjectID] AND t.[Status] <> N'Completed' AND t.[Status] <> N'Cancelled' AND t.[DueDate] < CAST(SYSUTCDATETIME() AS DATE) AND t.[IsDeleted] = 0) AS OverdueTasks
      FROM [dbo].[Project] p
      LEFT JOIN [dbo].[Department] d ON p.[DepartmentID] = d.[DepartmentID]
      LEFT JOIN [dbo].[Employee] pm ON p.[ProjectManagerID] = pm.[EmployeeID]
      ${whereClause}
      ORDER BY p.[ProgressPercentage] DESC;

      -- Aggregate Distribution by Status
      SELECT p.[Status], COUNT(*) AS Count
      FROM [dbo].[Project] p
      ${whereClause}
      GROUP BY p.[Status];
    `;

    const result = await this.query(queryStr, params);
    const projects = (result.recordsets[0] || []).map((r) => ({
      id: r.ProjectID,
      projectName: r.ProjectName,
      status: r.Status,
      progressPercentage: parseFloat(r.ProgressPercentage || 0),
      startDate: r.StartDate,
      endDate: r.EndDate,
      departmentName: r.DepartmentName,
      projectManagerName: r.ProjectManagerName,
      totalTasks: r.TotalTasks,
      completedTasks: r.CompletedTasks,
      openTasks: r.TotalTasks - r.CompletedTasks,
      overdueTasks: r.OverdueTasks,
      completionRate: r.TotalTasks > 0 ? parseFloat(((r.CompletedTasks / r.TotalTasks) * 100).toFixed(2)) : 0
    }));

    const statusDistribution = (result.recordsets[1] || []).reduce((acc, curr) => {
      acc[curr.Status] = curr.Count;
      return acc;
    }, {});

    return {
      totalProjects: projects.length,
      statusDistribution,
      projects
    };
  }

  /**
   * Task Analytics & Status/Priority Breakdown
   */
  async getTaskAnalytics({ roleName, userId, projectId, employeeId, startDate, endDate }) {
    let whereClause = 'WHERE t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0';
    const params = {};

    if (roleName === 'Project Manager') {
      whereClause += ' AND (p.[ProjectManagerID] = @PMUserId OR t.[AssignedTo] = @PMUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm WHERE pm.[ProjectID] = p.[ProjectID] AND pm.[EmployeeID] = @PMUserId AND pm.[IsDeleted] = 0))';
      params.PMUserId = { type: mssql.Int, value: userId };
    } else if (roleName === 'Employee') {
      whereClause += ' AND t.[AssignedTo] = @EmpUserId';
      params.EmpUserId = { type: mssql.Int, value: userId };
    } else if (roleName === 'Reviewer') {
      whereClause += ' AND (t.[ReviewerID] = @RevUserId OR EXISTS (SELECT 1 FROM [dbo].[Review] r WHERE r.[TaskID] = t.[TaskID] AND r.[ReviewerID] = @RevUserId AND r.[IsDeleted] = 0))';
      params.RevUserId = { type: mssql.Int, value: userId };
    }

    if (projectId) {
      whereClause += ' AND p.[ProjectID] = @ProjectId';
      params.ProjectId = { type: mssql.Int, value: projectId };
    }

    if (employeeId) {
      whereClause += ' AND t.[AssignedTo] = @FilterEmpId';
      params.FilterEmpId = { type: mssql.Int, value: employeeId };
    }

    if (startDate) {
      whereClause += ' AND t.[CreatedDate] >= @StartDate';
      params.StartDate = { type: mssql.Date, value: startDate };
    }

    if (endDate) {
      whereClause += ' AND t.[CreatedDate] <= @EndDate';
      params.EndDate = { type: mssql.Date, value: endDate };
    }

    const queryStr = `
      -- Breakdown by Status
      SELECT t.[Status], COUNT(*) AS Count
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      ${whereClause}
      GROUP BY t.[Status];

      -- Breakdown by Priority
      SELECT t.[Priority], COUNT(*) AS Count
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      ${whereClause}
      GROUP BY t.[Priority];

      -- Overall Task Aggregate Metrics
      SELECT 
        COUNT(*) AS TotalTasks,
        COUNT(CASE WHEN t.[Status] = N'Completed' THEN 1 END) AS CompletedTasks,
        COUNT(CASE WHEN t.[Status] <> N'Completed' AND t.[Status] <> N'Cancelled' AND t.[DueDate] < CAST(SYSUTCDATETIME() AS DATE) THEN 1 END) AS OverdueTasks
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      ${whereClause};
    `;

    const result = await this.query(queryStr, params);

    const statusBreakdown = (result.recordsets[0] || []).reduce((acc, curr) => {
      acc[curr.Status] = curr.Count;
      return acc;
    }, {});

    const priorityBreakdown = (result.recordsets[1] || []).reduce((acc, curr) => {
      acc[curr.Priority] = curr.Count;
      return acc;
    }, {});

    const totals = result.recordsets[2][0] || {};
    const totalTasks = totals.TotalTasks || 0;
    const completedTasks = totals.CompletedTasks || 0;

    return {
      totalTasks,
      completedTasks,
      openTasks: totalTasks - completedTasks,
      overdueTasks: totals.OverdueTasks || 0,
      completionRate: totalTasks > 0 ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(2)) : 0,
      byStatus: statusBreakdown,
      byPriority: priorityBreakdown
    };
  }

  /**
   * Employee Productivity & Workload Analytics
   */
  async getEmployeeAnalytics({ roleName, userId, departmentId, employeeId }) {
    let whereClause = 'WHERE e.[IsDeleted] = 0';
    const params = {};

    if (roleName === 'Employee') {
      whereClause += ' AND e.[EmployeeID] = @EmpUserId';
      params.EmpUserId = { type: mssql.Int, value: userId };
    } else if (roleName === 'Project Manager') {
      whereClause += ' AND (e.[EmployeeID] = @PMUserId OR EXISTS (SELECT 1 FROM [dbo].[ProjectMember] pm INNER JOIN [dbo].[Project] p ON pm.[ProjectID] = p.[ProjectID] WHERE pm.[EmployeeID] = e.[EmployeeID] AND p.[ProjectManagerID] = @PMUserId AND pm.[IsDeleted] = 0))';
      params.PMUserId = { type: mssql.Int, value: userId };
    }

    if (departmentId) {
      whereClause += ' AND e.[DepartmentID] = @DeptId';
      params.DeptId = { type: mssql.Int, value: departmentId };
    }

    if (employeeId) {
      whereClause += ' AND e.[EmployeeID] = @FilterEmpId';
      params.FilterEmpId = { type: mssql.Int, value: employeeId };
    }

    const queryStr = `
      SELECT 
        e.[EmployeeID],
        e.[FirstName] + ' ' + e.[LastName] AS EmployeeName,
        e.[Email],
        d.[DepartmentName],
        r.[RoleName],
        e.[Status] AS EmployeeStatus,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[AssignedTo] = e.[EmployeeID] AND t.[IsDeleted] = 0) AS AssignedTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[AssignedTo] = e.[EmployeeID] AND t.[Status] = N'Completed' AND t.[IsDeleted] = 0) AS CompletedTasks,
        (SELECT COUNT(*) FROM [dbo].[Task] t WHERE t.[AssignedTo] = e.[EmployeeID] AND t.[Status] <> N'Completed' AND t.[Status] <> N'Cancelled' AND t.[DueDate] < CAST(SYSUTCDATETIME() AS DATE) AND t.[IsDeleted] = 0) AS OverdueTasks,
        (SELECT COUNT(*) FROM [dbo].[Review] rw WHERE rw.[ReviewerID] = e.[EmployeeID] AND rw.[Status] = N'Pending' AND rw.[IsDeleted] = 0) AS PendingReviews
      FROM [dbo].[Employee] e
      LEFT JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      LEFT JOIN [dbo].[Role] r ON e.[RoleID] = r.[RoleID]
      ${whereClause}
      ORDER BY AssignedTasks DESC;
    `;

    const result = await this.query(queryStr, params);
    const employees = (result.recordset || []).map((emp) => ({
      id: emp.EmployeeID,
      employeeName: emp.EmployeeName,
      email: emp.Email,
      departmentName: emp.DepartmentName,
      roleName: emp.RoleName,
      status: emp.EmployeeStatus,
      assignedTasks: emp.AssignedTasks,
      completedTasks: emp.CompletedTasks,
      openTasks: emp.AssignedTasks - emp.CompletedTasks,
      overdueTasks: emp.OverdueTasks,
      pendingReviews: emp.PendingReviews,
      completionRate: emp.AssignedTasks > 0 ? parseFloat(((emp.CompletedTasks / emp.AssignedTasks) * 100).toFixed(2)) : 0
    }));

    return {
      totalEmployees: employees.length,
      employees
    };
  }

  /**
   * Notification Analytics
   */
  async getNotificationAnalytics({ roleName, userId }) {
    let whereClause = 'WHERE n.[IsDeleted] = 0';
    const params = {};

    if (roleName !== 'Administrator') {
      whereClause += ' AND n.[RecipientID] = @RecipientId';
      params.RecipientId = { type: mssql.Int, value: userId };
    }

    const queryStr = `
      SELECT 
        COUNT(*) AS TotalNotifications,
        COUNT(CASE WHEN n.[IsRead] = 0 THEN 1 END) AS UnreadNotifications,
        COUNT(CASE WHEN n.[IsRead] = 1 THEN 1 END) AS ReadNotifications
      FROM [dbo].[Notification] n
      ${whereClause};

      -- Breakdown by Type
      SELECT n.[NotificationType], COUNT(*) AS Count
      FROM [dbo].[Notification] n
      ${whereClause}
      GROUP BY n.[NotificationType];

      -- Breakdown by Delivery Channel
      SELECT n.[DeliveryChannel], COUNT(*) AS Count
      FROM [dbo].[Notification] n
      ${whereClause}
      GROUP BY n.[DeliveryChannel];
    `;

    const result = await this.query(queryStr, params);
    const totals = result.recordsets[0][0] || {};

    const byType = (result.recordsets[1] || []).reduce((acc, curr) => {
      acc[curr.NotificationType] = curr.Count;
      return acc;
    }, {});

    const byChannel = (result.recordsets[2] || []).reduce((acc, curr) => {
      acc[curr.DeliveryChannel] = curr.Count;
      return acc;
    }, {});

    return {
      totalNotifications: totals.TotalNotifications || 0,
      unreadNotifications: totals.UnreadNotifications || 0,
      readNotifications: totals.ReadNotifications || 0,
      byType,
      byChannel
    };
  }
}

module.exports = new DashboardRepository();
