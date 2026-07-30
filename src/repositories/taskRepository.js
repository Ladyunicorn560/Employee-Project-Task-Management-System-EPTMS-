const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class TaskRepository extends BaseRepository {
  /**
   * Fetches paginated & filtered tasks list for a milestone
   */
  async findByMilestoneId(milestoneId, {
    search,
    status,
    priority,
    assignedEmployeeId,
    sortBy = 'DueDate',
    sortOrder = 'ASC',
    page = 1,
    limit = 10
  }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE t.[MilestoneID] = @MilestoneID AND t.[IsDeleted] = 0';
    const params = {
      MilestoneID: { type: mssql.Int, value: milestoneId },
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (status) {
      whereClause += ' AND t.[Status] = @Status';
      params.Status = { type: mssql.NVarChar(30), value: status };
    }

    if (priority) {
      whereClause += ' AND t.[Priority] = @Priority';
      params.Priority = { type: mssql.NVarChar(20), value: priority };
    }

    if (assignedEmployeeId) {
      whereClause += ' AND t.[AssignedTo] = @AssignedEmployeeID';
      params.AssignedEmployeeID = { type: mssql.Int, value: assignedEmployeeId };
    }

    if (search) {
      whereClause += ' AND (t.[Title] LIKE @Search OR t.[Description] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    const columnMap = {
      TaskID: 'TaskID',
      TaskTitle: 'Title',
      DueDate: 'DueDate',
      Priority: 'Priority',
      Status: 'Status'
    };
    const safeSortBy = columnMap[sortBy] || 'DueDate';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const queryStr = `
      SELECT 
        t.[TaskID],
        t.[MilestoneID],
        m.[MilestoneTitle],
        m.[ProjectID],
        p.[ProjectName],
        t.[Title] AS TaskTitle,
        t.[Description],
        t.[AssignedTo] AS AssignedEmployeeID,
        ae.[FirstName] AS AssigneeFirstName,
        ae.[LastName] AS AssigneeLastName,
        ae.[Email] AS AssigneeEmail,
        t.[ReviewerID],
        t.[Priority],
        t.[Status],
        t.[StartDate],
        t.[DueDate],
        t.[CompletedDate],
        t.[CreatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] ae ON t.[AssignedTo] = ae.[EmployeeID]
      ${whereClause}
      ORDER BY t.[${safeSortBy}] ${safeSortOrder}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, AssigneeFirstName, AssigneeLastName, AssigneeEmail, ...task } = rec;
      return {
        id: task.TaskID,
        milestoneId: task.MilestoneID,
        milestoneTitle: task.MilestoneTitle,
        projectId: task.ProjectID,
        projectName: task.ProjectName,
        taskTitle: task.TaskTitle,
        description: task.Description,
        assignedEmployee: task.AssignedEmployeeID
          ? {
              id: task.AssignedEmployeeID,
              firstName: AssigneeFirstName,
              lastName: AssigneeLastName,
              email: AssigneeEmail
            }
          : null,
        reviewerId: task.ReviewerID,
        priority: task.Priority,
        status: task.Status,
        startDate: task.StartDate,
        dueDate: task.DueDate,
        completedDate: task.CompletedDate,
        createdDate: task.CreatedDate
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      data
    };
  }

  /**
   * Fetches single task details by ID
   */
  async findById(taskId) {
    const queryStr = `
      SELECT 
        t.[TaskID],
        t.[MilestoneID],
        m.[MilestoneTitle],
        m.[DueDate] AS MilestoneDueDate,
        m.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        p.[StartDate] AS ProjectStartDate,
        p.[EndDate] AS ProjectEndDate,
        t.[Title] AS TaskTitle,
        t.[Description],
        t.[AssignedTo] AS AssignedEmployeeID,
        ae.[FirstName] AS AssigneeFirstName,
        ae.[LastName] AS AssigneeLastName,
        ae.[Email] AS AssigneeEmail,
        t.[ReviewerID],
        t.[Priority],
        t.[Status],
        t.[StartDate],
        t.[DueDate],
        t.[CompletedDate],
        t.[CreatedDate]
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] ae ON t.[AssignedTo] = ae.[EmployeeID]
      WHERE t.[TaskID] = @TaskID AND t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0;
    `;

    const params = { TaskID: { type: mssql.Int, value: taskId } };
    const result = await this.query(queryStr, params);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const task = result.recordset[0];
    return {
      id: task.TaskID,
      milestoneId: task.MilestoneID,
      milestoneTitle: task.MilestoneTitle,
      milestoneDueDate: task.MilestoneDueDate,
      projectId: task.ProjectID,
      projectName: task.ProjectName,
      projectManagerId: task.ProjectManagerID,
      projectStartDate: task.ProjectStartDate,
      projectEndDate: task.ProjectEndDate,
      taskTitle: task.TaskTitle,
      description: task.Description,
      assignedEmployee: task.AssignedEmployeeID
        ? {
            id: task.AssignedEmployeeID,
            firstName: task.AssigneeFirstName,
            lastName: task.AssigneeLastName,
            email: task.AssigneeEmail
          }
        : null,
      reviewerId: task.ReviewerID,
      priority: task.Priority,
      status: task.Status,
      startDate: task.StartDate,
      dueDate: task.DueDate,
      completedDate: task.CompletedDate,
      createdDate: task.CreatedDate
    };
  }

  /**
   * Checks if task title exists within milestone
   */
  async findTitleInMilestone(milestoneId, title, excludeTaskId = null) {
    let queryStr = `
      SELECT [TaskID] 
      FROM [dbo].[Task] 
      WHERE LOWER([Title]) = LOWER(@Title) 
        AND [MilestoneID] = @MilestoneID 
        AND [IsDeleted] = 0
    `;

    const params = {
      Title: { type: mssql.NVarChar(200), value: title },
      MilestoneID: { type: mssql.Int, value: milestoneId }
    };

    if (excludeTaskId) {
      queryStr += ' AND [TaskID] <> @ExcludeTaskId';
      params.ExcludeTaskId = { type: mssql.Int, value: excludeTaskId };
    }

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Fetches milestone, project, and manager details for hierarchy validation
   */
  async getMilestoneAndProjectHierarchy(milestoneId) {
    const queryStr = `
      SELECT 
        m.[MilestoneID],
        m.[MilestoneTitle],
        m.[DueDate] AS MilestoneDueDate,
        m.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        p.[StartDate] AS ProjectStartDate,
        p.[EndDate] AS ProjectEndDate,
        p.[Status] AS ProjectStatus
      FROM [dbo].[Milestone] m
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      WHERE m.[MilestoneID] = @MilestoneID AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0;
    `;

    const params = { MilestoneID: { type: mssql.Int, value: milestoneId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Recalculates Milestone status and Project progressPercentage inside transaction
   */
  async recalculateMilestoneAndProjectProgress(milestoneId, projectId, updatedBy, transaction) {
    // 1. Calculate milestone tasks status
    const msTasksQuery = `
      SELECT 
        COUNT(*) AS TotalTasks,
        SUM(CASE WHEN [Status] = N'Completed' THEN 1 ELSE 0 END) AS CompletedTasks
      FROM [dbo].[Task]
      WHERE [MilestoneID] = @MilestoneID AND [IsDeleted] = 0;
    `;

    const msResult = await this.query(msTasksQuery, { MilestoneID: { type: mssql.Int, value: milestoneId } }, transaction);
    const { TotalTasks, CompletedTasks } = msResult.recordset[0] || { TotalTasks: 0, CompletedTasks: 0 };

    if (TotalTasks > 0 && CompletedTasks === TotalTasks) {
      const updateMsQuery = `
        UPDATE [dbo].[Milestone]
        SET 
          [Status] = N'Completed',
          [CompletedDate] = ISNULL([CompletedDate], CAST(SYSUTCDATETIME() AS DATE)),
          [UpdatedBy] = @UpdatedBy,
          [UpdatedDate] = SYSUTCDATETIME()
        WHERE [MilestoneID] = @MilestoneID AND [IsDeleted] = 0;
      `;
      await this.query(updateMsQuery, {
        MilestoneID: { type: mssql.Int, value: milestoneId },
        UpdatedBy: { type: mssql.Int, value: updatedBy }
      }, transaction);
    }

    // 2. Calculate overall Project Progress Percentage
    const projTasksQuery = `
      SELECT 
        COUNT(*) AS TotalProjTasks,
        SUM(CASE WHEN t.[Status] = N'Completed' THEN 1 ELSE 0 END) AS CompletedProjTasks
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      WHERE m.[ProjectID] = @ProjectID AND t.[IsDeleted] = 0 AND m.[IsDeleted] = 0;
    `;

    const projResult = await this.query(projTasksQuery, { ProjectID: { type: mssql.Int, value: projectId } }, transaction);
    const { TotalProjTasks, CompletedProjTasks } = projResult.recordset[0] || { TotalProjTasks: 0, CompletedProjTasks: 0 };

    const calculatedProgress = TotalProjTasks > 0
      ? parseFloat(((CompletedProjTasks / TotalProjTasks) * 100).toFixed(2))
      : 0.00;

    const updateProjQuery = `
      UPDATE [dbo].[Project]
      SET 
        [ProgressPercentage] = @ProgressPercentage,
        [UpdatedBy] = @UpdatedBy,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [ProjectID] = @ProjectID AND [IsDeleted] = 0;
    `;

    await this.query(updateProjQuery, {
      ProjectID: { type: mssql.Int, value: projectId },
      ProgressPercentage: { type: mssql.Decimal(5, 2), value: calculatedProgress },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    }, transaction);
  }

  /**
   * Inserts new task record within optional transaction
   */
  async create({
    milestoneId,
    projectId,
    projectManagerId,
    taskTitle,
    description,
    assignedEmployeeId,
    reviewerId,
    priority,
    status,
    startDate,
    dueDate,
    completedDate,
    createdBy
  }, transaction = null) {
    const todayStr = new Date().toISOString().substring(0, 10);
    const effectiveStartDate = startDate || todayStr;
    const effectiveReviewerId = reviewerId || projectManagerId || createdBy;

    const queryStr = `
      INSERT INTO [dbo].[Task] (
        [ProjectID], [MilestoneID], [Title], [Description], [AssignedTo], [ReviewerID],
        [Priority], [Status], [StartDate], [DueDate], [CompletedDate], [CreatedBy]
      )
      OUTPUT INSERTED.[TaskID]
      VALUES (
        @ProjectID, @MilestoneID, @Title, @Description, @AssignedTo, @ReviewerID,
        @Priority, @Status, @StartDate, @DueDate, @CompletedDate, @CreatedBy
      );
    `;

    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      MilestoneID: { type: mssql.Int, value: milestoneId },
      Title: { type: mssql.NVarChar(200), value: taskTitle },
      Description: { type: mssql.NVarChar(mssql.MAX), value: description || null },
      AssignedTo: { type: mssql.Int, value: assignedEmployeeId || null },
      ReviewerID: { type: mssql.Int, value: effectiveReviewerId },
      Priority: { type: mssql.NVarChar(20), value: priority || 'Medium' },
      Status: { type: mssql.NVarChar(30), value: status || 'Not Started' },
      StartDate: { type: mssql.Date, value: effectiveStartDate },
      DueDate: { type: mssql.Date, value: dueDate },
      CompletedDate: { type: mssql.Date, value: completedDate || null },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.recordset[0].TaskID;
  }

  /**
   * Updates task record within optional transaction
   */
  async update(taskId, updateData, updatedBy, transaction = null) {
    const setClauses = ['[UpdatedBy] = @UpdatedBy', '[UpdatedDate] = SYSUTCDATETIME()'];
    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (updateData.taskTitle !== undefined) {
      setClauses.push('[Title] = @Title');
      params.Title = { type: mssql.NVarChar(200), value: updateData.taskTitle };
    }
    if (updateData.description !== undefined) {
      setClauses.push('[Description] = @Description');
      params.Description = { type: mssql.NVarChar(mssql.MAX), value: updateData.description || null };
    }
    if (updateData.assignedEmployeeId !== undefined) {
      setClauses.push('[AssignedTo] = @AssignedTo');
      params.AssignedTo = { type: mssql.Int, value: updateData.assignedEmployeeId || null };
    }
    if (updateData.reviewerId !== undefined) {
      setClauses.push('[ReviewerID] = @ReviewerID');
      params.ReviewerID = { type: mssql.Int, value: updateData.reviewerId };
    }
    if (updateData.priority !== undefined) {
      setClauses.push('[Priority] = @Priority');
      params.Priority = { type: mssql.NVarChar(20), value: updateData.priority };
    }
    if (updateData.status !== undefined) {
      setClauses.push('[Status] = @Status');
      params.Status = { type: mssql.NVarChar(30), value: updateData.status };

      if (updateData.status === 'Completed') {
        setClauses.push('[CompletedDate] = ISNULL(@CompletedDate, CAST(SYSUTCDATETIME() AS DATE))');
        params.CompletedDate = { type: mssql.Date, value: updateData.completedDate || null };
      } else {
        setClauses.push('[CompletedDate] = NULL');
      }
    }
    if (updateData.startDate !== undefined) {
      setClauses.push('[StartDate] = @StartDate');
      params.StartDate = { type: mssql.Date, value: updateData.startDate };
    }
    if (updateData.dueDate !== undefined) {
      setClauses.push('[DueDate] = @DueDate');
      params.DueDate = { type: mssql.Date, value: updateData.dueDate };
    }

    const queryStr = `
      UPDATE [dbo].[Task]
      SET ${setClauses.join(', ')}
      WHERE [TaskID] = @TaskID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params, transaction);
  }

  /**
   * Soft deletes task record within optional transaction
   */
  async softDelete(taskId, deletedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Task]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [TaskID] = @TaskID AND [IsDeleted] = 0;
    `;

    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params, transaction);
  }
}

module.exports = new TaskRepository();
