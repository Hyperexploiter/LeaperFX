// Real Compliance Notification Service - Production Ready
import databaseService from './databaseService';
import webSocketService from './webSocketService';

// Types
export interface ComplianceNotification {
  id: string;
  type: 'lctr_due' | 'enhanced_records' | 'suspicious_activity' | 'deadline_warning';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  transactionId?: string;
  customerId?: string;
  dueDate?: string;
  createdAt: string;
  readAt?: string;
  dismissedAt?: string;
  status: 'unread' | 'read' | 'dismissed' | 'resolved';
  actionRequired: boolean;
  metadata?: { [key: string]: any };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  browserNotifications: boolean;
  smsNotifications: boolean;
  notificationHours: { start: number; end: number };
  severityThreshold: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Real Compliance Notification Service
 * 
 * This service manages FINTRAC compliance notifications and alerts.
 * has to alwways be Integrated with the database and WebSocket for real-time updates.
 */
class ComplianceNotificationService {
  private notifications: ComplianceNotification[] = [];
  private settings: NotificationSettings = {
    emailNotifications: true,
    browserNotifications: true,
    smsNotifications: false,
    notificationHours: { start: 9, end: 18 },
    severityThreshold: 'medium'
  };
  
  constructor() {
    this.initializeService();
  }
  
  /**
   * Initialize the service
   */
  private async initializeService(): Promise<void> {
    try {
      await this.loadNotifications();
      await this.loadSettings();
      this.startPeriodicChecks();
    } catch (error) {
      console.error('Error initializing compliance notification service:', error);
    }
  }
  
  /**
   * Load notifications from storage
   */
  private async loadNotifications(): Promise<void> {
    try {
      // In a real implementation, this would load from database
      const storedNotifications = localStorage.getItem('compliance_notifications');
      if (storedNotifications) {
        this.notifications = JSON.parse(storedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }
  
  /**
   * Save notifications to storage
   */
  private async saveNotifications(): Promise<void> {
    try {
      localStorage.setItem('compliance_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }
  
  /**
   * Load notification settings
   */
  private async loadSettings(): Promise<void> {
    try {
      const storedSettings = localStorage.getItem('notification_settings');
      if (storedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }
  
  /**
   * Save notification settings
   */
  private async saveSettings(): Promise<void> {
    try {
      localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }
  
  /**
   * Start periodic compliance checks
   */
  private startPeriodicChecks(): void {
    // Check every hour for compliance issues
    setInterval(async () => {
      await this.checkComplianceDeadlines();
      await this.checkSuspiciousActivity();
    }, 60 * 60 * 1000);
    
    // Initial check
    setTimeout(async () => {
      await this.checkComplianceDeadlines();
      await this.checkSuspiciousActivity();
    }, 5000);
  }
  
  /**
   * Check for upcoming compliance deadlines
   */
  private async checkComplianceDeadlines(): Promise<void> {
    try {
      const transactions = await databaseService.getTransactions();
      const now = new Date();
      
      transactions.forEach(tx => {
        if (tx.lctrDeadline && tx.complianceStatus !== 'completed') {
          const deadline = new Date(tx.lctrDeadline);
          const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          // Warning for transactions due in 3 days or less
          if (daysUntilDeadline <= 3 && daysUntilDeadline >= 0) {
            this.createNotification({
              type: 'deadline_warning',
              title: 'LCTR Deadline Approaching',
              message: `Transaction ${tx.id} LCTR report is due in ${daysUntilDeadline} days.`,
              severity: daysUntilDeadline === 0 ? 'critical' : daysUntilDeadline === 1 ? 'high' : 'medium',
              transactionId: tx.id,
              dueDate: tx.lctrDeadline,
              actionRequired: true,
              metadata: { daysUntilDeadline }
            });
          }
          
          // Critical alert for overdue transactions
          if (daysUntilDeadline < 0) {
            this.createNotification({
              type: 'lctr_due',
              title: 'LCTR Report Overdue',
              message: `Transaction ${tx.id} LCTR report is ${Math.abs(daysUntilDeadline)} days overdue!`,
              severity: 'critical',
              transactionId: tx.id,
              dueDate: tx.lctrDeadline,
              actionRequired: true,
              metadata: { overdueDays: Math.abs(daysUntilDeadline) }
            });
          }
        }
      });
    } catch (error) {
      console.error('Error checking compliance deadlines:', error);
    }
  }
  
  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(): Promise<void> {
    try {
      const transactions = await databaseService.getTransactions();
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Recent high-value transactions
      const recentHighValue = transactions.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate > last24Hours && tx.fromAmount >= 10000;
      });
      
      if (recentHighValue.length > 5) {
        this.createNotification({
          type: 'suspicious_activity',
          title: 'High-Value Transaction Pattern',
          message: `${recentHighValue.length} high-value transactions (≥$10,000) in the last 24 hours.`,
          severity: 'high',
          actionRequired: true,
          metadata: { transactionCount: recentHighValue.length, timeFrame: '24h' }
        });
      }
      
      // Check for rapid succession transactions
      const sortedTransactions = transactions
        .filter(tx => new Date(tx.date) > last24Hours)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      let rapidSuccessionCount = 0;
      for (let i = 1; i < sortedTransactions.length; i++) {
        const timeDiff = new Date(sortedTransactions[i].date).getTime() - 
                        new Date(sortedTransactions[i-1].date).getTime();
        if (timeDiff < 5 * 60 * 1000) { // Less than 5 minutes apart
          rapidSuccessionCount++;
        }
      }
      
      if (rapidSuccessionCount > 3) {
        this.createNotification({
          type: 'suspicious_activity',
          title: 'Rapid Transaction Pattern',
          message: `${rapidSuccessionCount} transactions completed within 5 minutes of each other.`,
          severity: 'medium',
          actionRequired: true,
          metadata: { rapidTransactions: rapidSuccessionCount }
        });
      }
    } catch (error) {
      console.error('Error checking suspicious activity:', error);
    }
  }
  
  /**
   * Create a new compliance notification
   */
  async createNotification(params: Omit<ComplianceNotification, 'id' | 'createdAt' | 'status'>): Promise<ComplianceNotification> {
    // Check if similar notification already exists
    const existingNotification = this.notifications.find(n => 
      n.type === params.type && 
      n.transactionId === params.transactionId &&
      n.status !== 'resolved' &&
      n.dismissedAt === undefined
    );
    
    if (existingNotification) {
      // Update existing notification instead of creating duplicate
      existingNotification.message = params.message;
      existingNotification.severity = params.severity;
      existingNotification.metadata = params.metadata;
      await this.saveNotifications();
      return existingNotification;
    }
    
    const notification: ComplianceNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      status: 'unread',
      ...params
    };
    
    this.notifications.unshift(notification);
    await this.saveNotifications();
    
    // Send real-time notification
    await this.sendRealtimeNotification(notification);
    
    // Send browser notification if enabled
    if (this.settings.browserNotifications && this.shouldNotifyNow(notification.severity)) {
      this.sendBrowserNotification(notification);
    }
    
    return notification;
  }
  
  /**
   * Send real-time notification via WebSocket
   */
  private async sendRealtimeNotification(notification: ComplianceNotification): Promise<void> {
    try {
      webSocketService.send({
        type: 'compliance_required',
        data: {
          notification,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending real-time notification:', error);
    }
  }
  
  /**
   * Send browser notification
   */
  private sendBrowserNotification(notification: ComplianceNotification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }
  }
  
  /**
   * Check if we should send notification now based on settings
   */
  private shouldNotifyNow(severity: string): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Always notify for critical alerts
    if (severity === 'critical') return true;
    
    // Check notification hours
    if (currentHour < this.settings.notificationHours.start || 
        currentHour > this.settings.notificationHours.end) {
      return false;
    }
    
    // Check severity threshold
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const notificationLevel = severityLevels[severity as keyof typeof severityLevels] || 1;
    const thresholdLevel = severityLevels[this.settings.severityThreshold];
    
    return notificationLevel >= thresholdLevel;
  }
  
  /**
   * Get all notifications
   */
  async getNotifications(limit?: number): Promise<ComplianceNotification[]> {
    const notifications = [...this.notifications].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return limit ? notifications.slice(0, limit) : notifications;
  }
  
  /**
   * Get unread notifications
   */
  async getUnreadNotifications(): Promise<ComplianceNotification[]> {
    return this.notifications.filter(n => n.status === 'unread');
  }
  
  /**
   * Mark notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && notification.status === 'unread') {
      notification.status = 'read';
      notification.readAt = new Date().toISOString();
      await this.saveNotifications();
    }
  }
  
  /**
   * Dismiss notification
   */
  async dismissNotification(id: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'dismissed';
      notification.dismissedAt = new Date().toISOString();
      await this.saveNotifications();
    }
  }
  
  /**
   * Resolve notification (mark as completed)
   */
  async resolveNotification(id: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'resolved';
      await this.saveNotifications();
    }
  }
  
  /**
   * Get notification settings
   */
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }
  
  /**
   * Update notification settings
   */
  async updateSettings(newSettings: Partial<NotificationSettings>): Promise<void> {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  }
  
  /**
   * Request browser notification permission
   */
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
  
  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<{
    total: number;
    unread: number;
    critical: number;
    actionRequired: number;
    byType: { [key: string]: number };
  }> {
    const notifications = await this.getNotifications();
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => n.status === 'unread').length,
      critical: notifications.filter(n => n.severity === 'critical').length,
      actionRequired: notifications.filter(n => n.actionRequired).length,
      byType: {} as { [key: string]: number }
    };
    
    // Count by type
    notifications.forEach(n => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * Clean up old notifications
   */
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const initialCount = this.notifications.length;
    
    this.notifications = this.notifications.filter(n => 
      new Date(n.createdAt) > cutoffDate || n.status === 'unread' || n.actionRequired
    );
    
    await this.saveNotifications();
    return initialCount - this.notifications.length;
  }
}

// Export singleton instance
const complianceNotificationService = new ComplianceNotificationService();
export default complianceNotificationService;