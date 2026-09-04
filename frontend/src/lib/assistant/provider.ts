import type { ActionType, PendingAction } from "./types";

const BACKEND_URL = process.env.NEXT_PUBLIC_ASSISTANT_BACKEND_URL || "http://localhost:8080/api/assistant";

export const processMessage = async (
  text: string,
  conversationId = "default-session",
): Promise<{ text: string; pendingAction?: PendingAction }> => {
  try {
    const res = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: text,
        conversationId,
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned status ${res.status}`);
    }

    const data = await res.json();

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
    const res = await fetch(`${BACKEND_URL}/confirm`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
        confirmationId,
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned status ${res.status}`);
    }

    const data = await res.json();
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
    const res = await fetch(`${BACKEND_URL}/tool-result`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId,
        confirmationId,
        success,
        message,
      }),
    });

    if (!res.ok) {
      throw new Error(`Backend returned status ${res.status}`);
    }

    const data = await res.json();
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
