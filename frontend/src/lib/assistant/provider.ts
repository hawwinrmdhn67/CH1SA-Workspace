import type { ActionType, PendingAction } from "./types";
import { API_BASE_URL } from "../api/client";

async function fetchStream(
  endpoint: string,
  body: any,
  onChunk?: (chunk: string) => void
): Promise<any> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    body: JSON.stringify(body),
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let finalResponse: any = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const dataStr = line.replace("data: ", "").trim();
        if (dataStr === "[DONE]" || !dataStr) continue;

        try {
          const data = JSON.parse(dataStr);
          if (data.type === "chunk" && data.text) {
            fullText += data.text;
            if (onChunk) onChunk(data.text);
          } else if (data.type === "final") {
            finalResponse = data.response;
          } else if (data.type === "error") {
            throw new Error(data.error);
          }
        } catch (e) {
          // ignore parse errors for partial chunks
        }
      }
    }
  }

  return finalResponse || { message: fullText };
}

export const processMessage = async (
  text: string,
  conversationId = "default-session",
  onChunk?: (chunk: string) => void
): Promise<{ text: string; pendingAction?: PendingAction }> => {
  try {
    const data = await fetchStream("/assistant/chat", {
      message: text,
      conversationId,
    }, onChunk);

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
  onChunk?: (chunk: string) => void
): Promise<{ text: string; data?: any; success: boolean }> => {
  try {
    const data = await fetchStream("/assistant/confirm", {
      conversationId,
      confirmationId,
    }, onChunk);
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
  onChunk?: (chunk: string) => void
): Promise<{ text: string }> => {
  try {
    const data = await fetchStream("/assistant/tool-result", {
      conversationId,
      confirmationId,
      success,
      message,
    }, onChunk);
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
