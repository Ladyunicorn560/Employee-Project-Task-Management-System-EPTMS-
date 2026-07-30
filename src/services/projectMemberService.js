const projectMemberRepository = require('../repositories/projectMemberRepository');
const projectRepository = require('../repositories/projectRepository');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class ProjectMemberService {
  /**
   * Assigns an active employee to a project (Admin or assigned PM)
   */
  async assignMember(projectId, data, currentUser) {
    // 1. Verify target project exists and is active
    const project = await projectMemberRepository.getProjectWithManager(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} was not found`);
    }

    // 2. PM Ownership Guard: PMs can only manage members for projects they own
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && project.ProjectManagerID !== currentUser.userId) {
      logger.warn(`Unauthorized member assignment attempt: PM ${currentUser.email} (ID: ${currentUser.userId}) tried to manage members for Project ID ${projectId} owned by PM ID ${project.ProjectManagerID}`);
      throw new ForbiddenError('Access denied. You can only manage project members for projects you manage.');
    }

    // 3. Verify target employee exists and is active
    const employee = await projectMemberRepository.getEmployeeDetails(data.employeeId);
    if (!employee) {
      throw new BadRequestError(`Invalid EmployeeID (${data.employeeId}): Employee does not exist`);
    }
    if (employee.Status !== 'Active') {
      logger.warn(`Member assignment rejected: Target employee is inactive [EmployeeID: ${data.employeeId}, Status: ${employee.Status}]`);
      throw new BadRequestError(`Cannot assign inactive employee '${employee.FirstName} ${employee.LastName}' to project. Current status: '${employee.Status}'.`);
    }

    // 4. Prevent assigning Project Manager as duplicate team member
    if (data.employeeId === project.ProjectManagerID) {
      throw new ConflictError(`Employee '${employee.FirstName} ${employee.LastName}' is already assigned as the Project Manager for this project.`);
    }

    // 5. Prevent duplicate member assignment
    const existingAssignment = await projectMemberRepository.findAssignment(projectId, data.employeeId);
    if (existingAssignment) {
      logger.warn(`Duplicate project member assignment attempt [ProjectID: ${projectId}, EmployeeID: ${data.employeeId}]`);
      throw new ConflictError(`Employee '${employee.FirstName} ${employee.LastName}' is already an assigned team member of this project.`);
    }

    // 6. Perform transactional assignment for atomicity
    await projectMemberRepository.withTransaction(async (transaction) => {
      await projectMemberRepository.assignMember(
        {
          projectId,
          employeeId: data.employeeId,
          roleInProject: data.roleInProject || 'Team Member',
          createdBy: currentUser.userId
        },
        transaction
      );
    });

    logger.info(`Member assigned to project successfully [ProjectID: ${projectId}, EmployeeID: ${data.employeeId}, AssignedBy: ${currentUser.userId}]`);

    return {
      projectId,
      employee: {
        id: employee.EmployeeID,
        firstName: employee.FirstName,
        lastName: employee.LastName,
        email: employee.Email
      },
      roleInProject: data.roleInProject || 'Team Member'
    };
  }

  /**
   * Fetches paginated team members list for a project
   */
  async getProjectMembers(projectId, queryParams, currentUser) {
    // 1. Verify target project exists
    const project = await projectMemberRepository.getProjectWithManager(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} was not found`);
    }

    // 2. Standard Employee Access Guard: Employees can only view members of assigned projects
    if (currentUser.roleName === ROLES.EMPLOYEE) {
      const isAssigned = await projectRepository.isEmployeeAssignedToProject(projectId, currentUser.userId);
      if (!isAssigned) {
        logger.warn(`Unauthorized members list view attempt: Employee ${currentUser.email} tried to view members of unassigned Project ID ${projectId}`);
        throw new ForbiddenError('Access denied. You can only view team members for projects you are assigned to.');
      }
    }

    return projectMemberRepository.findByProjectId(projectId, queryParams);
  }

  /**
   * Removes an assigned team member from a project (Admin or assigned PM)
   */
  async removeMember(projectId, employeeId, currentUser) {
    // 1. Verify target project exists
    const project = await projectMemberRepository.getProjectWithManager(projectId);
    if (!project) {
      throw new NotFoundError(`Project with ID ${projectId} was not found`);
    }

    // 2. PM Ownership Guard: PMs can only manage members for projects they own
    if (currentUser.roleName === ROLES.PROJECT_MANAGER && project.ProjectManagerID !== currentUser.userId) {
      logger.warn(`Unauthorized member removal attempt: PM ${currentUser.email} tried to remove member from Project ID ${projectId}`);
      throw new ForbiddenError('Access denied. You can only manage project members for projects you manage.');
    }

    // 3. PM Removal Guard: Cannot remove Project Manager
    if (employeeId === project.ProjectManagerID) {
      throw new BadRequestError('Cannot remove the Project Manager from project members.');
    }

    // 4. Verify assignment exists
    const existingAssignment = await projectMemberRepository.findAssignment(projectId, employeeId);
    if (!existingAssignment) {
      throw new NotFoundError(`Employee with ID ${employeeId} is not currently assigned to project ID ${projectId}`);
    }

    // 5. Perform transactional soft-delete removal
    await projectMemberRepository.withTransaction(async (transaction) => {
      await projectMemberRepository.removeMember(projectId, employeeId, currentUser.userId, transaction);
    });

    logger.info(`Member removed from project successfully [ProjectID: ${projectId}, EmployeeID: ${employeeId}, RemovedBy: ${currentUser.userId}]`);

    return { message: `Employee with ID ${employeeId} was successfully removed from project ID ${projectId}` };
  }
}

module.exports = new ProjectMemberService();
