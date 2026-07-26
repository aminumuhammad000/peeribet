import { Expo } from 'expo-server-sdk';
import User from '../models/User';

let expo = new Expo();

export const sendPushNotification = async (userId: string, title: string, body: string, data?: any) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushToken) return;

    if (!Expo.isExpoPushToken(user.pushToken)) {
      console.error(`Push token ${user.pushToken} is not a valid Expo push token`);
      return;
    }

    const messages = [{
      to: user.pushToken,
      sound: 'default' as const,
      title,
      body,
      data: data || {},
    }];

    const chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      try {
        await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error('Error sending chunk', error);
      }
    }
  } catch (error) {
    console.error('Error in sendPushNotification', error);
  }
};
