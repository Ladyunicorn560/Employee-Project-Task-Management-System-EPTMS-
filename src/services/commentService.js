const commentRepository = require('../repositories/commentRepository');
const projectRepository = require('../repositories/projectRepository');
const notificationService = require('./notificationService');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class CommentService {
  async _isProjectParticipant(projectId, projectManagerId, currentUser) {
    if (currentUser.roleName === ROLES.ADMINISTRATOR) {
      return true;
    }
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && projectManagerId === currentUser.userId) {
      return true;
    }
    return projectRepository.isEmployeeAssignedToProject(projectId, currentUser.userId);
  }

  /**
   * Creates a new comment under a task (Project Participants)
   */
  async createComment(taskId, commentText, currentUser) {
    const hierarchy = await commentRepository.getTaskProjectHierarchy(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    const isParticipant = await this._isProjectParticipant(hierarchy.ProjectID, hierarchy.ProjectManagerID, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized comment creation attempt: User ${currentUser.email} is not a participant in Project ID ${hierarchy.ProjectID}`);
      throw new ForbiddenError('Access denied. You can only add comments to projects you participate in.');
    }

    const newCommentId = await commentRepository.create({
      taskId,
      employeeId: currentUser.userId,
      commentText,
      createdBy: currentUser.userId
    });

    // Notify Project Manager
    await notificationService.createEventNotification({
      recipientId: hierarchy.ProjectManagerID,
      triggeredById: currentUser.userId,
      taskId,
      projectId: hierarchy.ProjectID,
      notificationType: 'Comment Added',
      message: `New comment added on task '${hierarchy.TaskTitle}'.`,
      createdBy: currentUser.userId
    });

    logger.info(`Comment created successfully [ID: ${newCommentId}, TaskID: ${taskId}, CreatedBy: ${currentUser.userId}]`);

    return commentRepository.findById(newCommentId);
  }

  async getCommentsByTaskId(taskId, queryParams, currentUser) {
    const hierarchy = await commentRepository.getTaskProjectHierarchy(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    const isParticipant = await this._isProjectParticipant(hierarchy.ProjectID, hierarchy.ProjectManagerID, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized comments view attempt: User ${currentUser.email} is not a participant in Project ID ${hierarchy.ProjectID}`);
      throw new ForbiddenError('Access denied. You can only view comments for projects you participate in.');
    }

    return commentRepository.findByTaskId(taskId, queryParams);
  }

  async getCommentById(commentId, currentUser) {
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundError(`Comment with ID ${commentId} was not found`);
    }

    const isParticipant = await this._isProjectParticipant(comment.projectId, comment.projectManagerId, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized comment view attempt: User ${currentUser.email} tried to view Comment ID ${commentId}`);
      throw new ForbiddenError('Access denied. You can only view comments for projects you participate in.');
    }

    return comment;
  }

  async updateComment(commentId, commentText, currentUser) {
    const existing = await commentRepository.findById(commentId);
    if (!existing) {
      throw new NotFoundError(`Comment with ID ${commentId} was not found`);
    }

    const isAuthor = existing.author && existing.author.id === currentUser.userId;
    const isManagingPm = currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId === currentUser.userId;
    const isAdmin = currentUser.roleName === ROLES.ADMINISTRATOR;

    if (!isAdmin && !isManagingPm && !isAuthor) {
      logger.warn(`Unauthorized comment update attempt: User ${currentUser.email} tried to update Comment ID ${commentId}`);
      throw new ForbiddenError('Access denied. You can only edit your own comments.');
    }

    await commentRepository.update(commentId, commentText, currentUser.userId);

    logger.info(`Comment updated successfully [ID: ${commentId}, UpdatedBy: ${currentUser.userId}]`);

    return commentRepository.findById(commentId);
  }

  async deleteComment(commentId, currentUser) {
    const existing = await commentRepository.findById(commentId);
    if (!existing) {
      throw new NotFoundError(`Comment with ID ${commentId} was not found`);
    }

    const isAuthor = existing.author && existing.author.id === currentUser.userId;
    const isManagingPm = currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId === currentUser.userId;
    const isAdmin = currentUser.roleName === ROLES.ADMINISTRATOR;

    if (!isAdmin && !isManagingPm && !isAuthor) {
      logger.warn(`Unauthorized comment delete attempt: User ${currentUser.email} tried to delete Comment ID ${commentId}`);
      throw new ForbiddenError('Access denied. You can only delete your own comments.');
    }

    await commentRepository.softDelete(commentId, currentUser.userId);

    logger.info(`Comment soft-deleted successfully [ID: ${commentId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Comment with ID ${commentId} was soft-deleted successfully` };
  }
}

module.exports = new CommentService();
