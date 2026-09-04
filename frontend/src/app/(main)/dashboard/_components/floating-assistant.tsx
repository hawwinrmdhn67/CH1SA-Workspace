"use client";

import * as React from "react";

import { Check, Send, Sparkles, User, X, AlertTriangle, Maximize, Minimize } from "lucide-react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDraggable } from "@/hooks/use-draggable";
import { processMessage } from "@/lib/assistant/provider";
import { executeTool } from "@/lib/assistant/tools";
import type { PendingAction } from "@/lib/assistant/types";
import { cn } from "@/lib/utils";
import { useAssistant } from "@/stores/use-assistant";

function scrollToBottom(force = false) {
  const container = document.getElementById("assistant-scroll-container");
  if (container) {
    if (force) {
      container.scrollTop = container.scrollHeight;
      return;
    }
    // Use a large threshold (500px) to allow for sudden height jumps (like when a code block renders)
    // while still letting the user stop auto-scroll if they intentionally scroll way up.
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 500;
    if (isNearBottom) {
      container.scrollTop = container.scrollHeight;
    }
  }
}

const markdownComponents = {
  p: ({ node, ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-1" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-1" {...props} />
  ),
  li: ({ node, ...props }: any) => <li className="" {...props} />,
  table: ({ node, ...props }: any) => (
    <div className="my-3 w-full overflow-x-auto rounded-md border border-border/50">
      <table className="w-full text-sm text-left border-collapse" {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <thead className="bg-muted/50 text-muted-foreground text-xs uppercase" {...props} />,
  tbody: ({ node, ...props }: any) => <tbody className="divide-y divide-border/50" {...props} />,
  tr: ({ node, ...props }: any) => <tr className="hover:bg-muted/30 transition-colors" {...props} />,
  th: ({ node, ...props }: any) => <th className="px-3 py-2 font-medium border-b border-border/50" {...props} />,
  td: ({ node, ...props }: any) => <td className="px-3 py-2" {...props} />,
  code: ({ node, inline, ...props }: any) =>
    inline ? (
      <code
        className="bg-muted-foreground/15 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono"
        {...props}
      />
    ) : (
      <pre className="bg-muted-foreground/10 p-3 rounded-md overflow-x-auto text-[0.85em] font-mono mb-2 border border-border/50">
        <code {...props} />
      </pre>
    ),
  a: ({ node, ...props }: any) => {
    const isSafe = props.href && !props.href.trim().toLowerCase().startsWith("javascript:");
    return isSafe ? (
      <a
        className="underline underline-offset-2 text-primary hover:text-primary/80 transition-colors"
        target="_blank"
        rel="noopener noreferrer"
        {...props}
      />
    ) : (
      <span className="text-destructive underline">{props.children}</span>
    );
  },
  strong: ({ node, ...props }: any) => (
    <strong className="font-semibold text-foreground" {...props} />
  ),
};

// A wrapper to give real AI responses a fast typewriter effect when they first appear
function TypewriterMarkdown({ 
  content, 
  createdAt,
  isInit 
}: { 
  content: string; 
  createdAt: number;
  isInit?: boolean;
}) {
  const [length, setLength] = React.useState(0);
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  
  // Only animate if it's a freshly created message (within the last 2 seconds) and not reduced motion
  const isOld = Date.now() - createdAt > 2000;
  const shouldAnimate = !prefersReducedMotion && !isOld && !isInit;

  React.useEffect(() => {
    if (!shouldAnimate) {
      setLength(content.length);
      return;
    }
    
    const interval = setInterval(() => {
      setLength((prev) => {
        if (prev >= content.length) {
          clearInterval(interval);
          return content.length;
        }
        return prev + 3; // Moderately fast appearance
      });
      scrollToBottom(true);
    }, 10);
    return () => clearInterval(interval);
  }, [content, shouldAnimate]);

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]} 
      rehypePlugins={[rehypeRaw]}
      components={markdownComponents}
    >
      {shouldAnimate ? content.substring(0, length) : content}
    </ReactMarkdown>
  );
}

export function FloatingAssistant() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { messages, isTyping, addMessage, updateMessageAction, setTyping } = useAssistant();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [input, setInput] = React.useState("");
  
  const animatedGreetingTimeRef = React.useRef<number | null>(null);
  const [initialGreetingState, setInitialGreetingState] = React.useState<"typing" | "typewriter" | "done">("done");
  const [typewriterLength, setTypewriterLength] = React.useState(0);

  const avatarSize = 56;
  const { position, isInitialized, isDragging, handlers } = useDraggable({
    onClick: () => setIsOpen((prev) => !prev),
    clickThreshold: 5,
    itemSize: avatarSize,
  });

  // Calculate popover origin based on avatar position relative to screen center
  const [popupStyle, setPopupStyle] = React.useState<React.CSSProperties>({});

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const isRightHalf = position.x > window.innerWidth / 2;
      const isBottomHalf = position.y > window.innerHeight / 2;

      setPopupStyle({
        position: "absolute",
        ...(isRightHalf ? { right: 0 } : { left: 0 }),
        ...(isBottomHalf ? { bottom: avatarSize + 12 } : { top: avatarSize + 12 }),
      });
    }
  }, [position, avatarSize]);

  React.useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  // Handle escape key and outside clicks
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (isExpanded) {
          setIsExpanded(false);
        } else {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isExpanded]);

  // Body scroll lock
  React.useEffect(() => {
    if (isOpen && isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen, isExpanded]);

  // Initial greeting animation logic
  React.useEffect(() => {
    if (isOpen) {
      const initMsg = messages.find((m) => m.id === "init");
      if (initMsg && initMsg.createdAt !== animatedGreetingTimeRef.current) {
        animatedGreetingTimeRef.current = initMsg.createdAt;
        
        const prefersReducedMotion = 
          typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        
        if (prefersReducedMotion) {
           setInitialGreetingState("done");
           return;
        }

        setInitialGreetingState("typing");
        const timer = setTimeout(() => {
          setInitialGreetingState("typewriter");
          setTypewriterLength(0);
        }, 400); // Reduced delay for better UX
        
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, messages]); // Do not put the ref in dependencies

  React.useEffect(() => {
    if (initialGreetingState === "typewriter") {
      const initMsg = messages.find((m) => m.id === "init");
      if (!initMsg) return;
      
      const textLen = initMsg.content.length;
      
      const interval = setInterval(() => {
        setTypewriterLength((prev) => {
          if (prev >= textLen) {
            clearInterval(interval);
            setInitialGreetingState("done");
            return textLen;
          }
          return prev + 3; // Moderately fast appearance
        });
        scrollToBottom(true);
      }, 10);
      
      return () => clearInterval(interval);
    }
  }, [initialGreetingState, messages.length]); // Use messages.length so content changes don't interrupt it

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput("");
    addMessage({ role: "user", content: userText });
    setTyping(true);

    setTimeout(async () => {
      try {
        const response = await processMessage(userText);

        // addMessage returns the generated ID
        const msgId = addMessage({
          role: "assistant",
          content: response.text,
          pendingAction: response.pendingAction,
        });

        // Auto-execute read-only actions is no longer needed because
        // the backend runs search queries synchronously now and won't
        // return pendingAction for them!
      } catch (err) {
        addMessage({
          role: "assistant",
          content: "Sorry, I encountered an error while processing your request.",
        });
      } finally {
        setTyping(false);
      }
    }, 600);
  };

  const handleAction = async (messageId: string, action: PendingAction, confirm: boolean) => {
    const confirmationId = action.confirmationId || "unknown";

    if (!confirm) {
      updateMessageAction(messageId, "cancelled");
      addMessage({ role: "assistant", content: "Action cancelled." });
      // Tell backend we cancelled (this goes to tool-result for immediate failure)
      import("@/lib/assistant/provider").then(({ submitToolResult }) => {
        submitToolResult("default-session", confirmationId, false, "User cancelled the action");
      });
      return;
    }

    updateMessageAction(messageId, "confirmed");
    setTyping(true);

    try {
      const { submitConfirmation, submitToolResult } = await import("@/lib/assistant/provider");

      // Flow 1: Requires Go backend confirmation (destructive/writes)
      if (action.status === "pending" || action.status === "critical_pending") {
        const confirmRes = await submitConfirmation("default-session", confirmationId);
        if (confirmRes.success) {
          // The Go backend ALREADY mutated the database for tasks, calendar, notes, AND file manager!
          // We just need to refresh the frontend UI
          window.dispatchEvent(new Event("workspace_updated"));

          updateMessageAction(messageId, "executed");
          addMessage({ role: "assistant", content: confirmRes.text });
        } else {
          updateMessageAction(messageId, "error");
          addMessage({ role: "assistant", content: confirmRes.text || "Action failed." });
        }
      }
    } catch (err) {
      console.error("Action execution error:", err);
      updateMessageAction(messageId, "error");
      addMessage({ role: "assistant", content: "Failed to process the action." });
    } finally {
      setTyping(false);
    }
  };

  const quickActions = ["Create a task", "Schedule an event", "Create a note", "Find a file"];

  if (!isInitialized) return null;

  return createPortal(
    <>
      {/* Backdrop for expanded mode */}
      {isOpen && isExpanded && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in duration-200" 
          onClick={() => setIsExpanded(false)} 
        />
      )}

      <div
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: isOpen && isExpanded ? 101 : 50,
        }}
        className="flex flex-col items-center justify-center"
      >
        {/* Popover UI */}
        {isOpen && (
          <div
            style={isExpanded ? {
              position: "fixed",
              zIndex: 102
            } : popupStyle}
            className={cn(
              "flex flex-col overflow-hidden bg-card shadow-xl animate-in fade-in zoom-in-95 origin-bottom-right transition-all duration-300",
              isExpanded 
                ? "inset-0 sm:inset-4 m-auto w-full h-[100dvh] sm:w-[95vw] sm:max-w-6xl sm:h-[95vh] rounded-none sm:rounded-2xl sm:border"
                : "absolute rounded-xl border w-[90vw] sm:w-[380px] h-[500px] max-h-[80vh] mb-4"
            )}
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/chisa.jfif" alt="CHISA" className="object-cover" />
                <AvatarFallback>
                  <Sparkles className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-sm leading-tight">CH1SA Assistant</h3>
                <p className="text-xs text-muted-foreground">Your workspace, at your command.</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full" 
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Restore Assistant" : "Expand Assistant"}
              >
                {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsOpen(false)} title="Close Assistant">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Area */}
          <div ref={scrollRef} id="assistant-scroll-container" className="flex-1 overflow-y-auto p-4 bg-card">
            <div className="flex flex-col gap-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex max-w-[85%] items-start gap-2",
                    msg.role === "user" ? "self-end flex-row-reverse" : "self-start",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border shadow-sm overflow-hidden",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                    )}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <img src="/chisa.jfif" alt="CHISA" className="h-full w-full object-cover" />
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm shadow-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                          : "bg-muted/60 border text-foreground",
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5">
                          {msg.id === "init" && initialGreetingState === "typing" ? (
                            <div className="flex gap-1 items-center h-5 px-1 py-1">
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.3s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60 [animation-delay:-0.15s]" />
                              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/60" />
                            </div>
                          ) : msg.id === "init" ? (
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                              components={markdownComponents}
                            >
                              {initialGreetingState === "typewriter"
                                ? msg.content.substring(0, typewriterLength)
                                : msg.content}
                            </ReactMarkdown>
                          ) : (
                            <TypewriterMarkdown content={msg.content} createdAt={msg.createdAt || Date.now()} />
                          )}
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {msg.pendingAction && msg.pendingAction.status === "pending" && (
                      <div className="mt-1 rounded-lg border bg-background p-3 shadow-sm text-sm">
                        <div className="mb-3 whitespace-pre-wrap text-muted-foreground border-l-2 border-primary pl-2 text-xs">
                          {msg.pendingAction.previewText}
                        </div>
                        {!msg.pendingAction.type.startsWith("search_") && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => handleAction(msg.id, msg.pendingAction!, true)}
                            >
                              <Check className="mr-1 h-3 w-3" /> Confirm
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs px-2"
                              onClick={() => handleAction(msg.id, msg.pendingAction!, false)}
                            >
                              <X className="mr-1 h-3 w-3" /> Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    {msg.pendingAction && msg.pendingAction.status === "critical_pending" && (
                      <div className="mt-1 rounded-lg border border-destructive/50 bg-destructive/10 p-3 shadow-sm text-sm">
                        <div className="mb-2 font-semibold text-destructive flex items-center">
                          <AlertTriangle className="mr-1.5 h-4 w-4" />
                          Critical Action
                        </div>
                        <div className="mb-3 whitespace-pre-wrap text-foreground/90 border-l-2 border-destructive pl-2 text-xs font-medium">
                          {msg.pendingAction.previewText}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs px-2 w-full justify-start font-semibold"
                            onClick={() => handleAction(msg.id, msg.pendingAction!, true)}
                          >
                            <Check className="mr-1.5 h-3 w-3" /> I understand, execute this action
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs px-2 w-full justify-start"
                            onClick={() => handleAction(msg.id, msg.pendingAction!, false)}
                          >
                            <X className="mr-1.5 h-3 w-3" /> Cancel and keep data safe
                          </Button>
                        </div>
                      </div>
                    )}
                    {msg.pendingAction && msg.pendingAction.status === "cancelled" && (
                      <div className="text-[10px] text-muted-foreground flex items-center px-1">
                        <X className="mr-1 h-2 w-2" /> Cancelled
                      </div>
                    )}
                    {msg.pendingAction && msg.pendingAction.status === "executed" && (
                      <div className="text-[10px] text-primary flex items-center font-medium px-1">
                        <Check className="mr-1 h-2 w-2" /> Executed
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex max-w-[80%] items-start gap-2 self-start">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-muted shadow-sm overflow-hidden">
                    <img src="/chisa.jfif" alt="CHISA" className="h-full w-full object-cover animate-pulse" />
                  </div>
                  <div className="rounded-lg bg-muted/60 border px-3 py-2 text-sm text-foreground shadow-sm">
                    <div className="flex gap-1 items-center h-4">
                      <span className="h-1 w-1 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.3s]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.15s]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-foreground/50" />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {messages.length === 1 && (
            <div className="bg-card px-4 pt-2 pb-4 flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-xs text-muted-foreground font-medium px-1">Try asking:</span>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((qa, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs h-7 px-3 bg-muted/20 hover:bg-muted"
                    onClick={() => {
                      setInput(qa);
                      setTimeout(() => {
                        document
                          .getElementById("floating-assistant-form")
                          ?.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
                      }, 100);
                    }}
                  >
                    {qa}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t bg-card p-3">
            <form id="floating-assistant-form" onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask CH1SA anything..."
                className="flex-1 rounded-full px-3 text-sm h-9 shadow-none bg-muted/30 focus-visible:ring-1"
                disabled={isTyping}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full shadow-sm"
                disabled={!input.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Avatar Button */}
      <div
        {...handlers}
        className={cn(
          "rounded-full shadow-lg ring-1 ring-border/10 cursor-grab hover:shadow-xl hover:scale-105 transition-all touch-none select-none",
          isDragging && "cursor-grabbing scale-95 opacity-90 shadow-md",
          isOpen && !isExpanded && "ring-2 ring-primary ring-offset-2 ring-offset-background",
          isOpen && isExpanded && "opacity-0 pointer-events-none"
        )}
        style={{ width: avatarSize, height: avatarSize }}
      >
        <Avatar className="h-full w-full pointer-events-none">
          <AvatarImage src="/chisa.jfif" alt="Assistant" className="object-cover" />
          <AvatarFallback>
            <Sparkles className="h-6 w-6 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
    </>,
    document.body,
  );
}
