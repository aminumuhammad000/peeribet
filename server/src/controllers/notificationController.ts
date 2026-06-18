import { Request, Response } from 'express';
import Notification from '../models/Notification';

const DEMO_NOTIFICATIONS = [
  { title: 'Welcome to Peeribet! 🎉', message: 'Your account is verified. Start exploring matches and place your first trade today.', type: 'system' },
  { title: 'Match Starting Soon ⚡', message: 'Chelsea vs Arsenal kicks off in 1 hour. The pool is currently at ₦85,000.', type: 'match' },
  { title: 'Deposit Successful 💰', message: 'Your wallet has been credited with ₦5,000 via virtual account transfer.', type: 'wallet' },
  { title: 'Bet Placed Successfully ✅', message: 'Your bet of ₦500 on Chelsea (Long) has been placed for the Match Outcome market.', type: 'bet' },
  { title: 'Password Changed 🔒', message: 'Your account password was changed successfully. If this wasn\'t you, contact support immediately.', type: 'system' },
];

// ─── Get All Notifications for Logged-in User ─────────────────────────────────
// @route  GET /api/notifications
export const getNotifications = async (req: any, res: Response) => {
  try {
    // Auto-seed demo notifications for users who have none
    const existing = await Notification.countDocuments({ user: req.user._id });
    if (existing === 0) {
      const now = Date.now();
      await Notification.insertMany(
        DEMO_NOTIFICATIONS.map((n, i) => ({
          ...n,
          user: req.user._id,
          isRead: false,
          createdAt: new Date(now - i * 60 * 60 * 1000), // stagger by 1 hour each
        }))
      );
    }

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
