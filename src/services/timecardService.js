const timecardRepository = require('../repositories/timecardRepository');
const projectRepository = require('../repositories/projectRepository');
const employeeRepository = require('../repositories/employeeRepository');
const notificationService = require('./notificationService');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class TimecardService {
  _sanitizeForEmployee(timecard, currentUser) {
    if (currentUser.roleName === ROLES.EMPLOYEE && timecard) {
      delete timecard.TotalAmount;
      delete timecard.totalAmount;
      delete timecard.HourlyRate;
      delete timecard.hourlyRate;
      if (Array.isArray(timecard.entries)) {
        timecard.entries.forEach((e) => {
          delete e.BillingAmount;
          delete e.billingAmount;
          delete e.HourlyRate;
          delete e.hourlyRate;
        });
      }
    }
    return timecard;
  }

  /**
   * Submit weekly timecard with entries
   */
  async submitTimecard(data, currentUser) {
    const { weekStartDate, weekEndDate, managerId, entries } = data;
    const employeeId = currentUser.userId;

    if (!entries || entries.length === 0) {
      throw new BadRequestError('Timecard must contain at least one work entry.');
    }

    // Validation 1: Future timecards not allowed
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDateObj = new Date(weekStartDate);

    if (startDateObj > today) {
      throw new BadRequestError('Employees cannot submit future timecards.');
    }

    for (const entry of entries) {
      const workDateObj = new Date(entry.workDate);
      if (workDateObj > today) {
        throw new BadRequestError(`Work date (${entry.workDate}) cannot be in the future.`);
      }
    }

    // Validation 2: Timecards > 1 week old not allowed
    const currentDay = today.getDay();
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + diffToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    const minAllowedMonday = new Date(currentMonday);
    minAllowedMonday.setDate(currentMonday.getDate() - 7);

    if (startDateObj < minAllowedMonday) {
      throw new BadRequestError('Employees cannot submit timecards older than 1 week.');
    }

    // Default assigned manager to employee's assigned Manager if not provided
    let effectiveManagerId = managerId;
    if (!effectiveManagerId) {
      const emp = await employeeRepository.findById(employeeId);
      if (emp && emp.manager) {
        effectiveManagerId = emp.manager.id;
      }
    }

    let totalHours = 0;
    let totalAmount = 0;

    const processedEntries = [];

    for (const entry of entries) {
      const hours = parseFloat(entry.hoursWorked);
      if (isNaN(hours) || hours <= 0) {
        throw new BadRequestError(`Invalid hours worked (${entry.hoursWorked}) for project ${entry.projectId}`);
      }

      // Fetch employee rate on this project (fallback to employee base rate)
      const hourlyRate = await timecardRepository.getEmployeeProjectRate(employeeId, entry.projectId);
      const billingAmount = parseFloat((hours * hourlyRate).toFixed(2));

      totalHours += hours;
      totalAmount += billingAmount;

      processedEntries.push({
        projectId: entry.projectId,
        taskId: entry.taskId || null,
        workDate: entry.workDate,
        workMode: entry.workMode || 'Office',
        hoursWorked: hours,
        hourlyRate: hourlyRate,
        billingAmount: billingAmount,
        description: entry.description || null
      });
    }

    totalHours = parseFloat(totalHours.toFixed(2));
    totalAmount = parseFloat(totalAmount.toFixed(2));

    const timecardHeader = {
      employeeId,
      weekStartDate,
      weekEndDate,
      totalHours,
      totalAmount,
      status: 'Submitted',
      managerId: effectiveManagerId || null
    };

    const timecardId = await timecardRepository.createTimecard(timecardHeader, processedEntries);

    logger.info(`Timecard ID ${timecardId} submitted by Employee ${employeeId} (${currentUser.email}). Total Hours: ${totalHours}`);

    // Trigger notification to Manager if assigned
    if (effectiveManagerId) {
      try {
        await notificationService.createEventNotification({
          recipientId: effectiveManagerId,
          triggeredById: employeeId,
          notificationType: 'TimecardSubmitted',
          message: `Employee ${currentUser.firstName} ${currentUser.lastName} submitted a weekly timecard (${totalHours} hrs) for approval.`
        });
      } catch (notifErr) {
        logger.error(`Failed to send timecard submission notification to manager ${effectiveManagerId}:`, notifErr);
      }
    }

    return this.getTimecardById(timecardId, currentUser);
  }

  /**
   * Resubmit / Edit a rejected timecard
   */
  async updateTimecard(id, data, currentUser) {
    const existing = await timecardRepository.findTimecardById(id);
    if (!existing) {
      throw new NotFoundError(`Timecard with ID ${id} was not found.`);
    }

    if (existing.EmployeeID !== currentUser.userId && currentUser.roleName !== ROLES.ADMINISTRATOR) {
      throw new ForbiddenError('Access denied. You can only edit your own timecards.');
    }

    if (!['ManagerRejected', 'FinancialRejected'].includes(existing.Status)) {
      throw new BadRequestError(`Only rejected timecards can be edited and resubmitted. Current status is '${existing.Status}'.`);
    }

    const { managerId, entries } = data;
    const employeeId = currentUser.userId;

    if (!entries || entries.length === 0) {
      throw new BadRequestError('Timecard must contain at least one work entry.');
    }

    let effectiveManagerId = managerId || existing.ManagerID;
    if (!effectiveManagerId) {
      const emp = await employeeRepository.findById(employeeId);
      if (emp && emp.manager) {
        effectiveManagerId = emp.manager.id;
      }
    }

    let totalHours = 0;
    let totalAmount = 0;
    const processedEntries = [];

    for (const entry of entries) {
      const hours = parseFloat(entry.hoursWorked);
      if (isNaN(hours) || hours <= 0) {
        throw new BadRequestError(`Invalid hours worked (${entry.hoursWorked}) for project ${entry.projectId}`);
      }

      const hourlyRate = await timecardRepository.getEmployeeProjectRate(employeeId, entry.projectId);
      const billingAmount = parseFloat((hours * hourlyRate).toFixed(2));

      totalHours += hours;
      totalAmount += billingAmount;

      processedEntries.push({
        projectId: entry.projectId,
        taskId: entry.taskId || null,
        workDate: entry.workDate,
        workMode: entry.workMode || 'Office',
        hoursWorked: hours,
        hourlyRate: hourlyRate,
        billingAmount: billingAmount,
        description: entry.description || null
      });
    }

    totalHours = parseFloat(totalHours.toFixed(2));
    totalAmount = parseFloat(totalAmount.toFixed(2));

    const timecardHeader = {
      employeeId,
      totalHours,
      totalAmount,
      managerId: effectiveManagerId || null
    };

    await timecardRepository.updateTimecard(id, timecardHeader, processedEntries);

    logger.info(`Timecard ID ${id} resubmitted by Employee ${employeeId} (${currentUser.email}).`);

    if (effectiveManagerId) {
      try {
        await notificationService.createEventNotification({
          recipientId: effectiveManagerId,
          triggeredById: employeeId,
          notificationType: 'TimecardSubmitted',
          message: `Employee ${currentUser.firstName} ${currentUser.lastName} edited and resubmitted timecard for approval.`
        });
      } catch (notifErr) {
        logger.error(`Failed to send timecard resubmission notification:`, notifErr);
      }
    }

    return this.getTimecardById(id, currentUser);
  }

  /**
   * Get missing timecards for current employee
   */
  async getMissingTimecards(currentUser) {
    return timecardRepository.findMissingTimecards(currentUser.userId);
  }

  /**
   * Get list of timecards filtered by role and criteria
   */
  async getTimecards(query, currentUser) {
    let { employeeId, managerId } = query;
    const { projectOwnerId, status, weekStartDate, weekEndDate, search, page, limit } = query;

    let scopedUserId = null;
    if (currentUser.roleName !== ROLES.ADMINISTRATOR) {
      scopedUserId = currentUser.userId;
    }

    const result = await timecardRepository.findTimecards({
      employeeId,
      managerId,
      projectOwnerId,
      scopedUserId,
      status,
      weekStartDate,
      weekEndDate,
      search,
      page,
      limit
    });

    if (currentUser.roleName === ROLES.EMPLOYEE && Array.isArray(result.items)) {
      result.items.forEach((tc) => {
        delete tc.TotalAmount;
        delete tc.totalAmount;
      });
    }

    return result;
  }

  /**
   * Get single timecard details by ID
   */
  async getTimecardById(id, currentUser) {
    const timecard = await timecardRepository.findTimecardById(id);
    if (!timecard) {
      throw new NotFoundError(`Timecard with ID ${id} was not found.`);
    }

    if (
      currentUser.roleName === ROLES.EMPLOYEE &&
      timecard.EmployeeID !== currentUser.userId
    ) {
      throw new ForbiddenError('Access denied. You can only view your own timecards.');
    }

    return this._sanitizeForEmployee(timecard, currentUser);
  }

  /**
   * Level 1 Approval: Manager Approves Timecard
   */
  async approveManagerTimecard(id, { comments }, currentUser) {
    const timecard = await this.getTimecardById(id, currentUser);

    if (timecard.Status !== 'Submitted') {
      throw new BadRequestError(`Cannot approve timecard in '${timecard.Status}' status. Expected 'Submitted'.`);
    }

    // Update status to ManagerApproved
    const updatedTimecard = await timecardRepository.updateManagerApproval(id, {
      managerId: currentUser.userId,
      status: 'ManagerApproved',
      comments
    });

    logger.info(`Timecard ID ${id} approved by Manager ${currentUser.userId} (${currentUser.email})`);

    // Send notification to Employee
    try {
      await notificationService.createEventNotification({
        recipientId: timecard.EmployeeID,
        triggeredById: currentUser.userId,
        notificationType: 'TimecardManagerApproved',
        message: `Your timecard for week ${timecard.WeekStartDate} was approved by Manager ${currentUser.firstName} ${currentUser.lastName}.`
      });
    } catch (err) {
      logger.error('Error sending manager approval notification:', err);
    }

    // Notify Project Owners for Level 2 Financial Approval
    if (updatedTimecard.entries && updatedTimecard.entries.length > 0) {
      const ownerIds = [...new Set(updatedTimecard.entries.map(e => e.ProjectOwnerID).filter(Boolean))];
      for (const ownerId of ownerIds) {
        try {
          await notificationService.createEventNotification({
            recipientId: ownerId,
            triggeredById: currentUser.userId,
            notificationType: 'TimecardPendingFinancialApproval',
            message: `Timecard for ${timecard.EmployeeFirstName} ${timecard.EmployeeLastName} requires financial billing approval.`
          });
        } catch (err) {
          logger.error(`Error notifying Project Owner ${ownerId}:`, err);
        }
      }
    }

    return updatedTimecard;
  }

  /**
   * Level 1 Rejection: Manager Rejects Timecard
   */
  async rejectManagerTimecard(id, { comments }, currentUser) {
    const timecard = await this.getTimecardById(id, currentUser);

    if (timecard.Status !== 'Submitted') {
      throw new BadRequestError(`Cannot reject timecard in '${timecard.Status}' status. Expected 'Submitted'.`);
    }

    const updatedTimecard = await timecardRepository.updateManagerApproval(id, {
      managerId: currentUser.userId,
      status: 'ManagerRejected',
      comments
    });

    logger.info(`Timecard ID ${id} rejected by Manager ${currentUser.userId}`);

    try {
      await notificationService.createEventNotification({
        recipientId: timecard.EmployeeID,
        triggeredById: currentUser.userId,
        notificationType: 'TimecardManagerRejected',
        message: `Your timecard for week ${timecard.WeekStartDate} was rejected by Manager. Reason: ${comments || 'No comments provided'}`
      });
    } catch (err) {
      logger.error('Error sending manager rejection notification:', err);
    }

    return updatedTimecard;
  }

  /**
   * Level 2 Approval: Project Owner Financial / Billing Approval
   */
  async approveFinancialTimecard(id, { comments }, currentUser) {
    const timecard = await this.getTimecardById(id, currentUser);

    if (timecard.Status !== 'ManagerApproved') {
      throw new BadRequestError(`Cannot financially approve timecard in '${timecard.Status}' status. Must be 'ManagerApproved'.`);
    }

    const updatedTimecard = await timecardRepository.updateFinancialApproval(id, {
      financialApprovedById: currentUser.userId,
      status: 'FinancialApproved',
      comments
    });

    logger.info(`Timecard ID ${id} financially approved by Project Owner / Finance ${currentUser.userId}`);

    try {
      await notificationService.createEventNotification({
        recipientId: timecard.EmployeeID,
        triggeredById: currentUser.userId,
        notificationType: 'TimecardFinancialApproved',
        message: `Your timecard for week ${timecard.WeekStartDate} ($${timecard.TotalAmount}) was financially approved for billing!`
      });
    } catch (err) {
      logger.error('Error sending financial approval notification:', err);
    }

    return updatedTimecard;
  }

  /**
   * Level 2 Rejection: Project Owner Financial Rejection
   */
  async rejectFinancialTimecard(id, { comments }, currentUser) {
    const timecard = await this.getTimecardById(id, currentUser);

    if (timecard.Status !== 'ManagerApproved') {
      throw new BadRequestError(`Cannot financially reject timecard in '${timecard.Status}' status. Must be 'ManagerApproved'.`);
    }

    const updatedTimecard = await timecardRepository.updateFinancialApproval(id, {
      financialApprovedById: currentUser.userId,
      status: 'FinancialRejected',
      comments
    });

    logger.info(`Timecard ID ${id} financially rejected by Project Owner ${currentUser.userId}`);

    try {
      await notificationService.createEventNotification({
        recipientId: timecard.EmployeeID,
        triggeredById: currentUser.userId,
        notificationType: 'TimecardFinancialRejected',
        message: `Your timecard for week ${timecard.WeekStartDate} was rejected during financial billing clearance. Reason: ${comments || 'No comments provided'}`
      });
    } catch (err) {
      logger.error('Error sending financial rejection notification:', err);
    }

    return updatedTimecard;
  }

  /**
   * Get Project Costing and Billing Report for Project Owner
   */
  async getProjectBillingSummary(projectId, _currentUser) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} was not found.`);
    }

    return timecardRepository.getProjectBillingSummary(projectId);
  }
}

module.exports = new TimecardService();
