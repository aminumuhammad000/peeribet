import { Request, Response } from 'express';
import Notification from '../models/Notification';

// ─── Get All Notifications for Logged-in User ─────────────────────────────────
// @route  GET /api/notifications
export const getNotifications = async (req: any, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Mark a Notification as Read ──────────────────────────────────────────────
// @route  PATCH /api/notifications/:id/read
export const markAsRead = async (req: any, res: Response) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true }
    );
    res.json({ message: 'Notification marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Mark All Notifications as Read ───────────────────────────────────────────
// @route  PATCH /api/notifications/read-all
export const markAllAsRead = async (req: any, res: Response) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Delete a Notification ────────────────────────────────────────────────────
// @route  DELETE /api/notifications/:id
export const deleteNotification = async (req: any, res: Response) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Notification deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
