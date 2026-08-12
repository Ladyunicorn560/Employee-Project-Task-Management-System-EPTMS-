const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class AuditLogRepository extends BaseRepository {
  /**
   * Fetches paginated list of audit logs
   */
  async findAll({ page = 1, limit = 10, search = '' }) {
    const offset = (page - 1) * limit;
    const params = {
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    let whereClause = 'WHERE 1 = 1';
    if (search) {
      whereClause += ' AND (a.[EntityName] LIKE @Search OR a.[Action] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    const queryStr = `
      SELECT 
        a.[AuditID] AS id,
        a.[EntityName] AS entityName,
        a.[EntityID] AS entityId,
        a.[Action] AS action,
        a.[ChangedBy] AS changedById,
        e.[FirstName] + ' ' + ISNULL(e.[LastName], '') AS changedBy,
        a.[OldValues] AS oldValues,
        a.[NewValues] AS newValues,
        a.[IPAddress] AS ipAddress,
        a.[CreatedDate] AS createdDate,
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[AuditLog] a
      LEFT JOIN [dbo].[Employee] e ON a.[ChangedBy] = e.[EmployeeID]
      ${whereClause}
      ORDER BY a.[CreatedDate] DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      data: records.map((rec) => {
        const { TotalCount, ...rest } = rec;
        return rest;
      })
    };
  }
}

module.exports = new AuditLogRepository();
