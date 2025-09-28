import React, { useState, useEffect } from 'react';
import { Bell, User, Calendar, AlertCircle } from 'lucide-react';
import { apiService } from '../../services/api';
import type { Notification } from '../../services/api';

const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchNotificationsAndCount = async () => {
    try {
      setLoading(true);

      const notificationsResponse = await apiService.getAdminNotifications();

      // Map API response to match Notification type
      const mappedNotifications: Notification[] = notificationsResponse.notifications.map((n: any) => ({
        id: n.notification_id,       // map notification_id → id
        content: n.content,
        created_at: n.created_at,
        is_read: false,              // 👈 default or map if backend provides
        sender: n.sender,
        pet: n.pet,
        report: n.report,
      }));

      setNotifications(mappedNotifications);

      const countResponse = await apiService.getUnreadAdminNotificationCount();
      setUnreadCount(countResponse.unread_count);

      console.log('API Response for count:', countResponse);
      console.log('Unread count state:', countResponse.unread_count);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(notif => !notif.is_read);
    
    // We will mark them as read one by one using the API
    const updatePromises = unreadNotifications.map(notif => 
      apiService.markNotificationAsRead(notif.id)
    );
    
    // Wait for all updates to complete before moving on
    await Promise.all(updatePromises)
      .catch(error => console.error('Error marking notifications as read:', error));
  };

  useEffect(() => {
    fetchNotificationsAndCount();
    
    // When the component mounts, a user is viewing all notifications.
    // So, we should mark them as read and update the count.
    markAllAsRead();
  }, []);

  const getNotificationIcon = (content: string) => {
    if (content.includes('lost')) return <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
    if (content.includes('found')) return <AlertCircle className="w-5 h-5 text-green-500 dark:text-green-400" />;
    if (content.includes('adoption')) return <User className="w-5 h-5 text-light-secondary dark:text-dark-secondary" />;
    return <Bell className="w-5 h-5 text-light-accent dark:text-dark-accent" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-light-accent dark:border-dark-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Count Popups */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-light-text dark:text-dark-secondary">Notifications</h1>
          <p className="text-light-secondary dark:text-dark-neutral mt-2">System notifications and alerts</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-light-accent/10 text-light-accent dark:bg-dark-accent/10 dark:text-dark-accent px-4 py-2 rounded-lg font-medium">
            Total: {notifications.length}
          </div>
          {unreadCount > 0 && (
            <div className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 px-4 py-2 rounded-lg font-medium">
              Unread: {unreadCount}
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`bg-light-neutral rounded-lg shadow p-6 border dark:bg-dark-primary hover:shadow-md transition-shadow 
            ${!notification.is_read ? 'border-l-4 border-light-accent dark:border-dark-accent' : 'border-light-primary dark:border-dark-secondary/20'}`}
          >
            <div className="flex items-start space-x-4" >
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.content)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <p className={`text-light-text dark:text-dark-secondary font-medium ${!notification.is_read ? 'font-bold' : ''}`}>
                    {notification.content}
                  </p>
                  <span className="text-xs text-light-secondary/80 dark:text-dark-neutral/80 flex-shrink-0 ml-4">
                    {new Date(notification.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {notification.sender && (
                  <div className="flex items-center space-x-2 text-sm text-light-secondary dark:text-dark-neutral mb-2">
                    <User className="w-4 h-4" />
                    <span>From: {notification.sender.username}</span>
                  </div>
                )}
                
                <div className="flex items-center space-x-2 text-sm text-light-secondary/80 dark:text-dark-neutral/80">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(notification.created_at).toLocaleString()}</span>
                </div>

                {notification.pet && (
                  <div className="mt-3 p-3 bg-light-primary dark:bg-dark-background rounded-lg">
                    <h4 className="font-medium text-light-text dark:text-dark-secondary mb-1">Related Pet:</h4>
                    <p className="text-sm text-light-secondary dark:text-dark-neutral">
                      {notification.pet.name} –{" "}
                      {typeof notification.pet.pet_type === "string"
                        ? notification.pet.pet_type
                        : notification.pet.pet_type?.type}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length === 0 && (
        <div className="text-center py-12 bg-light-neutral dark:bg-dark-primary rounded-lg">
          <Bell className="w-12 h-12 text-light-secondary/40 dark:text-dark-neutral/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-light-text dark:text-dark-secondary mb-2">No notifications</h3>
          <p className="text-light-secondary dark:text-dark-neutral">System notifications will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;