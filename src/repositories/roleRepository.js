const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class RoleRepository extends BaseRepository {
  /**
   * Fetches paginated list of roles with employee count aggregates
   */
  async findAll({ search, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE r.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (search) {
      whereClause += ' AND (r.[RoleName] LIKE @Search OR r.[Description] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    const queryStr = `
      SELECT 
        r.[RoleID],
        r.[RoleName],
        r.[Description],
        r.[Permissions],
        r.[CreatedDate],
        (SELECT COUNT(*) FROM [dbo].[Employee] e WHERE e.[RoleID] = r.[RoleID] AND e.[IsDeleted] = 0) AS EmployeeCount,
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Role] r
      ${whereClause}
      ORDER BY r.[RoleID] ASC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, ...role } = rec;
      let parsedPermissions = role.Permissions;
      try {
        if (typeof role.Permissions === 'string') {
          parsedPermissions = JSON.parse(role.Permissions);
        }
      } catch (e) {
        parsedPermissions = role.Permissions;
      }

      return {
        id: role.RoleID,
        roleName: role.RoleName,
        description: role.Description,
        permissions: parsedPermissions,
        employeeCount: role.EmployeeCount,
        createdDate: role.CreatedDate
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
   * Fetches single role details by ID
   */
  async findById(roleId) {
    const queryStr = `
      SELECT 
        r.[RoleID],
        r.[RoleName],
        r.[Description],
        r.[Permissions],
        r.[CreatedDate],
        (SELECT COUNT(*) FROM [dbo].[Employee] e WHERE e.[RoleID] = r.[RoleID] AND e.[IsDeleted] = 0) AS EmployeeCount
      FROM [dbo].[Role] r
      WHERE r.[RoleID] = @RoleID AND r.[IsDeleted] = 0;
    `;

    const params = {
      RoleID: { type: mssql.Int, value: roleId }
    };

    const result = await this.query(queryStr, params);
    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const role = result.recordset[0];
    let parsedPermissions = role.Permissions;
    try {
      if (typeof role.Permissions === 'string') {
        parsedPermissions = JSON.parse(role.Permissions);
      }
    } catch (e) {
      parsedPermissions = role.Permissions;
    }

    return {
      id: role.RoleID,
      roleName: role.RoleName,
      description: role.Description,
      permissions: parsedPermissions,
      employeeCount: role.EmployeeCount,
      createdDate: role.CreatedDate
    };
  }

  /**
   * Checks if a role name already exists
   */
  async findByName(roleName, excludeRoleId = null) {
    let queryStr = `
      SELECT r.[RoleID] 
      FROM [dbo].[Role] r 
      WHERE LOWER(r.[RoleName]) = LOWER(@RoleName) AND r.[IsDeleted] = 0
    `;

    const params = {
      RoleName: { type: mssql.NVarChar(100), value: roleName }
    };

    if (excludeRoleId) {
      queryStr += ' AND r.[RoleID] <> @ExcludeRoleId';
      params.ExcludeRoleId = { type: mssql.Int, value: excludeRoleId };
    }

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Gets active employee count assigned to role
   */
  async getActiveEmployeeCount(roleId) {
    const queryStr = `
      SELECT COUNT(*) AS EmpCount 
      FROM [dbo].[Employee] 
      WHERE [RoleID] = @RoleID AND [IsDeleted] = 0;
    `;

    const params = {
      RoleID: { type: mssql.Int, value: roleId }
    };

    const result = await this.query(queryStr, params);
    return result.recordset ? result.recordset[0].EmpCount : 0;
  }

  /**
   * Inserts new role record
   */
  async create({ roleName, description, permissions, createdBy }) {
    const permString = typeof permissions === 'object' ? JSON.stringify(permissions) : permissions;

    const queryStr = `
      INSERT INTO [dbo].[Role] ([RoleName], [Description], [Permissions], [CreatedBy])
      OUTPUT INSERTED.[RoleID]
      VALUES (@RoleName, @Description, @Permissions, @CreatedBy);
    `;

    const params = {
      RoleName: { type: mssql.NVarChar(100), value: roleName },
      Description: { type: mssql.NVarChar(mssql.MAX), value: description || null },
      Permissions: { type: mssql.NVarChar(mssql.MAX), value: permString || null },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params);
    return result.recordset[0].RoleID;
  }

  /**
   * Updates role record
   */
  async update(roleId, updateData, updatedBy) {
    const setClauses = ['[UpdatedBy] = @UpdatedBy', '[UpdatedDate] = SYSUTCDATETIME()'];
    const params = {
      RoleID: { type: mssql.Int, value: roleId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (updateData.roleName !== undefined) {
      setClauses.push('[RoleName] = @RoleName');
      params.RoleName = { type: mssql.NVarChar(100), value: updateData.roleName };
    }

    if (updateData.description !== undefined) {
      setClauses.push('[Description] = @Description');
      params.Description = { type: mssql.NVarChar(mssql.MAX), value: updateData.description || null };
    }

    if (updateData.permissions !== undefined) {
      const permString = typeof updateData.permissions === 'object' ? JSON.stringify(updateData.permissions) : updateData.permissions;
      setClauses.push('[Permissions] = @Permissions');
      params.Permissions = { type: mssql.NVarChar(mssql.MAX), value: permString || null };
    }

    const queryStr = `
      UPDATE [dbo].[Role]
      SET ${setClauses.join(', ')}
      WHERE [RoleID] = @RoleID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params);
  }

  /**
   * Soft deletes role record
   */
  async softDelete(roleId, deletedBy) {
    const queryStr = `
      UPDATE [dbo].[Role]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [RoleID] = @RoleID AND [IsDeleted] = 0;
    `;

    const params = {
      RoleID: { type: mssql.Int, value: roleId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params);
  }
}

module.exports = new RoleRepository();
