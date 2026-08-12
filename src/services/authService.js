const authRepository = require('../repositories/authRepository');
const { comparePassword, hashPassword } = require('../utils/crypto');
const { generateToken } = require('../utils/jwt');
const UnauthorizedError = require('../errors/UnauthorizedError');
const ForbiddenError = require('../errors/ForbiddenError');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const AppError = require('../errors/AppError');
const logger = require('../utils/logger');
const emailService = require('./emailService');

class AuthService {
  /**
   * Authenticates user credentials and returns JWT session payload
   * @param {string} email 
   * @param {string} password 
   */
  async login(email, password) {
    // 1. Fetch user record
    const user = await authRepository.findUserByEmail(email);

    // 2. Reject if user does not exist or is soft-deleted (Generic error message to prevent enumeration)
    if (!user || user.IsDeleted) {
      logger.warn(`Failed login attempt: User not found or deleted [Email: ${email}]`);
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    // 3. Reject if account status is Inactive or Suspended
    if (user.Status !== 'Active') {
      logger.warn(`Login rejected: Account is ${user.Status} [Email: ${email}, ID: ${user.EmployeeID}]`);
      throw new ForbiddenError(`Account is ${user.Status.toLowerCase()}. Access denied.`, 'ACCOUNT_DISABLED');
    }

    // 4. Check for active LockoutUntil timer
    if (user.LockoutUntil && new Date(user.LockoutUntil) > new Date()) {
      logger.warn(`Login rejected: Account locked out [Email: ${email}, LockoutUntil: ${user.LockoutUntil}]`);
      throw new AppError(
        'Account is temporarily locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.',
        423, // Locked
        'ACCOUNT_LOCKED'
      );
    }

    // 5. Verify password hash using bcrypt
    const isPasswordValid = user.PasswordHash ? await comparePassword(password, user.PasswordHash) : false;

    // 6. Handle password verification failure
    if (!isPasswordValid) {
      const newFailedAttempts = user.FailedLoginAttempts + 1;

      if (newFailedAttempts >= 5) {
        // Lock account for 15 minutes (900,000 ms)
        const lockoutUntil = new Date(Date.now() + 15 * 60 * 1000);
        await authRepository.recordFailedLogin(user.EmployeeID, newFailedAttempts, lockoutUntil);
        
        logger.warn(`Account locked out after 5 failed attempts [Email: ${email}, EmployeeID: ${user.EmployeeID}]`);
        
        throw new AppError(
          'Account locked out due to 5 consecutive failed login attempts. Please try again in 15 minutes.',
          423,
          'ACCOUNT_LOCKED'
        );
      } else {
        await authRepository.recordFailedLogin(user.EmployeeID, newFailedAttempts, null);
        logger.warn(`Failed login attempt: Incorrect password [Email: ${email}, Attempts: ${newFailedAttempts}/5]`);
        throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
      }
    }

    // 7. Handle password verification success (Reset lockout counters & update LastLoginDate)
    await authRepository.recordSuccessfulLogin(user.EmployeeID);
    logger.info(`Successful login for user: ${email} [Role: ${user.RoleName}, ID: ${user.EmployeeID}]`);

    // 8. Generate JWT Token
    const tokenPayload = {
      userId: user.EmployeeID,
      email: user.Email,
      roleId: user.RoleID,
      roleName: user.RoleName
    };

    const token = generateToken(tokenPayload);

    // 9. Format response payload (Excluding PasswordHash)
    return {
      token,
      user: {
        id: user.EmployeeID,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: {
          id: user.RoleID,
          name: user.RoleName
        },
        department: {
          id: user.DepartmentID,
          name: user.DepartmentName
        },
        status: user.Status,
        lastLoginDate: new Date().toISOString()
      }
    };
  }

  /**
   * Retrieves profile details for currently authenticated user
   * @param {number} userId 
   */
  async getProfile(userId) {
    const user = await authRepository.getUserProfileById(userId);

    if (!user || user.IsDeleted || user.Status !== 'Active') {
      throw new UnauthorizedError('User account is inactive or no longer exists', 'USER_NOT_ACTIVE');
    }

    return {
      user: {
        id: user.EmployeeID,
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        role: {
          id: user.RoleID,
          name: user.RoleName
        },
        department: {
          id: user.DepartmentID,
          name: user.DepartmentName
        },
        status: user.Status,
        lastLoginDate: user.LastLoginDate
      }
    };
  }

  /**
   * Changes password for a user after verifying their current password
   * @param {number} userId 
   * @param {string} currentPassword 
   * @param {string} newPassword 
   */
  async changePassword(userId, currentPassword, newPassword) {
    // 1. Fetch user's auth data
    const userProfile = await authRepository.getUserProfileById(userId);
    if (!userProfile) {
      throw new UnauthorizedError('User profile not found', 'USER_NOT_FOUND');
    }

    const user = await authRepository.findUserByEmail(userProfile.Email);
    if (!user) {
      throw new UnauthorizedError('User authentication record not found', 'USER_NOT_FOUND');
    }

    // 2. Validate current password
    const isPasswordValid = await comparePassword(currentPassword, user.PasswordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Incorrect current password', 'INCORRECT_CURRENT_PASSWORD');
    }

    // 3. Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    // 4. Persist the updated hash
    await authRepository.updatePassword(userId, newPasswordHash);
    logger.info(`Password updated successfully for EmployeeID: ${userId}`);
  }

  /**
   * Generates a password reset token and saves it in the database
   * @param {string} email
   */
  async forgotPassword(email) {
    const crypto = require('crypto');
    const user = await authRepository.findUserByEmail(email);
    if (!user || user.IsDeleted) {
      throw new NotFoundError(`User with email '${email}' was not found`);
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await authRepository.saveResetToken(user.EmployeeID, token, expires);

    await emailService.sendPasswordResetEmail(user.Email, `${user.FirstName} ${user.LastName}`, token);

    logger.info(`Password reset token generated for user ${email}: ${token}`);

    return { token };
  }

  /**
   * Validates the reset token and updates the employee password
   * @param {string} token
   * @param {string} newPassword
   */
  async resetPassword(token, newPassword) {
    const user = await authRepository.findUserByResetToken(token);
    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    if (new Date(user.ResetPasswordExpires) < new Date()) {
      throw new BadRequestError('Password reset token has expired');
    }

    const newPasswordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(user.EmployeeID, newPasswordHash);
    await authRepository.clearResetToken(user.EmployeeID);

    logger.info(`Password reset completed successfully for user ${user.Email}`);
  }
}

module.exports = new AuthService();
