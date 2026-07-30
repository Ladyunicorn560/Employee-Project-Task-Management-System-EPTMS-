const subtaskRepository = require('../repositories/subtaskRepository');
const projectRepository = require('../repositories/projectRepository');
const projectMemberRepository = require('../repositories/projectMemberRepository');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class SubtaskService {
  /**
   * Creates a new subtask under a parent task (Admin & PM managing project)
   */
  async createSubtask(taskId, data, currentUser) {
    // 1. Verify parent task, milestone, and project hierarchy
    const hierarchy = await subtaskRepository.getTaskMilestoneProjectHierarchy(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    // 2. PM Ownership Guard
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && hierarchy.ProjectManagerID !== currentUser.userId) {
      logger.warn(`Unauthorized subtask creation attempt: PM ${currentUser.email} tried to add subtask to Task ID ${taskId} on Project owned by PM ID ${hierarchy.ProjectManagerID}`);
      throw new ForbiddenError('Access denied. You can only create subtasks for projects you manage.');
    }

    // 3. If AssignedEmployeeID is specified, validate existence, active status, and project membership
    if (data.assignedEmployeeId) {
      const assignee = await projectMemberRepository.getEmployeeDetails(data.assignedEmployeeId);
      if (!assignee) {
        throw new BadRequestError(`Invalid AssignedEmployeeID (${data.assignedEmployeeId}): Employee does not exist`);
      }
      if (assignee.Status !== 'Active') {
        throw new BadRequestError(`Assigned employee '${assignee.FirstName} ${assignee.LastName}' must be active. Current status: '${assignee.Status}'.`);
      }

      const isBelongingToProject =
        data.assignedEmployeeId === hierarchy.ProjectManagerID ||
        (await projectRepository.isEmployeeAssignedToProject(hierarchy.ProjectID, data.assignedEmployeeId));

      if (!isBelongingToProject) {
        throw new BadRequestError(`Assigned employee '${assignee.FirstName} ${assignee.LastName}' does not belong to Project ID ${hierarchy.ProjectID}.`);
      }
    }

    // 4. Verify Subtask Title uniqueness within the parent task
    const titleExists = await subtaskRepository.findTitleInTask(taskId, data.subtaskTitle);
    if (titleExists) {
      throw new ConflictError(`Subtask with title '${data.subtaskTitle}' already exists in this task`);
    }

    // 5. Enforce Due Date Hierarchy (Subtask <= Task <= Milestone <= Project)
    const subDueDateObj = new Date(data.dueDate);
    const taskDueDateObj = new Date(hierarchy.TaskDueDate);
    const msDueDateObj = new Date(hierarchy.MilestoneDueDate);
    const projStartDateObj = new Date(hierarchy.ProjectStartDate);
    const projEndDateObj = new Date(hierarchy.ProjectEndDate);

    if (subDueDateObj > taskDueDateObj || subDueDateObj > msDueDateObj || subDueDateObj > projEndDateObj || subDueDateObj < projStartDateObj) {
      throw new BadRequestError(
        `Subtask due date (${data.dueDate.substring(0, 10)}) cannot exceed parent task due date (${hierarchy.TaskDueDate.toISOString().substring(0, 10)}), milestone due date (${hierarchy.MilestoneDueDate.toISOString().substring(0, 10)}), or project end date (${hierarchy.ProjectEndDate.toISOString().substring(0, 10)}).`
      );
    }

    // 6. Execute Subtask Creation and 3-Tier Progress Recalculation inside SQL Transaction
    let newSubtaskId;
    await subtaskRepository.withTransaction(async (transaction) => {
      newSubtaskId = await subtaskRepository.create(
        {
          taskId,
          subtaskTitle: data.subtaskTitle,
          description: data.description,
          assignedEmployeeId: data.assignedEmployeeId,
          priority: data.priority || 'Medium',
          status: data.status || 'Not Started',
          dueDate: data.dueDate,
          completedDate: data.completedDate,
          estimatedHours: data.estimatedHours,
          actualHours: data.actualHours,
          createdBy: currentUser.userId
        },
        transaction
      );

      // Recalculate 3-tier progress atomically (Subtask -> Task -> Milestone -> Project)
      await subtaskRepository.recalculateSubtaskTaskMilestoneProjectProgress(
        taskId,
        hierarchy.MilestoneID,
        hierarchy.ProjectID,
        currentUser.userId,
        transaction
      );
    });

    logger.info(`Subtask created successfully [ID: ${newSubtaskId}, Title: ${data.subtaskTitle}, TaskID: ${taskId}, CreatedBy: ${currentUser.userId}]`);

    return subtaskRepository.findById(newSubtaskId);
  }

  /**
   * Fetches paginated & filtered subtasks list for a task
   */
  async getSubtasksByTaskId(taskId, queryParams, currentUser) {
    // 1. Verify parent task exists
    const hierarchy = await subtaskRepository.getTaskMilestoneProjectHierarchy(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    // 2. Employee Access Guard
    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(hierarchy.ProjectID, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized subtasks list view attempt: Employee ${currentUser.email} tried to view subtasks of unassigned Project ID ${hierarchy.ProjectID}`);
        throw new ForbiddenError('Access denied. You can only view subtasks for projects you are assigned to.');
      }
    }

    return subtaskRepository.findByTaskId(taskId, queryParams);
  }

  /**
   * Fetches single subtask details by ID
   */
  async getSubtaskById(subtaskId, currentUser) {
    const subtask = await subtaskRepository.findById(subtaskId);
    if (!subtask) {
      throw new NotFoundError(`Subtask with ID ${subtaskId} was not found`);
    }

    // Employee Access Guard
    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(subtask.projectId, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized subtask view attempt: Employee ${currentUser.email} tried to view Subtask ID ${subtaskId}`);
        throw new ForbiddenError('Access denied. You can only view subtasks for projects you are assigned to.');
      }
    }

    return subtask;
  }

  /**
   * Updates an existing subtask record (Admin, assigned PM, or assigned Employee)
   */
  async updateSubtask(subtaskId, updateData, currentUser) {
    // 1. Verify subtask exists
    const existing = await subtaskRepository.findById(subtaskId);
    if (!existing) {
      throw new NotFoundError(`Subtask with ID ${subtaskId} was not found`);
    }

    // 2. Role-based Update Guards
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized subtask update attempt: PM ${currentUser.email} tried to update Subtask ID ${subtaskId}`);
      throw new ForbiddenError('Access denied. You can only update subtasks for projects you manage.');
    }

    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssignedToSubtask = existing.assignedEmployee && existing.assignedEmployee.id === currentUser.userId;
      const isAssignedToParentTask = existing.taskAssignedTo === currentUser.userId;

      if (!isAssignedToSubtask && !isAssignedToParentTask) {
        logger.warn(`Unauthorized subtask update attempt: Employee ${currentUser.email} tried to update Subtask ID ${subtaskId}`);
        throw new ForbiddenError('Access denied. You are only authorized to update subtasks assigned to you or your task.');
      }

      // Employees can ONLY update status, actualHours, or description/comments
      const restrictedFields = ['subtaskTitle', 'assignedEmployeeId', 'dueDate', 'priority', 'estimatedHours'];
      const attemptedRestrictedField = restrictedFields.find((f) => updateData[f] !== undefined);
      if (attemptedRestrictedField) {
        logger.warn(`Employee subtask update rejected: Attempted restricted field '${attemptedRestrictedField}' [SubtaskID: ${subtaskId}, User: ${currentUser.email}]`);
        throw new ForbiddenError(`Assigned employees can only update subtask status, time worked (actualHours), or description/comments. Cannot modify '${attemptedRestrictedField}'.`);
      }
    }

    // 3. Subtask Title uniqueness check if changing
    if (updateData.subtaskTitle && updateData.subtaskTitle.toLowerCase() !== existing.subtaskTitle.toLowerCase()) {
      const titleExists = await subtaskRepository.findTitleInTask(existing.taskId, updateData.subtaskTitle, subtaskId);
      if (titleExists) {
        throw new ConflictError(`Subtask with title '${updateData.subtaskTitle}' already exists in this task`);
      }
    }

    // 4. Validate Assignee if changing
    if (updateData.assignedEmployeeId && updateData.assignedEmployeeId !== existing.assignedEmployee?.id) {
      const assignee = await projectMemberRepository.getEmployeeDetails(updateData.assignedEmployeeId);
      if (!assignee) {
        throw new BadRequestError(`Invalid AssignedEmployeeID (${updateData.assignedEmployeeId}): Employee does not exist`);
      }
      if (assignee.Status !== 'Active') {
        throw new BadRequestError(`Assigned employee '${assignee.FirstName} ${assignee.LastName}' must be active. Current status: '${assignee.Status}'.`);
      }

      const isBelongingToProject =
        updateData.assignedEmployeeId === existing.projectManagerId ||
        (await projectRepository.isEmployeeAssignedToProject(existing.projectId, updateData.assignedEmployeeId));

      if (!isBelongingToProject) {
        throw new BadRequestError(`Assigned employee '${assignee.FirstName} ${assignee.LastName}' does not belong to Project ID ${existing.projectId}.`);
      }
    }

    // 5. Validate DueDate hierarchy if changing
    if (updateData.dueDate) {
      const subDueDateObj = new Date(updateData.dueDate);
      const taskDueDateObj = new Date(existing.taskDueDate);
      const msDueDateObj = new Date(existing.milestoneDueDate);
      const projStartDateObj = new Date(existing.projectStartDate);
      const projEndDateObj = new Date(existing.projectEndDate);

      if (subDueDateObj > taskDueDateObj || subDueDateObj > msDueDateObj || subDueDateObj > projEndDateObj || subDueDateObj < projStartDateObj) {
        throw new BadRequestError(
          `Subtask due date (${updateData.dueDate.substring(0, 10)}) cannot exceed parent task due date (${existing.taskDueDate.toISOString().substring(0, 10)}), milestone due date (${existing.milestoneDueDate.toISOString().substring(0, 10)}), or project end date (${existing.projectEndDate.toISOString().substring(0, 10)}).`
        );
      }
    }

    // 6. Update Subtask and Recalculate 3-Tier Progress inside SQL Transaction
    await subtaskRepository.withTransaction(async (transaction) => {
      await subtaskRepository.update(subtaskId, updateData, currentUser.userId, transaction);

      if (updateData.status && updateData.status !== existing.status) {
        await subtaskRepository.recalculateSubtaskTaskMilestoneProjectProgress(
          existing.taskId,
          existing.milestoneId,
          existing.projectId,
          currentUser.userId,
          transaction
        );
      }
    });

    logger.info(`Subtask updated successfully [ID: ${subtaskId}, UpdatedBy: ${currentUser.userId}]`);

    return subtaskRepository.findById(subtaskId);
  }

  /**
   * Soft deletes a subtask record (Admin & PM managing project)
   */
  async deleteSubtask(subtaskId, currentUser) {
    // 1. Verify subtask exists
    const existing = await subtaskRepository.findById(subtaskId);
    if (!existing) {
      throw new NotFoundError(`Subtask with ID ${subtaskId} was not found`);
    }

    // 2. PM Ownership Guard
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized subtask delete attempt: PM ${currentUser.email} tried to delete Subtask ID ${subtaskId}`);
      throw new ForbiddenError('Access denied. You can only delete subtasks for projects you manage.');
    }

    // 3. Perform Soft Delete and 3-Tier Progress Recalculation inside SQL Transaction
    await subtaskRepository.withTransaction(async (transaction) => {
      await subtaskRepository.softDelete(subtaskId, currentUser.userId, transaction);
      await subtaskRepository.recalculateSubtaskTaskMilestoneProjectProgress(
        existing.taskId,
        existing.milestoneId,
        existing.projectId,
        currentUser.userId,
        transaction
      );
    });

    logger.info(`Subtask soft-deleted successfully [ID: ${subtaskId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Subtask with ID ${subtaskId} was soft-deleted successfully` };
  }
}

module.exports = new SubtaskService();
