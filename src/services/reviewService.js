const reviewRepository = require('../repositories/reviewRepository');
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

class ReviewService {
  /**
   * Creates a new review or review request under a task
   */
  async createReview(taskId, data, currentUser) {
    const hierarchy = await reviewRepository.getTaskHierarchyAndAssigned(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssignedToTask = hierarchy.TaskAssignedTo === currentUser.userId;
      if (!isAssignedToTask) {
        logger.warn(`Unauthorized review creation attempt: Employee ${currentUser.email} tried to request review for unassigned Task ID ${taskId}`);
        throw new ForbiddenError('Access denied. You can only request reviews for tasks assigned to you.');
      }
      if (data.status && data.status !== 'Pending') {
        throw new ForbiddenError('Access denied. Employees can only request Pending reviews.');
      }
    }

    const effectiveReviewerId = data.reviewerId || hierarchy.TaskReviewerID || hierarchy.ProjectManagerID || currentUser.userId;

    const reviewer = await projectMemberRepository.getEmployeeDetails(effectiveReviewerId);
    if (!reviewer) {
      throw new BadRequestError(`Invalid ReviewerID (${effectiveReviewerId}): Employee does not exist`);
    }
    if (reviewer.Status !== 'Active') {
      throw new BadRequestError(`Reviewer '${reviewer.FirstName} ${reviewer.LastName}' must be active. Current status: '${reviewer.Status}'.`);
    }

    const isSelfReview =
      effectiveReviewerId === hierarchy.TaskAssignedTo ||
      effectiveReviewerId === hierarchy.TaskCreatedBy ||
      currentUser.userId === hierarchy.TaskAssignedTo ||
      currentUser.userId === hierarchy.TaskCreatedBy;

    if (isSelfReview && currentUser.roleName !== ROLES.ADMINISTRATOR && data.status && data.status !== 'Pending') {
      logger.warn(`Self-review attempt blocked: User ${currentUser.email} tried to review task assigned/created by self [TaskID: ${taskId}]`);
      throw new ForbiddenError('Self-review is not permitted. Reviewers cannot review tasks assigned to or created by themselves.');
    }

    const existingPending = await reviewRepository.findPendingReviewForTask(taskId);
    if (existingPending) {
      throw new ConflictError(`An active pending review request already exists for task ID ${taskId}`);
    }

    const iteration = await reviewRepository.getNextIterationNumber(taskId);

    let newReviewId;
    await reviewRepository.withTransaction(async (transaction) => {
      newReviewId = await reviewRepository.create(
        {
          taskId,
          reviewerId: effectiveReviewerId,
          iteration,
          status: data.status || 'Pending',
          comments: data.comments,
          createdBy: currentUser.userId
        },
        transaction
      );

      const targetStatus = data.status || 'Pending';

      if (targetStatus === 'Approved') {
        await reviewRepository.updateTaskStatus(taskId, 'Completed', currentUser.userId, transaction);
        await taskRepository.recalculateMilestoneAndProjectProgress(
          hierarchy.MilestoneID,
          hierarchy.ProjectID,
          currentUser.userId,
          transaction
        );
      } else if (targetStatus === 'Changes Required') {
        await reviewRepository.updateTaskStatus(taskId, 'Changes Required', currentUser.userId, transaction);
      }

      // Trigger Event Notifications
      if (targetStatus === 'Pending') {
        await notificationService.createEventNotification(
          {
            recipientId: effectiveReviewerId,
            triggeredById: currentUser.userId,
            taskId,
            projectId: hierarchy.ProjectID,
            notificationType: 'Review Requested',
            message: `A code review was requested for task '${hierarchy.TaskTitle}'.`,
            createdBy: currentUser.userId
          },
          transaction
        );
      } else {
        const notifTypeMap = {
          Approved: 'Review Approved',
          Rejected: 'Review Rejected',
          'Changes Required': 'Review Changes Required'
        };
        const notifType = notifTypeMap[targetStatus];

        if (hierarchy.TaskAssignedTo) {
          await notificationService.createEventNotification(
            {
              recipientId: hierarchy.TaskAssignedTo,
              triggeredById: currentUser.userId,
              taskId,
              projectId: hierarchy.ProjectID,
              notificationType: notifType,
              message: `Review outcome for task '${hierarchy.TaskTitle}': ${targetStatus}.`,
              createdBy: currentUser.userId
            },
            transaction
          );
        }
      }
    });

    logger.info(`Review created successfully [ID: ${newReviewId}, TaskID: ${taskId}, Status: ${data.status || 'Pending'}, Iteration: ${iteration}, CreatedBy: ${currentUser.userId}]`);

    return reviewRepository.findById(newReviewId);
  }

  /**
   * Fetches paginated & filtered reviews list for a task
   */
  async getReviewsByTaskId(taskId, queryParams, currentUser) {
    const hierarchy = await reviewRepository.getTaskHierarchyAndAssigned(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(hierarchy.ProjectID, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized reviews list view attempt: Employee ${currentUser.email} tried to view reviews of unassigned Project ID ${hierarchy.ProjectID}`);
        throw new ForbiddenError('Access denied. You can only view reviews for projects you are assigned to.');
      }
    }

    return reviewRepository.findByTaskId(taskId, queryParams);
  }

  /**
   * Fetches single review details by ID
   */
  async getReviewById(reviewId, currentUser) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new NotFoundError(`Review with ID ${reviewId} was not found`);
    }

    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(review.projectId, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized review view attempt: Employee ${currentUser.email} tried to view Review ID ${reviewId}`);
        throw new ForbiddenError('Access denied. You can only view reviews for projects you are assigned to.');
      }
    }

    return review;
  }

  /**
   * Updates review status and outcome (Reviewer, Admin, or PM managing project)
   */
  async updateReview(reviewId, updateData, currentUser) {
    const existing = await reviewRepository.findById(reviewId);
    if (!existing) {
      throw new NotFoundError(`Review with ID ${reviewId} was not found`);
    }

    if (currentUser.roleName === ROLES.EMPLOYEE) {
      logger.warn(`Unauthorized review update attempt: Employee ${currentUser.email} tried to update Review ID ${reviewId}`);
      throw new ForbiddenError('Access denied. Employees are not authorized to update review outcomes.');
    }

    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized review update attempt: PM ${currentUser.email} tried to update Review ID ${reviewId}`);
      throw new ForbiddenError('Access denied. You can only update reviews for projects you manage.');
    }

    const isSelfReview =
      currentUser.userId === existing.taskAssignedTo ||
      currentUser.userId === existing.taskCreatedBy;

    if (isSelfReview && currentUser.roleName !== ROLES.ADMINISTRATOR) {
      logger.warn(`Self-review update attempt blocked: User ${currentUser.email} tried to update Review ID ${reviewId} for task assigned/created by self`);
      throw new ForbiddenError('Self-review is not permitted. Reviewers cannot review tasks assigned to or created by themselves.');
    }

    if (existing.status !== 'Pending') {
      logger.warn(`Review update rejected: Review ID ${reviewId} is already in finalized state '${existing.status}'`);
      throw new BadRequestError(`Review with ID ${reviewId} is finalized ('${existing.status}') and cannot be updated. Please submit a new review request.`);
    }

    await reviewRepository.withTransaction(async (transaction) => {
      await reviewRepository.update(reviewId, updateData, currentUser.userId, transaction);

      if (updateData.status === 'Approved') {
        await reviewRepository.updateTaskStatus(existing.taskId, 'Completed', currentUser.userId, transaction);
        await taskRepository.recalculateMilestoneAndProjectProgress(
          existing.milestoneId,
          existing.projectId,
          currentUser.userId,
          transaction
        );
      } else if (updateData.status === 'Changes Required') {
        await reviewRepository.updateTaskStatus(existing.taskId, 'Changes Required', currentUser.userId, transaction);
      }

      // Notify Task Assignee & Creator of outcome
      const notifTypeMap = {
        Approved: 'Review Approved',
        Rejected: 'Review Rejected',
        'Changes Required': 'Review Changes Required'
      };
      const notifType = notifTypeMap[updateData.status];

      if (notifType && existing.taskAssignedTo) {
        await notificationService.createEventNotification(
          {
            recipientId: existing.taskAssignedTo,
            triggeredById: currentUser.userId,
            taskId: existing.taskId,
            projectId: existing.projectId,
            notificationType: notifType,
            message: `Review outcome for task '${existing.taskTitle}': ${updateData.status}.`,
            createdBy: currentUser.userId
          },
          transaction
        );
      }
    });

    logger.info(`Review updated successfully [ID: ${reviewId}, Status: ${updateData.status}, UpdatedBy: ${currentUser.userId}]`);

    return reviewRepository.findById(reviewId);
  }

  /**
   * Soft deletes a review record (Admin & PM managing project)
   */
  async deleteReview(reviewId, currentUser) {
    const existing = await reviewRepository.findById(reviewId);
    if (!existing) {
      throw new NotFoundError(`Review with ID ${reviewId} was not found`);
    }

    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized review delete attempt: PM ${currentUser.email} tried to delete Review ID ${reviewId}`);
      throw new ForbiddenError('Access denied. You can only delete reviews for projects you manage.');
    }

    await reviewRepository.softDelete(reviewId, currentUser.userId);

    logger.info(`Review soft-deleted successfully [ID: ${reviewId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Review with ID ${reviewId} was soft-deleted successfully` };
  }
}

module.exports = new ReviewService();
