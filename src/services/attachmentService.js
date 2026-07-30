const attachmentRepository = require('../repositories/attachmentRepository');
const commentRepository = require('../repositories/commentRepository');
const projectRepository = require('../repositories/projectRepository');
const notificationService = require('./notificationService');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class AttachmentService {
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
   * Creates a new attachment record under a task (Project Participants)
   */
  async createAttachment(taskId, attachmentData, currentUser) {
    const hierarchy = await commentRepository.getTaskProjectHierarchy(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    const isParticipant = await this._isProjectParticipant(hierarchy.ProjectID, hierarchy.ProjectManagerID, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized attachment upload attempt: User ${currentUser.email} is not a participant in Project ID ${hierarchy.ProjectID}`);
      throw new ForbiddenError('Access denied. You can only upload attachments for projects you participate in.');
    }

    const newAttachmentId = await attachmentRepository.create({
      taskId,
      uploadedBy: currentUser.userId,
      fileName: attachmentData.fileName,
      filePath: attachmentData.filePath,
      fileSize: attachmentData.fileSize,
      fileType: attachmentData.fileType,
      createdBy: currentUser.userId
    });

    // Notify Project Manager
    await notificationService.createEventNotification({
      recipientId: hierarchy.ProjectManagerID,
      triggeredById: currentUser.userId,
      taskId,
      projectId: hierarchy.ProjectID,
      notificationType: 'Attachment Uploaded',
      message: `Attachment '${attachmentData.fileName}' was uploaded to task '${hierarchy.TaskTitle}'.`,
      createdBy: currentUser.userId
    });

    logger.info(`Attachment uploaded successfully [ID: ${newAttachmentId}, TaskID: ${taskId}, UploadedBy: ${currentUser.userId}]`);

    return attachmentRepository.findById(newAttachmentId);
  }

  async getAttachmentsByTaskId(taskId, queryParams, currentUser) {
    const hierarchy = await commentRepository.getTaskProjectHierarchy(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    const isParticipant = await this._isProjectParticipant(hierarchy.ProjectID, hierarchy.ProjectManagerID, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized attachments view attempt: User ${currentUser.email} is not a participant in Project ID ${hierarchy.ProjectID}`);
      throw new ForbiddenError('Access denied. You can only view attachments for projects you participate in.');
    }

    return attachmentRepository.findByTaskId(taskId, queryParams);
  }

  async getAttachmentById(attachmentId, currentUser) {
    const attachment = await attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundError(`Attachment with ID ${attachmentId} was not found`);
    }

    const isParticipant = await this._isProjectParticipant(attachment.projectId, attachment.projectManagerId, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized attachment view attempt: User ${currentUser.email} tried to view Attachment ID ${attachmentId}`);
      throw new ForbiddenError('Access denied. You can only view attachments for projects you participate in.');
    }

    return attachment;
  }

  async deleteAttachment(attachmentId, currentUser) {
    const existing = await attachmentRepository.findById(attachmentId);
    if (!existing) {
      throw new NotFoundError(`Attachment with ID ${attachmentId} was not found`);
    }

    const isUploader = existing.uploader && existing.uploader.id === currentUser.userId;
    const isManagingPm = currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId === currentUser.userId;
    const isAdmin = currentUser.roleName === ROLES.ADMINISTRATOR;

    if (!isAdmin && !isManagingPm && !isUploader) {
      logger.warn(`Unauthorized attachment delete attempt: User ${currentUser.email} tried to delete Attachment ID ${attachmentId}`);
      throw new ForbiddenError('Access denied. You can only delete your own attachments.');
    }

    await attachmentRepository.softDelete(attachmentId, currentUser.userId);

    logger.info(`Attachment soft-deleted successfully [ID: ${attachmentId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Attachment with ID ${attachmentId} was soft-deleted successfully` };
  }
}

module.exports = new AttachmentService();
