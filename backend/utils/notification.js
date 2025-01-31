import Notification from '../models/notificationModel.js';

export const createNotification = async ({
  recipient,
  message,
  type = 'system',
  store = null,
  recipientModel = 'User'
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      message,
      type,
      store,
      recipientModel
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    throw error;
  }
};

export const getSubscriptionNotificationMessage = (status) => {
  switch (status) {
    case 'subscription.activated':
      return 'Your subscription has been successfully activated.';
    case 'subscription.expired':
      return 'Your subscription has expired.';
    case 'subscription.paused':
      return 'Your subscription has been paused. Some features may be limited.';
    case 'subscription.resumed':
      return 'Your subscription has been resumed. All features are now available.';
    case 'subscription.cancelled':
      return 'Your subscription has been cancelled.';
    default:
      return 'Your subscription status has been updated.';
  }
};