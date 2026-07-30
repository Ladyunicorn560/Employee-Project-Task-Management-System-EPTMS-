const reviewRepository = require('../repositories/reviewRepository');
const taskRepository = require('../repositories/taskRepository');
const projectRepository = require('../repositories/projectRepository');
const projectMemberRepository = require('../repositories/projectMemberRepository');
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
    // 1. Verify parent task and project hierarchy
    const hierarchy = await reviewRepository.getTaskHierarchyAndAssigned(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    // 2. Employee Access Guard (Employees can request Pending reviews on assigned tasks)
    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssignedToTask = hierarchy.TaskAssignedTo === currentUser.userId;
      if (!isAssignedToTask) {
        logger.warn(`Unauthorized review creation attempt: Employee ${currentUser.email} tried to request review for unassigned Task ID ${taskId}`);
        throw new ForbiddenError('Access denied. You can only request reviews for tasks assigned to you.');
      }
      // Employees can ONLY request Pending status
      if (data.status && data.status !== 'Pending') {
        throw new ForbiddenError('Access denied. Employees can only request Pending reviews.');
      }
    }

    // 3. Determine Reviewer ID
    const effectiveReviewerId = data.reviewerId || hierarchy.TaskReviewerID || hierarchy.ProjectManagerID || currentUser.userId;

    // 4. Validate Reviewer existence and active status
    const reviewer = await projectMemberRepository.getEmployeeDetails(effectiveReviewerId);
    if (!reviewer) {
      throw new BadRequestError(`Invalid ReviewerID (${effectiveReviewerId}): Employee does not exist`);
    }
    if (reviewer.Status !== 'Active') {
      throw new BadRequestError(`Reviewer '${reviewer.FirstName} ${reviewer.LastName}' must be active. Current status: '${reviewer.Status}'.`);
    }

    // 5. Self-Review Prevention Guard (Reviewers cannot review tasks assigned to or created by themselves unless Admin)
    const isSelfReview =
      effectiveReviewerId === hierarchy.TaskAssignedTo ||
      effectiveReviewerId === hierarchy.TaskCreatedBy ||
      currentUser.userId === hierarchy.TaskAssignedTo ||
      currentUser.userId === hierarchy.TaskCreatedBy;

    if (isSelfReview && currentUser.roleName !== ROLES.ADMINISTRATOR && data.status && data.status !== 'Pending') {
      logger.warn(`Self-review attempt blocked: User ${currentUser.email} tried to review task assigned/created by self [TaskID: ${taskId}]`);
      throw new ForbiddenError('Self-review is not permitted. Reviewers cannot review tasks assigned to or created by themselves.');
    }

    // 6. Prevent Duplicate Active Pending Review Requests
    const existingPending = await reviewRepository.findPendingReviewForTask(taskId);
    if (existingPending) {
      throw new ConflictError(`An active pending review request already exists for task ID ${taskId}`);
    }

    // 7. Determine Next Iteration Number
    const iteration = await reviewRepository.getNextIterationNumber(taskId);

    // 8. Execute Review Creation and Task/Project Status Updates inside SQL Transaction
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

      // Automatic Task Status Update & Progress Recalculation
      if (data.status === 'Approved') {
        await reviewRepository.updateTaskStatus(taskId, 'Completed', currentUser.userId, transaction);
        await taskRepository.recalculateMilestoneAndProjectProgress(
          hierarchy.MilestoneID,
          hierarchy.ProjectID,
          currentUser.userId,
          transaction
        );
      } else if (data.status === 'Changes Required') {
        await reviewRepository.updateTaskStatus(taskId, 'Changes Required', currentUser.userId, transaction);
      }
    });

    logger.info(`Review created successfully [ID: ${newReviewId}, TaskID: ${taskId}, Status: ${data.status || 'Pending'}, Iteration: ${iteration}, CreatedBy: ${currentUser.userId}]`);

    return reviewRepository.findById(newReviewId);
  }

  /**
   * Fetches paginated & filtered reviews list for a task
   */
  async getReviewsByTaskId(taskId, queryParams, currentUser) {
    // 1. Verify parent task exists
    const hierarchy = await reviewRepository.getTaskHierarchyAndAssigned(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    // 2. Employee Access Guard
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

    // Employee Access Guard
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
    // 1. Verify review exists
    const existing = await reviewRepository.findById(reviewId);
    if (!existing) {
      throw new NotFoundError(`Review with ID ${reviewId} was not found`);
    }

    // 2. Role-based Update Guards
    if (currentUser.roleName === ROLES.EMPLOYEE) {
      logger.warn(`Unauthorized review update attempt: Employee ${currentUser.email} tried to update Review ID ${reviewId}`);
      throw new ForbiddenError('Access denied. Employees are not authorized to update review outcomes.');
    }

    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized review update attempt: PM ${currentUser.email} tried to update Review ID ${reviewId}`);
      throw new ForbiddenError('Access denied. You can only update reviews for projects you manage.');
    }

    // 3. Self-Review Prevention Guard
    const isSelfReview =
      currentUser.userId === existing.taskAssignedTo ||
      currentUser.userId === existing.taskCreatedBy;

    if (isSelfReview && currentUser.roleName !== ROLES.ADMINISTRATOR) {
      logger.warn(`Self-review update attempt blocked: User ${currentUser.email} tried to update Review ID ${reviewId} for task assigned/created by self`);
      throw new ForbiddenError('Self-review is not permitted. Reviewers cannot review tasks assigned to or created by themselves.');
    }

    // 4. Review Immutability Guard (Only Pending reviews may be updated)
    if (existing.status !== 'Pending') {
      logger.warn(`Review update rejected: Review ID ${reviewId} is already in finalized state '${existing.status}'`);
      throw new BadRequestError(`Review with ID ${reviewId} is finalized ('${existing.status}') and cannot be updated. Please submit a new review request.`);
    }

    // 5. Update Review and Automatic Task/Project Status Transitions inside SQL Transaction
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
      // Note: If Rejected, task status is preserved and review outcome is recorded in dbo.Review
    });

    logger.info(`Review updated successfully [ID: ${reviewId}, Status: ${updateData.status}, UpdatedBy: ${currentUser.userId}]`);

    return reviewRepository.findById(reviewId);
  }

  /**
   * Soft deletes a review record (Admin & PM managing project)
   */
  async deleteReview(reviewId, currentUser) {
    // 1. Verify review exists
    const existing = await reviewRepository.findById(reviewId);
    if (!existing) {
      throw new NotFoundError(`Review with ID ${reviewId} was not found`);
    }

    // 2. PM Ownership Guard
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId !== currentUser.userId) {
      logger.warn(`Unauthorized review delete attempt: PM ${currentUser.email} tried to delete Review ID ${reviewId}`);
      throw new ForbiddenError('Access denied. You can only delete reviews for projects you manage.');
    }

    // 3. Perform Soft Delete
    await reviewRepository.softDelete(reviewId, currentUser.userId);

    logger.info(`Review soft-deleted successfully [ID: ${reviewId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Review with ID ${reviewId} was soft-deleted successfully` };
  }
}

module.exports = new ReviewService();
