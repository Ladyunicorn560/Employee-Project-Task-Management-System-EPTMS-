const projectRepository = require('../repositories/projectRepository');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class ProjectService {
  /**
   * Creates a new project record (Admin & PM)
   */
  async createProject(data, currentUser) {
    // 1. Verify project name uniqueness
    const nameExists = await projectRepository.findByName(data.projectName);
    if (nameExists) {
      throw new ConflictError(`Project with name '${data.projectName}' already exists`);
    }

    // 2. Verify Department exists
    const deptExists = await projectRepository.departmentExists(data.departmentId);
    if (!deptExists) {
      throw new BadRequestError(`Invalid DepartmentID (${data.departmentId}): Department does not exist`);
    }

    // 3. Verify Project Manager exists and is Active
    const pm = await projectRepository.getProjectManagerDetails(data.projectManagerId);
    if (!pm) {
      throw new BadRequestError(`Invalid ProjectManagerID (${data.projectManagerId}): Employee does not exist`);
    }
    if (pm.Status !== 'Active') {
      throw new BadRequestError(`Project Manager must be an active employee. Specified employee status is '${pm.Status}'.`);
    }

    // 4. Verify StartDate & EndDate logic
    if (new Date(data.endDate) < new Date(data.startDate)) {
      throw new BadRequestError('End date cannot be before start date');
    }

    // 5. Insert project record
    const newProjectId = await projectRepository.create({
      projectName: data.projectName,
      description: data.description,
      departmentId: data.departmentId,
      projectManagerId: data.projectManagerId,
      startDate: data.startDate,
      endDate: data.endDate,
      actualEndDate: data.actualEndDate,
      status: data.status || 'Planning',
      progressPercentage: data.progressPercentage || 0,
      totalAmount: data.totalAmount || 0,
      createdBy: currentUser.userId
    });

    logger.info(`Project created successfully [ID: ${newProjectId}, Name: ${data.projectName}, CreatedBy: ${currentUser.userId}]`);

    // 6. Return created project
    return projectRepository.findById(newProjectId);
  }

  /**
   * Fetches paginated & filtered list of projects (Role-aware)
   */
  async getProjects(queryParams, currentUser) {
    const query = { ...queryParams };

    // Non-administrators (Project Managers, Employees, Reviewers) view assigned/managed projects only
    if (currentUser.roleName !== ROLES.ADMINISTRATOR) {
      query.assignedEmployeeId = currentUser.userId;
    }

    return projectRepository.findAll(query);
  }

  /**
   * Fetches single project details by ID (Role & Assignment aware)
   */
  async getProjectById(projectId, currentUser) {
    const project = await projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} was not found`);
    }

    // Standard Employees can only view assigned projects
    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(projectId, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized access attempt: Employee ${currentUser.email} tried to view unassigned Project ID ${projectId}`);
        throw new ForbiddenError('Access denied. You are only authorized to view projects you are assigned to.');
      }
    }

    return project;
  }

  /**
   * Updates an existing project (Admin or PM managing the project)
   */
  async updateProject(projectId, updateData, currentUser) {
    // 1. Verify project exists
    const existingProject = await projectRepository.findById(projectId);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${projectId} was not found`);
    }

    // 2. PM Ownership Guard: PMs can only update projects they manage
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && existingProject.projectManager.id !== currentUser.userId) {
      logger.warn(`Unauthorized project update attempt: PM ${currentUser.email} (ID: ${currentUser.userId}) tried to update Project ID ${projectId} managed by PM ID ${existingProject.projectManager.id}`);
      throw new ForbiddenError('Access denied. You are only authorized to update projects that you manage.');
    }

    // 3. If project name is changing, verify uniqueness
    if (updateData.projectName && updateData.projectName.toLowerCase() !== existingProject.projectName.toLowerCase()) {
      const nameExists = await projectRepository.findByName(updateData.projectName, projectId);
      if (nameExists) {
        throw new ConflictError(`Project with name '${updateData.projectName}' already exists`);
      }
    }

    // 4. If Department is changing, verify existence
    if (updateData.departmentId) {
      const deptExists = await projectRepository.departmentExists(updateData.departmentId);
      if (!deptExists) {
        throw new BadRequestError(`Invalid DepartmentID (${updateData.departmentId}): Department does not exist`);
      }
    }

    // 5. If Project Manager is changing, verify existence and active status
    if (updateData.projectManagerId) {
      const pm = await projectRepository.getProjectManagerDetails(updateData.projectManagerId);
      if (!pm) {
        throw new BadRequestError(`Invalid ProjectManagerID (${updateData.projectManagerId}): Employee does not exist`);
      }
      if (pm.Status !== 'Active') {
        throw new BadRequestError(`Project Manager must be an active employee. Specified employee status is '${pm.Status}'.`);
      }
    }

    // 6. Verify effective StartDate and EndDate
    const effectiveStartDate = updateData.startDate || existingProject.startDate;
    const effectiveEndDate = updateData.endDate || existingProject.endDate;

    if (new Date(effectiveEndDate) < new Date(effectiveStartDate)) {
      throw new BadRequestError('End date cannot be before start date');
    }

    // 6.5 If status is set to Completed, check for open tasks
    if (updateData.status === 'Completed') {
      const incompleteCount = await projectRepository.getIncompleteTaskCount(projectId);
      if (incompleteCount > 0) {
        throw new BadRequestError(`Cannot complete project '${existingProject.projectName}' (ID: ${projectId}) because it has ${incompleteCount} incomplete task(s).`);
      }
    }

    // 6.6 Project lifecycle constraint: only Administrator can archive completed projects
    if (updateData.status === 'Archived') {
      if (currentUser.roleName !== ROLES.ADMINISTRATOR) {
        logger.warn(`Unauthorized archiving attempt: User ${currentUser.email} (Role: ${currentUser.roleName}) tried to archive Project ID ${projectId}`);
        throw new ForbiddenError('Access denied. Only Administrators are authorized to archive projects.');
      }
      if (existingProject.status !== 'Completed') {
        throw new BadRequestError(`Cannot archive project '${existingProject.projectName}' (ID: ${projectId}) because its current status is '${existingProject.status}'. Only completed projects can be archived.`);
      }
    }

    // 7. Perform update
    await projectRepository.update(projectId, updateData, currentUser.userId);
    logger.info(`Project updated successfully [ID: ${projectId}, UpdatedBy: ${currentUser.userId}]`);

    // 8. Return updated project
    return projectRepository.findById(projectId);
  }

  /**
   * Soft deletes a project record (Admin or PM for Draft/Planning projects they manage)
   */
  async deleteProject(projectId, currentUser) {
    // 1. Verify project exists
    const existingProject = await projectRepository.findById(projectId);
    if (!existingProject) {
      throw new NotFoundError(`Project with ID ${projectId} was not found`);
    }

    // PM Ownership and Status Guard
    if (currentUser.roleName === ROLES.PROJECT_MANAGER) {
      if (existingProject.projectManager.id !== currentUser.userId) {
        logger.warn(`Unauthorized project delete attempt: PM ${currentUser.email} (ID: ${currentUser.userId}) tried to delete Project ID ${projectId} managed by PM ID ${existingProject.projectManager.id}`);
        throw new ForbiddenError('Access denied. You are only authorized to delete projects that you manage.');
      }
      if (existingProject.status !== 'Planning') {
        logger.warn(`Rejected project delete: PM ${currentUser.email} (ID: ${currentUser.userId}) tried to delete Project ID ${projectId} in active status '${existingProject.status}'`);
        throw new BadRequestError('Access denied. Project Managers can only delete projects in "Planning" status.');
      }
    }

    // 2. Perform soft delete
    await projectRepository.softDelete(projectId, currentUser.userId);
    logger.info(`Project soft-deleted successfully [ID: ${projectId}, DeletedBy: ${currentUser.userId}]`);

    return { message: `Project with ID ${projectId} was soft-deleted successfully` };
  }
}

module.exports = new ProjectService();
