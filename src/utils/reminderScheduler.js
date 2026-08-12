const { getPool, mssql } = require('../config/db');
const emailService = require('../services/emailService');
const notificationRepository = require('../repositories/notificationRepository');
const logger = require('./logger');

/**
 * Inserts an in-app "Task Overdue" notification if one doesn't already exist
 * (duplicate-unread guard is built into notificationRepository.findDuplicateUnread)
 */
async function createOverdueNotification(pool, { recipientId, taskId, projectId, taskTitle, projectName, daysOverdue }) {
  try {
    const isDuplicate = await notificationRepository.findDuplicateUnread(
      recipientId,
      'Task Overdue',
      taskId,
      null
    );

    if (isDuplicate) {
      logger.info(`[Scheduler] Suppressed duplicate overdue notification [TaskID: ${taskId}, RecipientID: ${recipientId}]`);
      return;
    }

    const daysLabel = daysOverdue === 1 ? '1 day' : `${daysOverdue} days`;
    const message = `Task "${taskTitle}" in project "${projectName}" is overdue by ${daysLabel}. Please update its status immediately.`;

    await notificationRepository.create({
      recipientId,
      triggeredById: null,
      taskId,
      projectId,
      notificationType: 'Task Overdue',
      message,
      deliveryChannel: 'In-App',
      createdBy: recipientId
    });

    logger.info(`[Scheduler] Created in-app overdue notification [TaskID: ${taskId}, RecipientID: ${recipientId}]`);
  } catch (err) {
    logger.error(`[Scheduler] Failed to create overdue notification [TaskID: ${taskId}]:`, err);
  }
}

async function checkAndSendReminders() {
  logger.info('[Scheduler] Running task due date and pending review checks...');
  try {
    const pool = getPool();

    // 1. Process Overdue Tasks
    const overdueTasksQuery = `
      SELECT 
        t.[TaskID],
        t.[Title] AS TaskTitle,
        t.[DueDate],
        t.[Priority],
        t.[AssignedTo] AS AssigneeID,
        e.[FirstName] AS AssigneeFirstName,
        e.[LastName] AS AssigneeLastName,
        e.[Email] AS AssigneeEmail,
        p.[ProjectManagerID] AS PmID,
        pm.[FirstName] AS PmFirstName,
        pm.[LastName] AS PmLastName,
        pm.[Email] AS PmEmail,
        p.[ProjectID],
        p.[ProjectName]
      FROM [dbo].[Task] t
      INNER JOIN [dbo].[Employee] e ON t.[AssignedTo] = e.[EmployeeID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      INNER JOIN [dbo].[Employee] pm ON p.[ProjectManagerID] = pm.[EmployeeID]
      WHERE t.[Status] NOT IN (N'Completed', N'Cancelled') 
        AND t.[IsDeleted] = 0
        AND m.[IsDeleted] = 0
        AND p.[IsDeleted] = 0
        AND t.[DueDate] < CAST(SYSUTCDATETIME() AS DATE);
    `;

    const overdueResult = await pool.request().query(overdueTasksQuery);
    const overdueTasks = overdueResult.recordset || [];

    logger.info(`[Scheduler] Found ${overdueTasks.length} overdue tasks.`);

    for (const task of overdueTasks) {
      const dueDate = new Date(task.DueDate);
      const diffTime = Date.now() - dueDate.getTime();
      const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      const formattedDueDate = dueDate.toISOString().split('T')[0];

      if (daysOverdue >= 3) {
        // ── PM Escalation (email + in-app to PM) ──────────────────────────
        logger.info(`[Scheduler] Escalating task ${task.TaskID} ('${task.TaskTitle}') to PM ${task.PmEmail} (${daysOverdue} days overdue)`);

        // Email to PM
        await emailService.sendOverdueTaskPmEscalationEmail(
          task.PmEmail,
          `${task.PmFirstName} ${task.PmLastName}`,
          `${task.AssigneeFirstName} ${task.AssigneeLastName}`,
          task.TaskTitle,
          task.ProjectName,
          formattedDueDate,
          daysOverdue
        ).catch(err => logger.error(`[Scheduler] Failed to send PM escalation email for task ${task.TaskID}:`, err));

        // In-app notification to PM
        await createOverdueNotification(pool, {
          recipientId: task.PmID,
          taskId: task.TaskID,
          projectId: task.ProjectID,
          taskTitle: task.TaskTitle,
          projectName: task.ProjectName,
          daysOverdue
        });

        // Also keep the assignee in-app notification so they see it too
        await createOverdueNotification(pool, {
          recipientId: task.AssigneeID,
          taskId: task.TaskID,
          projectId: task.ProjectID,
          taskTitle: task.TaskTitle,
          projectName: task.ProjectName,
          daysOverdue
        });

      } else {
        // ── Assignee Reminder (email + in-app to Assignee) ────────────────
        logger.info(`[Scheduler] Sending overdue task reminder to assignee ${task.AssigneeEmail} for task ${task.TaskID}`);

        // Email to Assignee
        await emailService.sendOverdueTaskReminderEmail(
          task.AssigneeEmail,
          `${task.AssigneeFirstName} ${task.AssigneeLastName}`,
          task.TaskTitle,
          task.ProjectName,
          formattedDueDate
        ).catch(err => logger.error(`[Scheduler] Failed to send reminder email for task ${task.TaskID}:`, err));

        // In-app notification to Assignee
        await createOverdueNotification(pool, {
          recipientId: task.AssigneeID,
          taskId: task.TaskID,
          projectId: task.ProjectID,
          taskTitle: task.TaskTitle,
          projectName: task.ProjectName,
          daysOverdue
        });
      }
    }

    // 2. Process Pending Reviews
    const pendingReviewsQuery = `
      SELECT 
        r.[ReviewID],
        r.[TaskID],
        r.[ReviewerID],
        r.[CreatedDate] AS ReviewCreatedDate,
        t.[Title] AS TaskTitle,
        rev.[FirstName] AS ReviewerFirstName,
        rev.[LastName] AS ReviewerLastName,
        rev.[Email] AS ReviewerEmail,
        p.[ProjectManagerID] AS PmID,
        pm.[FirstName] AS PmFirstName,
        pm.[LastName] AS PmLastName,
        pm.[Email] AS PmEmail,
        p.[ProjectID],
        p.[ProjectName]
      FROM [dbo].[Review] r
      INNER JOIN [dbo].[Task] t ON r.[TaskID] = t.[TaskID]
      INNER JOIN [dbo].[Employee] rev ON r.[ReviewerID] = rev.[EmployeeID]
      INNER JOIN [dbo].[Milestone] m ON t.[MilestoneID] = m.[MilestoneID]
      INNER JOIN [dbo].[Project] p ON m.[ProjectID] = p.[ProjectID]
      INNER JOIN [dbo].[Employee] pm ON p.[ProjectManagerID] = pm.[EmployeeID]
      WHERE r.[Status] = N'Pending'
        AND t.[IsDeleted] = 0
        AND m.[IsDeleted] = 0
        AND p.[IsDeleted] = 0;
    `;

    const reviewsResult = await pool.request().query(pendingReviewsQuery);
    const pendingReviews = reviewsResult.recordset || [];

    logger.info(`[Scheduler] Found ${pendingReviews.length} pending review requests.`);

    for (const review of pendingReviews) {
      const createdDate = new Date(review.ReviewCreatedDate);
      const diffTime = Date.now() - createdDate.getTime();
      const hoursPending = Math.floor(diffTime / (1000 * 60 * 60));
      const daysPending = Math.floor(hoursPending / 24);

      if (daysPending >= 3) {
        // PM Escalation (email + in-app)
        logger.info(`[Scheduler] Escalating pending review ${review.ReviewID} to PM ${review.PmEmail} (${daysPending} days pending)`);
        await emailService.sendPendingReviewPmEscalationEmail(
          review.PmEmail,
          `${review.PmFirstName} ${review.PmLastName}`,
          `${review.ReviewerFirstName} ${review.ReviewerLastName}`,
          review.TaskTitle,
          review.ProjectName,
          daysPending
        ).catch(err => logger.error(`[Scheduler] Failed to send PM escalation for review ${review.ReviewID}:`, err));

        // In-app notification to PM
        try {
          const isDuplicate = await notificationRepository.findDuplicateUnread(review.PmID, 'Review Overdue', null, null);
          if (!isDuplicate) {
            await notificationRepository.create({
              recipientId: review.PmID,
              triggeredById: null,
              taskId: review.TaskID,
              projectId: review.ProjectID,
              notificationType: 'Review Overdue',
              message: `Review for task "${review.TaskTitle}" in "${review.ProjectName}" has been pending for ${daysPending} days. Reviewer: ${review.ReviewerFirstName} ${review.ReviewerLastName}.`,
              deliveryChannel: 'In-App',
              createdBy: review.PmID
            });
          }
        } catch (err) {
          logger.error(`[Scheduler] Failed to create PM review overdue notification for review ${review.ReviewID}:`, err);
        }

      } else if (hoursPending >= 24) {
        // Reviewer Reminder (email + in-app)
        logger.info(`[Scheduler] Sending pending review reminder to reviewer ${review.ReviewerEmail} for review ${review.ReviewID}`);
        await emailService.sendPendingReviewReminderEmail(
          review.ReviewerEmail,
          `${review.ReviewerFirstName} ${review.ReviewerLastName}`,
          review.TaskTitle,
          review.ProjectName,
          hoursPending
        ).catch(err => logger.error(`[Scheduler] Failed to send reminder for review ${review.ReviewID}:`, err));

        // In-app notification to Reviewer
        try {
          const isDuplicate = await notificationRepository.findDuplicateUnread(review.ReviewerID, 'Review Overdue', null, null);
          if (!isDuplicate) {
            await notificationRepository.create({
              recipientId: review.ReviewerID,
              triggeredById: null,
              taskId: review.TaskID,
              projectId: review.ProjectID,
              notificationType: 'Review Overdue',
              message: `Your review for task "${review.TaskTitle}" in project "${review.ProjectName}" has been pending for ${hoursPending} hours. Please complete it immediately.`,
              deliveryChannel: 'In-App',
              createdBy: review.ReviewerID
            });
          }
        } catch (err) {
          logger.error(`[Scheduler] Failed to create reviewer overdue notification for review ${review.ReviewID}:`, err);
        }
      }
    }

  } catch (err) {
    logger.error('[Scheduler] Error running background reminder checks:', err);
  }
}

function start() {
  // Run immediately on boot to verify, then run every 1 hour (3,600,000 ms)
  setTimeout(() => {
    checkAndSendReminders();
  }, 5000); // 5s delay to ensure DB is initialized

  setInterval(() => {
    checkAndSendReminders();
  }, 60 * 60 * 1000);

  logger.info('[Scheduler] Background reminder scheduler registered.');
}

module.exports = {
  start
};
