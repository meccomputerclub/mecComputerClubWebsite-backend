import mongoose, { Types } from "mongoose";
import {
  Notification,
  INotification,
  NotificationType,
  NotificationPriority,
} from "../models/Notification.model";

export interface CreateNotificationParams {
  recipient?: string | Types.ObjectId | null;
  recipientRole?: "all" | "admin" | "moderator" | "executive" | "member";
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  actionLabel?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

/**
 * Dispatch a targeted or broadcast in-app notification.
 */
export const createNotification = async (
  params: CreateNotificationParams
): Promise<INotification> => {
  const notification = new Notification({
    recipient: params.recipient ? new mongoose.Types.ObjectId(params.recipient) : null,
    recipientRole: params.recipientRole || undefined,
    type: params.type,
    title: params.title,
    message: params.message,
    link: params.link || "",
    actionLabel: params.actionLabel || "",
    priority: params.priority || "normal",
    metadata: params.metadata || {},
  });

  return await notification.save();
};

/**
 * Convenience helper to broadcast announcements to all users or targeted roles.
 */
export const createBroadcastNotification = async (
  params: Omit<CreateNotificationParams, "recipient">
): Promise<INotification> => {
  return await createNotification({
    ...params,
    recipient: null,
    recipientRole: params.recipientRole || "all",
  });
};

/**
 * Fetch notifications tailored to a specific authenticated user.
 */
export const getUserNotifications = async (
  userId: string,
  userRole?: string,
  options: {
    filter?: "all" | "unread" | "important";
    limit?: number;
    page?: number;
  } = {}
) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const limit = Math.min(options.limit || 30, 100);
  const page = Math.max(options.page || 1, 1);
  const skip = (page - 1) * limit;

  // Derive roles matching this user
  const matchingRoles: string[] = ["all"];
  if (userRole) {
    matchingRoles.push(userRole);
    if (userRole === "admin" || userRole === "moderator") {
      matchingRoles.push("executive");
    }
  }

  // Base query: either sent to this user directly OR broadcast to their matching roles,
  // excluding anything dismissed by this user.
  const query: any = {
    dismissedBy: { $ne: userObjectId },
    $or: [
      { recipient: userObjectId },
      { recipientRole: { $in: matchingRoles } },
    ],
  };

  // Fetch items sorted by newest first
  const rawItems = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  // Transform items with personalized read status
  const items = rawItems.map((item: any) => {
    let isItemRead = false;
    if (item.recipient && item.recipient.toString() === userId) {
      isItemRead = !!item.isRead;
    } else if (Array.isArray(item.readBy)) {
      isItemRead = item.readBy.some(
        (rb: any) => rb.userId?.toString() === userId
      );
    }

    return {
      _id: item._id,
      id: item._id.toString(),
      type: item.type,
      title: item.title,
      message: item.message,
      link: item.link,
      actionLabel: item.actionLabel,
      priority: item.priority,
      createdAt: item.createdAt,
      isRead: isItemRead,
      read: isItemRead,
      metadata: item.metadata,
    };
  });

  // Apply in-memory filter if requested
  let filteredItems = items;
  if (options.filter === "unread") {
    filteredItems = items.filter((n) => !n.isRead);
  } else if (options.filter === "important") {
    filteredItems = items.filter(
      (n) => n.priority === "high" || n.priority === "urgent"
    );
  }

  // Calculate total unread count for badge
  // Query all active non-dismissed notifications to count unread
  const allActiveForUser = await Notification.find(query)
    .select("recipient isRead readBy")
    .lean();

  const totalUnreadCount = allActiveForUser.filter((item: any) => {
    if (item.recipient && item.recipient.toString() === userId) {
      return !item.isRead;
    }
    if (Array.isArray(item.readBy)) {
      return !item.readBy.some((rb: any) => rb.userId?.toString() === userId);
    }
    return true;
  }).length;

  return {
    items: filteredItems,
    unreadCount: totalUnreadCount,
    total: allActiveForUser.length,
    page,
    limit,
  };
};

/**
 * Mark a single notification as read by a specific user.
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  const notif = await Notification.findById(notificationId);
  if (!notif) return null;

  const userObjectId = new mongoose.Types.ObjectId(userId);

  if (notif.recipient && notif.recipient.toString() === userId) {
    notif.isRead = true;
    notif.readAt = new Date();
  } else {
    // Broadcast notification
    const alreadyRead = notif.readBy.some(
      (r: any) => r.userId.toString() === userId
    );
    if (!alreadyRead) {
      notif.readBy.push({
        userId: userObjectId,
        readAt: new Date(),
      });
    }
  }

  await notif.save();
  return notif;
};

/**
 * Mark all active notifications as read for a given user.
 */
export const markAllNotificationsAsRead = async (
  userId: string,
  userRole?: string
) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // 1. Mark all personal direct notifications as read
  await Notification.updateMany(
    { recipient: userObjectId, isRead: false },
    { $set: { isRead: true, readAt: now } }
  );

  // 2. Add userId to readBy for broadcast notifications matching user's role
  const matchingRoles: string[] = ["all"];
  if (userRole) {
    matchingRoles.push(userRole);
    if (userRole === "admin" || userRole === "moderator") {
      matchingRoles.push("executive");
    }
  }

  await Notification.updateMany(
    {
      recipient: null,
      recipientRole: { $in: matchingRoles },
      "readBy.userId": { $ne: userObjectId },
      dismissedBy: { $ne: userObjectId },
    },
    {
      $push: {
        readBy: {
          userId: userObjectId,
          readAt: now,
        },
      },
    }
  );

  return true;
};

/**
 * Dismiss a single notification so it no longer appears for this user.
 */
export const dismissNotification = async (
  notificationId: string,
  userId: string
) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  await Notification.findByIdAndUpdate(notificationId, {
    $addToSet: { dismissedBy: userObjectId },
  });
  return true;
};

/**
 * Dismiss all active notifications for this user.
 */
export const clearAllNotifications = async (
  userId: string,
  userRole?: string
) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const matchingRoles: string[] = ["all"];
  if (userRole) {
    matchingRoles.push(userRole);
    if (userRole === "admin" || userRole === "moderator") {
      matchingRoles.push("executive");
    }
  }

  await Notification.updateMany(
    {
      $or: [
        { recipient: userObjectId },
        { recipientRole: { $in: matchingRoles } },
      ],
      dismissedBy: { $ne: userObjectId },
    },
    {
      $addToSet: { dismissedBy: userObjectId },
    }
  );

  return true;
};
