package assistant

type ChatRequest struct {
	Message        string `json:"message"`
	ConversationID string `json:"conversationId"`
}

type ChatResponse struct {
	Message string         `json:"message"`
	Status  string         `json:"status"`
	Action  *PendingAction `json:"action,omitempty"`
	Data    interface{}    `json:"data,omitempty"`
	Error   interface{}    `json:"error,omitempty"`
}

type PendingAction struct {
	Type           string                 `json:"type"`
	ConfirmationID string                 `json:"confirmationId"`
	PreviewText    string                 `json:"previewText,omitempty"`
	Payload        map[string]interface{} `json:"payload,omitempty"`
	Risk           string                 `json:"risk,omitempty"`
	Scope          string                 `json:"scope,omitempty"`
}

type Intent string
type Scope string
type Entity string
type Risk string
type PolicyDecision string

const (
	PolicyAllow          PolicyDecision = "ALLOW"
	PolicyConfirm        PolicyDecision = "CONFIRM"
	PolicyCritical       PolicyDecision = "CRITICAL_CONFIRM"
	PolicyReject         PolicyDecision = "REJECT"
	PolicyClarify        PolicyDecision = "CLARIFY"

	RiskLow      Risk = "LOW"
	RiskMedium   Risk = "MEDIUM"
	RiskHigh     Risk = "HIGH"
	RiskVeryHigh Risk = "VERY_HIGH"
	RiskCritical Risk = "CRITICAL"

	ScopeSingle     Scope = "SINGLE"
	ScopeMultiple   Scope = "MULTIPLE"
	ScopeCollection Scope = "COLLECTION"
	ScopeModule     Scope = "MODULE"
	ScopeWorkspace  Scope = "WORKSPACE"

	EntityTask         Entity = "TASK"
	EntityKanban       Entity = "KANBAN"
	EntityCalendar     Entity = "CALENDAR_EVENT"
	EntityNote         Entity = "NOTE"
	EntityFile         Entity = "FILE"
	EntityFolder       Entity = "FOLDER"
	EntityWorkspace    Entity = "WORKSPACE"
)

type ConfirmRequest struct {
	ConversationID string `json:"conversationId"`
	ConfirmationID string `json:"confirmationId"`
}

type ToolResultRequest struct {
	ConversationID string `json:"conversationId"`
	ConfirmationID string `json:"confirmationId"`
	Success        bool   `json:"success"`
	Message        string `json:"message"`
}
