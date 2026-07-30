const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class DepartmentRepository extends BaseRepository {
  /**
   * Fetches paginated list of departments with employee count
   */
  async findAll({ search, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE d.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (search) {
      whereClause += ' AND (d.[DepartmentName] LIKE @Search OR d.[Description] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    const queryStr = `
      SELECT 
        d.[DepartmentID],
        d.[DepartmentName],
        d.[Description],
        d.[CreatedDate],
        (SELECT COUNT(*) FROM [dbo].[Employee] e WHERE e.[DepartmentID] = d.[DepartmentID] AND e.[IsDeleted] = 0) AS EmployeeCount,
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Department] d
      ${whereClause}
      ORDER BY d.[DepartmentID] ASC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, ...dept } = rec;
      return {
        id: dept.DepartmentID,
        departmentName: dept.DepartmentName,
        description: dept.Description,
        employeeCount: dept.EmployeeCount,
        createdDate: dept.CreatedDate
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
   * Fetches single department details by ID
   */
  async findById(departmentId) {
    const queryStr = `
      SELECT 
        d.[DepartmentID],
        d.[DepartmentName],
        d.[Description],
        d.[CreatedDate],
        (SELECT COUNT(*) FROM [dbo].[Employee] e WHERE e.[DepartmentID] = d.[DepartmentID] AND e.[IsDeleted] = 0) AS EmployeeCount
      FROM [dbo].[Department] d
      WHERE d.[DepartmentID] = @DepartmentID AND d.[IsDeleted] = 0;
    `;

    const params = {
      DepartmentID: { type: mssql.Int, value: departmentId }
    };

    const result = await this.query(queryStr, params);
    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const dept = result.recordset[0];
    return {
      id: dept.DepartmentID,
      departmentName: dept.DepartmentName,
      description: dept.Description,
      employeeCount: dept.EmployeeCount,
      createdDate: dept.CreatedDate
    };
  }

  /**
   * Checks if a department name already exists
   */
  async findByName(departmentName, excludeDepartmentId = null) {
    let queryStr = `
      SELECT d.[DepartmentID] 
      FROM [dbo].[Department] d 
      WHERE LOWER(d.[DepartmentName]) = LOWER(@DepartmentName) AND d.[IsDeleted] = 0
    `;

    const params = {
      DepartmentName: { type: mssql.NVarChar(150), value: departmentName }
    };

    if (excludeDepartmentId) {
      queryStr += ' AND d.[DepartmentID] <> @ExcludeDepartmentId';
      params.ExcludeDepartmentId = { type: mssql.Int, value: excludeDepartmentId };
    }

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Gets number of active employees assigned to a department
   */
  async getActiveEmployeeCount(departmentId) {
    const queryStr = `
      SELECT COUNT(*) AS EmpCount 
      FROM [dbo].[Employee] 
      WHERE [DepartmentID] = @DepartmentID AND [IsDeleted] = 0;
    `;

    const params = {
      DepartmentID: { type: mssql.Int, value: departmentId }
    };

    const result = await this.query(queryStr, params);
    return result.recordset ? result.recordset[0].EmpCount : 0;
  }

  /**
   * Inserts new department record
   */
  async create({ departmentName, description, createdBy }) {
    const queryStr = `
      INSERT INTO [dbo].[Department] ([DepartmentName], [Description], [CreatedBy])
      OUTPUT INSERTED.[DepartmentID]
      VALUES (@DepartmentName, @Description, @CreatedBy);
    `;

    const params = {
      DepartmentName: { type: mssql.NVarChar(150), value: departmentName },
      Description: { type: mssql.NVarChar(mssql.MAX), value: description || null },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params);
    return result.recordset[0].DepartmentID;
  }

  /**
   * Updates department record
   */
  async update(departmentId, updateData, updatedBy) {
    const setClauses = ['[UpdatedBy] = @UpdatedBy', '[UpdatedDate] = SYSUTCDATETIME()'];
    const params = {
      DepartmentID: { type: mssql.Int, value: departmentId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    if (updateData.departmentName !== undefined) {
      setClauses.push('[DepartmentName] = @DepartmentName');
      params.DepartmentName = { type: mssql.NVarChar(150), value: updateData.departmentName };
    }

    if (updateData.description !== undefined) {
      setClauses.push('[Description] = @Description');
      params.Description = { type: mssql.NVarChar(mssql.MAX), value: updateData.description || null };
    }

    const queryStr = `
      UPDATE [dbo].[Department]
      SET ${setClauses.join(', ')}
      WHERE [DepartmentID] = @DepartmentID AND [IsDeleted] = 0;
    `;

    await this.query(queryStr, params);
  }

  /**
   * Soft deletes department record
   */
  async softDelete(departmentId, deletedBy) {
    const queryStr = `
      UPDATE [dbo].[Department]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [DepartmentID] = @DepartmentID AND [IsDeleted] = 0;
    `;

    const params = {
      DepartmentID: { type: mssql.Int, value: departmentId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params);
  }
}

module.exports = new DepartmentRepository();
