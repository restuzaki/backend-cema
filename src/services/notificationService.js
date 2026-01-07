const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const ROLES = require("../config/roles");

/**
 * Notification Service
 * Handles sending FCM push notifications to users
 */

/**
 * Send notification to all admin users
 * @param {object} notification - { title, body, data }
 * @returns {Promise<object>} Result of notification send
 */
exports.sendNotificationToAdmins = async (notification) => {
  try {
    // Get all admin users with FCM tokens
    const admins = await User.find({
      role: ROLES.ADMIN,
      fcm_token: { $ne: null, $exists: true },
    });

    if (admins.length === 0) {
      console.log("ℹ️ No admin users with FCM tokens found");
      return { success: false, message: "No admin users with FCM tokens" };
    }

    const tokens = admins.map((admin) => admin.fcm_token).filter(Boolean);

    if (tokens.length === 0) {
      console.log("ℹ️ No valid FCM tokens found for admins");
      return { success: false, message: "No valid FCM tokens" };
    }

    // Prepare the message
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      tokens: tokens,
    };

    // Send multicast message to all admin tokens
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(
      `✅ Notification sent to admins: ${response.successCount} successful, ${response.failureCount} failed`
    );

    // Handle failed tokens (remove invalid tokens)
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });

      // Remove invalid tokens from database
      await User.updateMany(
        { fcm_token: { $in: failedTokens } },
        { $set: { fcm_token: null } }
      );

      console.log(`🗑️ Removed ${failedTokens.length} invalid FCM tokens`);
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error("❌ Error sending notification to admins:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to a specific user by ID
 * @param {string} userId - User's MongoDB ObjectId
 * @param {object} notification - { title, body, data }
 * @returns {Promise<object>} Result of notification send
 */
exports.sendNotificationToUser = async (userId, notification) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.fcm_token) {
      console.log(`ℹ️ User ${userId} has no FCM token`);
      return { success: false, message: "User has no FCM token" };
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data || {},
      token: user.fcm_token,
    };

    const response = await admin.messaging().send(message);

    console.log(`✅ Notification sent to user ${userId}:`, response);

    return { success: true, messageId: response };
  } catch (error) {
    console.error(`❌ Error sending notification to user ${userId}:`, error);

    // If token is invalid, remove it
    if (
      error.code === "messaging/invalid-registration-token" ||
      error.code === "messaging/registration-token-not-registered"
    ) {
      await User.findByIdAndUpdate(userId, { $set: { fcm_token: null } });
      console.log(`🗑️ Removed invalid FCM token for user ${userId}`);
    }

    return { success: false, error: error.message };
  }
};

/**
 * Send notification about new project to admins
 * @param {object} project - Project object
 * @returns {Promise<object>} Result of notification send
 */
exports.notifyAdminsNewProject = async (project) => {
  return await exports.sendNotificationToAdmins({
    title: "New Project Created",
    body: `Project "${project.title || project.id}" has been created`,
    data: {
      type: "new_project",
      project_id: project.id,
      project_title: project.title || "",
    },
  });
};

/**
 * Send notification about new task to admins
 * @param {object} task - Task object
 * @param {string} projectId - Project custom ID
 * @returns {Promise<object>} Result of notification send
 */
exports.notifyAdminsNewTask = async (task, projectId) => {
  return await exports.sendNotificationToAdmins({
    title: "New Task Created",
    body: `Task "${task.title || task.id}" has been created`,
    data: {
      type: "new_task",
      task_id: task.id,
      task_title: task.title || "",
      project_id: projectId || "",
    },
  });
};
