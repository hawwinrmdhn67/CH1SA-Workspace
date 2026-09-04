import { create } from "zustand";

import type { AssistantMessage, PendingAction, ToolResult } from "@/lib/assistant/types";

interface AssistantState {
  messages: AssistantMessage[];
  isTyping: boolean;
  addMessage: (msg: Omit<AssistantMessage, "id" | "createdAt">) => string;
  updateMessageAction: (id: string, status: PendingAction["status"]) => void;
  setTyping: (typing: boolean) => void;
  clearHistory: () => void;
}

export const useAssistant = create<AssistantState>((set) => ({
  messages: [
    {
      id: "init",
      role: "assistant",
      content:
        "Hello! I am CHISA Assistant. I can help you manage your tasks, events, notes, and files. How can I help you today?",
      createdAt: Date.now(),
    },
  ],
  isTyping: false,
  addMessage: (msg) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const fullMsg: AssistantMessage = {
      ...msg,
      id,
      createdAt: Date.now(),
    };
    set((state) => ({ messages: [...state.messages, fullMsg] }));
    return id;
  },
  updateMessageAction: (id, status) => {
    set((state) => ({
      messages: state.messages.map((m) => {
        if (m.id === id && m.pendingAction) {
          return {
            ...m,
            pendingAction: { ...m.pendingAction, status },
          };
        }
        return m;
      }),
    }));
  },
  setTyping: (typing) => set({ isTyping: typing }),
  clearHistory: () =>
    set({
      messages: [
        {
          id: "init",
          role: "assistant",
          content:
            "Hello! I am CHISA Assistant. I can help you manage your tasks, events, notes, and files. How can I help you today?",
          createdAt: Date.now(),
        },
      ],
    }),
}));
