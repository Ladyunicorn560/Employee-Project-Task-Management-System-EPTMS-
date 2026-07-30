const departmentRepository = require('../repositories/departmentRepository');
const NotFoundError = require('../errors/NotFoundError');
const ConflictError = require('../errors/ConflictError');
const logger = require('../utils/logger');

class DepartmentService {
  /**
   * Creates a new department (Admin only)
   */
  async createDepartment(data, createdBy) {
    // 1. Check department name uniqueness
    const nameExists = await departmentRepository.findByName(data.departmentName);
    if (nameExists) {
      throw new ConflictError(`Department with name '${data.departmentName}' already exists`);
    }

    // 2. Insert department record
    const newDepartmentId = await departmentRepository.create({
      departmentName: data.departmentName,
      description: data.description,
      createdBy
    });

    logger.info(`Department created successfully [ID: ${newDepartmentId}, Name: ${data.departmentName}, CreatedBy: ${createdBy}]`);

    // 3. Fetch and return created department
    return departmentRepository.findById(newDepartmentId);
  }

  /**
   * Fetches paginated & filtered list of departments
   */
  async getDepartments(queryParams) {
    return departmentRepository.findAll(queryParams);
  }

  /**
   * Fetches single department details by ID
   */
  async getDepartmentById(departmentId) {
    const department = await departmentRepository.findById(departmentId);
    if (!department) {
      throw new NotFoundError(`Department with ID ${departmentId} was not found`);
    }
    return department;
  }

  /**
   * Updates an existing department record (Admin only)
   */
  async updateDepartment(departmentId, updateData, updatedBy) {
    // 1. Verify target department exists
    const existingDepartment = await departmentRepository.findById(departmentId);
    if (!existingDepartment) {
      throw new NotFoundError(`Department with ID ${departmentId} was not found`);
    }

    // 2. If department name is being changed, verify uniqueness
    if (updateData.departmentName && updateData.departmentName.toLowerCase() !== existingDepartment.departmentName.toLowerCase()) {
      const nameExists = await departmentRepository.findByName(updateData.departmentName, departmentId);
      if (nameExists) {
        throw new ConflictError(`Department with name '${updateData.departmentName}' already exists`);
      }
    }

    // 3. Perform update
    await departmentRepository.update(departmentId, updateData, updatedBy);
    logger.info(`Department updated successfully [ID: ${departmentId}, UpdatedBy: ${updatedBy}]`);

    // 4. Fetch and return updated department
    return departmentRepository.findById(departmentId);
  }

  /**
   * Soft deletes a department record (Admin only)
   */
  async deleteDepartment(departmentId, deletedBy) {
    // 1. Verify department exists
    const existingDepartment = await departmentRepository.findById(departmentId);
    if (!existingDepartment) {
      throw new NotFoundError(`Department with ID ${departmentId} was not found`);
    }

    // 2. Check for active employees in department
    const activeEmpCount = await departmentRepository.getActiveEmployeeCount(departmentId);
    if (activeEmpCount > 0) {
      logger.warn(`Department deletion rejected: Active employee dependency exists [DepartmentID: ${departmentId}, EmployeeCount: ${activeEmpCount}]`);
      throw new ConflictError(`Cannot delete department '${existingDepartment.departmentName}' (ID: ${departmentId}) because it currently has ${activeEmpCount} active employee(s). Please reassign or remove employees before deleting.`);
    }

    // 3. Perform soft delete
    await departmentRepository.softDelete(departmentId, deletedBy);
    logger.info(`Department soft-deleted successfully [ID: ${departmentId}, DeletedBy: ${deletedBy}]`);

    return { message: `Department with ID ${departmentId} was soft-deleted successfully` };
  }
}

module.exports = new DepartmentService();
