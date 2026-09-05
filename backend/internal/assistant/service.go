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

	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
)

type ChatSession struct {
	Messages    []openai.ChatCompletionMessage
	ToolCount   int
	LastAccess  time.Time
	IsExecuting bool
}

type contextKey string
const requestIDKey contextKey = "RequestID"

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
				Content: SystemPrompt + "\n\nCurrent Date: " + time.Now().In(time.FixedZone("WIB", 7*3600)).Format("Monday, 2006-01-02"),
			},
		},
		LastAccess: time.Now(),
	}
	s.sessions[conversationID] = session
	return session
}

func (s *Service) ProcessMessage(ctx context.Context, req ChatRequest) (ChatResponse, error) {
	session := s.getOrCreateSession(req.ConversationID)

	s.mu.Lock()
	if session.IsExecuting {
		s.mu.Unlock()
		return ChatResponse{Status: "error", Message: "Mohon tunggu, request sebelumnya sedang diproses."}, nil
	}
	session.IsExecuting = true
	session.ToolCount = 0
	session.Messages = append(session.Messages, openai.ChatCompletionMessage{
		Role:    openai.ChatMessageRoleUser,
		Content: req.Message,
	})
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		session.IsExecuting = false
		s.mu.Unlock()
	}()

	reqID := uuid.New().String()
	ctx = context.WithValue(ctx, requestIDKey, reqID)

	return s.generateResponse(ctx, req.ConversationID, session)
}

func (s *Service) ConfirmAction(ctx context.Context, req ConfirmRequest) (ChatResponse, error) {
	session := s.getOrCreateSession(req.ConversationID)
	
	s.mu.Lock()
	if session.IsExecuting {
		s.mu.Unlock()
		return ChatResponse{Status: "error", Message: "Mohon tunggu, request sebelumnya sedang diproses."}, nil
	}
	session.IsExecuting = true
	action, exists := s.pendingActions[req.ConfirmationID]
	if !exists {
		session.IsExecuting = false
		s.mu.Unlock()
		return ChatResponse{
			Status:  "error",
			Message: "Confirmation ID is invalid or has expired.",
		}, nil
	}

	if action.Executed {
		session.IsExecuting = false
		s.mu.Unlock()
		return ChatResponse{
			Status:  "error",
			Message: "This action has already been executed.",
		}, nil
	}

	if time.Now().After(action.ExpiresAt) {
		session.IsExecuting = false
		s.mu.Unlock()
		return ChatResponse{
			Status:  "error",
			Message: "This confirmation has expired.",
		}, nil
	}

	action.Executed = true
	s.mu.Unlock()

	result := s.router.ExecuteTool(ctx, action.ToolName, action.Args)

	if result.Status == "error" {
		s.mu.Lock()
		session.IsExecuting = false
		s.mu.Unlock()
		return ChatResponse{
			Status:  "error",
			Message: "Failed to execute action.",
			Error:   result.Error,
		}, nil
	}

	resultJSON, _ := json.Marshal(result)

	s.mu.Lock()
	session.Messages = append(session.Messages, openai.ChatCompletionMessage{
		Role:       openai.ChatMessageRoleTool,
		Content:    string(resultJSON),
		ToolCallID: req.ConfirmationID,
	})
	session.IsExecuting = false
	s.mu.Unlock()

	return ChatResponse{
		Message: "Action confirmed and executed successfully.",
		Status:  "success",
		Data:    result.Data,
	}, nil
}

func (s *Service) ProcessToolResult(ctx context.Context, req ToolResultRequest) (ChatResponse, error) {
	session := s.getOrCreateSession(req.ConversationID)

	s.mu.Lock()
	if session.IsExecuting {
		s.mu.Unlock()
		return ChatResponse{Status: "error", Message: "Mohon tunggu, request sebelumnya sedang diproses."}, nil
	}
	session.IsExecuting = true
	
	resultJSON, _ := json.Marshal(map[string]any{
		"success": req.Success,
		"message": req.Message,
	})

	session.Messages = append(session.Messages, openai.ChatCompletionMessage{
		Role:       openai.ChatMessageRoleTool,
		Content:    string(resultJSON),
		ToolCallID: req.ConfirmationID,
	})
	s.mu.Unlock()

	defer func() {
		s.mu.Lock()
		session.IsExecuting = false
		s.mu.Unlock()
	}()

	reqID := uuid.New().String()
	ctx = context.WithValue(ctx, requestIDKey, reqID)

	return s.generateResponse(ctx, req.ConversationID, session)
}


func estimateTokens(messages []openai.ChatCompletionMessage, tools []openai.Tool) int {
	size := 0
	for _, m := range messages {
		size += len(m.Role)
		size += len(m.Content)
		if m.Name != "" {
			size += len(m.Name)
		}
		for _, tc := range m.ToolCalls {
			size += len(tc.Function.Name)
			size += len(tc.Function.Arguments)
		}
	}
	for _, t := range tools {
		size += len(t.Function.Name)
		size += len(t.Function.Description)
		if b, err := json.Marshal(t.Function.Parameters); err == nil {
			size += len(b)
		}
	}
	return size / 4
}

func (s *Service) generateResponse(ctx context.Context, conversationID string, session *ChatSession) (ChatResponse, error) {
	reqID, _ := ctx.Value(requestIDKey).(string)
	startTime := time.Now()

	s.mu.RLock()
	if session.ToolCount >= 8 {
		s.mu.RUnlock()
		return ChatResponse{
			Message: "I couldn't complete the full request in one step. Please split it into smaller actions.",
			Status:  "action_limit_reached",
		}, nil
	}

	maxHistory := 6
	var messages []openai.ChatCompletionMessage
	if len(session.Messages) > maxHistory+1 {
		messages = make([]openai.ChatCompletionMessage, 0, maxHistory+1)
		messages = append(messages, session.Messages[0])
		
		startIndex := len(session.Messages) - maxHistory
		for startIndex < len(session.Messages) && session.Messages[startIndex].Role != openai.ChatMessageRoleUser {
			startIndex++
		}
		
		if startIndex < len(session.Messages) {
			messages = append(messages, session.Messages[startIndex:]...)
		} else {
			messages = append(messages, session.Messages[len(session.Messages)-1])
		}
	} else {
		messages = make([]openai.ChatCompletionMessage, len(session.Messages))
		copy(messages, session.Messages)
	}
	s.mu.RUnlock()

	tools := GetToolDefinitions()
	estimatedInputTokens := estimateTokens(messages, tools)
	
	// Soft internal budget
	if estimatedInputTokens > 4000 && len(messages) > 3 {
		log.Printf("[Request %s] Context is large (est: %d). Compacting.", reqID, estimatedInputTokens)
		compact := []openai.ChatCompletionMessage{messages[0]}
		compact = append(compact, messages[len(messages)-2:]...)
		messages = compact
		estimatedInputTokens = estimateTokens(messages, tools)
	}

	req := openai.ChatCompletionRequest{
		Model:       s.model,
		Messages:    messages,
		Tools:       tools,
		Temperature: 0.2,
		MaxTokens:   500,
	}

	var resp openai.ChatCompletionResponse
	var err error
	groqCalls := 0

	for attempts := 0; attempts < 2; attempts++ {
		groqCalls++
		resp, err = s.client.CreateChatCompletion(ctx, req)
		if err == nil {
			break
		}
		
		if strings.Contains(err.Error(), "429") {
			log.Printf("[Request %s] Rate limited (429). Waiting 5s before retry...", reqID)
			time.Sleep(5 * time.Second)
			continue
		}
		
		if strings.Contains(err.Error(), "413") && len(messages) > 3 {
			log.Printf("[Request %s] 413 Error. Reducing context.", reqID)
			compact := []openai.ChatCompletionMessage{messages[0]}
			compact = append(compact, messages[len(messages)-2:]...)
			req.Messages = compact
			continue
		}
		break
	}

	duration := time.Since(startTime)

	if err != nil {
		log.Printf("[Request %s] Failed: %v, Duration: %v, EstTokens: %d", reqID, err, duration, estimatedInputTokens)
		
		if strings.Contains(err.Error(), "429") {
			return ChatResponse{
				Message: "CHISA sedang mencapai batas AI sementara. Coba lagi dalam beberapa detik.",
				Status:  "rate_limited",
			}, nil
		}

		return ChatResponse{
			Message: "I encountered an error. The conversation context might be too large.",
			Status:  "error",
		}, nil
	}

	actualInputTokens := resp.Usage.PromptTokens
	actualOutputTokens := resp.Usage.CompletionTokens
	totalTokens := resp.Usage.TotalTokens

	log.Printf("[Request %s] Success - Duration: %v, Calls: %d, Input: %d, Output: %d, Total: %d", 
		reqID, duration, groqCalls, actualInputTokens, actualOutputTokens, totalTokens)

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

		var args map[string]interface{}
		if err := json.Unmarshal([]byte(toolCall.Function.Arguments), &args); err != nil {
			args = make(map[string]interface{})
		}

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
			result := s.router.ExecuteTool(ctx, toolCall.Function.Name, args)
			resultJSON, _ := json.Marshal(result)

			s.mu.Lock()
			session.Messages = append(session.Messages, openai.ChatCompletionMessage{
				Role:       openai.ChatMessageRoleTool,
				Content:    string(resultJSON),
				ToolCallID: toolCall.ID,
			})
			s.mu.Unlock()

			return s.generateResponse(ctx, conversationID, session)
		}
	}

	return ChatResponse{
		Message: message.Content,
		Status:  "success",
	}, nil
}
