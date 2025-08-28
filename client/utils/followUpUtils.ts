import { apiClient } from "@/lib/api";

export interface FollowUpStatusChangeData {
  followUpId: number;
  newStatus: string;
  stepId?: number;
  userId: number;
  userName: string;
  followUpTitle?: string;
  isVC?: boolean;
}

/**
 * Creates a system chat message when a follow-up status changes
 */
export async function notifyFollowUpStatusChange(
  data: FollowUpStatusChangeData,
) {
  const {
    followUpId,
    newStatus,
    stepId,
    userId,
    userName,
    followUpTitle,
    isVC,
  } = data;

  console.log("Follow-up notification data:", data);

  if (!stepId) {
    console.warn("No step ID provided for follow-up status notification");
    return;
  }

  let message = "";
  let messageType: "system" | "text" = "system";

  switch (newStatus) {
    case "completed":
      message = `✅ Follow-up task completed: "${followUpTitle || `Follow-up #${followUpId}`}" by ${userName}`;
      break;
    case "in_progress":
      message = `🔄 Follow-up task started: "${followUpTitle || `Follow-up #${followUpId}`}" by ${userName}`;
      break;
    case "overdue":
      message = `⚠️ Follow-up task overdue: "${followUpTitle || `Follow-up #${followUpId}`}"`;
      break;
    default:
      message = `📋 Follow-up task status changed to "${newStatus}": "${followUpTitle || `Follow-up #${followUpId}`}" by ${userName}`;
      break;
  }

  const chatData = {
    user_id: userId,
    user_name: userName,
    message: message,
    message_type: messageType,
    is_rich_text: false,
  };

  try {
    console.log(
      "Creating chat notification for step:",
      stepId,
      "with data:",
      chatData,
    );
    // Create the system message in the step's chat (VC or Lead)
    const endpoint = isVC
      ? `/api/vc/steps/${stepId}/chats`
      : `/api/leads/steps/${stepId}/chats`;

    console.log(`Using ${isVC ? "VC" : "Lead"} endpoint:`, endpoint);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chatData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
      );
      throw new Error(
        `Failed to create follow-up status notification: ${response.statusText}`,
      );
    }

    const result = await response.json();
    console.log(
      `Follow-up status notification added to step ${stepId}:`,
      result,
    );
    return result;
  } catch (error) {
    console.error("Failed to create follow-up status notification:", error);
    // Don't re-throw the error - we don't want to break the status update if notification fails
    return null;
  }
}

/**
 * Enhanced follow-up status update that includes chat notification
 */
export async function updateFollowUpStatusWithNotification(
  followUpId: number,
  statusData: { status: string; completed_at?: string | null },
  notificationData: Omit<FollowUpStatusChangeData, "followUpId" | "newStatus">,
) {
  try {
    // Update the follow-up status
    const updateResponse = await apiClient.updateFollowUpStatus(
      followUpId,
      statusData,
    );

    // Create chat notification for status change
    if (notificationData.stepId) {
      await notifyFollowUpStatusChange({
        followUpId,
        newStatus: statusData.status,
        ...notificationData,
      });
    }

    return updateResponse;
  } catch (error) {
    console.error(
      "Failed to update follow-up status with notification:",
      error,
    );
    throw error;
  }
}
