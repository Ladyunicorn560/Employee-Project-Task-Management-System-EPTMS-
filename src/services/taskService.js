const taskRepository = require('../repositories/taskRepository');
const projectRepository = require('../repositories/projectRepository');
const projectMemberRepository = require('../repositories/projectMemberRepository');
const notificationService = require('./notificationService');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class TaskService {
  /**
   * Creates a new task under a milestone (Admin & PM managing project)
   */
  async createTask(milestoneId, data, currentUser) {
    // 1. Verify Milestone and Project hierarchy exists
    const hierarchy = await taskRepository.getMilestoneAndProjectHierarchy(milestoneId);
    if (!hierarchy) {
      throw new NotFoundError(`Milestone with ID ${milestoneId} was not found`);
    }

    // 2. PM Ownership Guard
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && hierarchy.ProjectManagerID !== currentUser.userId) {
      logger.warn(`Unauthorized task creation attempt: PM ${currentUser.email} tried to add task to Milestone ID ${milestoneId} on Project owned by PM ID ${hierarchy.ProjectManagerID}`);
      throw new ForbiddenError('Access denied. You can only create tasks for projects you manage.');
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

    // 4. Verify Task Title uniqueness within the milestone
    const titleExists = await taskRepository.findTitleInMilestone(milestoneId, data.taskTitle);
    if (titleExists) {
      throw new ConflictError(`Task with title '${data.taskTitle}' already exists in this milestone`);
    }

    // 5. Validate DueDate falls within Milestone DueDate and Project Duration
    const dueDateObj = new Date(data.dueDate);
    const msDueDateObj = new Date(hierarchy.MilestoneDueDate);
    const projStartDateObj = new Date(hierarchy.ProjectStartDate);
    const projEndDateObj = new Date(hierarchy.ProjectEndDate);

    if (dueDateObj > msDueDateObj || dueDateObj < projStartDateObj || dueDateObj > projEndDateObj) {
      throw new BadRequestError(
        `Task due date (${data.dueDate.substring(0, 10)}) must fall within milestone due date (${hierarchy.MilestoneDueDate.toISOString().substring(0, 10)}) and project duration (${hierarchy.ProjectStartDate.toISOString().substring(0, 10)} to ${hierarchy.ProjectEndDate.toISOString().substring(0, 10)}).`
      );
    }

    // 6. Execute Task Creation and Progress Recalculation inside SQL Transaction
    let newTaskId;
    await taskRepository.withTransaction(async (transaction) => {
      newTaskId = await taskRepository.create(
        {
          milestoneId,
          projectId: hierarchy.ProjectID,
          projectManagerId: hierarchy.ProjectManagerID,
          taskTitle: data.taskTitle,
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

      // Recalculate Milestone & Project Progress atomically
      await taskRepository.recalculateMilestoneAndProjectProgress(
        milestoneId,
        hierarchy.ProjectID,
        currentUser.userId,
        transaction
      );

      // Trigger Task Assigned Notification if assigned
      if (data.assignedEmployeeId) {
        await notificationService.createEventNotification(
          {
            recipientId: data.assignedEmployeeId,
            triggeredById: currentUser.userId,
            taskId: newTaskId,
            projectId: hierarchy.ProjectID,
            notificationType: 'Task Assigned',
            message: `You have been assigned to task '${data.taskTitle}' in project '${hierarchy.ProjectName}'.`,
            createdBy: currentUser.userId
          },
          transaction
        );
      }
    });

    logger.info(`Task created successfully [ID: ${newTaskId}, Title: ${data.taskTitle}, MilestoneID: ${milestoneId}, CreatedBy: ${currentUser.userId}]`);

    return taskRepository.findById(newTaskId);
  }

  /**
   * Fetches paginated & filtered tasks list for a milestone
   */
  async getTasksByMilestoneId(milestoneId, queryParams, currentUser) {
    const hierarchy = await taskRepository.getMilestoneAndProjectHierarchy(milestoneId);
    if (!hierarchy) {
      throw new NotFoundError(`Milestone with ID ${milestoneId} was not found`);
    }

    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(hierarchy.ProjectID, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized tasks list view attempt: Employee ${currentUser.email} tried to view tasks of unassigned Project ID ${hierarchy.ProjectID}`);
        throw new ForbiddenError('Access denied. You can only view tasks for projects you are assigned to.');
      }
    }

    return taskRepository.findByMilestoneId(milestoneId, queryParams);
  }

  /**
   * Fetches single task details by ID
   */
  async getTaskById(taskId, currentUser) {
    const task = await taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(task.projectId, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized task view attempt: Employee ${currentUser.email} tried to view Task ID ${taskId}`);
        throw new ForbiddenError('Access denied. You can only view tasks for projects you are assigned to.');
      }
    }

    return task;
  }

  /**
   * Updates an existing task record (Admin, assigned PM, or assigned Employee)
   */
  async updateTask(taskId, updateData, currentUser) {
    const existing = await taskRepository.findById(taskId);
    if (!existing) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized task update attempt: PM ${currentUser.email} tried to update Task ID ${taskId}`);
      throw new ForbiddenError('Access denied. You can only update tasks for projects you manage.');
    }

    if (currentUser.roleName === ROLES.EMPLOYEE) {
      if (!existing.assignedEmployee || existing.assignedEmployee.id !== currentUser.userId) {
        logger.warn(`Unauthorized task update attempt: Employee ${currentUser.email} tried to update Task ID ${taskId} assigned to Employee ID ${existing.assignedEmployee?.id}`);
        throw new ForbiddenError('Access denied. You are only authorized to update tasks assigned to you.');
      }

      const restrictedFields = ['taskTitle', 'assignedEmployeeId', 'dueDate', 'priority', 'estimatedHours'];
      const attemptedRestrictedField = restrictedFields.find((f) => updateData[f] !== undefined);
      if (attemptedRestrictedField) {
        logger.warn(`Employee task update rejected: Attempted restricted field '${attemptedRestrictedField}' [TaskID: ${taskId}, User: ${currentUser.email}]`);
        throw new ForbiddenError(`Assigned employees can only update task status, time worked (actualHours), or description/comments. Cannot modify '${attemptedRestrictedField}'.`);
      }
    }

    if (updateData.taskTitle && updateData.taskTitle.toLowerCase() !== existing.taskTitle.toLowerCase()) {
      const titleExists = await taskRepository.findTitleInMilestone(existing.milestoneId, updateData.taskTitle, taskId);
      if (titleExists) {
        throw new ConflictError(`Task with title '${updateData.taskTitle}' already exists in this milestone`);
      }
    }

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

    if (updateData.dueDate) {
      const dueDateObj = new Date(updateData.dueDate);
      const msDueDateObj = new Date(existing.milestoneDueDate);
      const projStartDateObj = new Date(existing.projectStartDate);
      const projEndDateObj = new Date(existing.projectEndDate);

      if (dueDateObj > msDueDateObj || dueDateObj < projStartDateObj || dueDateObj > projEndDateObj) {
        throw new BadRequestError(
          `Task due date (${updateData.dueDate.substring(0, 10)}) must fall within milestone due date (${existing.milestoneDueDate.toISOString().substring(0, 10)}) and project duration (${existing.projectStartDate.toISOString().substring(0, 10)} to ${existing.projectEndDate.toISOString().substring(0, 10)}).`
        );
      }
    }

    await taskRepository.withTransaction(async (transaction) => {
      await taskRepository.update(taskId, updateData, currentUser.userId, transaction);

      if (updateData.status && updateData.status !== existing.status) {
        await taskRepository.recalculateMilestoneAndProjectProgress(
          existing.milestoneId,
          existing.projectId,
          currentUser.userId,
          transaction
        );

        if (updateData.status === 'Completed') {
          // Notify PM & Assignee of completion
          await notificationService.createEventNotification(
            {
              recipientId: existing.projectManagerId,
              triggeredById: currentUser.userId,
              taskId,
              projectId: existing.projectId,
              notificationType: 'Task Completed',
              message: `Task '${existing.taskTitle}' has been marked as Completed.`,
              createdBy: currentUser.userId
            },
            transaction
          );
        }
      }

      // Notify newly assigned employee if changed
      if (updateData.assignedEmployeeId && updateData.assignedEmployeeId !== existing.assignedEmployee?.id) {
        await notificationService.createEventNotification(
          {
            recipientId: updateData.assignedEmployeeId,
            triggeredById: currentUser.userId,
            taskId,
            projectId: existing.projectId,
            notificationType: 'Task Assigned',
            message: `You have been assigned to task '${existing.taskTitle}'.`,
            createdBy: currentUser.userId
          },
          transaction
        );
      }
    });

    logger.info(`Task updated successfully [ID: ${taskId}, UpdatedBy: ${currentUser.userId}]`);

    return taskRepository.findById(taskId);
  }

  /**
   * Soft deletes a task record (Admin & PM managing project)
   */
  async deleteTask(taskId, currentUser) {
    const existing = await taskRepository.findById(taskId);
    if (!existing) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized task delete attempt: PM ${currentUser.email} tried to delete Task ID ${taskId}`);
      throw new ForbiddenError('Access denied. You can only delete tasks for projects you manage.');
    }

    await taskRepository.withTransaction(async (transaction) => {
      await taskRepository.softDelete(taskId, currentUser.userId, transaction);
      await taskRepository.recalculateMilestoneAndProjectProgress(
        existing.milestoneId,
        existing.projectId,
        currentUser.userId,
        transaction
      );
    });

    logger.info(`Task soft-deleted successfully [ID: ${taskId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Task with ID ${taskId} was soft-deleted successfully` };
  }
}

module.exports = new TaskService();
