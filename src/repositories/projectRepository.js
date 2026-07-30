const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class ProjectRepository extends BaseRepository {
  /**
   * Fetches paginated & filtered projects list
   */
  async findAll({
    departmentId,
    projectManagerId,
    status,
    search,
    startDate,
    endDate,
    assignedEmployeeId,
    sortBy = 'ProjectID',
    sortOrder = 'DESC',
    page = 1,
    limit = 10
  }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE p.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (departmentId) {
      whereClause += ' AND p.[DepartmentID] = @DepartmentID';
      params.DepartmentID = { type: mssql.Int, value: departmentId };
    }

    if (projectManagerId) {
      whereClause += ' AND p.[ProjectManagerID] = @ProjectManagerID';
      params.ProjectManagerID = { type: mssql.Int, value: projectManagerId };
    }

    if (status) {
      whereClause += ' AND p.[Status] = @Status';
      params.Status = { type: mssql.NVarChar(30), value: status };
    }

    if (search) {
      whereClause += ' AND (p.[ProjectName] LIKE @Search OR p.[Description] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    if (startDate) {
      whereClause += ' AND p.[StartDate] >= @FilterStartDate';
      params.FilterStartDate = { type: mssql.Date, value: startDate };
    }

    if (endDate) {
      whereClause += ' AND p.[EndDate] <= @FilterEndDate';
      params.FilterEndDate = { type: mssql.Date, value: endDate };
    }

    // Filter projects for non-admin/PM employees (Assigned projects only)
    if (assignedEmployeeId) {
      whereClause += ` AND (
        p.[ProjectManagerID] = @AssignedEmployeeID 
        OR EXISTS (
          SELECT 1 FROM [dbo].[ProjectMember] pmemb 
          WHERE pmemb.[ProjectID] = p.[ProjectID] 
            AND pmemb.[EmployeeID] = @AssignedEmployeeID 
            AND pmemb.[IsDeleted] = 0
        )
      )`;
      params.AssignedEmployeeID = { type: mssql.Int, value: assignedEmployeeId };
    }

    // Whitelist sort column
    const allowedSortColumns = ['ProjectID', 'ProjectName', 'StartDate', 'EndDate', 'Status', 'ProgressPercentage'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'ProjectID';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryStr = `
      SELECT 
        p.[ProjectID],
        p.[ProjectName],
        p.[Description],
        p.[DepartmentID],
        d.[DepartmentName],
        p.[ProjectManagerID],
        pm.[FirstName] AS PMFirstName,
        pm.[LastName] AS PMLastName,
        pm.[Email] AS PMEmail,
        p.[StartDate],
        p.[EndDate],
        p.[ActualEndDate],
        p.[Status],
        p.[ProgressPercentage],
        p.[CreatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Project] p
      INNER JOIN [dbo].[Department] d ON p.[DepartmentID] = d.[DepartmentID]
      INNER JOIN [dbo].[Employee] pm ON p.[ProjectManagerID] = pm.[EmployeeID]
      ${whereClause}
      ORDER BY p.[${safeSortBy}] ${safeSortOrder}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, PMFirstName, PMLastName, PMEmail, ...proj } = rec;
      return {
        id: proj.ProjectID,
        projectName: proj.ProjectName,
        description: proj.Description,
        startDate: proj.StartDate,
        endDate: proj.EndDate,
        actualEndDate: proj.ActualEndDate,
        status: proj.Status,
        progressPercentage: proj.ProgressPercentage,
        createdDate: proj.CreatedDate,
        department: {
          id: proj.DepartmentID,
          name: proj.DepartmentName
        },
        projectManager: {
          id: proj.ProjectManagerID,
          firstName: PMFirstName,
          lastName: PMLastName,
          email: PMEmail
        }
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
   * Fetches single project details by ID
   */
  async findById(projectId) {
    const queryStr = `
      SELECT 
        p.[ProjectID],
        p.[ProjectName],
        p.[Description],
        p.[DepartmentID],
        d.[DepartmentName],
        p.[ProjectManagerID],
        pm.[FirstName] AS PMFirstName,
        pm.[LastName] AS PMLastName,
        pm.[Email] AS PMEmail,
        p.[StartDate],
        p.[EndDate],
        p.[ActualEndDate],
        p.[Status],
        p.[ProgressPercentage],
        p.[CreatedDate]
      FROM [dbo].[Project] p
      INNER JOIN [dbo].[Department] d ON p.[DepartmentID] = d.[DepartmentID]
      INNER JOIN [dbo].[Employee] pm ON p.[ProjectManagerID] = pm.[EmployeeID]
      WHERE p.[ProjectID] = @ProjectID AND p.[IsDeleted] = 0;
    `;

    const params = {
      ProjectID: { type: mssql.Int, value: projectId }
    };

    const result = await this.query(queryStr, params);
    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const proj = result.recordset[0];
    return {
      id: proj.ProjectID,
      projectName: proj.ProjectName,
      description: proj.Description,
      startDate: proj.StartDate,
      endDate: proj.EndDate,
      actualEndDate: proj.ActualEndDate,
      status: proj.Status,
      progressPercentage: proj.ProgressPercentage,
      createdDate: proj.CreatedDate,
      department: {
        id: proj.DepartmentID,
        name: proj.DepartmentName
      },
      projectManager: {
        id: proj.ProjectManagerID,
        firstName: proj.PMFirstName,
        lastName: proj.PMLastName,
        email: proj.PMEmail
      }
    };
  }

  /**
   * Checks if project name already exists
   */
  async findByName(projectName, excludeProjectId = null) {
    let queryStr = `
      SELECT p.[ProjectID] 
      FROM [dbo].[Project] p 
      WHERE LOWER(p.[ProjectName]) = LOWER(@ProjectName) AND p.[IsDeleted] = 0
    `;

    const params = {
      ProjectName: { type: mssql.NVarChar(200), value: projectName }
    };

    if (excludeProjectId) {
      queryStr += ' AND p.[ProjectID] <> @ExcludeProjectId';
      params.ExcludeProjectId = { type: mssql.Int, value: excludeProjectId };
    }

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Verifies if Department exists and is active
   */
  async departmentExists(departmentId) {
    const queryStr = `
      SELECT 1 FROM [dbo].[Department] 
      WHERE [DepartmentID] = @DepartmentID AND [IsDeleted] = 0;
    `;
    const params = { DepartmentID: { type: mssql.Int, value: departmentId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Fetches Project Manager employee record and status
   */
  async getProjectManagerDetails(projectManagerId) {
    const queryStr = `
      SELECT [EmployeeID], [Status], [FirstName], [LastName], [Email]
      FROM [dbo].[Employee]
      WHERE [EmployeeID] = @ProjectManagerID AND [IsDeleted] = 0;
    `;
    const params = { ProjectManagerID: { type: mssql.Int, value: projectManagerId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Checks if an employee is assigned to a project (as PM or team member)
   */
  async isEmployeeAssignedToProject(projectId, employeeId) {
    const queryStr = `
      SELECT 1 
      FROM [dbo].[Project] p
      WHERE p.[ProjectID] = @ProjectID 
        AND p.[IsDeleted] = 0 
        AND (
          p.[ProjectManagerID] = @EmployeeID 
          OR EXISTS (
            SELECT 1 FROM [dbo].[ProjectMember] pm 
            WHERE pm.[ProjectID] = p.[ProjectID] 
              AND pm.[EmployeeID] = @EmployeeID 
              AND pm.[IsDeleted] = 0
          )
        );
    `;

    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      EmployeeID: { type: mssql.Int, value: employeeId }
    };

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Inserts new project record
   */
  async create({
    projectName,
    description,
    departmentId,
    projectManagerId,
    startDate,
    endDate,
    actualEndDate,
    status,
    progressPercentage,
    createdBy
  }) {
    const queryStr = `
      INSERT INTO [dbo].[Project] (
        [ProjectName], [Description], [DepartmentID], [ProjectManagerID], 
        [StartDate], [EndDate], [ActualEndDate], [Status], [ProgressPercentage], [CreatedBy]
      )
      OUTPUT INSERTED.[ProjectID]
      VALUES (
        @ProjectName, @Description, @DepartmentID, @ProjectManagerID, 
        @StartDate, @EndDate, @ActualEndDate, @Status, @ProgressPercentage, @CreatedBy
      );
    `;

    const params = {
      ProjectName: { type: mssql.NVarChar(200), value: projectName },
      Description: { type: mssql.NVarChar(mssql.MAX), value: description || null },
      DepartmentID: { type: mssql.Int, value: departmentId },
      ProjectManagerID: { type: mssql.Int, value: projectManagerId },
      StartDate: { type: mssql.Date, value: startDate },
      EndDate: { type: mssql.Date, value: endDate },
      ActualEndDate: { type: mssql.Date, value: actualEndDate || null },
      Status: { type: mssql.NVarChar(30), value: status || 'Planning' },
      ProgressPercentage: { type: mssql.Decimal(5, 2), value: progressPercentage || 0 },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params);
    return result.recordset[0].ProjectID;
  }

  /**
   * Updates project record
   */
  async update(projectId, updateData, updatedBy) {
    const setClauses = ['[UpdatedBy] = @UpdatedBy', '[UpdatedDate] = SYSUTCDATETIME()'];
    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (updateData.projectName !== undefined) {
      setClauses.push('[ProjectName] = @ProjectName');
      params.ProjectName = { type: mssql.NVarChar(200), value: updateData.projectName };
    }
    if (updateData.description !== undefined) {
      setClauses.push('[Description] = @Description');
      params.Description = { type: mssql.NVarChar(mssql.MAX), value: updateData.description || null };
    }
    if (updateData.departmentId !== undefined) {
      setClauses.push('[DepartmentID] = @DepartmentID');
      params.DepartmentID = { type: mssql.Int, value: updateData.departmentId };
    }
    if (updateData.projectManagerId !== undefined) {
      setClauses.push('[ProjectManagerID] = @ProjectManagerID');
      params.ProjectManagerID = { type: mssql.Int, value: updateData.projectManagerId };
    }
    if (updateData.startDate !== undefined) {
      setClauses.push('[StartDate] = @StartDate');
      params.StartDate = { type: mssql.Date, value: updateData.startDate };
    }
    if (updateData.endDate !== undefined) {
      setClauses.push('[EndDate] = @EndDate');
      params.EndDate = { type: mssql.Date, value: updateData.endDate };
    }
    if (updateData.actualEndDate !== undefined) {
      setClauses.push('[ActualEndDate] = @ActualEndDate');
      params.ActualEndDate = { type: mssql.Date, value: updateData.actualEndDate || null };
    }
    if (updateData.status !== undefined) {
      setClauses.push('[Status] = @Status');
      params.Status = { type: mssql.NVarChar(30), value: updateData.status };
    }
    if (updateData.progressPercentage !== undefined) {
      setClauses.push('[ProgressPercentage] = @ProgressPercentage');
      params.ProgressPercentage = { type: mssql.Decimal(5, 2), value: updateData.progressPercentage };
    }

    const queryStr = `
      UPDATE [dbo].[Project]
      SET ${setClauses.join(', ')}
      WHERE [ProjectID] = @ProjectID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params);
  }

  /**
   * Soft deletes project record
   */
  async softDelete(projectId, deletedBy) {
    const queryStr = `
      UPDATE [dbo].[Project]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [ProjectID] = @ProjectID AND [IsDeleted] = 0;
    `;

    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params);
  }
}

module.exports = new ProjectRepository();
