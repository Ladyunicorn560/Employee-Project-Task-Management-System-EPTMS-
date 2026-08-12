const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class ReviewRepository extends BaseRepository {
  /**
   * Fetches paginated reviews list for a task
   */
  async findByTaskId(taskId, {
    status,
    reviewerId,
    sortBy = 'Iteration',
    sortOrder = 'DESC',
    page = 1,
    limit = 10
  }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE r.[TaskID] = @TaskID AND r.[IsDeleted] = 0';
    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (status) {
      whereClause += ' AND r.[Status] = @Status';
      params.Status = { type: mssql.NVarChar(30), value: status };
    }

    if (reviewerId) {
      whereClause += ' AND r.[ReviewerID] = @ReviewerID';
      params.ReviewerID = { type: mssql.Int, value: reviewerId };
    }

    const columnMap = {
      ReviewID: 'ReviewID',
      Iteration: 'Iteration',
      CreatedDate: 'CreatedDate'
    };
    const safeSortBy = columnMap[sortBy] || 'Iteration';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryStr = `
      SELECT 
        r.[ReviewID],
        r.[TaskID],
        t.[Title] AS TaskTitle,
        m.[ProjectID],
        p.[ProjectName],
        r.[ReviewerID],
        e.[FirstName] AS ReviewerFirstName,
        e.[LastName] AS ReviewerLastName,
        e.[Email] AS ReviewerEmail,
        r.[Iteration],
        r.[Status],
        r.[Comments],
        r.[ReviewedDate],
        r.[CreatedBy],
        r.[CreatedDate],
        r.[UpdatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Review] r
      INNER JOIN [dbo].[Task] t ON r.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] e ON r.[ReviewerID] = e.[EmployeeID]
      ${whereClause}
      ORDER BY r.[${safeSortBy}] ${safeSortOrder}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, ReviewerFirstName, ReviewerLastName, ReviewerEmail, ...review } = rec;
      return {
        id: review.ReviewID,
        taskId: review.TaskID,
        taskTitle: review.TaskTitle,
        projectId: review.ProjectID,
        projectName: review.ProjectName,
        reviewer: review.ReviewerID
          ? {
              id: review.ReviewerID,
              firstName: ReviewerFirstName,
              lastName: ReviewerLastName,
              email: ReviewerEmail
            }
          : null,
        iteration: review.Iteration,
        status: review.Status,
        comments: review.Comments,
        reviewedDate: review.ReviewedDate,
        createdBy: review.CreatedBy,
        createdDate: review.CreatedDate,
        updatedDate: review.UpdatedDate
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
   * Fetches single review details by ID
   */
  async findById(reviewId) {
    const queryStr = `
      SELECT 
        r.[ReviewID],
        r.[TaskID],
        t.[Title] AS TaskTitle,
        t.[AssignedTo] AS TaskAssignedTo,
        t.[CreatedBy] AS TaskCreatedBy,
        t.[Status] AS TaskStatus,
        t.[MilestoneID],
        m.[MilestoneTitle],
        m.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        r.[ReviewerID],
        e.[FirstName] AS ReviewerFirstName,
        e.[LastName] AS ReviewerLastName,
        e.[Email] AS ReviewerEmail,
        r.[Iteration],
        r.[Status],
        r.[Comments],
        r.[ReviewedDate],
        r.[CreatedBy],
        r.[CreatedDate],
        r.[UpdatedDate]
      FROM [dbo].[Review] r
      INNER JOIN [dbo].[Task] t ON r.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] e ON r.[ReviewerID] = e.[EmployeeID]
      WHERE r.[ReviewID] = @ReviewID AND r.[IsDeleted] = 0 AND t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0;
    `;

    const params = { ReviewID: { type: mssql.Int, value: reviewId } };
    const result = await this.query(queryStr, params);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const r = result.recordset[0];
    return {
      id: r.ReviewID,
      taskId: r.TaskID,
      taskTitle: r.TaskTitle,
      taskAssignedTo: r.TaskAssignedTo,
      taskCreatedBy: r.TaskCreatedBy,
      taskStatus: r.TaskStatus,
      milestoneId: r.MilestoneID,
      milestoneTitle: r.MilestoneTitle,
      projectId: r.ProjectID,
      projectName: r.ProjectName,
      projectManagerId: r.ProjectManagerID,
      reviewer: r.ReviewerID
        ? {
            id: r.ReviewerID,
            firstName: r.ReviewerFirstName,
            lastName: r.ReviewerLastName,
            email: r.ReviewerEmail
          }
        : null,
      iteration: r.Iteration,
      status: r.Status,
      comments: r.Comments,
      reviewedDate: r.ReviewedDate,
      createdBy: r.CreatedBy,
      createdDate: r.CreatedDate,
      updatedDate: r.UpdatedDate
    };
  }

  /**
   * Checks if an active pending review exists for a task
   */
  async findPendingReviewForTask(taskId) {
    const queryStr = `
      SELECT [ReviewID]
      FROM [dbo].[Review]
      WHERE [TaskID] = @TaskID AND [Status] = N'Pending' AND [IsDeleted] = 0;
    `;

    const params = { TaskID: { type: mssql.Int, value: taskId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Calculates next iteration number for a task
   */
  async getNextIterationNumber(taskId) {
    const queryStr = `
      SELECT ISNULL(MAX([Iteration]), 0) + 1 AS NextIteration
      FROM [dbo].[Review]
      WHERE [TaskID] = @TaskID AND [IsDeleted] = 0;
    `;

    const params = { TaskID: { type: mssql.Int, value: taskId } };
    const result = await this.query(queryStr, params);
    return result.recordset[0].NextIteration;
  }

  /**
   * Fetches task, milestone, and project hierarchy with task assignee & creator
   */
  async getTaskHierarchyAndAssigned(taskId) {
    const queryStr = `
      SELECT 
        t.[TaskID],
        t.[Title] AS TaskTitle,
        t.[AssignedTo] AS TaskAssignedTo,
        t.[CreatedBy] AS TaskCreatedBy,
        t.[ReviewerID] AS TaskReviewerID,
        t.[Status] AS TaskStatus,
        m.[MilestoneID],
        m.[MilestoneTitle],
        p.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID]
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
   * Inserts new review record inside transaction
   */
  async create({ taskId, reviewerId, iteration, status, comments, createdBy }, transaction = null) {
    const reviewedDate = new Date();

    const queryStr = `
      INSERT INTO [dbo].[Review] (
        [TaskID], [ReviewerID], [Iteration], [Status], [Comments], [ReviewedDate], [CreatedBy]
      )
      OUTPUT INSERTED.[ReviewID]
      VALUES (
        @TaskID, @ReviewerID, @Iteration, @Status, @Comments, @ReviewedDate, @CreatedBy
      );
    `;

    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      ReviewerID: { type: mssql.Int, value: reviewerId },
      Iteration: { type: mssql.Int, value: iteration },
      Status: { type: mssql.NVarChar(30), value: status || 'Pending' },
      Comments: { type: mssql.NVarChar(mssql.MAX), value: comments || null },
      ReviewedDate: { type: mssql.DateTime2, value: reviewedDate },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.recordset[0].ReviewID;
  }

  /**
   * Updates review record status and outcome inside transaction
   */
  async update(reviewId, { status, comments }, updatedBy, transaction = null) {
    const setClauses = [
      '[Status] = @Status',
      '[UpdatedBy] = @UpdatedBy',
      '[UpdatedDate] = SYSUTCDATETIME()',
      '[ReviewedDate] = SYSUTCDATETIME()'
    ];
    const params = {
      ReviewID: { type: mssql.Int, value: reviewId },
      Status: { type: mssql.NVarChar(30), value: status },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (comments !== undefined) {
      setClauses.push('[Comments] = @Comments');
      params.Comments = { type: mssql.NVarChar(mssql.MAX), value: comments || null };
    }

    const queryStr = `
      UPDATE [dbo].[Review]
      SET ${setClauses.join(', ')}
      WHERE [ReviewID] = @ReviewID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params, transaction);
  }

  /**
   * Updates Task status inside transaction
   */
  async updateTaskStatus(taskId, status, updatedBy, transaction = null) {
    const setClauses = ['[Status] = @Status', '[UpdatedBy] = @UpdatedBy', '[UpdatedDate] = SYSUTCDATETIME()'];
    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      Status: { type: mssql.NVarChar(30), value: status },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (status === 'Completed') {
      setClauses.push('[CompletedDate] = ISNULL([CompletedDate], CAST(SYSUTCDATETIME() AS DATE))');
    }

    const queryStr = `
      UPDATE [dbo].[Task]
      SET ${setClauses.join(', ')}
      WHERE [TaskID] = @TaskID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params, transaction);
  }

  /**
   * Soft deletes review record
   */
  async softDelete(reviewId, deletedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Review]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [ReviewID] = @ReviewID AND [IsDeleted] = 0;
    `;

    const params = {
      ReviewID: { type: mssql.Int, value: reviewId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params, transaction);
  }
}

module.exports = new ReviewRepository();
