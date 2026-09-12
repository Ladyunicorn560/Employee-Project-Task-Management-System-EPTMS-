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
        r.[RoleName],
        e.[ManagerID],
        m.[FirstName] AS ManagerFirstName,
        m.[LastName] AS ManagerLastName,
        m.[Email] AS ManagerEmail
      FROM [dbo].[Employee] e
      INNER JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      INNER JOIN [dbo].[Role] r ON e.[RoleID] = r.[RoleID]
      LEFT JOIN [dbo].[Employee] m ON e.[ManagerID] = m.[EmployeeID]
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
        r.[RoleName],
        e.[ManagerID],
        m.[FirstName] AS ManagerFirstName,
        m.[LastName] AS ManagerLastName,
        m.[Email] AS ManagerEmail
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

  /**
   * Updates employee password hash
   * @param {number} employeeId 
   * @param {string} passwordHash 
   */
  async updatePassword(employeeId, passwordHash) {
    const queryStr = `
      UPDATE [dbo].[Employee]
      SET 
        [PasswordHash] = @PasswordHash,
        [PasswordChangedAt] = SYSUTCDATETIME(),
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [EmployeeID] = @EmployeeID;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId },
      PasswordHash: { type: mssql.NVarChar(255), value: passwordHash }
    };

    await this.query(queryStr, params);
  }

  /**
   * Saves reset password token and expiration date for employee
   */
  async saveResetToken(employeeId, token, expires) {
    const queryStr = `
      UPDATE [dbo].[Employee]
      SET 
        [ResetPasswordToken] = @ResetPasswordToken,
        [ResetPasswordExpires] = @ResetPasswordExpires,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [EmployeeID] = @EmployeeID;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId },
      ResetPasswordToken: { type: mssql.NVarChar(255), value: token },
      ResetPasswordExpires: { type: mssql.DateTime2, value: expires }
    };

    await this.query(queryStr, params);
  }

  /**
   * Finds employee by reset token
   */
  async findUserByResetToken(token) {
    const queryStr = `
      SELECT 
        e.[EmployeeID],
        e.[Email],
        e.[ResetPasswordExpires]
      FROM [dbo].[Employee] e
      WHERE e.[ResetPasswordToken] = @ResetPasswordToken 
      AND e.[IsDeleted] = 0;
    `;

    const params = {
      ResetPasswordToken: { type: mssql.NVarChar(255), value: token }
    };

    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0 ? result.recordset[0] : null;
  }

  /**
   * Clears reset password token and expiration date for employee
   */
  async clearResetToken(employeeId) {
    const queryStr = `
      UPDATE [dbo].[Employee]
      SET 
        [ResetPasswordToken] = NULL,
        [ResetPasswordExpires] = NULL,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [EmployeeID] = @EmployeeID;
    `;

    const params = {
      EmployeeID: { type: mssql.Int, value: employeeId }
    };

    await this.query(queryStr, params);
  }
}

module.exports = new AuthRepository();
