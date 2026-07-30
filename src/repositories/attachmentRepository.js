const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class AttachmentRepository extends BaseRepository {
  /**
   * Fetches paginated & filtered attachments list for a task
   */
  async findByTaskId(taskId, {
    search,
    uploadedBy,
    sortBy = 'CreatedDate',
    sortOrder = 'DESC',
    page = 1,
    limit = 10
  }) {
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE a.[TaskID] = @TaskID AND a.[IsDeleted] = 0';
    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (uploadedBy) {
      whereClause += ' AND a.[UploadedBy] = @UploadedBy';
      params.UploadedBy = { type: mssql.Int, value: uploadedBy };
    }

    if (search) {
      whereClause += ' AND (a.[FileName] LIKE @Search OR a.[FileType] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(255), value: `%${search}%` };
    }

    const columnMap = {
      AttachmentID: 'AttachmentID',
      FileName: 'FileName',
      FileSize: 'FileSize',
      CreatedDate: 'CreatedDate'
    };
    const safeSortBy = columnMap[sortBy] || 'CreatedDate';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const queryStr = `
      SELECT 
        a.[AttachmentID],
        a.[TaskID],
        t.[Title] AS TaskTitle,
        m.[ProjectID],
        p.[ProjectName],
        a.[UploadedBy],
        e.[FirstName] AS UploaderFirstName,
        e.[LastName] AS UploaderLastName,
        e.[Email] AS UploaderEmail,
        a.[FileName],
        a.[FilePath],
        a.[FileSize],
        a.[FileType],
        a.[CreatedBy],
        a.[CreatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Attachment] a
      INNER JOIN [dbo].[Task] t ON a.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] e ON a.[UploadedBy] = e.[EmployeeID]
      ${whereClause}
      ORDER BY a.[${safeSortBy}] ${safeSortOrder}
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    `;

    const result = await this.query(queryStr, params);
    const records = result.recordset || [];
    const total = records.length > 0 ? records[0].TotalCount : 0;

    const data = records.map((rec) => {
      const { TotalCount, UploaderFirstName, UploaderLastName, UploaderEmail, ...att } = rec;
      return {
        id: att.AttachmentID,
        taskId: att.TaskID,
        taskTitle: att.TaskTitle,
        projectId: att.ProjectID,
        projectName: att.ProjectName,
        fileName: att.FileName,
        filePath: att.FilePath,
        fileSize: att.FileSize,
        fileType: att.FileType,
        uploader: att.UploadedBy
          ? {
              id: att.UploadedBy,
              firstName: UploaderFirstName,
              lastName: UploaderLastName,
              email: UploaderEmail
            }
          : null,
        createdBy: att.CreatedBy,
        createdDate: att.CreatedDate
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
   * Fetches single attachment details by ID
   */
  async findById(attachmentId) {
    const queryStr = `
      SELECT 
        a.[AttachmentID],
        a.[TaskID],
        t.[Title] AS TaskTitle,
        t.[MilestoneID],
        m.[MilestoneTitle],
        m.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        a.[UploadedBy],
        e.[FirstName] AS UploaderFirstName,
        e.[LastName] AS UploaderLastName,
        e.[Email] AS UploaderEmail,
        a.[FileName],
        a.[FilePath],
        a.[FileSize],
        a.[FileType],
        a.[CreatedBy],
        a.[CreatedDate]
      FROM [dbo].[Attachment] a
      INNER JOIN [dbo].[Task] t ON a.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] e ON a.[UploadedBy] = e.[EmployeeID]
      WHERE a.[AttachmentID] = @AttachmentID AND a.[IsDeleted] = 0 AND t.[IsDeleted] = 0 AND m.[IsDeleted] = 0 AND p.[IsDeleted] = 0;
    `;

    const params = { AttachmentID: { type: mssql.Int, value: attachmentId } };
    const result = await this.query(queryStr, params);

    if (!result.recordset || result.recordset.length === 0) {
      return null;
    }

    const att = result.recordset[0];
    return {
      id: att.AttachmentID,
      taskId: att.TaskID,
      taskTitle: att.TaskTitle,
      milestoneId: att.MilestoneID,
      milestoneTitle: att.MilestoneTitle,
      projectId: att.ProjectID,
      projectName: att.ProjectName,
      projectManagerId: att.ProjectManagerID,
      fileName: att.FileName,
      filePath: att.FilePath,
      fileSize: att.FileSize,
      fileType: att.FileType,
      uploader: att.UploadedBy
        ? {
            id: att.UploadedBy,
            firstName: att.UploaderFirstName,
            lastName: att.UploaderLastName,
            email: att.UploaderEmail
          }
        : null,
      createdBy: att.CreatedBy,
      createdDate: att.CreatedDate
    };
  }

  /**
   * Inserts new attachment record
   */
  async create({ taskId, uploadedBy, fileName, filePath, fileSize, fileType, createdBy }, transaction = null) {
    const queryStr = `
      INSERT INTO [dbo].[Attachment] (
        [TaskID], [UploadedBy], [FileName], [FilePath], [FileSize], [FileType], [CreatedBy]
      )
      OUTPUT INSERTED.[AttachmentID]
      VALUES (
        @TaskID, @UploadedBy, @FileName, @FilePath, @FileSize, @FileType, @CreatedBy
      );
    `;

    const params = {
      TaskID: { type: mssql.Int, value: taskId },
      UploadedBy: { type: mssql.Int, value: uploadedBy },
      FileName: { type: mssql.NVarChar(255), value: fileName },
      FilePath: { type: mssql.NVarChar(500), value: filePath },
      FileSize: { type: mssql.BigInt, value: fileSize },
      FileType: { type: mssql.NVarChar(100), value: fileType || null },
      CreatedBy: { type: mssql.Int, value: createdBy }
    };

    const result = await this.query(queryStr, params, transaction);
    return result.recordset[0].AttachmentID;
  }

  /**
   * Soft deletes attachment record
   */
  async softDelete(attachmentId, deletedBy, transaction = null) {
    const queryStr = `
      UPDATE [dbo].[Attachment]
      SET 
        [IsDeleted] = 1,
        [DeletedBy] = @DeletedBy,
        [DeletedDate] = SYSUTCDATETIME()
      WHERE [AttachmentID] = @AttachmentID AND [IsDeleted] = 0;
    `;

    const params = {
      AttachmentID: { type: mssql.Int, value: attachmentId },
      DeletedBy: { type: mssql.Int, value: deletedBy }
    };

    await this.query(queryStr, params, transaction);
  }
}

module.exports = new AttachmentRepository();
