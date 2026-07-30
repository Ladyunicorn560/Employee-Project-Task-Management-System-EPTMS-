const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class CommentRepository extends BaseRepository {
  /**
   * Fetches paginated & filtered comments list for a task
   */
  async findByTaskId(taskId, {
    search,
    createdBy,
    sortBy = 'CreatedDate',
    sortOrder = 'DESC',
    page = 1,
    limit = 10
  }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE c.[TaskID] = @TaskID AND c.[IsDeleted] = 0';
    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (createdBy) {
      whereClause += ' AND c.[EmployeeID] = @CreatedBy';
      params.CreatedBy = { type: mssql.Int, value: createdBy };
    }

    if (search) {
      whereClause += ' AND c.[CommentText] LIKE @Search';
      params.Search = { type: mssql.NVarChar(mssql.MAX), value: `%${search}%` };
    }

    const columnMap = {
      CommentID: 'CommentID',
      CreatedDate: 'CreatedDate'
    };
    const safeSortBy = columnMap[sortBy] || 'CreatedDate';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryStr = `
      SELECT 
        c.[CommentID],
        c.[TaskID],
        t.[Title] AS TaskTitle,
        m.[ProjectID],
        p.[ProjectName],
        c.[EmployeeID],
        e.[FirstName] AS AuthorFirstName,
        e.[LastName] AS AuthorLastName,
        e.[Email] AS AuthorEmail,
        c.[CommentText],
        c.[CreatedBy],
        c.[CreatedDate],
        c.[UpdatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Comment] c
      INNER JOIN [dbo].[Task] t ON c.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] e ON c.[EmployeeID] = e.[EmployeeID]
      ${whereClause}
      ORDER BY c.[${safeSortBy}] ${safeSortOrder}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, AuthorFirstName, AuthorLastName, AuthorEmail, ...comment } = rec;
      return {
        id: comment.CommentID,
        taskId: comment.TaskID,
        taskTitle: comment.TaskTitle,
        projectId: comment.ProjectID,
        projectName: comment.ProjectName,
        commentText: comment.CommentText,
        author: comment.EmployeeID
          ? {
              id: comment.EmployeeID,
              firstName: AuthorFirstName,
              lastName: AuthorLastName,
              email: AuthorEmail
            }
          : null,
        createdBy: comment.CreatedBy,
        createdDate: comment.CreatedDate,
        updatedDate: comment.UpdatedDate
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
   * Fetches single comment details by ID
   */
  async findById(commentId) {
    const queryStr = `
      SELECT 
        c.[CommentID],
        c.[TaskID],
        t.[Title] AS TaskTitle,
        t.[MilestoneID],
        m.[MilestoneTitle],
        m.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        c.[EmployeeID],
        e.[FirstName] AS AuthorFirstName,
        e.[LastName] AS AuthorLastName,
        e.[Email] AS AuthorEmail,
        c.[CommentText],
        c.[CreatedBy],
        c.[CreatedDate],
        c.[UpdatedDate]
      FROM [dbo].[Comment] c
      INNER JOIN [dbo].[Task] t ON c.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] e ON c.[EmployeeID] = e.[EmployeeID]
      WHERE c.[CommentID] = @CommentID AND c.[IsDeleted] = 0 AND t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0;
    `;

    const params = { CommentID: { type: mssql.Int, value: commentId } };
    const result = await this.query(queryStr, params);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const c = result.recordset[0];
    return {
      id: c.CommentID,
      taskId: c.TaskID,
      taskTitle: c.TaskTitle,
      milestoneId: c.MilestoneID,
      milestoneTitle: c.MilestoneTitle,
      projectId: c.ProjectID,
      projectName: c.ProjectName,
      projectManagerId: c.ProjectManagerID,
      commentText: c.CommentText,
      author: c.EmployeeID
        ? {
            id: c.EmployeeID,
            firstName: c.AuthorFirstName,
            lastName: c.AuthorLastName,
            email: c.AuthorEmail
          }
        : null,
      createdBy: c.CreatedBy,
      createdDate: c.CreatedDate,
      updatedDate: c.UpdatedDate
    };
  }

  /**
   * Fetches parent task and project hierarchy for validation
   */
  async getTaskProjectHierarchy(taskId) {
    const queryStr = `
      SELECT 
        t.[TaskID],
        t.[Title] AS TaskTitle,
        m.[MilestoneID],
        m.[ProjectID],
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
   * Inserts new comment record
   */
  async create({ taskId, employeeId, commentText, createdBy }, transaction = null) {
    const queryStr = `
      INSERT INTO [dbo].[Comment] (
        [TaskID], [EmployeeID], [CommentText], [CreatedBy]
      )
      OUTPUT INSERTED.[CommentID]
      VALUES (
        @TaskID, @EmployeeID, @CommentText, @CreatedBy
      );
    `;

    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      EmployeeID: { type: mssql.Int, value: employeeId },
      CommentText: { type: mssql.NVarChar(mssql.MAX), value: commentText },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.recordset[0].CommentID;
  }

  /**
   * Updates comment record
   */
  async update(commentId, commentText, updatedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Comment]
      SET 
        [CommentText] = @CommentText,
        [UpdatedBy] = @UpdatedBy,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [CommentID] = @CommentID AND [IsDeleted] = 0;
    `;

    const params = {
      CommentID: { type: mssql.Int, value: commentId },
      CommentText: { type: mssql.NVarChar(mssql.MAX), value: commentText },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    await this.query(queryStr, params, transaction);
  }

  /**
   * Soft deletes comment record
   */
  async softDelete(commentId, deletedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Comment]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [CommentID] = @CommentID AND [IsDeleted] = 0;
    `;

    const params = {
      CommentID: { type: mssql.Int, value: commentId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params, transaction);
  }
}

module.exports = new CommentRepository();
