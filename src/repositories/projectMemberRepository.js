const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class ProjectMemberRepository extends BaseRepository {
  /**
   * Fetches list of assigned team members for a project
   */
  async findByProjectId(projectId, { search, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE pmemb.[ProjectID] = @ProjectID AND pmemb.[IsDeleted] = 0 AND e.[IsDeleted] = 0';
    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (search) {
      whereClause += ' AND (e.[FirstName] LIKE @Search OR e.[LastName] LIKE @Search OR e.[Email] LIKE @Search OR pmemb.[RoleInProject] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    const queryStr = `
      SELECT 
        pmemb.[ProjectMemberID],
        pmemb.[ProjectID],
        pmemb.[EmployeeID],
        e.[FirstName],
        e.[LastName],
        e.[Email],
        e.[Phone],
        e.[Status] AS EmployeeStatus,
        d.[DepartmentID],
        d.[DepartmentName],
        r.[RoleID],
        r.[RoleName],
        pmemb.[RoleInProject],
        pmemb.[JoinedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[ProjectMember] pmemb
      INNER JOIN [dbo].[Employee] e ON pmemb.[EmployeeID] = e.[EmployeeID]
      INNER JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      INNER JOIN [dbo].[Role] r ON e.[RoleID] = r.[RoleID]
      ${whereClause}
      ORDER BY pmemb.[JoinedDate] ASC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, ...member } = rec;
      return {
        projectMemberId: member.ProjectMemberID,
        projectId: member.ProjectID,
        employee: {
          id: member.EmployeeID,
          firstName: member.FirstName,
          lastName: member.LastName,
          email: member.Email,
          phone: member.Phone,
          status: member.EmployeeStatus,
          department: {
            id: member.DepartmentID,
            name: member.DepartmentName
          },
          role: {
            id: member.RoleID,
            name: member.RoleName
          }
        },
        roleInProject: member.RoleInProject,
        joinedDate: member.JoinedDate
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
   * Checks if an active assignment exists for an employee in a project
   */
  async findAssignment(projectId, employeeId) {
    const queryStr = `
      SELECT [ProjectMemberID], [RoleInProject], [JoinedDate]
      FROM [dbo].[ProjectMember]
      WHERE [ProjectID] = @ProjectID AND [EmployeeID] = @EmployeeID AND [IsDeleted] = 0;
    `;

    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      EmployeeID: { type: mssql.Int, value: employeeId }
    };

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Retrieves project details including ProjectManagerID
   */
  async getProjectWithManager(projectId) {
    const queryStr = `
      SELECT [ProjectID], [ProjectName], [ProjectManagerID], [Status]
      FROM [dbo].[Project]
      WHERE [ProjectID] = @ProjectID AND [IsDeleted] = 0;
    `;

    const params = { ProjectID: { type: mssql.Int, value: projectId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Retrieves employee details for validation
   */
  async getEmployeeDetails(employeeId) {
    const queryStr = `
      SELECT [EmployeeID], [FirstName], [LastName], [Email], [Status]
      FROM [dbo].[Employee]
      WHERE [EmployeeID] = @EmployeeID AND [IsDeleted] = 0;
    `;

    const params = { EmployeeID: { type: mssql.Int, value: employeeId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Inserts new project member assignment within optional transaction
   */
  async assignMember({ projectId, employeeId, roleInProject, createdBy }, transaction = null) {
    const queryStr = `
      INSERT INTO [dbo].[ProjectMember] ([ProjectID], [EmployeeID], [RoleInProject], [CreatedBy])
      OUTPUT INSERTED.[ProjectMemberID]
      VALUES (@ProjectID, @EmployeeID, @RoleInProject, @CreatedBy);
    `;

    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      EmployeeID: { type: mssql.Int, value: employeeId },
      RoleInProject: { type: mssql.NVarChar(100), value: roleInProject || 'Team Member' },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.recordset[0].ProjectMemberID;
  }

  /**
   * Soft deletes project member assignment within optional transaction
   */
  async removeMember(projectId, employeeId, deletedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[ProjectMember]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [ProjectID] = @ProjectID AND [EmployeeID] = @EmployeeID AND [IsDeleted] = 0;
    `;

    const params = {
      ProjectID: { type: mssql.Int, value: projectId },
      EmployeeID: { type: mssql.Int, value: employeeId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params, transaction);
  }
}

module.exports = new ProjectMemberRepository();
