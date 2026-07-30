const roleRepository = require('../repositories/roleRepository');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

// System critical roles that cannot be deleted or renamed
const SYSTEM_CRITICAL_ROLES = [
  ROLES.ADMINISTRATOR,
  ROLES.PROJECT_MANAGER,
  ROLES.EMPLOYEE,
  ROLES.REVIEWER
];

class RoleService {
  /**
   * Creates a new role record (Admin only)
   */
  async createRole(data, createdBy) {
    // 1. Verify role name uniqueness
    const nameExists = await roleRepository.findByName(data.roleName);
    if (nameExists) {
      throw new ConflictError(`Role with name '${data.roleName}' already exists`);
    }

    // 2. Insert role record
    const newRoleId = await roleRepository.create({
      roleName: data.roleName,
      description: data.description,
      permissions: data.permissions,
      createdBy
    });

    logger.info(`Role created successfully [ID: ${newRoleId}, Name: ${data.roleName}, CreatedBy: ${createdBy}]`);

    // 3. Fetch and return created role
    return roleRepository.findById(newRoleId);
  }

  /**
   * Fetches paginated list of roles
   */
  async getRoles(queryParams) {
    return roleRepository.findAll(queryParams);
  }

  /**
   * Fetches single role details by ID
   */
  async getRoleById(roleId) {
    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new NotFoundError(`Role with ID ${roleId} was not found`);
    }
    return role;
  }

  /**
   * Updates an existing role record (Admin only)
   */
  async updateRole(roleId, updateData, updatedBy) {
    // 1. Verify target role exists
    const existingRole = await roleRepository.findById(roleId);
    if (!existingRole) {
      throw new NotFoundError(`Role with ID ${roleId} was not found`);
    }

    // 2. Prevent renaming system critical roles
    if (
      updateData.roleName &&
      updateData.roleName.toLowerCase() !== existingRole.roleName.toLowerCase() &&
      SYSTEM_CRITICAL_ROLES.includes(existingRole.roleName)
    ) {
      throw new BadRequestError(`System critical role '${existingRole.roleName}' cannot be renamed.`);
    }

    // 3. If role name is being changed, verify uniqueness
    if (updateData.roleName && updateData.roleName.toLowerCase() !== existingRole.roleName.toLowerCase()) {
      const nameExists = await roleRepository.findByName(updateData.roleName, roleId);
      if (nameExists) {
        throw new ConflictError(`Role with name '${updateData.roleName}' already exists`);
      }
    }

    // 4. Perform update
    await roleRepository.update(roleId, updateData, updatedBy);
    logger.info(`Role updated successfully [ID: ${roleId}, UpdatedBy: ${updatedBy}]`);

    // 5. Fetch and return updated role
    return roleRepository.findById(roleId);
  }

  /**
   * Soft deletes a role record (Admin only)
   */
  async deleteRole(roleId, deletedBy) {
    // 1. Verify role exists
    const existingRole = await roleRepository.findById(roleId);
    if (!existingRole) {
      throw new NotFoundError(`Role with ID ${roleId} was not found`);
    }

    // 2. Prevent deletion of system critical roles
    if (SYSTEM_CRITICAL_ROLES.includes(existingRole.roleName)) {
      logger.warn(`Role deletion rejected: System critical role protection [RoleID: ${roleId}, Name: ${existingRole.roleName}]`);
      throw new ForbiddenError(`System critical role '${existingRole.roleName}' is protected and cannot be deleted.`);
    }

    // 3. Check for active assigned employees
    const activeEmpCount = await roleRepository.getActiveEmployeeCount(roleId);
    if (activeEmpCount > 0) {
      logger.warn(`Role deletion rejected: Active employee dependency exists [RoleID: ${roleId}, EmployeeCount: ${activeEmpCount}]`);
      throw new ConflictError(`Cannot delete role '${existingRole.roleName}' (ID: ${roleId}) because ${activeEmpCount} active employee(s) are currently assigned to it. Please reassign employees before deleting.`);
    }

    // 4. Perform soft delete
    await roleRepository.softDelete(roleId, deletedBy);
    logger.info(`Role soft-deleted successfully [ID: ${roleId}, DeletedBy: ${deletedBy}]`);

    return { message: `Role with ID ${roleId} was soft-deleted successfully` };
  }
}

module.exports = new RoleService();
