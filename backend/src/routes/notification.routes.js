import { Router } from "express";
import { verifyJwt } from "../middlewares/authMiddleware.js";
import {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getUnreadCount,
} from "../controllers/notification.controller.js";

const notificationRouter = Router();

// All routes require authentication
notificationRouter.get("/", verifyJwt, getNotifications);
notificationRouter.get("/unread-count", verifyJwt, getUnreadCount);
notificationRouter.patch("/mark-all/read", verifyJwt, markAllAsRead);
notificationRouter.delete("/read/clear", verifyJwt, deleteReadNotifications);
// Parameterized routes come LAST to avoid matching specific paths
notificationRouter.get("/:id", verifyJwt, getNotificationById);
notificationRouter.patch("/:id/read", verifyJwt, markAsRead);
notificationRouter.patch("/:id/unread", verifyJwt, markAsUnread);
notificationRouter.delete("/:id", verifyJwt, deleteNotification);

export default notificationRouter;
