const attachmentRepository = require('../repositories/attachmentRepository');
const commentRepository = require('../repositories/commentRepository');
const projectRepository = require('../repositories/projectRepository');
const NotFoundError = require('../errors/NotFoundError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class AttachmentService {
  /**
   * Helper to verify if user is a participant in the project
   */
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
    // 1. Verify parent task and project hierarchy
    const hierarchy = await commentRepository.getTaskProjectHierarchy(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    // 2. Participant Guard
    const isParticipant = await this._isProjectParticipant(hierarchy.ProjectID, hierarchy.ProjectManagerID, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized attachment upload attempt: User ${currentUser.email} is not a participant in Project ID ${hierarchy.ProjectID}`);
      throw new ForbiddenError('Access denied. You can only upload attachments for projects you participate in.');
    }

    // 3. Create Attachment Record
    const newAttachmentId = await attachmentRepository.create({
      taskId,
      uploadedBy: currentUser.userId,
      fileName: attachmentData.fileName,
      filePath: attachmentData.filePath,
      fileSize: attachmentData.fileSize,
      fileType: attachmentData.fileType,
      createdBy: currentUser.userId
    });

    logger.info(`Attachment uploaded successfully [ID: ${newAttachmentId}, TaskID: ${taskId}, UploadedBy: ${currentUser.userId}]`);

    return attachmentRepository.findById(newAttachmentId);
  }

  /**
   * Fetches paginated & filtered attachments list for a task
   */
  async getAttachmentsByTaskId(taskId, queryParams, currentUser) {
    // 1. Verify parent task exists
    const hierarchy = await commentRepository.getTaskProjectHierarchy(taskId);
    if (!hierarchy) {
      throw new NotFoundError(`Task with ID ${taskId} was not found`);
    }

    // 2. Participant Guard for Employees & PMs
    const isParticipant = await this._isProjectParticipant(hierarchy.ProjectID, hierarchy.ProjectManagerID, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized attachments view attempt: User ${currentUser.email} is not a participant in Project ID ${hierarchy.ProjectID}`);
      throw new ForbiddenError('Access denied. You can only view attachments for projects you participate in.');
    }

    return attachmentRepository.findByTaskId(taskId, queryParams);
  }

  /**
   * Fetches single attachment details by ID
   */
  async getAttachmentById(attachmentId, currentUser) {
    const attachment = await attachmentRepository.findById(attachmentId);
    if (!attachment) {
      throw new NotFoundError(`Attachment with ID ${attachmentId} was not found`);
    }

    // Participant Guard
    const isParticipant = await this._isProjectParticipant(attachment.projectId, attachment.projectManagerId, currentUser);
    if (!isParticipant) {
      logger.warn(`Unauthorized attachment view attempt: User ${currentUser.email} tried to view Attachment ID ${attachmentId}`);
      throw new ForbiddenError('Access denied. You can only view attachments for projects you participate in.');
    }

    return attachment;
  }

  /**
   * Soft deletes an attachment (Admin, PM managing project, or uploader)
   */
  async deleteAttachment(attachmentId, currentUser) {
    // 1. Verify attachment exists
    const existing = await attachmentRepository.findById(attachmentId);
    if (!existing) {
      throw new NotFoundError(`Attachment with ID ${attachmentId} was not found`);
    }

    // 2. Ownership / Permission Guard
    const isUploader = existing.uploader && existing.uploader.id === currentUser.userId;
    const isManagingPm = currentUser.roleName === ROLES.PROJECT_MANAGER && existing.projectManagerId === currentUser.userId;
    const isAdmin = currentUser.roleName === ROLES.ADMINISTRATOR;

    if (!isAdmin && !isManagingPm && !isUploader) {
      logger.warn(`Unauthorized attachment delete attempt: User ${currentUser.email} tried to delete Attachment ID ${attachmentId} uploaded by Employee ID ${existing.uploader?.id}`);
      throw new ForbiddenError('Access denied. You can only delete your own attachments.');
    }

    // 3. Soft Delete Attachment
    await attachmentRepository.softDelete(attachmentId, currentUser.userId);

    logger.info(`Attachment soft-deleted successfully [ID: ${attachmentId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Attachment with ID ${attachmentId} was soft-deleted successfully` };
  }
}

module.exports = new AttachmentService();
