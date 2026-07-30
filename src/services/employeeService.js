const employeeRepository = require('../repositories/employeeRepository');
const { hashPassword } = require('../utils/crypto');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ConflictError = require('../errors/ConflictError');
const ForbiddenError = require('../errors/ForbiddenError');
const logger = require('../utils/logger');
const ROLES = require('../constants/roles');

class EmployeeService {
  /**
   * Creates a new employee record (Admin only)
   */
  async createEmployee(data, createdBy) {
    // 1. Verify email uniqueness
    const emailExists = await employeeRepository.findByEmail(data.email);
    if (emailExists) {
      throw new ConflictError('Employee with this email address already exists');
    }

    // 2. Verify Department exists
    const deptExists = await employeeRepository.departmentExists(data.departmentId);
    if (!deptExists) {
      throw new BadRequestError(`Invalid DepartmentID (${data.departmentId}): Department does not exist`);
    }

    // 3. Verify Role exists
    const roleExists = await employeeRepository.roleExists(data.roleId);
    if (!roleExists) {
      throw new BadRequestError(`Invalid RoleID (${data.roleId}): Role does not exist`);
    }

    // 4. Hash initial password
    const passwordHash = await hashPassword(data.password);

    // 5. Insert employee record
    const newEmployeeId = await employeeRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      departmentId: data.departmentId,
      roleId: data.roleId,
      passwordHash,
      status: data.status || 'Active',
      createdBy
    });

    logger.info(`Employee created successfully [ID: ${newEmployeeId}, Email: ${data.email}, CreatedBy: ${createdBy}]`);

    // 6. Fetch and return sanitized created employee
    return employeeRepository.findById(newEmployeeId);
  }

  /**
   * Fetches paginated & filtered list of employees (Admin & PM only)
   */
  async getEmployees(queryParams) {
    return employeeRepository.findAll(queryParams);
  }

  /**
   * Fetches single employee details by ID (Admin, PM, or Self)
   */
  async getEmployeeById(employeeId, currentUser) {
    const isElevatedRole = [ROLES.ADMINISTRATOR, ROLES.PROJECT_MANAGER].includes(currentUser.roleName);
    const isSelf = currentUser.userId === employeeId;

    if (!isElevatedRole && !isSelf) {
      logger.warn(`Unauthorized access attempt: User ${currentUser.email} (Role: ${currentUser.roleName}) tried to view Employee ID ${employeeId}`);
      throw new ForbiddenError('Access denied. You are only authorized to view your own profile.');
    }

    const employee = await employeeRepository.findById(employeeId);
    if (!employee) {
      throw new NotFoundError(`Employee with ID ${employeeId} was not found`);
    }

    return employee;
  }

  /**
   * Updates an existing employee record (Admin only)
   */
  async updateEmployee(employeeId, updateData, updatedBy) {
    // 1. Verify target employee exists
    const existingEmployee = await employeeRepository.findById(employeeId);
    if (!existingEmployee) {
      throw new NotFoundError(`Employee with ID ${employeeId} was not found`);
    }

    // 2. If email is being changed, verify uniqueness
    if (updateData.email && updateData.email !== existingEmployee.email) {
      const emailExists = await employeeRepository.findByEmail(updateData.email, employeeId);
      if (emailExists) {
        throw new ConflictError('Employee with this email address already exists');
      }
    }

    // 3. If Department is being changed, verify existence
    if (updateData.departmentId) {
      const deptExists = await employeeRepository.departmentExists(updateData.departmentId);
      if (!deptExists) {
        throw new BadRequestError(`Invalid DepartmentID (${updateData.departmentId}): Department does not exist`);
      }
    }

    // 4. If Role is being changed, verify existence
    if (updateData.roleId) {
      const roleExists = await employeeRepository.roleExists(updateData.roleId);
      if (!roleExists) {
        throw new BadRequestError(`Invalid RoleID (${updateData.roleId}): Role does not exist`);
      }
    }

    // 5. If password is being updated, hash new password
    const dataToUpdate = { ...updateData };
    if (updateData.password) {
      dataToUpdate.passwordHash = await hashPassword(updateData.password);
      delete dataToUpdate.password;
    }

    // 6. Perform update
    await employeeRepository.update(employeeId, dataToUpdate, updatedBy);
    logger.info(`Employee updated successfully [ID: ${employeeId}, UpdatedBy: ${updatedBy}]`);

    // 7. Fetch and return sanitized updated employee
    return employeeRepository.findById(employeeId);
  }

  /**
   * Soft deletes an employee record (Admin only)
   */
  async deleteEmployee(employeeId, deletedBy) {
    // 1. Verify employee exists
    const existingEmployee = await employeeRepository.findById(employeeId);
    if (!existingEmployee) {
      throw new NotFoundError(`Employee with ID ${employeeId} was not found`);
    }

    // 2. Prevent self-deletion
    if (employeeId === deletedBy) {
      throw new BadRequestError('Self-deletion is forbidden. You cannot soft-delete your own active administrator account.');
    }

    // 3. Perform soft delete
    await employeeRepository.softDelete(employeeId, deletedBy);
    logger.info(`Employee soft-deleted successfully [ID: ${employeeId}, DeletedBy: ${deletedBy}]`);

    return { message: `Employee with ID ${employeeId} was soft-deleted successfully` };
  }
}

module.exports = new EmployeeService();
