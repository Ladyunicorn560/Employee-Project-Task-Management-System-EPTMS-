const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    const hasSmtp = env.SMTP_HOST && env.SMTP_PORT;
    if (hasSmtp) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: parseInt(env.SMTP_PORT, 10),
        secure: env.SMTP_SECURE === 'true',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      logger.info(`Email Service initialized with SMTP [Host: ${env.SMTP_HOST}]`);
    } else {
      logger.info('Email Service initialized in MOCK mode (emails will be logged to console/logs)');
    }
  }

  async sendEmail({ to, subject, html, text }) {
    const from = env.SMTP_FROM || '"EPTMS" <noreply@eptms.com>';
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from,
          to,
          subject,
          text,
          html,
        });
        logger.info(`Email sent successfully: ${info.messageId} [Recipient: ${to}]`);
        return info;
      } catch (err) {
        logger.error(`Failed to send email to ${to}:`, err);
        throw err;
      }
    } else {
      // Mock mode logging
      logger.info(`[MOCK EMAIL DISPATCH]
-----------------------------------------
From: ${from}
To: ${to}
Subject: ${subject}
Text: ${text}
-----------------------------------------`);
      return { mock: true, messageId: 'mock-id-' + Date.now() };
    }
  }

  async sendTaskAssignmentEmail(employeeEmail, employeeName, taskTitle, projectName, dueDate, priority) {
    const subject = `New Task Assigned - ${taskTitle}`;
    const text = `Hello ${employeeName},\n\nA new task has been assigned to you.\n\nProject: ${projectName}\nTask: ${taskTitle}\nDue Date: ${dueDate}\nPriority: ${priority}\n\nPlease log in to EPTMS to begin work.\n\nRegards,\nEPTMS`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Hello ${employeeName},</h2>
        <p>A new task has been assigned to you.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Project:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Task:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Due Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Priority:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${priority}</td>
          </tr>
        </table>
        <p>Please log in to EPTMS to begin work.</p>
        <p>Regards,<br/><strong>EPTMS Team</strong></p>
      </div>
    `;
    return this.sendEmail({ to: employeeEmail, subject, text, html });
  }

  async sendReviewRequestEmail(reviewerEmail, reviewerName, employeeName, taskTitle, projectName) {
    const subject = `Task Ready for Review - ${taskTitle}`;
    const text = `Hello ${reviewerName},\n\nThe following task is awaiting your review.\n\nTask: ${taskTitle}\nSubmitted By: ${employeeName}\nProject: ${projectName}\n\nPlease review and approve or request changes.\n\nRegards,\nEPTMS`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Hello ${reviewerName},</h2>
        <p>The following task is awaiting your review.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Task:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Submitted By:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${employeeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Project:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td>
          </tr>
        </table>
        <p>Please log in to EPTMS to review and approve or request changes.</p>
        <p>Regards,<br/><strong>EPTMS Team</strong></p>
      </div>
    `;
    return this.sendEmail({ to: reviewerEmail, subject, text, html });
  }

  async sendReviewOutcomeEmail(employeeEmail, employeeName, taskTitle, status, reviewerName, comments = '') {
    const subject = `Task ${status} - ${taskTitle}`;
    const commentSection = comments ? `\n\nReviewer Comments:\n${comments}` : '';
    const text = `Hello ${employeeName},\n\nYour task '${taskTitle}' has been reviewed.\n\nStatus: ${status}\nReviewed By: ${reviewerName}${commentSection}\n\nRegards,\nEPTMS`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Hello ${employeeName},</h2>
        <p>Your task <strong>${taskTitle}</strong> has been reviewed.</p>
        <p>Status: <span style="font-weight: bold; color: ${status === 'Approved' ? 'green' : 'orange'};">${status}</span></p>
        <p>Reviewed By: ${reviewerName}</p>
        ${comments ? `<div style="background: #f9f9f9; padding: 10px; border-left: 4px solid #ddd; margin: 15px 0;"><strong>Comments:</strong><br/>${comments}</div>` : ''}
        <p>Regards,<br/><strong>EPTMS Team</strong></p>
      </div>
    `;
    return this.sendEmail({ to: employeeEmail, subject, text, html });
  }

  async sendPasswordResetEmail(employeeEmail, employeeName, token) {
    const resetUrl = `${env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
    const subject = 'Password Reset Request';
    const text = `Hello ${employeeName},\n\nYou requested a password reset for your EPTMS account. Please use the following link to reset your password:\n\n${resetUrl}\n\nThis link is valid for 1 hour.\n\nRegards,\nEPTMS`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Hello ${employeeName},</h2>
        <p>You requested a password reset for your EPTMS account.</p>
        <p>Please click the button below to reset your password:</p>
        <p style="margin: 25px 0;">
          <a href="${resetUrl}" style="background-color: #1976D2; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
        </p>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all;"><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link is valid for 1 hour.</p>
        <p>Regards,<br/><strong>EPTMS Team</strong></p>
      </div>
    `;
    return this.sendEmail({ to: employeeEmail, subject, text, html });
  }

  async sendOverdueTaskReminderEmail(assigneeEmail, assigneeName, taskTitle, projectName, dueDate) {
    const subject = `URGENT: Task is Overdue - ${taskTitle}`;
    const text = `Hello ${assigneeName},\n\nThis is a reminder that the task '${taskTitle}' assigned to you in project '${projectName}' was due on ${dueDate} and is now overdue. Please update the status or complete the task as soon as possible.\n\nRegards,\nEPTMS`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #D32F2F;">Hello ${assigneeName},</h2>
        <p>This is a reminder that your assigned task is now <strong>overdue</strong>.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Project:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Task:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #D32F2F;">Due Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #D32F2F; font-weight: bold;">${dueDate}</td>
          </tr>
        </table>
        <p>Please log in to EPTMS to complete the task or request an extension from your project manager.</p>
        <p>Regards,<br/><strong>EPTMS Team</strong></p>
      </div>
    `;
    return this.sendEmail({ to: assigneeEmail, subject, text, html });
  }

  async sendOverdueTaskPmEscalationEmail(pmEmail, pmName, assigneeName, taskTitle, projectName, dueDate, daysOverdue) {
    const subject = `ESCALATION: Task Overdue by ${daysOverdue} Days - ${taskTitle}`;
    const text = `Hello ${pmName},\n\nThis is a PM escalation. The task '${taskTitle}' assigned to ${assigneeName} in project '${projectName}' has been overdue since ${dueDate} (by ${daysOverdue} days).\n\nRegards,\nEPTMS`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #C62828;">Hello ${pmName},</h2>
        <p>This is an automated <strong>Project Manager Escalation</strong> for an overdue task.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Project:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Task:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Assigned To:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${assigneeName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Original Due Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dueDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #C62828;">Days Overdue:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #C62828; font-weight: bold;">${daysOverdue}</td>
          </tr>
        </table>
        <p>Please review this task with the assignee to ensure project milestones are not delayed.</p>
        <p>Regards,<br/><strong>EPTMS Team</strong></p>
      </div>
    `;
    return this.sendEmail({ to: pmEmail, subject, text, html });
  }

  async sendPendingReviewReminderEmail(reviewerEmail, reviewerName, taskTitle, projectName, ageHours) {
    const subject = `Reminder: Review Request Pending - ${taskTitle}`;
    const text = `Hello ${reviewerName},\n\nThis is a reminder that the task '${taskTitle}' in project '${projectName}' has been awaiting your review for ${ageHours} hours. Please review and approve or request changes.\n\nRegards,\nEPTMS`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2>Hello ${reviewerName},</h2>
        <p>This is a reminder that you have a pending task review request.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Project:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Task:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Awaiting Review For:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${ageHours} hours</td>
          </tr>
        </table>
        <p>Please log in to EPTMS and complete your review as soon as possible.</p>
        <p>Regards,<br/><strong>EPTMS Team</strong></p>
      </div>
    `;
    return this.sendEmail({ to: reviewerEmail, subject, text, html });
  }

  async sendPendingReviewPmEscalationEmail(pmEmail, pmName, reviewerName, taskTitle, projectName, ageDays) {
    const subject = `ESCALATION: Pending Review Awaiting Action for ${ageDays} Days - ${taskTitle}`;
    const text = `Hello ${pmName},\n\nThis is a PM escalation. The task '${taskTitle}' in project '${projectName}' has been awaiting review by ${reviewerName} for ${ageDays} days.\n\nRegards,\nEPTMS`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #C62828;">Hello ${pmName},</h2>
        <p>This is an automated <strong>Project Manager Escalation</strong> for a delayed task review.</p>
        <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Project:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${projectName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Task:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${taskTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Reviewer:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${reviewerName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; color: #C62828;">Awaiting Review For:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #C62828; font-weight: bold;">${ageDays} days</td>
          </tr>
        </table>
        <p>Please coordinate with the designated reviewer to avoid bottlenecking task progress.</p>
        <p>Regards,<br/><strong>EPTMS Team</strong></p>
      </div>
    `;
    return this.sendEmail({ to: pmEmail, subject, text, html });
  }
}

module.exports = new EmailService();
