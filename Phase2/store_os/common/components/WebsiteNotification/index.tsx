import React, { useState, useEffect } from 'react';
import { Bell, Lock, Clock, AlertTriangle, DollarSign, X, ExternalLink } from 'lucide-react';
import websiteService from '../../services/websiteService';
import webSocketService, { WebSocketEvent } from '../../services/webSocketService';

// Types
interface WebsiteNotificationProps {
  onViewRateLock?: (id: string) => void;
  onViewRateAlert?: (id: string) => void;
}

export interface Notification {
  id: string;
  type: 'rate_lock' | 'rate_alert' | 'website_order';
  title: string;
  message: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read: boolean;
  data?: any;
}

/**
 * WebsiteNotification Component
 * 
 * Displays notifications for website activities such as rate locks and rate alerts.
 */
const WebsiteNotification: React.FC<WebsiteNotificationProps> = ({
  onViewRateLock,
  onViewRateAlert
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Get rate locks
        const rateLocks = await websiteService.getRateLocks();
        const activeRateLocks = rateLocks.filter(lock => lock.status === 'active');
        
        // Get rate alerts
        const rateAlerts = await websiteService.getRateAlerts();
        const activeRateAlerts = rateAlerts.filter(alert => alert.status === 'active');
        
        // Convert to notifications
        const rateLockNotifications = activeRateLocks.map(lock => ({
          id: `notification-${lock.id}`,
          type: 'rate_lock' as const,
          title: 'Rate Lock Active',
          message: `${lock.fromCurrency}/${lock.toCurrency} locked at ${lock.rate} for ${lock.amount} ${lock.fromCurrency}`,
          timestamp: lock.createdAt,
          priority: 'high' as const,
          read: false,
          data: lock
        }));
        
        const rateAlertNotifications = activeRateAlerts.map(alert => ({
          id: `notification-${alert.id}`,
          type: 'rate_alert' as const,
          title: 'Rate Alert Active',
          message: `Alert for ${alert.fromCurrency}/${alert.toCurrency} at ${alert.targetRate}`,
          timestamp: alert.createdAt,
          priority: 'medium' as const,
          read: false,
          data: alert
        }));
        
        // Combine notifications
        const allNotifications = [...rateLockNotifications, ...rateAlertNotifications];
        
        // Sort by timestamp (newest first)
        allNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        setNotifications(allNotifications);
        setUnreadCount(allNotifications.length);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    loadNotifications();
  }, []);
  
  // Listen for WebSocket events
  useEffect(() => {
    const handleWebSocketEvent = (event: WebSocketEvent) => {
      switch (event.type) {
        case 'rate_lock_created':
          addNotification({
            id: `notification-${event.data.id}`,
            type: 'rate_lock',
            title: 'New Rate Lock',
            message: `${event.data.fromCurrency}/${event.data.toCurrency} locked at ${event.data.rate} for ${event.data.amount} ${event.data.fromCurrency}`,
            timestamp: event.timestamp,
            priority: 'high',
            read: false,
            data: event.data
          });
          break;
          
        case 'rate_lock_completed':
          addNotification({
            id: `notification-completed-${event.data.id}`,
            type: 'rate_lock',
            title: 'Rate Lock Completed',
            message: `Rate lock ${event.data.id} has been completed`,
            timestamp: event.timestamp,
            priority: 'medium',
            read: false,
            data: event.data
          });
          break;
          
        case 'rate_lock_expired':
          addNotification({
            id: `notification-expired-${event.data.id}`,
            type: 'rate_lock',
            title: 'Rate Lock Expired',
            message: `Rate lock ${event.data.id} has expired`,
            timestamp: event.timestamp,
            priority: 'medium',
            read: false,
            data: event.data
          });
          break;
          
        case 'rate_alert_set':
          addNotification({
            id: `notification-${event.data.id}`,
            type: 'rate_alert',
            title: 'New Rate Alert',
            message: `Alert set for ${event.data.fromCurrency}/${event.data.toCurrency} at ${event.data.targetRate}`,
            timestamp: event.timestamp,
            priority: 'medium',
            read: false,
            data: event.data
          });
          break;
          
        case 'rate_alert_triggered':
          addNotification({
            id: `notification-triggered-${event.data.id}`,
            type: 'rate_alert',
            title: 'Rate Alert Triggered!',
            message: `${event.data.fromCurrency}/${event.data.toCurrency} has reached ${event.data.targetRate}`,
            timestamp: event.timestamp,
            priority: 'urgent',
            read: false,
            data: event.data
          });
          break;
      }
    };
    
    // Subscribe to WebSocket events
    const unsubscribe = webSocketService.subscribe(handleWebSocketEvent);
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Add a new notification
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };
  
  // Mark a notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      )
    );
    
    // Update unread count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  
  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    setUnreadCount(0);
  };
  
  // Remove a notification
  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      const newNotifications = prev.filter(n => n.id !== id);
      
      // Update unread count if the notification was unread
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      
      return newNotifications;
    });
  };
  
  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id);
    
    // Handle based on type
    if (notification.type === 'rate_lock' && onViewRateLock) {
      onViewRateLock(notification.data.id);
    } else if (notification.type === 'rate_alert' && onViewRateAlert) {
      onViewRateAlert(notification.data.id);
    }
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'rate_lock':
        return <Lock className="h-5 w-5 text-blue-500" />;
      case 'rate_alert':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'website_order':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Get background color based on priority
  const getNotificationBgColor = (notification: Notification) => {
    if (notification.read) {
      return 'bg-gray-50';
    }
    
    switch (notification.priority) {
      case 'urgent':
        return 'bg-red-50';
      case 'high':
        return 'bg-yellow-50';
      case 'medium':
        return 'bg-blue-50';
      case 'low':
        return 'bg-gray-50';
      default:
        return 'bg-gray-50';
    }
  };
  
  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>
      
      {/* Notification Panel */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg overflow-hidden z-50">
          <div className="p-3 bg-gray-100 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-semibold text-gray-700">Notifications</h3>
            <div className="flex space-x-2">
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No notifications</p>
              </div>
            ) : (
              <div>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 ${getNotificationBgColor(notification)} hover:bg-gray-100 transition-colors`}
                  >
                    <div className="flex justify-between items-start">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5 mr-2">
                            {getNotificationIcon(notification)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTimestamp(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="mt-2 flex justify-end space-x-2">
                      {notification.type === 'rate_lock' && (
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Details
                        </button>
                      )}
                      {notification.type === 'rate_alert' && (
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 flex items-center"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View Alert
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 bg-gray-100 border-t border-gray-200 text-center">
            <button
              onClick={() => setShowNotifications(false)}
              className="text-xs text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebsiteNotification;