const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class SubtaskRepository extends BaseRepository {
  /**
   * Fetches paginated & filtered subtasks list for a task
   */
  async findByTaskId(taskId, {
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

    let whereClause = 'WHERE st.[TaskID] = @TaskID AND st.[IsDeleted] = 0';
    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (status) {
      whereClause += ' AND st.[Status] = @Status';
      params.Status = { type: mssql.NVarChar(30), value: status };
    }

    if (priority) {
      whereClause += ' AND st.[Priority] = @Priority';
      params.Priority = { type: mssql.NVarChar(20), value: priority };
    }

    if (assignedEmployeeId) {
      whereClause += ' AND st.[AssignedTo] = @AssignedEmployeeID';
      params.AssignedEmployeeID = { type: mssql.Int, value: assignedEmployeeId };
    }

    if (search) {
      whereClause += ' AND (st.[Title] LIKE @Search OR st.[Description] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    const columnMap = {
      SubtaskID: 'SubtaskID',
      SubtaskTitle: 'Title',
      DueDate: 'DueDate',
      Priority: 'Priority',
      Status: 'Status'
    };
    const safeSortBy = columnMap[sortBy] || 'DueDate';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const queryStr = `
      SELECT 
        st.[SubtaskID],
        st.[TaskID],
        t.[Title] AS TaskTitle,
        t.[MilestoneID],
        m.[MilestoneTitle],
        m.[ProjectID],
        p.[ProjectName],
        st.[Title] AS SubtaskTitle,
        st.[Description],
        st.[AssignedTo] AS AssignedEmployeeID,
        ae.[FirstName] AS AssigneeFirstName,
        ae.[LastName] AS AssigneeLastName,
        ae.[Email] AS AssigneeEmail,
        st.[Priority],
        st.[Status],
        st.[IsCompleted],
        st.[DueDate],
        st.[CompletedDate],
        st.[EstimatedHours],
        st.[ActualHours],
        st.[CreatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Subtask] st
      INNER JOIN [dbo].[Task] t ON st.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] ae ON st.[AssignedTo] = ae.[EmployeeID]
      ${whereClause}
      ORDER BY st.[${safeSortBy}] ${safeSortOrder}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, AssigneeFirstName, AssigneeLastName, AssigneeEmail, ...st } = rec;
      return {
        id: st.SubtaskID,
        taskId: st.TaskID,
        taskTitle: st.TaskTitle,
        milestoneId: st.MilestoneID,
        milestoneTitle: st.MilestoneTitle,
        projectId: st.ProjectID,
        projectName: st.ProjectName,
        subtaskTitle: st.SubtaskTitle,
        description: st.Description,
        assignedEmployee: st.AssignedEmployeeID
          ? {
              id: st.AssignedEmployeeID,
              firstName: AssigneeFirstName,
              lastName: AssigneeLastName,
              email: AssigneeEmail
            }
          : null,
        priority: st.Priority,
        status: st.Status,
        isCompleted: Boolean(st.IsCompleted),
        dueDate: st.DueDate,
        completedDate: st.CompletedDate,
        estimatedHours: st.EstimatedHours,
        actualHours: st.ActualHours,
        createdDate: st.CreatedDate
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
   * Fetches single subtask details by ID
   */
  async findById(subtaskId) {
    const queryStr = `
      SELECT 
        st.[SubtaskID],
        st.[TaskID],
        t.[Title] AS TaskTitle,
        t.[DueDate] AS TaskDueDate,
        t.[AssignedTo] AS TaskAssignedTo,
        t.[MilestoneID],
        m.[MilestoneTitle],
        m.[DueDate] AS MilestoneDueDate,
        m.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        p.[StartDate] AS ProjectStartDate,
        p.[EndDate] AS ProjectEndDate,
        st.[Title] AS SubtaskTitle,
        st.[Description],
        st.[AssignedTo] AS AssignedEmployeeID,
        ae.[FirstName] AS AssigneeFirstName,
        ae.[LastName] AS AssigneeLastName,
        ae.[Email] AS AssigneeEmail,
        st.[Priority],
        st.[Status],
        st.[IsCompleted],
        st.[DueDate],
        st.[CompletedDate],
        st.[EstimatedHours],
        st.[ActualHours],
        st.[CreatedDate]
      FROM [dbo].[Subtask] st
      INNER JOIN [dbo].[Task] t ON st.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] ae ON st.[AssignedTo] = ae.[EmployeeID]
      WHERE st.[SubtaskID] = @SubtaskID AND st.[IsDeleted] = 0 AND t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0;
    `;

    const params = { SubtaskID: { type: mssql.Int, value: subtaskId } };
    const result = await this.query(queryStr, params);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const st = result.recordset[0];
    return {
      id: st.SubtaskID,
      taskId: st.TaskID,
      taskTitle: st.TaskTitle,
      taskDueDate: st.TaskDueDate,
      taskAssignedTo: st.TaskAssignedTo,
      milestoneId: st.MilestoneID,
      milestoneTitle: st.MilestoneTitle,
      milestoneDueDate: st.MilestoneDueDate,
      projectId: st.ProjectID,
      projectName: st.ProjectName,
      projectManagerId: st.ProjectManagerID,
      projectStartDate: st.ProjectStartDate,
      projectEndDate: st.ProjectEndDate,
      subtaskTitle: st.SubtaskTitle,
      description: st.Description,
      assignedEmployee: st.AssignedEmployeeID
        ? {
            id: st.AssignedEmployeeID,
            firstName: st.AssigneeFirstName,
            lastName: st.AssigneeLastName,
            email: st.AssigneeEmail
          }
        : null,
      priority: st.Priority,
      status: st.Status,
      isCompleted: Boolean(st.IsCompleted),
      dueDate: st.DueDate,
      completedDate: st.CompletedDate,
      estimatedHours: st.EstimatedHours,
      actualHours: st.ActualHours,
      createdDate: st.CreatedDate
    };
  }

  /**
   * Checks if subtask title exists within task
   */
  async findTitleInTask(taskId, title, excludeSubtaskId = null) {
    let queryStr = `
      SELECT [SubtaskID] 
      FROM [dbo].[Subtask] 
      WHERE LOWER([Title]) = LOWER(@Title) 
        AND [TaskID] = @TaskID 
        AND [IsDeleted] = 0
    `;

    const params = {
      Title: { type: mssql.NVarChar(200), value: title },
      TaskID: { type: mssql.Int, value: taskId }
    };

    if (excludeSubtaskId) {
      queryStr += ' AND [SubtaskID] <> @ExcludeSubtaskId';
      params.ExcludeSubtaskId = { type: mssql.Int, value: excludeSubtaskId };
    }

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Fetches full task, milestone, and project hierarchy for subtask validation
   */
  async getTaskMilestoneProjectHierarchy(taskId) {
    const queryStr = `
      SELECT 
        t.[TaskID],
        t.[Title] AS TaskTitle,
        t.[DueDate] AS TaskDueDate,
        t.[AssignedTo] AS TaskAssignedTo,
        t.[Status] AS TaskStatus,
        m.[MilestoneID],
        m.[MilestoneTitle],
        m.[DueDate] AS MilestoneDueDate,
        m.[Status] AS MilestoneStatus,
        p.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        p.[StartDate] AS ProjectStartDate,
        p.[EndDate] AS ProjectEndDate
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      WHERE t.[TaskID] = @TaskID AND t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0;
    `;

    const params = { TaskID: { type: mssql.Int, value: taskId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * 3-Tier Progress Recalculation: Subtask -> Task -> Milestone -> Project inside transaction
   */
  async recalculateSubtaskTaskMilestoneProjectProgress(taskId, milestoneId, projectId, updatedBy, transaction) {
    // Tier 1: Calculate Subtasks Completion -> Parent Task Status
    const subtasksQuery = `
      SELECT 
        COUNT(*) AS TotalSubtasks,
        SUM(CASE WHEN [Status] = N'Completed' THEN 1 ELSE 0 END) AS CompletedSubtasks
      FROM [dbo].[Subtask]
      WHERE [TaskID] = @TaskID AND [IsDeleted] = 0;
    `;

    const stResult = await this.query(subtasksQuery, { TaskID: { type: mssql.Int, value: taskId } }, transaction);
    const { TotalSubtasks, CompletedSubtasks } = stResult.recordset[0] || { TotalSubtasks: 0, CompletedSubtasks: 0 };

    if (TotalSubtasks > 0 && CompletedSubtasks === TotalSubtasks) {
      const updateTaskQuery = `
        UPDATE [dbo].[Task]
        SET 
          [Status] = N'Completed',
          [CompletedDate] = ISNULL([CompletedDate], CAST(SYSUTCDATETIME() AS DATE)),
          [UpdatedBy] = @UpdatedBy,
          [UpdatedDate] = SYSUTCDATETIME()
        WHERE [TaskID] = @TaskID AND [IsDeleted] = 0;
      `;
      await this.query(updateTaskQuery, {
        TaskID: { type: mssql.Int, value: taskId },
        UpdatedBy: { type: mssql.Int, value: updatedBy }
      }, transaction);
    }

    // Tier 2: Calculate Milestone Tasks Status
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

    // Tier 3: Calculate overall Project Progress Percentage
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
   * Inserts new subtask record within optional transaction
   */
  async create({
    taskId,
    subtaskTitle,
    description,
    assignedEmployeeId,
    priority,
    status,
    dueDate,
    completedDate,
    estimatedHours,
    actualHours,
    createdBy
  }, transaction = null) {
    const isCompleted = status === 'Completed' ? 1 : 0;

    const queryStr = `
      INSERT INTO [dbo].[Subtask] (
        [TaskID], [Title], [Description], [AssignedTo], 
        [Priority], [Status], [IsCompleted], [DueDate], [CompletedDate], 
        [EstimatedHours], [ActualHours], [CreatedBy]
      )
      OUTPUT INSERTED.[SubtaskID]
      VALUES (
        @TaskID, @Title, @Description, @AssignedTo, 
        @Priority, @Status, @IsCompleted, @DueDate, @CompletedDate, 
        @EstimatedHours, @ActualHours, @CreatedBy
      );
    `;

    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      Title: { type: mssql.NVarChar(200), value: subtaskTitle },
      Description: { type: mssql.NVarChar(mssql.MAX), value: description || null },
      AssignedTo: { type: mssql.Int, value: assignedEmployeeId || null },
      Priority: { type: mssql.NVarChar(20), value: priority || 'Medium' },
      Status: { type: mssql.NVarChar(30), value: status || 'Not Started' },
      IsCompleted: { type: mssql.Bit, value: isCompleted },
      DueDate: { type: mssql.Date, value: dueDate },
      CompletedDate: { type: mssql.Date, value: completedDate || null },
      EstimatedHours: { type: mssql.Decimal(6, 2), value: estimatedHours || null },
      ActualHours: { type: mssql.Decimal(6, 2), value: actualHours || null },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.recordset[0].SubtaskID;
  }

  /**
   * Updates subtask record within optional transaction
   */
  async update(subtaskId, updateData, updatedBy, transaction = null) {
    const setClauses = ['[UpdatedBy] = @UpdatedBy', '[UpdatedDate] = SYSUTCDATETIME()'];
    const params = {
      SubtaskID: { type: mssql.Int, value: subtaskId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (updateData.subtaskTitle !== undefined) {
      setClauses.push('[Title] = @Title');
      params.Title = { type: mssql.NVarChar(200), value: updateData.subtaskTitle };
    }
    if (updateData.description !== undefined) {
      setClauses.push('[Description] = @Description');
      params.Description = { type: mssql.NVarChar(mssql.MAX), value: updateData.description || null };
    }
    if (updateData.assignedEmployeeId !== undefined) {
      setClauses.push('[AssignedTo] = @AssignedTo');
      params.AssignedTo = { type: mssql.Int, value: updateData.assignedEmployeeId || null };
    }
    if (updateData.priority !== undefined) {
      setClauses.push('[Priority] = @Priority');
      params.Priority = { type: mssql.NVarChar(20), value: updateData.priority };
    }
    if (updateData.status !== undefined) {
      setClauses.push('[Status] = @Status');
      params.Status = { type: mssql.NVarChar(30), value: updateData.status };

      if (updateData.status === 'Completed') {
        setClauses.push('[IsCompleted] = 1');
        setClauses.push('[CompletedDate] = ISNULL(@CompletedDate, CAST(SYSUTCDATETIME() AS DATE))');
        params.CompletedDate = { type: mssql.Date, value: updateData.completedDate || null };
      } else {
        setClauses.push('[IsCompleted] = 0');
        setClauses.push('[CompletedDate] = NULL');
      }
    }
    if (updateData.dueDate !== undefined) {
      setClauses.push('[DueDate] = @DueDate');
      params.DueDate = { type: mssql.Date, value: updateData.dueDate };
    }
    if (updateData.estimatedHours !== undefined) {
      setClauses.push('[EstimatedHours] = @EstimatedHours');
      params.EstimatedHours = { type: mssql.Decimal(6, 2), value: updateData.estimatedHours || null };
    }
    if (updateData.actualHours !== undefined) {
      setClauses.push('[ActualHours] = @ActualHours');
      params.ActualHours = { type: mssql.Decimal(6, 2), value: updateData.actualHours || null };
    }

    const queryStr = `
      UPDATE [dbo].[Subtask]
      SET ${setClauses.join(', ')}
      WHERE [SubtaskID] = @SubtaskID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params, transaction);
  }

  /**
   * Soft deletes subtask record within optional transaction
   */
  async softDelete(subtaskId, deletedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Subtask]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [SubtaskID] = @SubtaskID AND [IsDeleted] = 0;
    `;

    const params = {
      SubtaskID: { type: mssql.Int, value: subtaskId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params, transaction);
  }
}

module.exports = new SubtaskRepository();
