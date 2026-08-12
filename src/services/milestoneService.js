const milestoneRepository = require('../repositories/milestoneRepository');
const projectRepository = require('../repositories/projectRepository');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class MilestoneService {
  /**
   * Creates a new milestone for a project (Admin & PM managing project)
   */
  async createMilestone(projectId, data, currentUser) {
    // 1. Verify project exists
    const project = await milestoneRepository.getProjectWithDates(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} was not found`);
    }

    // 2. PM Ownership Guard: PMs can only create milestones for projects they manage
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && project.ProjectManagerID !== currentUser.userId) {
      logger.warn(`Unauthorized milestone creation attempt: PM ${currentUser.email} tried to add milestone to Project ID ${projectId} owned by PM ID ${project.ProjectManagerID}`);
      throw new ForbiddenError('Access denied. You can only create milestones for projects you manage.');
    }

    // 3. Title uniqueness within the project
    const titleExists = await milestoneRepository.findTitleInProject(projectId, data.milestoneTitle);
    if (titleExists) {
      throw new ConflictError(`Milestone with title '${data.milestoneTitle}' already exists in this project`);
    }

    // 4. Validate DueDate falls within Project duration (StartDate to EndDate)
    const dueDateObj = new Date(data.dueDate);
    const startDateObj = new Date(project.StartDate);
    const endDateObj = new Date(project.EndDate);

    if (dueDateObj < startDateObj || dueDateObj > endDateObj) {
      throw new BadRequestError(
        `Milestone due date (${data.dueDate.substring(0, 10)}) must fall within project duration (${project.StartDate.toISOString().substring(0, 10)} to ${project.EndDate.toISOString().substring(0, 10)}).`
      );
    }

    // 5. Create milestone within SQL transaction
    let newMilestoneId;
    await milestoneRepository.withTransaction(async (transaction) => {
      newMilestoneId = await milestoneRepository.create(
        {
          projectId,
          milestoneTitle: data.milestoneTitle,
          description: data.description,
          dueDate: data.dueDate,
          completedDate: data.completedDate,
          status: data.status || 'Not Started',
          createdBy: currentUser.userId
        },
        transaction
      );
    });

    logger.info(`Milestone created successfully [ID: ${newMilestoneId}, Title: ${data.milestoneTitle}, ProjectID: ${projectId}, CreatedBy: ${currentUser.userId}]`);

    return milestoneRepository.findById(newMilestoneId);
  }

  /**
   * Fetches paginated & filtered milestones for a project
   */
  async getMilestonesByProjectId(projectId, queryParams, currentUser) {
    // 1. Verify project exists
    const project = await milestoneRepository.getProjectWithDates(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} was not found`);
    }

    // 2. Employee Access Guard: Employees can only view milestones for assigned projects
    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(projectId, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized milestones list view attempt: Employee ${currentUser.email} tried to view milestones of unassigned Project ID ${projectId}`);
        throw new ForbiddenError('Access denied. You can only view milestones for projects you are assigned to.');
      }
    }

    return milestoneRepository.findByProjectId(projectId, queryParams);
  }

  /**
   * Fetches single milestone details by ID
   */
  async getMilestoneById(milestoneId, currentUser) {
    const milestone = await milestoneRepository.findById(milestoneId);
    if (!milestone) {
      throw new NotFoundError(`Milestone with ID ${milestoneId} was not found`);
    }

    // Employee Access Guard
    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(milestone.projectId, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized milestone view attempt: Employee ${currentUser.email} tried to view Milestone ID ${milestoneId}`);
        throw new ForbiddenError('Access denied. You can only view milestones for projects you are assigned to.');
      }
    }

    return milestone;
  }

  /**
   * Updates an existing milestone (Admin & PM managing project)
   */
  async updateMilestone(milestoneId, updateData, currentUser) {
    // 1. Verify milestone exists
    const existing = await milestoneRepository.findById(milestoneId);
    if (!existing) {
      throw new NotFoundError(`Milestone with ID ${milestoneId} was not found`);
    }

    // 2. PM Ownership Guard
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized milestone update attempt: PM ${currentUser.email} tried to update Milestone ID ${milestoneId}`);
      throw new ForbiddenError('Access denied. You can only update milestones for projects you manage.');
    }

    // 3. Title uniqueness within project if changing
    if (updateData.milestoneTitle && updateData.milestoneTitle.toLowerCase() !== existing.milestoneTitle.toLowerCase()) {
      const titleExists = await milestoneRepository.findTitleInProject(existing.projectId, updateData.milestoneTitle, milestoneId);
      if (titleExists) {
        throw new ConflictError(`Milestone with title '${updateData.milestoneTitle}' already exists in this project`);
      }
    }

    // 4. Validate DueDate falls within Project duration if changing
    if (updateData.dueDate) {
      const dueDateObj = new Date(updateData.dueDate);
      const startDateObj = new Date(existing.projectStartDate);
      const endDateObj = new Date(existing.projectEndDate);

      if (dueDateObj < startDateObj || dueDateObj > endDateObj) {
        throw new BadRequestError(
          `Milestone due date (${updateData.dueDate.substring(0, 10)}) must fall within project duration (${existing.projectStartDate.toISOString().substring(0, 10)} to ${existing.projectEndDate.toISOString().substring(0, 10)}).`
        );
      }
    }

    // 4.5 If status is set to Completed, check for open tasks
    if (updateData.status === 'Completed') {
      const incompleteCount = await milestoneRepository.getIncompleteTaskCount(milestoneId);
      if (incompleteCount > 0) {
        throw new BadRequestError(`Cannot complete milestone '${existing.milestoneTitle}' (ID: ${milestoneId}) because it has ${incompleteCount} incomplete task(s).`);
      }
    }

    // 5. Update milestone within SQL transaction
    await milestoneRepository.withTransaction(async (transaction) => {
      await milestoneRepository.update(milestoneId, updateData, currentUser.userId, transaction);
    });

    logger.info(`Milestone updated successfully [ID: ${milestoneId}, UpdatedBy: ${currentUser.userId}]`);

    return milestoneRepository.findById(milestoneId);
  }

  /**
   * Soft deletes a milestone record (Admin & PM managing project)
   */
  async deleteMilestone(milestoneId, currentUser) {
    // 1. Verify milestone exists
    const existing = await milestoneRepository.findById(milestoneId);
    if (!existing) {
      throw new NotFoundError(`Milestone with ID ${milestoneId} was not found`);
    }

    // 2. PM Ownership Guard
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized milestone delete attempt: PM ${currentUser.email} tried to delete Milestone ID ${milestoneId}`);
      throw new ForbiddenError('Access denied. You can only delete milestones for projects you manage.');
    }

    // 3. Active Task Dependency Guard: Prevent deletion if active tasks are assigned
    const activeTasksCount = await milestoneRepository.getActiveTaskCount(milestoneId);
    if (activeTasksCount > 0) {
      logger.warn(`Milestone deletion rejected: Active tasks exist [MilestoneID: ${milestoneId}, ActiveTasksCount: ${activeTasksCount}]`);
      throw new ConflictError(
        `Cannot delete milestone '${existing.milestoneTitle}' (ID: ${milestoneId}) because ${activeTasksCount} active task(s) are currently assigned to it. Please reassign or remove tasks before deleting.`
      );
    }

    // 4. Soft delete milestone within SQL transaction
    await milestoneRepository.withTransaction(async (transaction) => {
      await milestoneRepository.softDelete(milestoneId, currentUser.userId, transaction);
    });

    logger.info(`Milestone soft-deleted successfully [ID: ${milestoneId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Milestone with ID ${milestoneId} was soft-deleted successfully` };
  }
}

module.exports = new MilestoneService();
