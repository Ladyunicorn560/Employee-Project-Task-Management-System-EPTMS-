const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class AuthRepository extends BaseRepository {
  /**
   * Finds a user by email for authentication processing
   * @param {string} email 
   * @returns {Promise<Object|null>} User database record or null
   */
  async findUserByEmail(email) {
    const queryStr = `
      SELECT 
        e.[EmployeeID],
        e.[FirstName],
        e.[LastName],
        e.[Email],
        e.[Phone],
        e.[PasswordHash],
        e.[Status],
        e.[IsDeleted],
        e.[FailedLoginAttempts],
        e.[LockoutUntil],
        e.[LastLoginDate],
        e.[PasswordChangedAt],
        e.[DepartmentID],
        d.[DepartmentName],
        e.[RoleID],
        r.[RoleName]
      FROM [dbo].[Employee] e
      INNER JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      INNER JOIN [dbo].[Role] r ON e.[RoleID] = r.[RoleID]
      WHERE LOWER(e.[Email]) = LOWER(@Email);
    `;

    const params = {
      Email: { type: mssql.NVarChar(256), value: email }
    };

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Fetches full authenticated user profile by EmployeeID
   * @param {number} employeeId 
   * @returns {Promise<Object|null>} User profile details or null
   */
  async getUserProfileById(employeeId) {
    const queryStr = `
      SELECT 
        e.[EmployeeID],
        e.[FirstName],
        e.[LastName],
        e.[Email],
        e.[Phone],
        e.[Status],
        e.[IsDeleted],
        e.[LastLoginDate],
        e.[DepartmentID],
        d.[DepartmentName],
        e.[RoleID],
        r.[RoleName]
      FROM [dbo].[Employee] e
      INNER JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      INNER JOIN [dbo].[Role] r ON e.[RoleID] = r.[RoleID]
      WHERE e.[EmployeeID] = @EmployeeID AND e.[IsDeleted] = 0;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId }
    };

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Records a failed login attempt and optional lockout timestamp
   * @param {number} employeeId 
   * @param {number} failedAttempts 
   * @param {Date|null} lockoutUntil 
   */
  async recordFailedLogin(employeeId, failedAttempts, lockoutUntil = null) {
    const queryStr = `
      UPDATE [dbo].[Employee]
      SET 
        [FailedLoginAttempts] = @FailedLoginAttempts,
        [LockoutUntil] = @LockoutUntil,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [EmployeeID] = @EmployeeID;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId },
      FailedLoginAttempts: { type: mssql.Int, value: failedAttempts },
      LockoutUntil: { type: mssql.DateTime2, value: lockoutUntil }
    };

    await this.query(queryStr, params);
  }

  /**
   * Records a successful login by resetting failed attempts, clearing lockouts, and setting LastLoginDate
   * @param {number} employeeId 
   */
  async recordSuccessfulLogin(employeeId) {
    const queryStr = `
      UPDATE [dbo].[Employee]
      SET 
        [FailedLoginAttempts] = 0,
        [LockoutUntil] = NULL,
        [LastLoginDate] = SYSUTCDATETIME(),
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [EmployeeID] = @EmployeeID;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId }
    };

    await this.query(queryStr, params);
  }

  /**
   * Updates employee status (utility helper for test automation)
   * @param {number} employeeId 
   * @param {string} status 
   */
  async updateUserStatus(employeeId, status) {
    const queryStr = `
      UPDATE [dbo].[Employee]
      SET [Status] = @Status, [UpdatedDate] = SYSUTCDATETIME()
      WHERE [EmployeeID] = @EmployeeID;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId },
      Status: { type: mssql.NVarChar(30), value: status }
    };

    await this.query(queryStr, params);
  }
}

module.exports = new AuthRepository();
