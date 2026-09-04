package assistant

// ChatRequest represents the payload sent from Next.js to the Go backend
type ChatRequest struct {
	Message        string `json:"message"`
	ConversationID string `json:"conversationId"`
}

// ChatResponse represents the response sent back to Next.js
type ChatResponse struct {
	Message string         `json:"message"`
	Status  string         `json:"status"` // "success", "pending_confirmation", "error"
	Action  *PendingAction `json:"action,omitempty"`
	Data    interface{}    `json:"data,omitempty"`
	Error   interface{}    `json:"error,omitempty"`
}

// PendingAction represents a tool call that the frontend needs to confirm
type PendingAction struct {
	Type           string                 `json:"type"`
	ConfirmationID string                 `json:"confirmationId"`
	PreviewText    string                 `json:"previewText,omitempty"`
	Payload        map[string]interface{} `json:"payload,omitempty"`
	Risk           string                 `json:"risk,omitempty"`
	Scope          string                 `json:"scope,omitempty"`
}

// Policy Engine Types
type Intent string
type Scope string
type Entity string
type Risk string
type PolicyDecision string

const (
	// Policy Decisions
	PolicyAllow          PolicyDecision = "ALLOW"
	PolicyConfirm        PolicyDecision = "CONFIRM"
	PolicyCritical       PolicyDecision = "CRITICAL_CONFIRM"
	PolicyReject         PolicyDecision = "REJECT"
	PolicyClarify        PolicyDecision = "CLARIFY"

	// Risks
	RiskLow      Risk = "LOW"
	RiskMedium   Risk = "MEDIUM"
	RiskHigh     Risk = "HIGH"
	RiskVeryHigh Risk = "VERY_HIGH"
	RiskCritical Risk = "CRITICAL"

	// Scopes
	ScopeSingle     Scope = "SINGLE"
	ScopeMultiple   Scope = "MULTIPLE"
	ScopeCollection Scope = "COLLECTION"
	ScopeModule     Scope = "MODULE"
	ScopeWorkspace  Scope = "WORKSPACE"

	// Entities
	EntityTask         Entity = "TASK"
	EntityKanban       Entity = "KANBAN"
	EntityCalendar     Entity = "CALENDAR_EVENT"
	EntityNote         Entity = "NOTE"
	EntityFile         Entity = "FILE"
	EntityFolder       Entity = "FOLDER"
	EntityWorkspace    Entity = "WORKSPACE"
)

// ConfirmRequest represents the frontend returning the confirmation of a tool execution
type ConfirmRequest struct {
	ConversationID string `json:"conversationId"`
	ConfirmationID string `json:"confirmationId"`
}

// ToolResultRequest is for auto-executed (read-only) tools that don't go through /confirm
type ToolResultRequest struct {
	ConversationID string `json:"conversationId"`
	ConfirmationID string `json:"confirmationId"`
	Success        bool   `json:"success"`
	Message        string `json:"message"`
}
