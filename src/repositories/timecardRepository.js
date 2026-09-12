const BaseRepository = require('./baseRepository');
const { mssql } = require('../config/db');

class TimecardRepository extends BaseRepository {
  /**
   * Get employee hourly rate for a project
   * Checks ProjectMember first, falls back to Employee base rate
   */
  async getEmployeeProjectRate(employeeId, projectId) {
    const queryStr = `
      SELECT 
        COALESCE(pm.[HourlyRate], e.[HourlyRate], 50.00) AS HourlyRate
      FROM [dbo].[Employee] e
      LEFT JOIN [dbo].[ProjectMember] pm 
        ON pm.[EmployeeID] = e.[EmployeeID] 
       AND pm.[ProjectID] = @ProjectID 
       AND pm.[IsDeleted] = 0
      WHERE e.[EmployeeID] = @EmployeeID AND e.[IsDeleted] = 0
    `;
    const result = await this.query(queryStr, {
      EmployeeID: { type: mssql.Int, value: employeeId },
      ProjectID: { type: mssql.Int, value: projectId }
    });

    if (result.recordset && result.recordset.length > 0) {
      return parseFloat(result.recordset[0].HourlyRate || 50.00);
    }
    return 50.00;
  }

  /**
   * Create a new weekly timecard with entries in a transaction
   */
  async createTimecard(headerData, entries) {
    return this.withTransaction(async (tx) => {
      // 1. Insert Header
      const headerQuery = `
        INSERT INTO [dbo].[Timecard] (
          [EmployeeID],
          [WeekStartDate],
          [WeekEndDate],
          [TotalHours],
          [TotalAmount],
          [Status],
          [ManagerID],
          [CreatedBy],
          [CreatedDate]
        )
        OUTPUT INSERTED.TimecardID
        VALUES (
          @EmployeeID,
          @WeekStartDate,
          @WeekEndDate,
          @TotalHours,
          @TotalAmount,
          @Status,
          @ManagerID,
          @CreatedBy,
          SYSUTCDATETIME()
        )
      `;

      const headerResult = await this.query(headerQuery, {
        EmployeeID: { type: mssql.Int, value: headerData.employeeId },
        WeekStartDate: { type: mssql.Date, value: headerData.weekStartDate },
        WeekEndDate: { type: mssql.Date, value: headerData.weekEndDate },
        TotalHours: { type: mssql.Decimal(7, 2), value: headerData.totalHours },
        TotalAmount: { type: mssql.Decimal(12, 2), value: headerData.totalAmount },
        Status: { type: mssql.NVarChar(30), value: headerData.status || 'Submitted' },
        ManagerID: { type: mssql.Int, value: headerData.managerId || null },
        CreatedBy: { type: mssql.Int, value: headerData.employeeId }
      }, tx);

      const timecardId = headerResult.recordset[0].TimecardID;

      // 2. Insert Entries
      for (const entry of entries) {
        const entryQuery = `
          INSERT INTO [dbo].[TimecardEntry] (
            [TimecardID],
            [ProjectID],
            [TaskID],
            [WorkDate],
            [WorkMode],
            [HoursWorked],
            [HourlyRate],
            [BillingAmount],
            [Description],
            [CreatedBy],
            [CreatedDate]
          )
          VALUES (
            @TimecardID,
            @ProjectID,
            @TaskID,
            @WorkDate,
            @WorkMode,
            @HoursWorked,
            @HourlyRate,
            @BillingAmount,
            @Description,
            @CreatedBy,
            SYSUTCDATETIME()
          )
        `;

        await this.query(entryQuery, {
          TimecardID: { type: mssql.Int, value: timecardId },
          ProjectID: { type: mssql.Int, value: entry.projectId },
          TaskID: { type: mssql.Int, value: entry.taskId || null },
          WorkDate: { type: mssql.Date, value: entry.workDate },
          WorkMode: { type: mssql.NVarChar(50), value: entry.workMode || 'Office' },
          HoursWorked: { type: mssql.Decimal(5, 2), value: entry.hoursWorked },
          HourlyRate: { type: mssql.Decimal(10, 2), value: entry.hourlyRate },
          BillingAmount: { type: mssql.Decimal(12, 2), value: entry.billingAmount },
          Description: { type: mssql.NVarChar(500), value: entry.description || null },
          CreatedBy: { type: mssql.Int, value: headerData.employeeId }
        }, tx);
      }

      return timecardId;
    });
  }

  /**
   * Find paginated timecards with optional filters
   */
  async findTimecards({
    employeeId,
    managerId,
    projectOwnerId,
    scopedUserId,
    status,
    weekStartDate,
    weekEndDate,
    search,
    page = 1,
    limit = 10
  }) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE t.[IsDeleted] = 0';
    const params = {
      Offset: { type: mssql.Int, value: offset },
      Limit: { type: mssql.Int, value: limit }
    };

    if (scopedUserId) {
      if (employeeId) {
        whereClause += ' AND t.[EmployeeID] = @FilterEmployeeID';
        params.FilterEmployeeID = { type: mssql.Int, value: employeeId };
      } else if (managerId) {
        whereClause += ' AND (t.[ManagerID] = @FilterManagerID OR EXISTS (SELECT 1 FROM [dbo].[Project] p INNER JOIN [dbo].[TimecardEntry] te ON te.[ProjectID] = p.[ProjectID] WHERE te.[TimecardID] = t.[TimecardID] AND p.[ProjectManagerID] = @FilterManagerID))';
        params.FilterManagerID = { type: mssql.Int, value: managerId };
      } else {
        whereClause += ` AND (
          t.[EmployeeID] = @ScopedUserId 
          OR t.[ManagerID] = @ScopedUserId 
          OR EXISTS (
            SELECT 1 FROM [dbo].[Project] p 
            INNER JOIN [dbo].[TimecardEntry] te ON te.[ProjectID] = p.[ProjectID] 
            WHERE te.[TimecardID] = t.[TimecardID] AND p.[ProjectManagerID] = @ScopedUserId
          )
        )`;
        params.ScopedUserId = { type: mssql.Int, value: scopedUserId };
      }
    } else {
      if (employeeId) {
        whereClause += ' AND t.[EmployeeID] = @EmployeeID';
        params.EmployeeID = { type: mssql.Int, value: employeeId };
      }
      if (managerId) {
        whereClause += ' AND (t.[ManagerID] = @ManagerID OR EXISTS (SELECT 1 FROM [dbo].[Project] p INNER JOIN [dbo].[TimecardEntry] te ON te.[ProjectID] = p.[ProjectID] WHERE te.[TimecardID] = t.[TimecardID] AND p.[ProjectManagerID] = @ManagerID))';
        params.ManagerID = { type: mssql.Int, value: managerId };
      }
    }

    if (projectOwnerId) {
      whereClause += ' AND EXISTS (SELECT 1 FROM [dbo].[Project] p INNER JOIN [dbo].[TimecardEntry] te ON te.[ProjectID] = p.[ProjectID] WHERE te.[TimecardID] = t.[TimecardID] AND p.[ProjectOwnerID] = @ProjectOwnerID)';
      params.ProjectOwnerID = { type: mssql.Int, value: projectOwnerId };
    }

    if (status) {
      whereClause += ' AND t.[Status] = @Status';
      params.Status = { type: mssql.NVarChar(30), value: status };
    }

    if (weekStartDate) {
      whereClause += ' AND t.[WeekStartDate] >= @WeekStartDate';
      params.WeekStartDate = { type: mssql.Date, value: weekStartDate };
    }

    if (weekEndDate) {
      whereClause += ' AND t.[WeekEndDate] <= @WeekEndDate';
      params.WeekEndDate = { type: mssql.Date, value: weekEndDate };
    }

    if (search) {
      whereClause += ' AND (e.[FirstName] LIKE @Search OR e.[LastName] LIKE @Search OR e.[Email] LIKE @Search)';
      params.Search = { type: mssql.NVarChar(256), value: `%${search}%` };
    }

    const queryStr = `
      SELECT 
        t.[TimecardID],
        t.[EmployeeID],
        e.[FirstName] AS EmployeeFirstName,
        e.[LastName] AS EmployeeLastName,
        e.[Email] AS EmployeeEmail,
        d.[DepartmentName],
        t.[WeekStartDate],
        t.[WeekEndDate],
        t.[TotalHours],
        t.[TotalAmount],
        t.[Status],
        t.[ManagerID],
        mgr.[FirstName] AS ManagerFirstName,
        mgr.[LastName] AS ManagerLastName,
        t.[ManagerApprovedDate],
        t.[ManagerComments],
        t.[FinancialApprovedByID],
        fin.[FirstName] AS FinancialFirstName,
        fin.[LastName] AS FinancialLastName,
        t.[FinancialApprovedDate],
        t.[FinancialComments],
        t.[CreatedDate],
        COUNT(*) OVER() AS TotalCount
      FROM [dbo].[Timecard] t
      INNER JOIN [dbo].[Employee] e ON t.[EmployeeID] = e.[EmployeeID]
      LEFT JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      LEFT JOIN [dbo].[Employee] mgr ON t.[ManagerID] = mgr.[EmployeeID]
      LEFT JOIN [dbo].[Employee] fin ON t.[FinancialApprovedByID] = fin.[EmployeeID]
      ${whereClause}
      ORDER BY t.[TimecardID] DESC
      OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY
    `;

    const result = await this.query(queryStr, params);
    return {
      items: result.recordset || [],
      totalCount: result.recordset?.[0]?.TotalCount || 0
    };
  }

  /**
   * Get single timecard by ID including detail entries
   */
  async findTimecardById(timecardId) {
    const headerQuery = `
      SELECT 
        t.[TimecardID],
        t.[EmployeeID],
        e.[FirstName] AS EmployeeFirstName,
        e.[LastName] AS EmployeeLastName,
        e.[Email] AS EmployeeEmail,
        d.[DepartmentName],
        t.[WeekStartDate],
        t.[WeekEndDate],
        t.[TotalHours],
        t.[TotalAmount],
        t.[Status],
        t.[ManagerID],
        mgr.[FirstName] AS ManagerFirstName,
        mgr.[LastName] AS ManagerLastName,
        t.[ManagerApprovedDate],
        t.[ManagerComments],
        t.[FinancialApprovedByID],
        fin.[FirstName] AS FinancialFirstName,
        fin.[LastName] AS FinancialLastName,
        t.[FinancialApprovedDate],
        t.[FinancialComments],
        t.[CreatedDate]
      FROM [dbo].[Timecard] t
      INNER JOIN [dbo].[Employee] e ON t.[EmployeeID] = e.[EmployeeID]
      LEFT JOIN [dbo].[Department] d ON e.[DepartmentID] = d.[DepartmentID]
      LEFT JOIN [dbo].[Employee] mgr ON t.[ManagerID] = mgr.[EmployeeID]
      LEFT JOIN [dbo].[Employee] fin ON t.[FinancialApprovedByID] = fin.[EmployeeID]
      WHERE t.[TimecardID] = @TimecardID AND t.[IsDeleted] = 0
    `;

    const headerResult = await this.query(headerQuery, {
      TimecardID: { type: mssql.Int, value: timecardId }
    });

    if (!headerResult.recordset || headerResult.recordset.length === 0) {
      return null;
    }

    const timecard = headerResult.recordset[0];

    const entriesQuery = `
      SELECT 
        te.[TimecardEntryID],
        te.[TimecardID],
        te.[ProjectID],
        p.[ProjectName],
        p.[ProjectOwnerID],
        po.[FirstName] AS ProjectOwnerFirstName,
        po.[LastName] AS ProjectOwnerLastName,
        te.[TaskID],
        tsk.[Title] AS TaskTitle,
        te.[WorkDate],
        ISNULL(te.[WorkMode], N'Office') AS WorkMode,
        te.[HoursWorked],
        te.[HourlyRate],
        te.[BillingAmount],
        te.[Description]
      FROM [dbo].[TimecardEntry] te
      INNER JOIN [dbo].[Project] p ON te.[ProjectID] = p.[ProjectID]
      LEFT JOIN [dbo].[Employee] po ON p.[ProjectOwnerID] = po.[EmployeeID]
      LEFT JOIN [dbo].[Task] tsk ON te.[TaskID] = tsk.[TaskID]
      WHERE te.[TimecardID] = @TimecardID AND te.[IsDeleted] = 0
      ORDER BY te.[WorkDate] ASC, p.[ProjectName] ASC
    `;

    const entriesResult = await this.query(entriesQuery, {
      TimecardID: { type: mssql.Int, value: timecardId }
    });

    timecard.entries = entriesResult.recordset || [];
    return timecard;
  }

  /**
   * Update Manager approval/rejection status (Stage 1)
   */
  async updateManagerApproval(timecardId, { managerId, status, comments }) {
    const queryStr = `
      UPDATE [dbo].[Timecard]
      SET 
        [Status] = @Status,
        [ManagerID] = @ManagerID,
        [ManagerApprovedDate] = SYSUTCDATETIME(),
        [ManagerComments] = @Comments,
        [UpdatedBy] = @ManagerID,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [TimecardID] = @TimecardID AND [IsDeleted] = 0
    `;

    await this.query(queryStr, {
      TimecardID: { type: mssql.Int, value: timecardId },
      ManagerID: { type: mssql.Int, value: managerId },
      Status: { type: mssql.NVarChar(30), value: status },
      Comments: { type: mssql.NVarChar(mssql.MAX), value: comments || null }
    });

    return this.findTimecardById(timecardId);
  }

  /**
   * Update Financial approval/rejection status (Stage 2 - Project Owner Clearance)
   */
  async updateFinancialApproval(timecardId, { financialApprovedById, status, comments }) {
    const queryStr = `
      UPDATE [dbo].[Timecard]
      SET 
        [Status] = @Status,
        [FinancialApprovedByID] = @FinancialApprovedByID,
        [FinancialApprovedDate] = SYSUTCDATETIME(),
        [FinancialComments] = @Comments,
        [UpdatedBy] = @FinancialApprovedByID,
        [UpdatedDate] = SYSUTCDATETIME()
      WHERE [TimecardID] = @TimecardID AND [IsDeleted] = 0
    `;

    await this.query(queryStr, {
      TimecardID: { type: mssql.Int, value: timecardId },
      FinancialApprovedByID: { type: mssql.Int, value: financialApprovedById },
      Status: { type: mssql.NVarChar(30), value: status },
      Comments: { type: mssql.NVarChar(mssql.MAX), value: comments || null }
    });

    return this.findTimecardById(timecardId);
  }

  /**
   * Get Project Financial & Billing summary for Project Owner review
   */
  async getProjectBillingSummary(projectId) {
    const queryStr = `
      SELECT 
        p.[ProjectID],
        p.[ProjectName],
        p.[ProjectManagerID],
        pm.[FirstName] + ' ' + pm.[LastName] AS ProjectManagerName,
        p.[ProjectOwnerID],
        po.[FirstName] + ' ' + po.[LastName] AS ProjectOwnerName,
        e.[EmployeeID],
        e.[FirstName] + ' ' + e.[LastName] AS EmployeeName,
        e.[Email] AS EmployeeEmail,
        SUM(te.[HoursWorked]) AS TotalHoursWorked,
        te.[HourlyRate] AS CostingRatePerHour,
        SUM(te.[BillingAmount]) AS TotalBillingAmount
      FROM [dbo].[TimecardEntry] te
      INNER JOIN [dbo].[Timecard] t ON te.[TimecardID] = t.[TimecardID]
      INNER JOIN [dbo].[Project] p ON te.[ProjectID] = p.[ProjectID]
      INNER JOIN [dbo].[Employee] e ON t.[EmployeeID] = e.[EmployeeID]
      LEFT JOIN [dbo].[Employee] pm ON p.[ProjectManagerID] = pm.[EmployeeID]
      LEFT JOIN [dbo].[Employee] po ON p.[ProjectOwnerID] = po.[EmployeeID]
      WHERE te.[ProjectID] = @ProjectID AND te.[IsDeleted] = 0 AND t.[IsDeleted] = 0
      GROUP BY 
        p.[ProjectID], p.[ProjectName], p.[ProjectManagerID], pm.[FirstName], pm.[LastName],
        p.[ProjectOwnerID], po.[FirstName], po.[LastName], e.[EmployeeID], e.[FirstName], e.[LastName], e.[Email], te.[HourlyRate]
    `;

    const result = await this.query(queryStr, {
      ProjectID: { type: mssql.Int, value: projectId }
    });

    const rows = result.recordset || [];
    const totalProjectHours = rows.reduce((sum, r) => sum + (parseFloat(r.TotalHoursWorked) || 0), 0);
    const totalProjectBilling = rows.reduce((sum, r) => sum + (parseFloat(r.TotalBillingAmount) || 0), 0);

    return {
      projectId,
      projectName: rows[0]?.ProjectName || 'Project',
      projectManagerName: rows[0]?.ProjectManagerName || 'Unassigned',
      projectOwnerName: rows[0]?.ProjectOwnerName || 'Unassigned',
      totalProjectHours,
      totalProjectBilling,
      employeeBreakdown: rows
    };
  }

  /**
   * Updates an existing rejected timecard record and replaces entries (Resubmit workflow)
   */
  async updateTimecard(timecardId, headerData, entries) {
    return this.withTransaction(async (tx) => {
      // 1. Reset Header status & totals
      const headerQuery = `
        UPDATE [dbo].[Timecard]
        SET 
          [TotalHours] = @TotalHours,
          [TotalAmount] = @TotalAmount,
          [Status] = N'Submitted',
          [ManagerID] = @ManagerID,
          [ManagerApprovedDate] = NULL,
          [ManagerComments] = NULL,
          [FinancialApprovedByID] = NULL,
          [FinancialApprovedDate] = NULL,
          [FinancialComments] = NULL,
          [UpdatedBy] = @EmployeeID,
          [UpdatedDate] = SYSUTCDATETIME()
        WHERE [TimecardID] = @TimecardID AND [IsDeleted] = 0;
      `;

      await this.query(headerQuery, {
        TimecardID: { type: mssql.Int, value: timecardId },
        TotalHours: { type: mssql.Decimal(7, 2), value: headerData.totalHours },
        TotalAmount: { type: mssql.Decimal(12, 2), value: headerData.totalAmount },
        ManagerID: { type: mssql.Int, value: headerData.managerId || null },
        EmployeeID: { type: mssql.Int, value: headerData.employeeId }
      }, tx);

      // 2. Soft delete existing entries
      await this.query(`
        UPDATE [dbo].[TimecardEntry]
        SET [IsDeleted] = 1, [UpdatedBy] = @EmployeeID, [UpdatedDate] = SYSUTCDATETIME()
        WHERE [TimecardID] = @TimecardID AND [IsDeleted] = 0;
      `, {
        TimecardID: { type: mssql.Int, value: timecardId },
        EmployeeID: { type: mssql.Int, value: headerData.employeeId }
      }, tx);

      // 3. Insert new entries
      for (const entry of entries) {
        const entryQuery = `
          INSERT INTO [dbo].[TimecardEntry] (
            [TimecardID],
            [ProjectID],
            [TaskID],
            [WorkDate],
            [WorkMode],
            [HoursWorked],
            [HourlyRate],
            [BillingAmount],
            [Description],
            [CreatedBy],
            [CreatedDate]
          )
          VALUES (
            @TimecardID,
            @ProjectID,
            @TaskID,
            @WorkDate,
            @WorkMode,
            @HoursWorked,
            @HourlyRate,
            @BillingAmount,
            @Description,
            @CreatedBy,
            SYSUTCDATETIME()
          )
        `;

        await this.query(entryQuery, {
          TimecardID: { type: mssql.Int, value: timecardId },
          ProjectID: { type: mssql.Int, value: entry.projectId },
          TaskID: { type: mssql.Int, value: entry.taskId || null },
          WorkDate: { type: mssql.Date, value: entry.workDate },
          WorkMode: { type: mssql.NVarChar(50), value: entry.workMode || 'Office' },
          HoursWorked: { type: mssql.Decimal(5, 2), value: entry.hoursWorked },
          HourlyRate: { type: mssql.Decimal(10, 2), value: entry.hourlyRate },
          BillingAmount: { type: mssql.Decimal(12, 2), value: entry.billingAmount },
          Description: { type: mssql.NVarChar(500), value: entry.description || null },
          CreatedBy: { type: mssql.Int, value: headerData.employeeId }
        }, tx);
      }

      return timecardId;
    });
  }

  /**
   * Find missing timecard weeks for an employee (past 4 weeks)
   */
  async findMissingTimecards(employeeId) {
    const queryStr = `
      SELECT 
        WeekStartDate
      FROM [dbo].[Timecard]
      WHERE [EmployeeID] = @EmployeeID AND [IsDeleted] = 0;
    `;
    const result = await this.query(queryStr, { EmployeeID: { type: mssql.Int, value: employeeId } });
    const submittedDates = (result.recordset || []).map(r => new Date(r.WeekStartDate).toISOString().substring(0, 10));

    // Calculate Mondays of past 4 weeks
    const missing = [];
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = (currentDay === 0 ? -6 : 1) - currentDay;
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() + diffToMonday);
    currentMonday.setHours(0, 0, 0, 0);

    for (let i = 1; i <= 4; i++) {
      const pastMon = new Date(currentMonday);
      pastMon.setDate(currentMonday.getDate() - (i * 7));
      const dateStr = pastMon.toISOString().substring(0, 10);
      if (!submittedDates.includes(dateStr)) {
        const pastSun = new Date(pastMon);
        pastSun.setDate(pastMon.getDate() + 6);
        missing.push({
          weekStartDate: dateStr,
          weekEndDate: pastSun.toISOString().substring(0, 10)
        });
      }
    }

    return missing;
  }
}

module.exports = new TimecardRepository();
