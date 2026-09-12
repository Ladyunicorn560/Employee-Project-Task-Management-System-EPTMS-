const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class EmployeeRepository extends BaseRepository {
  /**
   * Fetches paginated & filtered employees list (Excludes PasswordHash)
   */
  async findAll({ departmentId, roleId, status, search, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE e.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (departmentId) {
      whereClause += ' AND e.[DepartmentID] = @DepartmentID';
      params.DepartmentID = { type: mssql.Int, value: departmentId };
    }

    if (roleId) {
      whereClause += ' AND e.[RoleID] = @RoleID';
      params.RoleID = { type: mssql.Int, value: roleId };
    }

    if (status) {
      whereClause += ' AND e.[Status] = @Status';
      params.Status = { type: mssql.NVarChar(30), value: status };
    }

    if (search) {
      whereClause += ' AND (e.[FirstName] LIKE @Search OR e.[LastName] LIKE @Search OR e.[Email] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    const queryStr = `
      SELECT 
        e.[EmployeeID],
        e.[FirstName],
        e.[LastName],
        e.[Email],
        e.[Phone],
        e.[Status],
        e.[HourlyRate],
        e.[ManagerID],
        m.[FirstName] + N' ' + m.[LastName] AS ManagerName,
        m.[FirstName] AS ManagerFirstName,
        m.[LastName] AS ManagerLastName,
        m.[Email] AS ManagerEmail,
        e.[LastLoginDate],
        e.[CreatedDate],
        e.[DepartmentID],
        d.[DepartmentName],
        e.[RoleID],
        r.[RoleName],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Employee] e
      INNER JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      INNER JOIN [dbo].[Role] r ON e.[RoleID] = r.[RoleID]
      LEFT JOIN [dbo].[Employee] m ON e.[ManagerID] = m.[EmployeeID]
      ${whereClause}
      ORDER BY e.[EmployeeID] DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, ...employee } = rec;
      return {
        id: employee.EmployeeID,
        firstName: employee.FirstName,
        lastName: employee.LastName,
        email: employee.Email,
        phone: employee.Phone,
        status: employee.Status,
        hourlyRate: employee.HourlyRate ?? 50.0,
        manager: employee.ManagerID ? {
          id: employee.ManagerID,
          name: employee.ManagerName,
          firstName: employee.ManagerFirstName,
          lastName: employee.ManagerLastName,
          email: employee.ManagerEmail
        } : null,
        lastLoginDate: employee.LastLoginDate,
        createdDate: employee.CreatedDate,
        department: {
          id: employee.DepartmentID,
          name: employee.DepartmentName
        },
        role: {
          id: employee.RoleID,
          name: employee.RoleName
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
   * Fetches single employee details by ID (Excludes PasswordHash)
   */
  async findById(employeeId) {
    const queryStr = `
      SELECT 
        e.[EmployeeID],
        e.[FirstName],
        e.[LastName],
        e.[Email],
        e.[Phone],
        e.[Status],
        e.[HourlyRate],
        e.[ManagerID],
        m.[FirstName] + N' ' + m.[LastName] AS ManagerName,
        m.[FirstName] AS ManagerFirstName,
        m.[LastName] AS ManagerLastName,
        m.[Email] AS ManagerEmail,
        e.[LastLoginDate],
        e.[CreatedDate],
        e.[DepartmentID],
        d.[DepartmentName],
        e.[RoleID],
        r.[RoleName]
      FROM [dbo].[Employee] e
      INNER JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      INNER JOIN [dbo].[Role] r ON e.[RoleID] = r.[RoleID]
      LEFT JOIN [dbo].[Employee] m ON e.[ManagerID] = m.[EmployeeID]
      WHERE e.[EmployeeID] = @EmployeeID AND e.[IsDeleted] = 0;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId }
    };

    const result = await this.query(queryStr, params);
    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const employee = result.recordset[0];
    return {
      id: employee.EmployeeID,
      firstName: employee.FirstName,
      lastName: employee.LastName,
      email: employee.Email,
      phone: employee.Phone,
      status: employee.Status,
      hourlyRate: employee.HourlyRate ?? 50.0,
      manager: employee.ManagerID ? {
        id: employee.ManagerID,
        name: employee.ManagerName,
        firstName: employee.ManagerFirstName,
        lastName: employee.ManagerLastName,
        email: employee.ManagerEmail
      } : null,
      lastLoginDate: employee.LastLoginDate,
      createdDate: employee.CreatedDate,
      department: {
        id: employee.DepartmentID,
        name: employee.DepartmentName
      },
      role: {
        id: employee.RoleID,
        name: employee.RoleName
      }
    };
  }

  /**
   * Checks if an email already exists (optionally excluding current employee ID during update)
   */
  async findByEmail(email, excludeEmployeeId = null) {
    let queryStr = `
      SELECT e.[EmployeeID] 
      FROM [dbo].[Employee] e 
      WHERE LOWER(e.[Email]) = LOWER(@Email) AND e.[IsDeleted] = 0
    `;

    const params = {
      Email: { type: mssql.NVarChar(256), value: email }
    };

    if (excludeEmployeeId) {
      queryStr += ' AND e.[EmployeeID] <> @ExcludeEmployeeId';
      params.ExcludeEmployeeId = { type: mssql.Int, value: excludeEmployeeId };
    }

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Verifies if a Department exists and is active
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
   * Verifies if a Role exists and is active
   */
  async roleExists(roleId) {
    const queryStr = `
      SELECT 1 FROM [dbo].[Role] 
      WHERE [RoleID] = @RoleID AND [IsDeleted] = 0;
    `;
    const params = { RoleID: { type: mssql.Int, value: roleId } };
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Inserts new employee record
   */
  async create({ firstName, lastName, email, phone, departmentId, roleId, passwordHash, status, managerId, hourlyRate, createdBy }) {
    const queryStr = `
      INSERT INTO [dbo].[Employee] (
        [FirstName], [LastName], [Email], [Phone], 
        [DepartmentID], [RoleID], [PasswordHash], [Status],
        [ManagerID], [HourlyRate], [CreatedBy]
      )
      OUTPUT INSERTED.[EmployeeID]
      VALUES (
        @FirstName, @LastName, @Email, @Phone, 
        @DepartmentID, @RoleID, @PasswordHash, @Status,
        @ManagerID, @HourlyRate, @CreatedBy
      );
    `;

    const params = {
      FirstName: { type: mssql.NVarChar(100), value: firstName },
      LastName: { type: mssql.NVarChar(100), value: lastName },
      Email: { type: mssql.NVarChar(256), value: email },
      Phone: { type: mssql.NVarChar(20), value: phone || null },
      DepartmentID: { type: mssql.Int, value: departmentId },
      RoleID: { type: mssql.Int, value: roleId },
      PasswordHash: { type: mssql.NVarChar(255), value: passwordHash },
      Status: { type: mssql.NVarChar(30), value: status || 'Active' },
      ManagerID: { type: mssql.Int, value: managerId || null },
      HourlyRate: { type: mssql.Decimal(10, 2), value: hourlyRate ?? 50.00 },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params);
    return result.recordset[0].EmployeeID;
  }

  /**
   * Updates employee record
   */
  async update(employeeId, updateData, updatedBy) {
    const setClauses = ['[UpdatedBy] = @UpdatedBy', '[UpdatedDate] = SYSUTCDATETIME()'];
    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (updateData.firstName !== undefined) {
      setClauses.push('[FirstName] = @FirstName');
      params.FirstName = { type: mssql.NVarChar(100), value: updateData.firstName };
    }
    if (updateData.lastName !== undefined) {
      setClauses.push('[LastName] = @LastName');
      params.LastName = { type: mssql.NVarChar(100), value: updateData.lastName };
    }
    if (updateData.email !== undefined) {
      setClauses.push('[Email] = @Email');
      params.Email = { type: mssql.NVarChar(256), value: updateData.email };
    }
    if (updateData.phone !== undefined) {
      setClauses.push('[Phone] = @Phone');
      params.Phone = { type: mssql.NVarChar(20), value: updateData.phone || null };
    }
    if (updateData.departmentId !== undefined) {
      setClauses.push('[DepartmentID] = @DepartmentID');
      params.DepartmentID = { type: mssql.Int, value: updateData.departmentId };
    }
    if (updateData.roleId !== undefined) {
      setClauses.push('[RoleID] = @RoleID');
      params.RoleID = { type: mssql.Int, value: updateData.roleId };
    }
    if (updateData.status !== undefined) {
      setClauses.push('[Status] = @Status');
      params.Status = { type: mssql.NVarChar(30), value: updateData.status };
    }
    if (updateData.managerId !== undefined) {
      setClauses.push('[ManagerID] = @ManagerID');
      params.ManagerID = { type: mssql.Int, value: updateData.managerId || null };
    }
    if (updateData.hourlyRate !== undefined) {
      setClauses.push('[HourlyRate] = @HourlyRate');
      params.HourlyRate = { type: mssql.Decimal(10, 2), value: updateData.hourlyRate };
    }
    if (updateData.passwordHash !== undefined) {
      setClauses.push('[PasswordHash] = @PasswordHash');
      setClauses.push('[PasswordChangedAt] = SYSUTCDATETIME()');
      params.PasswordHash = { type: mssql.NVarChar(255), value: updateData.passwordHash };
    }

    const queryStr = `
      UPDATE [dbo].[Employee]
      SET ${setClauses.join(', ')}
      WHERE [EmployeeID] = @EmployeeID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params);
  }

  /**
   * Soft deletes employee record
   */
  async softDelete(employeeId, deletedBy) {
    const queryStr = `
      UPDATE [dbo].[Employee]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [EmployeeID] = @EmployeeID AND [IsDeleted] = 0;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params);
  }
}

module.exports = new EmployeeRepository();
