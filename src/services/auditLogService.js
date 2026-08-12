const auditLogRepository = require('../repositories/auditLogRepository');

class AuditLogService {
  /**
   * Fetches paginated & filtered system audit log trail
   */
  async getAuditLogs(queryParams) {
    const page = parseInt(queryParams.page, 10) || 1;
    const limit = parseInt(queryParams.limit, 10) || 10;
    const search = queryParams.search || '';

    return auditLogRepository.findAll({ page, limit, search });
  }
}

module.exports = new AuditLogService();
