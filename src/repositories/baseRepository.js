const { getPool, mssql } = require('../config/db');

class BaseRepository {
  /**
   * Executes a parameterized T-SQL query
   * @param {string} query - T-SQL query string
   * @param {Object} params - Key-value pair of parameters { name: { type: mssql.Int, value: 123 } }
   * @param {Object} [transaction] - Optional active mssql.Transaction
   */
  async query(query, params = {}, transaction = null) {
    const pool = getPool();
    const request = transaction ? new mssql.Request(transaction) : pool.request();

    for (const [key, param] of Object.entries(params)) {
      if (param.type) {
        request.input(key, param.type, param.value);
      } else {
        request.input(key, param);
      }
    }

    return request.query(query);
  }

  /**
   * Executes a Stored Procedure
   * @param {string} procedureName - Name of the stored procedure
   * @param {Object} params - Key-value pair of parameters
   * @param {Object} [transaction] - Optional active mssql.Transaction
   */
  async executeProcedure(procedureName, params = {}, transaction = null) {
    const pool = getPool();
    const request = transaction ? new mssql.Request(transaction) : pool.request();

    for (const [key, param] of Object.entries(params)) {
      if (param.type) {
        request.input(key, param.type, param.value);
      } else {
        request.input(key, param);
      }
    }

    return request.execute(procedureName);
  }

  /**
   * Executes a callback within a managed SQL transaction block
   * @param {Function} workCallback - Callback receiving the transaction instance
   */
  async withTransaction(workCallback) {
    const pool = getPool();
    const transaction = new mssql.Transaction(pool);
    await transaction.begin();

    try {
      const result = await workCallback(transaction);
      await transaction.commit();
      return result;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = BaseRepository;
