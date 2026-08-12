const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class MilestoneRepository extends BaseRepository {
  /**
   * Fetches paginated & filtered milestones list for a project
   */
  async findByProjectId(projectId, {
    search,
    status,
    dueDate,
    sortBy = 'DueDate',
    sortOrder = 'ASC',
    page = 1,
    limit = 10
  }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE m.[ProjectID] = @ProjectID AND m.[IsDeleted] = 0';
    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (status) {
      whereClause += ' AND m.[Status] = @Status';
      params.Status = { type: mssql.NVarChar(30), value: status };
    }

    if (search) {
      whereClause += ' AND (m.[MilestoneTitle] LIKE @Search OR m.[Description] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    if (dueDate) {
      whereClause += ' AND m.[DueDate] = @FilterDueDate';
      params.FilterDueDate = { type: mssql.Date, value: dueDate };
    }

    const allowedSortColumns = ['MilestoneID', 'MilestoneTitle', 'DueDate', 'Status'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'DueDate';
    const safeSortOrder = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const queryStr = `
      SELECT 
        m.[MilestoneID],
        m.[ProjectID],
        p.[ProjectName],
        m.[MilestoneTitle],
        m.[Description],
        m.[DueDate],
        m.[CompletedDate],
        m.[Status],
        m.[CreatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Milestone] m
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      ${whereClause}
      ORDER BY m.[${safeSortBy}] ${safeSortOrder}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, ...ms } = rec;
      return {
        id: ms.MilestoneID,
        projectId: ms.ProjectID,
        projectName: ms.ProjectName,
        milestoneTitle: ms.MilestoneTitle,
        description: ms.Description,
        dueDate: ms.DueDate,
        completedDate: ms.CompletedDate,
        status: ms.Status,
        createdDate: ms.CreatedDate
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
   * Fetches single milestone details by ID
   */
  async findById(milestoneId) {
    const queryStr = `
      SELECT 
        m.[MilestoneID],
        m.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        p.[StartDate] AS ProjectStartDate,
        p.[EndDate] AS ProjectEndDate,
        m.[MilestoneTitle],
        m.[Description],
        m.[DueDate],
        m.[CompletedDate],
        m.[Status],
        m.[CreatedDate]
      FROM [dbo].[Milestone] m
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      WHERE m.[MilestoneID] = @MilestoneID AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0;
    `;

    const params = { MilestoneID: { type: mssql.Int, value: milestoneId } };
    const result = await this.query(queryStr, params);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const ms = result.recordset[0];
    return {
      id: ms.MilestoneID,
      projectId: ms.ProjectID,
      projectName: ms.ProjectName,
      projectManagerId: ms.ProjectManagerID,
      projectStartDate: ms.ProjectStartDate,
      projectEndDate: ms.ProjectEndDate,
      milestoneTitle: ms.MilestoneTitle,
      description: ms.Description,
      dueDate: ms.DueDate,
      completedDate: ms.CompletedDate,
      status: ms.Status,
      createdDate: ms.CreatedDate
    };
  }

  /**
   * Checks if milestone title exists within project
   */
  async findTitleInProject(projectId, title, excludeMilestoneId = null) {
    let queryStr = `
      SELECT [MilestoneID] 
      FROM [dbo].[Milestone] 
      WHERE LOWER([MilestoneTitle]) = LOWER(@Title) 
        AND [ProjectID] = @ProjectID 
        AND [IsDeleted] = 0
    `;

    const params = {
      Title: { type: mssql.NVarChar(200), value: title },
      ProjectID: { type: mssql.Int, value: projectId }
    };

    if (excludeMilestoneId) {
      queryStr += ' AND [MilestoneID] <> @ExcludeMilestoneId';
      params.ExcludeMilestoneId = { type: mssql.Int, value: excludeMilestoneId };
    }

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Fetches project date range and manager for milestone validation
   */
  async getProjectWithDates(projectId) {
    const queryStr = `
      SELECT [ProjectID], [ProjectName], [ProjectManagerID], [StartDate], [EndDate], [Status]
      FROM [dbo].[Project]
      WHERE [ProjectID] = @ProjectID AND [IsDeleted] = 0;
    `;

    const params = { ProjectID: { type: mssql.Int, value: projectId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Gets active task count assigned under a milestone
   */
  async getActiveTaskCount(milestoneId) {
    const queryStr = `
      SELECT COUNT(*) AS TaskCount
      FROM [dbo].[Task]
      WHERE [MilestoneID] = @MilestoneID AND [IsDeleted] = 0;
    `;

    const params = { MilestoneID: { type: mssql.Int, value: milestoneId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0].TaskCount : 0;
  }

  /**
   * Gets incomplete active task count assigned under a milestone
   */
  async getIncompleteTaskCount(milestoneId) {
    const queryStr = `
      SELECT COUNT(*) AS TaskCount
      FROM [dbo].[Task]
      WHERE [MilestoneID] = @MilestoneID AND [Status] <> N'Completed' AND [Status] <> N'Cancelled' AND [IsDeleted] = 0;
    `;

    const params = { MilestoneID: { type: mssql.Int, value: milestoneId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0].TaskCount : 0;
  }

  /**
   * Inserts new milestone record within optional transaction
   */
  async create({ projectId, milestoneTitle, description, dueDate, completedDate, status, createdBy }, transaction = null) {
    const queryStr = `
      INSERT INTO [dbo].[Milestone] (
        [ProjectID], [MilestoneTitle], [Description], [DueDate], [CompletedDate], [Status], [CreatedBy]
      )
      OUTPUT INSERTED.[MilestoneID]
      VALUES (
        @ProjectID, @MilestoneTitle, @Description, @DueDate, @CompletedDate, @Status, @CreatedBy
      );
    `;

    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      MilestoneTitle: { type: mssql.NVarChar(200), value: milestoneTitle },
      Description: { type: mssql.NVarChar(mssql.MAX), value: description || null },
      DueDate: { type: mssql.Date, value: dueDate },
      CompletedDate: { type: mssql.Date, value: completedDate || null },
      Status: { type: mssql.NVarChar(30), value: status || 'Not Started' },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.recordset[0].MilestoneID;
  }

  /**
   * Updates milestone record within optional transaction
   */
  async update(milestoneId, updateData, updatedBy, transaction = null) {
    const setClauses = ['[UpdatedBy] = @UpdatedBy', '[UpdatedDate] = SYSUTCDATETIME()'];
    const params = {
      MilestoneID: { type: mssql.Int, value: milestoneId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (updateData.milestoneTitle !== undefined) {
      setClauses.push('[MilestoneTitle] = @MilestoneTitle');
      params.MilestoneTitle = { type: mssql.NVarChar(200), value: updateData.milestoneTitle };
    }
    if (updateData.description !== undefined) {
      setClauses.push('[Description] = @Description');
      params.Description = { type: mssql.NVarChar(mssql.MAX), value: updateData.description || null };
    }
    if (updateData.dueDate !== undefined) {
      setClauses.push('[DueDate] = @DueDate');
      params.DueDate = { type: mssql.Date, value: updateData.dueDate };
    }
    if (updateData.completedDate !== undefined) {
      setClauses.push('[CompletedDate] = @CompletedDate');
      params.CompletedDate = { type: mssql.Date, value: updateData.completedDate || null };
    }
    if (updateData.status !== undefined) {
      setClauses.push('[Status] = @Status');
      params.Status = { type: mssql.NVarChar(30), value: updateData.status };

      // Auto-set CompletedDate if status changed to Completed and CompletedDate not specified
      if (updateData.status === 'Completed' && !updateData.completedDate) {
        setClauses.push('[CompletedDate] = CAST(SYSUTCDATETIME() AS DATE)');
      }
    }

    const queryStr = `
      UPDATE [dbo].[Milestone]
      SET ${setClauses.join(', ')}
      WHERE [MilestoneID] = @MilestoneID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params, transaction);
  }

  /**
   * Soft deletes milestone record within optional transaction
   */
  async softDelete(milestoneId, deletedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Milestone]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [MilestoneID] = @MilestoneID AND [IsDeleted] = 0;
    `;

    const params = {
      MilestoneID: { type: mssql.Int, value: milestoneId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params, transaction);
  }
}

module.exports = new MilestoneRepository();
