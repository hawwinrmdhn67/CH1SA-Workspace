package assistant

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"chisa-assistant-backend/internal/calendar"
	"chisa-assistant-backend/internal/config"
	"chisa-assistant-backend/internal/files"
	"chisa-assistant-backend/internal/notes"
	"chisa-assistant-backend/internal/tasks"

	"github.com/sashabaranov/go-openai"
)

type ChatSession struct {
	Messages   []openai.ChatCompletionMessage
	ToolCount  int
	LastAccess time.Time
}

type Service struct {
	client         *openai.Client
	model          string
	router         *Router
	sessions       map[string]*ChatSession
	pendingActions map[string]*StoredAction
	mu             sync.RWMutex
}

func NewService(cfg *config.Config, taskService tasks.Service, calendarService calendar.Service, notesService notes.Service, filesService files.Service) (*Service, error) {
	clientConfig := openai.DefaultConfig(cfg.GroqAPIKey)
	clientConfig.BaseURL = "https://api.groq.com/openai/v1"

	client := openai.NewClientWithConfig(clientConfig)

	return &Service{
		client:         client,
		model:          cfg.GroqModel,
		router:         NewRouter(taskService, calendarService, notesService, filesService),
		sessions:       make(map[string]*ChatSession),
		pendingActions: make(map[string]*StoredAction),
	}, nil
}

func (s *Service) getOrCreateSession(conversationID string) *ChatSession {
	s.mu.Lock()
	defer s.mu.Unlock()

	if session, exists := s.sessions[conversationID]; exists {
		session.LastAccess = time.Now()
		return session
	}

	session := &ChatSession{
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleSystem,
				Content: SystemPrompt,
			},
		},
		LastAccess: time.Now(),
	}
	s.sessions[conversationID] = session
	return session
}

// ProcessMessage sends a message to Groq and handles the response
func (s *Service) ProcessMessage(ctx context.Context, req ChatRequest) (ChatResponse, error) {
	session := s.getOrCreateSession(req.ConversationID)

	// Rate limiting logic could go here (e.g. check session.LastAccess frequency)
	s.mu.Lock()
	session.ToolCount = 0 // Reset tool count per request
	session.Messages = append(session.Messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: req.Message,
	})
	s.mu.Unlock()

	return s.generateResponse(ctx, req.ConversationID, session)
}

// ConfirmAction executes a previously stored action (destructive/mutating actions)
func (s *Service) ConfirmAction(ctx context.Context, req ConfirmRequest) (ChatResponse, error) {
	s.mu.Lock()
	action, exists := s.pendingActions[req.ConfirmationID]
	if !exists {
		s.mu.Unlock()
		return ChatResponse{
			Status:  "error",
			Message: "Confirmation ID is invalid or has expired.",
		}, nil
	}

	if action.Executed {
		s.mu.Unlock()
		return ChatResponse{
			Status:  "error",
			Message: "This action has already been executed.",
		}, nil
	}

	if time.Now().After(action.ExpiresAt) {
		s.mu.Unlock()
		return ChatResponse{
			Status:  "error",
			Message: "This confirmation has expired.",
		}, nil
	}

	// Mark as executed immediately to prevent duplicate executions
	action.Executed = true
	s.mu.Unlock()

	// Execute the action (generates the final data payload)
	result := s.router.ExecuteTool(ctx, action.ToolName, action.Args)

	if result.Status == "error" {
		return ChatResponse{
			Status:  "error",
			Message: "Failed to execute action.",
			Error:   result.Error,
		}, nil
	}

	// Inform Groq that it succeeded so it can generate a final response
	session := s.getOrCreateSession(req.ConversationID)
	resultJSON, _ := json.Marshal(result)

	s.mu.Lock()
	session.Messages = append(session.Messages, openai.ChatCompletionMessage{
		Role:       openai.ChatMessageRoleTool,
		Content:    string(resultJSON),
		ToolCallID: req.ConfirmationID,
	})
	s.mu.Unlock()

	// Generate the final conversational response from Groq
	resp, err := s.generateResponse(ctx, req.ConversationID, session)
	if err != nil {
		return resp, err
	}

	// But override the response to include the explicit success and data!
	resp.Status = "success"
	resp.Data = result.Data
	return resp, nil
}

// ProcessToolResult handles results from READ-ONLY actions executed on the frontend
func (s *Service) ProcessToolResult(ctx context.Context, req ToolResultRequest) (ChatResponse, error) {
	session := s.getOrCreateSession(req.ConversationID)

	resultJSON, _ := json.Marshal(map[string]any{
		"success": req.Success,
		"message": req.Message,
	})

	s.mu.Lock()
	session.Messages = append(session.Messages, openai.ChatCompletionMessage{
		Role:       openai.ChatMessageRoleTool,
		Content:    string(resultJSON),
		ToolCallID: req.ConfirmationID,
	})
	s.mu.Unlock()

	return s.generateResponse(ctx, req.ConversationID, session)
}

func (s *Service) generateResponse(ctx context.Context, conversationID string, session *ChatSession) (ChatResponse, error) {
	s.mu.RLock()
	if session.ToolCount >= 8 {
		s.mu.RUnlock()
		return ChatResponse{
			Message: "I couldn't complete the full request in one step. Please split it into smaller actions.",
			Status:  "action_limit_reached",
		}, nil
	}

	// Truncate history to avoid token limits (keep system prompt + valid recent messages)
	maxHistory := 10
	var messages []openai.ChatCompletionMessage
	if len(session.Messages) > maxHistory+1 {
		messages = make([]openai.ChatCompletionMessage, 0, maxHistory+1)
		messages = append(messages, session.Messages[0]) // System prompt
		
		startIndex := len(session.Messages) - maxHistory
		// Advance startIndex to the nearest User message to avoid breaking tool call chains
		for startIndex < len(session.Messages) && session.Messages[startIndex].Role != openai.ChatMessageRoleUser {
			startIndex++
		}
		
		if startIndex < len(session.Messages) {
			messages = append(messages, session.Messages[startIndex:]...)
		} else {
			// Fallback: just include the very last message if we couldn't find a User message boundary
			messages = append(messages, session.Messages[len(session.Messages)-1])
		}
	} else {
		messages = make([]openai.ChatCompletionMessage, len(session.Messages))
		copy(messages, session.Messages)
	}
	s.mu.RUnlock()

	req := openai.ChatCompletionRequest{
		Model:       s.model,
		Messages:    messages,
		Tools:       GetToolDefinitions(),
		Temperature: 0.2,
		MaxTokens:   500,
	}

	resp, err := s.client.CreateChatCompletion(ctx, req)
	if err != nil && strings.Contains(err.Error(), "413") && maxHistory > 3 {
		log.Printf("Groq 413 Error received. Retrying with aggressive context reduction...")

		s.mu.RLock()
		extremeHistory := 3
		var minimalMessages []openai.ChatCompletionMessage
		if len(session.Messages) > extremeHistory+1 {
			minimalMessages = make([]openai.ChatCompletionMessage, 0, extremeHistory+1)
			minimalMessages = append(minimalMessages, session.Messages[0])
			minimalMessages = append(minimalMessages, session.Messages[len(session.Messages)-extremeHistory:]...)
		}
		s.mu.RUnlock()

		if minimalMessages != nil {
			req.Messages = minimalMessages
			resp, err = s.client.CreateChatCompletion(ctx, req)
		}
	}

	if err != nil {
		log.Printf("Groq API Error: %v", err)
		return ChatResponse{
			Message: "I encountered an error. The conversation context might be too large.",
			Status:  "error",
		}, nil
	}

	if len(resp.Choices) == 0 {
		return ChatResponse{Message: "I'm not sure how to respond to that.", Status: "success"}, nil
	}

	choice := resp.Choices[0]
	message := choice.Message

	s.mu.Lock()
	session.Messages = append(session.Messages, message)
	s.mu.Unlock()

	if len(message.ToolCalls) > 0 {
		s.mu.Lock()
		session.ToolCount++
		s.mu.Unlock()

		toolCall := message.ToolCalls[0]

		// Parse arguments
		var args map[string]interface{}
		if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err != nil {
			args = make(map[string]interface{})
		}

		// Validation Layer: Protect Read-Only Indonesia Holidays
		if toolCall.Function.Name == "update_event" || toolCall.Function.Name == "delete_event" {
			if idStr, ok := args["id"].(string); ok {
				if len(idStr) >= 7 && strings.HasPrefix(idStr, "holiday") {
					s.mu.Lock()
					session.Messages = append(session.Messages, openai.ChatCompletionMessage{
						Role:       openai.ChatMessageRoleTool,
						Content:    `{"status":"error", "message":"I cannot modify or delete Indonesia Holidays as they are read-only external events."}`,
						ToolCallID: toolCall.ID,
					})
					s.mu.Unlock()
					return s.generateResponse(ctx, conversationID, session)
				}
			}
		}

		// Validate Tool Call using Router
		previewText, eval, err := s.router.ValidateToolCall(ctx, toolCall.Function.Name, args)
		
		if eval.Decision == PolicyClarify {
			s.mu.Lock()
			session.Messages = append(session.Messages, openai.ChatCompletionMessage{
				Role:       openai.ChatMessageRoleTool,
				Content:    fmt.Sprintf(`{"status":"clarification_required", "message":"%s"}`, eval.Message),
				ToolCallID: toolCall.ID,
			})
			s.mu.Unlock()
			return ChatResponse{
				Message: eval.Message,
				Status:  "clarification_required",
			}, nil
		}

		if err != nil {
			// Unsupported tool or missing required arguments
			s.mu.Lock()
			session.Messages = append(session.Messages, openai.ChatCompletionMessage{
				Role:       openai.ChatMessageRoleTool,
				Content:    fmt.Sprintf(`{"status":"error", "message":"%s"}`, err.Error()),
				ToolCallID: toolCall.ID,
			})
			s.mu.Unlock()
			return s.generateResponse(ctx, conversationID, session)
		}

		pendingAction := &PendingAction{
			Type:           toolCall.Function.Name,
			ConfirmationID: toolCall.ID,
			PreviewText:    previewText,
			Payload:        args,
			Risk:           string(eval.Risk),
			Scope:          string(eval.Scope),
		}

		if eval.Decision == PolicyConfirm || eval.Decision == PolicyCritical {
			// Store it in Go memory for 10 minutes
			s.mu.Lock()
			s.pendingActions[toolCall.ID] = &StoredAction{
				ConfirmationID: toolCall.ID,
				ToolName:       toolCall.Function.Name,
				Args:           args,
				ExpiresAt:      time.Now().Add(10 * time.Minute),
				Executed:       false,
			}
			s.mu.Unlock()

			status := "pending_confirmation"
			msg := eval.Message
			if eval.Decision == PolicyCritical {
				status = "critical_confirmation"
				if msg == "" {
					msg = "This action requires critical confirmation."
				}
			} else {
				if msg == "" {
					msg = "I need you to confirm this action."
				}
			}

			return ChatResponse{
				Message: msg,
				Status:  status,
				Action:  pendingAction,
			}, nil
		} else {
			// Execute immediately on backend (PolicyAllow)
			result := s.router.ExecuteTool(ctx, toolCall.Function.Name, args)
			resultJSON, _ := json.Marshal(result)

			s.mu.Lock()
			session.Messages = append(session.Messages, openai.ChatCompletionMessage{
				Role:       openai.ChatMessageRoleTool,
				Content:    string(resultJSON),
				ToolCallID: toolCall.ID,
			})
			s.mu.Unlock()

			// Recurse to generate final response based on tool result
			return s.generateResponse(ctx, conversationID, session)
		}
	}

	return ChatResponse{
		Message: message.Content,
		Status:  "success",
	}, nil
}
