import Notification from "../models/notification.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── Get notifications for the logged-in user ────────────────────
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const filter = req.query.filter || "all"; // "all", "unread", or type filter

  const skip = (page - 1) * limit;

  const query = { recipient: userId };
  if (filter === "unread") {
    query.read = false;
  } else if (filter !== "all") {
    query.type = filter;
  }

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("sender", "fullName email profilePhoto role")
      .lean(),
    Notification.countDocuments(query),
    Notification.countDocuments({ recipient: userId, read: false }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    }, "Notifications fetched successfully")
  );
});

// ─── Get a single notification by ID ─────────────────────────────
export const getNotificationById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOne({
    _id: id,
    recipient: userId,
  }).populate("sender", "fullName email profilePhoto role");

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res.status(200).json(
    new ApiResponse(200, notification, "Notification fetched successfully")
  );
});

// ─── Mark a single notification as read ──────────────────────────
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { read: true, readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return res.status(200).json(
    new ApiResponse(200, { notification, unreadCount }, "Marked as read")
  );
});

// ─── Mark a single notification as unread ────────────────────────
export const markAsUnread = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, recipient: userId },
    { read: false, readAt: null },
    { new: true }
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return res.status(200).json(
    new ApiResponse(200, { notification, unreadCount }, "Marked as unread")
  );
});

// ─── Mark all notifications as read ──────────────────────────────
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Notification.updateMany(
    { recipient: userId, read: false },
    { read: true, readAt: new Date() }
  );

  return res.status(200).json(
    new ApiResponse(200, null, "All notifications marked as read")
  );
});

// ─── Delete a single notification ────────────────────────────────
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    recipient: userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return res.status(200).json(
    new ApiResponse(200, { unreadCount }, "Notification deleted")
  );
});

// ─── Delete all read notifications ───────────────────────────────
export const deleteReadNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  await Notification.deleteMany({
    recipient: userId,
    read: true,
  });

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return res.status(200).json(
    new ApiResponse(200, { unreadCount }, "Read notifications deleted")
  );
});

// ─── Get unread count ────────────────────────────────────────────
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false,
  });

  return res.status(200).json(
    new ApiResponse(200, { unreadCount }, "Unread count fetched")
  );
});

// ─── Internal helper: create a notification and emit via socket ──
// This is NOT a route handler — it's called from other controllers/services
export const createAndEmitNotification = async ({
  io,
  recipientId,
  senderId = null,
  type = "system",
  title,
  message,
  details = null,
  link = null,
  relatedEntity = null,
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      title,
      message,
      details,
      link,
      relatedEntity,
    });

    // Populate sender for the real-time payload
    const populated = await notification.populate(
      "sender",
      "fullName email profilePhoto role"
    );

    // Emit to the recipient's personal room
    if (io) {
      io.to(`user_${recipientId}`).emit("new_notification", populated);
      // Also emit unread count update
      const unreadCount = await Notification.countDocuments({
        recipient: recipientId,
        read: false,
      });
      io.to(`user_${recipientId}`).emit("unread_count", { unreadCount });
    }

    return populated;
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
};
