import type { ActionType, PendingAction } from "./types";
import { fetchApi } from "../api/client";
export const processMessage = async (
  text: string,
  conversationId = "default-session",
): Promise<{ text: string; pendingAction?: PendingAction }> => {
  try {
    const data = await fetchApi("/assistant/chat", {
      method: "POST",
      body: JSON.stringify({
        message: text,
        conversationId,
      }),
    });

    let pendingAction: PendingAction | undefined;
    if (data.action) {
      let status: PendingAction["status"] = "pending";
      if (data.status === "immediate_execute") status = "executed";
      if (data.status === "critical_confirmation") status = "critical_pending";
      
      pendingAction = {
        type: data.action.type as ActionType,
        confirmationId: data.action.confirmationId,
        status,
        previewText: data.action.previewText,
        payload: data.action.payload,
        risk: data.action.risk,
        scope: data.action.scope,
      };
    }

    return {
      text: data.message || "No response received.",
      pendingAction,
    };
  } catch (error) {
    console.error("Error calling assistant backend:", error);
    return {
      text: "I couldn't reach the CHISA Assistant backend. Please ensure the server is running.",
    };
  }
};

export const submitConfirmation = async (
  conversationId: string,
  confirmationId: string,
): Promise<{ text: string; data?: any; success: boolean }> => {
  try {
    const data = await fetchApi("/assistant/confirm", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        confirmationId,
      }),
    });
    return {
      text: data.message || "Action processed.",
      success: data.status === "success",
      data: data.data,
    };
  } catch (error) {
    console.error("Error confirming action:", error);
    return {
      text: "I couldn't verify the result of the action with the server.",
      success: false,
    };
  }
};

export const submitToolResult = async (
  conversationId: string,
  confirmationId: string,
  success: boolean,
  message: string,
): Promise<{ text: string }> => {
  try {
    const data = await fetchApi("/assistant/tool-result", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        confirmationId,
        success,
        message,
      }),
    });
    return {
      text: data.message || "Action processed.",
    };
  } catch (error) {
    console.error("Error submitting tool result:", error);
    return {
      text: "I couldn't verify the result of the action with the server.",
    };
  }
};
