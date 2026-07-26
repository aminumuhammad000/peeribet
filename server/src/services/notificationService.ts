import Notification from '../models/Notification';
import { sendPushNotification } from './pushNotificationService';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: 'system' | 'match' | 'wallet' | 'bet'
) => {
  try {
    // 1. Create In-App Notification
    await Notification.create({
      user: userId,
      title,
      message,
      type,
    });

    // 2. Send Push Notification
    await sendPushNotification(userId, title, message, { type });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
