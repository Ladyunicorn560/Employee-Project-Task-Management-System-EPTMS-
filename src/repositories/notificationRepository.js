const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class NotificationRepository extends BaseRepository {
  /**
   * Fetches paginated & filtered notifications list for a recipient
   */
  async findByRecipientId(recipientId, {
    isRead,
    notificationType,
    search,
    sortBy = 'CreatedDate',
    sortOrder = 'DESC',
    page = 1,
    limit = 10
  }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE n.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (recipientId) {
      whereClause += ' AND n.[RecipientID] = @RecipientID';
      params.RecipientID = { type: mssql.Int, value: recipientId };
    }

    if (isRead !== undefined) {
      whereClause += ' AND n.[IsRead] = @IsRead';
      params.IsRead = { type: mssql.Bit, value: isRead ? 1 : 0 };
    }

    if (notificationType) {
      whereClause += ' AND n.[NotificationType] = @NotificationType';
      params.NotificationType = { type: mssql.NVarChar(50), value: notificationType };
    }

    if (search) {
      whereClause += ' AND (n.[Message] LIKE @Search OR n.[NotificationType] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(mssql.MAX), value: `%${search}%` };
    }

    const columnMap = {
      NotificationID: 'NotificationID',
      CreatedDate: 'CreatedDate'
    };
    const safeSortBy = columnMap[sortBy] || 'CreatedDate';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryStr = `
      SELECT 
        n.[NotificationID],
        n.[RecipientID],
        r.[FirstName] AS RecipientFirstName,
        r.[LastName] AS RecipientLastName,
        r.[Email] AS RecipientEmail,
        n.[TriggeredByID],
        tb.[FirstName] AS TriggeredByFirstName,
        tb.[LastName] AS TriggeredByLastName,
        tb.[Email] AS TriggeredByEmail,
        n.[TaskID],
        t.[Title] AS TaskTitle,
        n.[ProjectID],
        p.[ProjectName],
        n.[NotificationType],
        n.[Message],
        n.[DeliveryChannel],
        n.[IsRead],
        n.[ReadDate],
        n.[CreatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Notification] n
      INNER JOIN [dbo].[Employee] r ON n.[RecipientID] = r.[EmployeeID]
      LEFT JOIN [dbo].[Employee] tb ON n.[TriggeredByID] = tb.[EmployeeID]
      LEFT JOIN [dbo].[Task] t ON n.[TaskID] = t.[TaskID]
      LEFT JOIN [dbo].[Project] p ON n.[ProjectID] = p.[ProjectID]
      ${whereClause}
      ORDER BY n.[${safeSortBy}] ${safeSortOrder}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const {
        TotalCount, RecipientFirstName, RecipientLastName, RecipientEmail,
        TriggeredByFirstName, TriggeredByLastName, TriggeredByEmail, ...notif
      } = rec;
      return {
        id: notif.NotificationID,
        recipient: {
          id: notif.RecipientID,
          firstName: RecipientFirstName,
          lastName: RecipientLastName,
          email: RecipientEmail
        },
        triggeredBy: notif.TriggeredByID
          ? {
              id: notif.TriggeredByID,
              firstName: TriggeredByFirstName,
              lastName: TriggeredByLastName,
              email: TriggeredByEmail
            }
          : null,
        taskId: notif.TaskID,
        taskTitle: notif.TaskTitle,
        projectId: notif.ProjectID,
        projectName: notif.ProjectName,
        notificationType: notif.NotificationType,
        title: notif.NotificationType,
        message: notif.Message,
        deliveryChannel: notif.DeliveryChannel,
        isRead: Boolean(notif.IsRead),
        readDate: notif.ReadDate,
        createdDate: notif.CreatedDate
      };
    });

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      data
    };
  }

  /**
   * Fetches single notification details by ID
   */
  async findById(notificationId) {
    const queryStr = `
      SELECT 
        n.[NotificationID],
        n.[RecipientID],
        r.[FirstName] AS RecipientFirstName,
        r.[LastName] AS RecipientLastName,
        r.[Email] AS RecipientEmail,
        n.[TriggeredByID],
        tb.[FirstName] AS TriggeredByFirstName,
        tb.[LastName] AS TriggeredByLastName,
        tb.[Email] AS TriggeredByEmail,
        n.[TaskID],
        t.[Title] AS TaskTitle,
        n.[ProjectID],
        p.[ProjectName],
        n.[NotificationType],
        n.[Message],
        n.[DeliveryChannel],
        n.[IsRead],
        n.[ReadDate],
        n.[CreatedDate]
      FROM [dbo].[Notification] n
      INNER JOIN [dbo].[Employee] r ON n.[RecipientID] = r.[EmployeeID]
      LEFT JOIN [dbo].[Employee] tb ON n.[TriggeredByID] = tb.[EmployeeID]
      LEFT JOIN [dbo].[Task] t ON n.[TaskID] = t.[TaskID]
      LEFT JOIN [dbo].[Project] p ON n.[ProjectID] = p.[ProjectID]
      WHERE n.[NotificationID] = @NotificationID AND n.[IsDeleted] = 0;
    `;

    const params = { NotificationID: { type: mssql.Int, value: notificationId } };
    const result = await this.query(queryStr, params);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const notif = result.recordset[0];
    return {
      id: notif.NotificationID,
      recipient: {
        id: notif.RecipientID,
        firstName: notif.RecipientFirstName,
        lastName: notif.RecipientLastName,
        email: notif.RecipientEmail
      },
      triggeredBy: notif.TriggeredByID
        ? {
            id: notif.TriggeredByID,
            firstName: notif.TriggeredByFirstName,
            lastName: notif.TriggeredByLastName,
            email: notif.TriggeredByEmail
          }
        : null,
      taskId: notif.TaskID,
      taskTitle: notif.TaskTitle,
      projectId: notif.ProjectID,
      projectName: notif.ProjectName,
      notificationType: notif.NotificationType,
      title: notif.NotificationType,
      message: notif.Message,
      deliveryChannel: notif.DeliveryChannel,
      isRead: Boolean(notif.IsRead),
      readDate: notif.ReadDate,
      createdDate: notif.CreatedDate
    };
  }

  /**
   * Checks if duplicate unread notification exists to prevent spam
   */
  async findDuplicateUnread(recipientId, notificationType, taskId = null, projectId = null) {
    let whereClause = `
      WHERE [RecipientID] = @RecipientID 
        AND [NotificationType] = @NotificationType 
        AND [IsRead] = 0 
        AND [IsDeleted] = 0
    `;
    const params = {
      RecipientID: { type: mssql.Int, value: recipientId },
      NotificationType: { type: mssql.NVarChar(50), value: notificationType }
    };

    if (taskId) {
      whereClause += ' AND [TaskID] = @TaskID';
      params.TaskID = { type: mssql.Int, value: taskId };
    } else if (projectId) {
      whereClause += ' AND [ProjectID] = @ProjectID';
      params.ProjectID = { type: mssql.Int, value: projectId };
    }

    const queryStr = `SELECT [NotificationID] FROM [dbo].[Notification] ${whereClause};`;
    const result = await this.query(queryStr, params);
    return result.recordset && result.recordset.length > 0;
  }

  /**
   * Inserts new notification record inside optional transaction
   */
  async create({
    recipientId,
    triggeredById,
    taskId,
    projectId,
    notificationType,
    message,
    deliveryChannel = 'In-App',
    createdBy
  }, transaction = null) {
    const queryStr = `
      INSERT INTO [dbo].[Notification] (
        [RecipientID], [TriggeredByID], [TaskID], [ProjectID], 
        [NotificationType], [Message], [DeliveryChannel], [CreatedBy]
      )
      OUTPUT INSERTED.[NotificationID]
      VALUES (
        @RecipientID, @TriggeredByID, @TaskID, @ProjectID, 
        @NotificationType, @Message, @DeliveryChannel, @CreatedBy
      );
    `;

    const params = {
      RecipientID: { type: mssql.Int, value: recipientId },
      TriggeredByID: { type: mssql.Int, value: triggeredById || createdBy },
      TaskID: { type: mssql.Int, value: taskId || null },
      ProjectID: { type: mssql.Int, value: projectId || null },
      NotificationType: { type: mssql.NVarChar(50), value: notificationType },
      Message: { type: mssql.NVarChar(mssql.MAX), value: message },
      DeliveryChannel: { type: mssql.NVarChar(30), value: deliveryChannel },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.recordset[0].NotificationID;
  }

  /**
   * Marks single notification as read
   */
  async markAsRead(notificationId, updatedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Notification]
      SET 
        [IsRead] = 1,
        [ReadDate] = SYSUTCDATETIME(),
        [UpdatedBy] = @UpdatedBy,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [NotificationID] = @NotificationID AND [IsDeleted] = 0;
    `;

    const params = {
      NotificationID: { type: mssql.Int, value: notificationId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    await this.query(queryStr, params, transaction);
  }

  /**
   * Marks all unread notifications for recipient as read
   */
  async markAllAsRead(recipientId, updatedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Notification]
      SET 
        [IsRead] = 1,
        [ReadDate] = SYSUTCDATETIME(),
        [UpdatedBy] = @UpdatedBy,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [RecipientID] = @RecipientID AND [IsRead] = 0 AND [IsDeleted] = 0;
    `;

    const params = {
      RecipientID: { type: mssql.Int, value: recipientId },
      UpdatedBy: { type: mssql.Int, value: updatedBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.rowsAffected ? result.rowsAffected[0] : 0;
  }

  /**
   * Soft deletes notification record
   */
  async softDelete(notificationId, deletedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Notification]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [NotificationID] = @NotificationID AND [IsDeleted] = 0;
    `;

    const params = {
      NotificationID: { type: mssql.Int, value: notificationId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params, transaction);
  }
}

module.exports = new NotificationRepository();
