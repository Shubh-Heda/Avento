/**
 * Deadline Reminder Service
 * Handles payment deadline reminders with multiple intervals:
 * - 7 days before deadline
 * - 3 days before deadline
 * - 1 day before deadline
 * - Hourly reminders when less than 1 day away
 */

// Deadline Reminder Service - Using Firebase
import { firebaseAuth } from './firebaseService';
import { notificationService } from './notificationService';

export interface DeadlineReminder {
  id: string;
  matchId: string;
  userId: string;
  deadline: Date;
  createdAt: Date;
  remindersScheduled: {
    sevenDays: boolean;
    threeDays: boolean;
    oneDay: boolean;
    hourly: boolean;
  };
  remindersTriggered: {
    sevenDays: boolean;
    threeDays: boolean;
    oneDay: boolean;
    hourlyTimestamps: Date[];
  };
}

class DeadlineReminderService {
  private reminderMap: Map<string, DeadlineReminder> = new Map();
  private activeIntervals: Map<string, NodeJS.Timeout[]> = new Map();

  /**
   * Create a deadline reminder for a match
   * Automatically schedules all reminder intervals based on deadline
   */
  createReminder(
    matchId: string,
    userId: string,
    deadline: Date
  ): DeadlineReminder {
    const reminderId = `reminder_${matchId}_${userId}`;
    
    const reminder: DeadlineReminder = {
      id: reminderId,
      matchId,
      userId,
      deadline,
      createdAt: new Date(),
      remindersScheduled: {
        sevenDays: true,
        threeDays: true,
        oneDay: true,
        hourly: true,
      },
      remindersTriggered: {
        sevenDays: false,
        threeDays: false,
        oneDay: false,
        hourlyTimestamps: [],
      },
    };

    this.reminderMap.set(reminderId, reminder);
    this.scheduleReminders(reminder);

    return reminder;
  }

  /**
   * Schedule all reminders for a deadline
   */
  private scheduleReminders(reminder: DeadlineReminder): void {
    const now = new Date();
    const deadline = reminder.deadline;
    const timeUntilDeadline = deadline.getTime() - now.getTime();

    if (timeUntilDeadline <= 0) {
      // Deadline has passed
      return;
    }

    const intervals: NodeJS.Timeout[] = [];

    // 7 days before (604800000 ms)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (timeUntilDeadline > sevenDaysMs) {
      const sevenDaysTimeout = setTimeout(
        () => this.triggerReminder(reminder, 'sevenDays'),
        timeUntilDeadline - sevenDaysMs
      );
      intervals.push(sevenDaysTimeout);
    }

    // 3 days before (259200000 ms)
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    if (timeUntilDeadline > threeDaysMs) {
      const threeDaysTimeout = setTimeout(
        () => this.triggerReminder(reminder, 'threeDays'),
        timeUntilDeadline - threeDaysMs
      );
      intervals.push(threeDaysTimeout);
    }

    // 1 day before (86400000 ms)
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (timeUntilDeadline > oneDayMs) {
      const oneDayTimeout = setTimeout(
        () => this.triggerReminder(reminder, 'oneDay'),
        timeUntilDeadline - oneDayMs
      );
      intervals.push(oneDayTimeout);
    }

    // Hourly reminders when less than 1 day away
    if (timeUntilDeadline <= oneDayMs) {
      this.scheduleHourlyReminders(reminder, intervals);
    } else {
      // Schedule hourly reminders to start 1 day before
      const hourlyStartTimeout = setTimeout(
        () => this.scheduleHourlyReminders(reminder, []),
        timeUntilDeadline - oneDayMs
      );
      intervals.push(hourlyStartTimeout);
    }

    // Store intervals for cleanup
    this.activeIntervals.set(reminder.id, intervals);
  }

  /**
   * Schedule hourly reminders starting 1 day before deadline
   */
  private scheduleHourlyReminders(
    reminder: DeadlineReminder,
    baseIntervals: NodeJS.Timeout[]
  ): void {
    const intervals = [...baseIntervals];
    const now = new Date();
    const deadline = reminder.deadline;
    const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (60 * 60 * 1000);

    if (hoursUntilDeadline > 0) {
      // Schedule hourly check
      const hourlyInterval = setInterval(
        () => {
          const currentTime = new Date();
          const hoursDiff = (deadline.getTime() - currentTime.getTime()) / (60 * 60 * 1000);

          if (hoursDiff <= 0) {
            // Deadline reached
            this.triggerReminder(reminder, 'deadline');
            clearInterval(hourlyInterval);
          } else {
            // Trigger hourly reminder
            this.triggerReminder(reminder, 'hourly');
          }
        },
        60 * 60 * 1000 // Every hour
      );

      intervals.push(hourlyInterval as unknown as NodeJS.Timeout);
      this.activeIntervals.set(reminder.id, intervals);
    }
  }

  /**
   * Trigger a reminder notification
   */
  private triggerReminder(
    reminder: DeadlineReminder,
    type: 'sevenDays' | 'threeDays' | 'oneDay' | 'hourly' | 'deadline'
  ): void {
    const { matchId, userId, deadline } = reminder;

    // Calculate time remaining
    const now = new Date();
    const timeRemaining = this.calculateTimeRemaining(deadline);

    // Create reminder message
    const messages = {
      sevenDays: {
        title: '⏰ Payment Reminder - 7 Days Left!',
        body: `Your match payment is due in 7 days (${this.formatDate(deadline)}). Don't miss out! 🏃‍♂️`,
      },
      threeDays: {
        title: '⏰ Payment Reminder - 3 Days Left!',
        body: `Hurry! Your match payment deadline is in 3 days (${this.formatDate(deadline)}). 🏃‍♂️`,
      },
      oneDay: {
        title: '⏰ Urgent: Payment Due Tomorrow!',
        body: `Your payment is due in 24 hours! Don't lose your spot. ⚠️`,
      },
      hourly: {
        title: '⏰ Time Running Out!',
        body: `Payment deadline in ${timeRemaining}. Secure your spot now! 🚨`,
      },
      deadline: {
        title: '❌ Payment Deadline Reached!',
        body: `Your spot may be at risk. Complete payment immediately!`,
      },
    };

    const message = messages[type];

    // Send notification via multiple channels
    this.sendNotificationByChannels(
      userId,
      matchId,
      message.title,
      message.body,
      type
    );

    // Update reminder state
    if (type === 'sevenDays' && !reminder.remindersTriggered.sevenDays) {
      reminder.remindersTriggered.sevenDays = true;
    } else if (type === 'threeDays' && !reminder.remindersTriggered.threeDays) {
      reminder.remindersTriggered.threeDays = true;
    } else if (type === 'oneDay' && !reminder.remindersTriggered.oneDay) {
      reminder.remindersTriggered.oneDay = true;
    } else if (type === 'hourly') {
      reminder.remindersTriggered.hourlyTimestamps.push(now);
    }
  }

  /**
   * Send notification through multiple channels
   */
  private sendNotificationByChannels(
    userId: string,
    matchId: string,
    title: string,
    body: string,
    reminderType: string
  ): void {
    try {
      // In-app notification (always)
      notificationService.addNotification({
        userId,
        type: 'payment_reminder',
        title,
        body,
        matchId,
        actionUrl: `/match/${matchId}`,
        timestamp: new Date(),
        read: false,
        reminderType,
      });

      // Push notification (if enabled)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '💰',
            tag: `payment-reminder-${matchId}`,
            requireInteraction: reminderType === 'deadline',
          });
        }
      }

      // Email notification (backend should handle this)
      this.queueEmailReminder(userId, matchId, title, body, reminderType);

      console.log(`[Reminder] ${reminderType.toUpperCase()} sent to ${userId} for match ${matchId}`);
    } catch (error) {
      console.error(`Failed to send reminder: ${error}`);
    }
  }

  /**
   * Queue email reminder for backend processing
   */
  private queueEmailReminder(
    userId: string,
    matchId: string,
    title: string,
    body: string,
    reminderType: string
  ): void {
    // Store in localStorage for backend to pick up
    const queueKey = 'pending_email_reminders';
    const existingQueue = JSON.parse(localStorage.getItem(queueKey) || '[]');

    existingQueue.push({
      userId,
      matchId,
      title,
      body,
      reminderType,
      queuedAt: new Date().toISOString(),
    });

    localStorage.setItem(queueKey, JSON.stringify(existingQueue));
  }

  /**
   * Calculate human-readable time remaining
   */
  private calculateTimeRemaining(deadline: Date): string {
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Get reminder status
   */
  getReminder(matchId: string, userId: string): DeadlineReminder | undefined {
    const reminderId = `reminder_${matchId}_${userId}`;
    return this.reminderMap.get(reminderId);
  }

  /**
   * Cancel all reminders for a match
   */
  cancelReminders(matchId: string, userId: string): void {
    const reminderId = `reminder_${matchId}_${userId}`;
    const intervals = this.activeIntervals.get(reminderId);

    if (intervals) {
      intervals.forEach(interval => {
        clearTimeout(interval);
        clearInterval(interval);
      });
      this.activeIntervals.delete(reminderId);
    }

    this.reminderMap.delete(reminderId);
  }

  /**
   * Get all active reminders
   */
  getAllReminders(): DeadlineReminder[] {
    return Array.from(this.reminderMap.values());
  }
}

export const deadlineReminderService = new DeadlineReminderService();
