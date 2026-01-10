const admin = require("../config/firebaseAdmin");
const User = require("../models/User");
const ROLES = require("../config/roles");

// Not needed
exports.sendNotificationToAdmins = async (notification) => {
  try {
    // Get all admin users with FCM tokens
    const admins = await User.find({
      role: ROLES.ADMIN,
      fcm_token: { $ne: null, $exists: true },
    });

    if (admins.length === 0) {
      console.log("No admin users with FCM tokens found");
      return { success: false, message: "No admin users with FCM tokens" };
    }

    const tokens = admins.map((admin) => admin.fcm_token).filter(Boolean);

    if (tokens.length === 0) {
      console.log("No valid FCM tokens found for admins");
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
exports.notifyUser = async (userId, notification) => {
  try {
    const user = await User.findById(userId);

    if (!user || !user.fcm_token) {
      console.log(`ℹ️ User ${userId} has no FCM token`);
      return { success: false, message: "User has no FCM token" };
    }

    console.log(user.fcm_token);

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

exports.notifyNewProjects = async (project) => {
  console.log(project.manager_id);
  return await exports.notifyUser(project.manager_id, {
    title: "New Project Created",
    body: `Project "${project.name || project.id}" has been created`,
    data: {
      type: "new_project",
      project_id: project.id,
      project_title: project.name || "",
    },
  });
};
exports.notifyAdminsNewTask = async (task, projectId) => {
  return await exports.notifyUser(task.manager_id, {
    title: "New Task Created",
    body: `Task "${task.name || task.id}" has been created`,
    data: {
      type: "new_task",
      task_id: task.id,
      task_title: task.name || "",
      project_id: projectId || "",
    },
  });
};

/**
 * Send notification to project manager when project is updated
 */
exports.sendProjectUpdateNotification = async (
  managerId,
  project,
  updatedFields
) => {
  try {
    const fieldsText = updatedFields.join(", ");

    const notification = {
      title: "📝 Project Updated",
      body: `"${
        project.name || project.title
      }" has been updated. Changes: ${fieldsText}`,
      data: {
        type: "project_update",
        project_id: project.id || project._id?.toString(),
        project_title: project.name || project.title || "",
        updated_fields: updatedFields.join(","),
        timestamp: new Date().toISOString(),
      },
    };

    // Use your existing sendNotificationToUser function
    const result = await exports.sendNotificationToUser(
      managerId,
      notification
    );

    if (result.success) {
      console.log(
        `✅ Project update notification sent to manager ${managerId}`
      );
    } else {
      console.log(
        `ℹ️ Could not send project update notification: ${result.message}`
      );
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending project update notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send approval request to project manager
 */
exports.sendUpdateApprovalRequest = async (
  managerId,
  project,
  pendingUpdate,
  changedFields
) => {
  try {
    const fieldsText = changedFields.join(", ");

    const notification = {
      title: "✏️ Project Update Pending Approval",
      body: `${
        project.name || project.title
      } has changes waiting for your approval. Changes: ${fieldsText}`,
      data: {
        type: "update_approval_request",
        project_id: project._id.toString(),
        update_id: pendingUpdate._id.toString(),
        project_name: project.name || project.title || "",
        changed_fields: fieldsText,
        action_required: "true",
        timestamp: new Date().toISOString(),
      },
    };
    const result = await exports.sendNotificationToUser(
      managerId,
      notification
    );

    if (result.success) {
      console.log(`✅ Approval request sent to manager ${managerId}`);
    } else {
      console.log(`ℹ️ Could not send approval request: ${result.message}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending approval request:", error);
    return { success: false, error: error.message };
  }
};
/**
 * Notify user that their update was approved
 */
exports.sendUpdateApproved = async (userId, project) => {
  try {
    const notification = {
      title: "✅ Update Approved",
      body: `Your changes to "${
        project.name || project.title
      }" have been approved and applied!`,
      data: {
        type: "update_approved",
        project_id: project._id.toString(),
        project_name: project.name || project.title || "",
        timestamp: new Date().toISOString(),
      },
    };
    const result = await exports.sendNotificationToUser(userId, notification);

    if (result.success) {
      console.log(`✅ Approval notification sent to user ${userId}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending approval notification:", error);
    return { success: false, error: error.message };
  }
};
/**
 * Notify user that their update was rejected
 */
exports.sendUpdateRejected = async (userId, project) => {
  try {
    const notification = {
      title: "❌ Update Rejected",
      body: `Your proposed changes to "${
        project.name || project.title
      }" were not approved.`,
      data: {
        type: "update_rejected",
        project_id: project._id.toString(),
        project_name: project.name || project.title || "",
        timestamp: new Date().toISOString(),
      },
    };
    const result = await exports.sendNotificationToUser(userId, notification);

    if (result.success) {
      console.log(`✅ Rejection notification sent to user ${userId}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending rejection notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify assigned staff members about new task
 * @param {Object} task - The task object
 * @param {Array} assignedUserIds - Array of user IDs assigned to the task
 * @param {String} projectId - Project custom ID for context
 * @returns {Promise<Array>} Array of notification results
 */
exports.notifyTaskAssignment = async (task, assignedUserIds, projectId) => {
  if (!assignedUserIds || assignedUserIds.length === 0) {
    console.log("ℹ️ No staff assigned to task");
    return { success: false, message: "No staff assigned to task" };
  }

  const results = [];

  for (const userId of assignedUserIds) {
    try {
      console.log(`Sending task assignment notification to user: ${userId}`);
      const result = await exports.notifyUser(userId, {
        title: "📋 New Task Assigned",
        body: `You've been assigned: "${task.title}"`,
        data: {
          type: "task_assignment",
          task_id: task.id,
          task_title: task.title,
          project_id: projectId || "",
          timestamp: new Date().toISOString(),
        },
      });
      results.push(result);
    } catch (error) {
      console.error(`❌ Failed to notify user ${userId}:`, error);
      results.push({ success: false, error: error.message, userId });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `✅ Task assignment notifications: ${successCount}/${results.length} sent successfully`
  );

  return results;
};

/**
 * Notify PM when task is completed and needs approval
 * @param {Object} task - The task object
 * @param {String} managerId - Manager's user ID
 * @param {String} projectName - Project name for context
 * @returns {Promise<Object>} Notification result
 */
exports.notifyTaskCompletion = async (task, managerId, projectName) => {
  try {
    console.log(`Sending task completion notification to PM: ${managerId}`);

    const result = await exports.notifyUser(managerId, {
      title: "✅ Task Completed - Awaiting Approval",
      body: `"${task.title}" in ${projectName} is ready for review`,
      data: {
        type: "task_completion",
        task_id: task.id,
        task_title: task.title,
        project_name: projectName,
        action_required: "true",
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      console.log(`✅ Task completion notification sent to PM ${managerId}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending task completion notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify PM when staff submits expense for approval
 * @param {Object} expense - The expense object
 * @param {String} managerId - Manager's user ID
 * @param {String} projectName - Project name for context
 * @returns {Promise<Object>} Notification result
 */
exports.notifyExpenseSubmission = async (expense, managerId, projectName) => {
  try {
    console.log(`Sending expense submission notification to PM: ${managerId}`);

    const result = await exports.notifyUser(managerId, {
      title: "💰 Expense Awaiting Approval",
      body: `"${expense.title}" (${
        expense.currency
      } ${expense.amount.toLocaleString()}) in ${projectName} needs approval`,
      data: {
        type: "expense_submission",
        expense_id: expense.id,
        expense_title: expense.title,
        expense_amount: expense.amount.toString(),
        expense_currency: expense.currency,
        project_name: projectName,
        action_required: "true",
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      console.log(`✅ Expense submission notification sent to PM ${managerId}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending expense submission notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify staff when PM approves their expense
 * @param {Object} expense - The expense object
 * @param {String} staffId - Staff user ID who submitted the expense
 * @param {String} projectName - Project name for context
 * @returns {Promise<Object>} Notification result
 */
exports.notifyExpenseApproval = async (expense, staffId, projectName) => {
  try {
    console.log(`Sending expense approval notification to staff: ${staffId}`);

    const result = await exports.notifyUser(staffId, {
      title: "✅ Expense Approved",
      body: `Your expense "${expense.title}" (${
        expense.currency
      } ${expense.amount.toLocaleString()}) in ${projectName} has been approved`,
      data: {
        type: "expense_approved",
        expense_id: expense.id,
        expense_title: expense.title,
        expense_amount: expense.amount.toString(),
        expense_currency: expense.currency,
        project_name: projectName,
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      console.log(`✅ Expense approval notification sent to staff ${staffId}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending expense approval notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Notify staff when PM rejects their expense
 * @param {Object} expense - The expense object
 * @param {String} staffId - Staff user ID who submitted the expense
 * @param {String} projectName - Project name for context
 * @returns {Promise<Object>} Notification result
 */
exports.notifyExpenseRejection = async (expense, staffId, projectName) => {
  try {
    console.log(`Sending expense rejection notification to staff: ${staffId}`);

    const result = await exports.notifyUser(staffId, {
      title: "❌ Expense Rejected",
      body: `Your expense "${
        expense.title
      }" in ${projectName} was not approved. Reason: ${
        expense.rejection_note || "No reason provided"
      }`,
      data: {
        type: "expense_rejected",
        expense_id: expense.id,
        expense_title: expense.title,
        expense_amount: expense.amount.toString(),
        expense_currency: expense.currency,
        project_name: projectName,
        rejection_note: expense.rejection_note || "",
        timestamp: new Date().toISOString(),
      },
    });

    if (result.success) {
      console.log(`✅ Expense rejection notification sent to staff ${staffId}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error sending expense rejection notification:", error);
    return { success: false, error: error.message };
  }
};
