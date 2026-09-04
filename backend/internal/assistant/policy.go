package assistant

import (
	"fmt"
)

// PolicyEvaluation represents the structural analysis and decision of a tool call
type PolicyEvaluation struct {
	Intent   Intent
	Scope    Scope
	Entity   Entity
	Risk     Risk
	Decision PolicyDecision
	Message  string // Explanation for UI or logging
}

// EvaluateAction acts as the deterministic Go policy engine protecting the workspace
func EvaluateAction(toolName string, args map[string]interface{}) PolicyEvaluation {
	switch toolName {
	// ---------------------------------------------------------
	// TASKS
	// ---------------------------------------------------------
	case "create_task":
		return PolicyEvaluation{
			Intent:   "create_task",
			Scope:    ScopeSingle,
			Entity:   EntityTask,
			Risk:     RiskLow,
			Decision: PolicyAllow, // Non-destructive create can just execute in some architectures, but router.go validates it as true (needs confirmation). We will align with PolicyConfirm if it mutates.
		}
	case "search_tasks", "get_task":
		return PolicyEvaluation{
			Intent:   "read_tasks",
			Scope:    ScopeCollection,
			Entity:   EntityTask,
			Risk:     RiskLow,
			Decision: PolicyAllow,
		}
	case "update_task", "add_subtask", "update_subtask":
		return PolicyEvaluation{
			Intent:   "update_task",
			Scope:    ScopeSingle,
			Entity:   EntityTask,
			Risk:     RiskMedium,
			Decision: PolicyConfirm,
		}
	case "delete_task", "delete_subtask":
		return PolicyEvaluation{
			Intent:   "delete_task",
			Scope:    ScopeSingle,
			Entity:   EntityTask,
			Risk:     RiskHigh,
			Decision: PolicyConfirm,
		}
	case "bulk_update_tasks":
		return PolicyEvaluation{
			Intent:   "bulk_update_tasks",
			Scope:    ScopeMultiple,
			Entity:   EntityTask,
			Risk:     RiskHigh,
			Decision: PolicyConfirm,
		}
	case "bulk_delete_tasks":
		return PolicyEvaluation{
			Intent:   "bulk_delete_tasks",
			Scope:    ScopeMultiple,
			Entity:   EntityTask,
			Risk:     RiskVeryHigh,
			Decision: PolicyConfirm, // We could make this PolicyCritical depending on size, but CONFIRM is okay for multiple
		}

	// ---------------------------------------------------------
	// EVENTS
	// ---------------------------------------------------------
	case "create_event":
		return PolicyEvaluation{
			Intent:   "create_event",
			Scope:    ScopeSingle,
			Entity:   EntityCalendar,
			Risk:     RiskLow,
			Decision: PolicyConfirm, // Mutation
		}
	case "search_events", "get_event":
		return PolicyEvaluation{
			Intent:   "read_events",
			Scope:    ScopeCollection,
			Entity:   EntityCalendar,
			Risk:     RiskLow,
			Decision: PolicyAllow,
		}
	case "update_event":
		return PolicyEvaluation{
			Intent:   "update_event",
			Scope:    ScopeSingle,
			Entity:   EntityCalendar,
			Risk:     RiskMedium,
			Decision: PolicyConfirm,
		}
	case "delete_event":
		return PolicyEvaluation{
			Intent:   "delete_event",
			Scope:    ScopeSingle,
			Entity:   EntityCalendar,
			Risk:     RiskHigh,
			Decision: PolicyConfirm,
		}

	// ---------------------------------------------------------
	// NOTES
	// ---------------------------------------------------------
	case "create_note":
		return PolicyEvaluation{
			Intent:   "create_note",
			Scope:    ScopeSingle,
			Entity:   EntityNote,
			Risk:     RiskLow,
			Decision: PolicyConfirm, // Mutation
		}
	case "search_notes", "get_note":
		return PolicyEvaluation{
			Intent:   "read_notes",
			Scope:    ScopeCollection,
			Entity:   EntityNote,
			Risk:     RiskLow,
			Decision: PolicyAllow,
		}
	case "update_note":
		return PolicyEvaluation{
			Intent:   "update_note",
			Scope:    ScopeSingle,
			Entity:   EntityNote,
			Risk:     RiskMedium,
			Decision: PolicyConfirm,
		}
	case "delete_note":
		return PolicyEvaluation{
			Intent:   "delete_note",
			Scope:    ScopeSingle,
			Entity:   EntityNote,
			Risk:     RiskHigh,
			Decision: PolicyConfirm,
		}

	// ---------------------------------------------------------
	// FILE MANAGER
	// ---------------------------------------------------------
	case "search_files", "search_folders":
		return PolicyEvaluation{
			Intent:   "read_files",
			Scope:    ScopeCollection,
			Entity:   EntityWorkspace, // mixed
			Risk:     RiskLow,
			Decision: PolicyAllow,
		}
	case "create_folder":
		return PolicyEvaluation{
			Intent:   "create_folder",
			Scope:    ScopeSingle,
			Entity:   EntityFolder,
			Risk:     RiskLow,
			Decision: PolicyConfirm,
		}
	case "rename_file", "move_file", "star_file", "unstar_file":
		return PolicyEvaluation{
			Intent:   "update_file",
			Scope:    ScopeSingle,
			Entity:   EntityFile,
			Risk:     RiskMedium,
			Decision: PolicyConfirm,
		}
	case "rename_folder", "move_folder", "star_folder", "unstar_folder":
		return PolicyEvaluation{
			Intent:   "update_folder",
			Scope:    ScopeSingle,
			Entity:   EntityFolder,
			Risk:     RiskMedium,
			Decision: PolicyConfirm,
		}
	case "delete_file":
		return PolicyEvaluation{
			Intent:   "delete_file",
			Scope:    ScopeSingle,
			Entity:   EntityFile,
			Risk:     RiskHigh,
			Decision: PolicyConfirm,
		}
	case "delete_folder":
		return PolicyEvaluation{
			Intent:   "delete_folder",
			Scope:    ScopeSingle,
			Entity:   EntityFolder,
			Risk:     RiskVeryHigh, // deleting folder deletes children
			Decision: PolicyConfirm,
		}

	// ---------------------------------------------------------
	// WORKSPACE CRITICAL
	// ---------------------------------------------------------
	case "reset_workspace":
		// Examine scope
		scopes, ok := args["scope"].([]interface{})
		if !ok || len(scopes) == 0 {
			return PolicyEvaluation{
				Intent:   "reset_workspace",
				Scope:    ScopeWorkspace,
				Entity:   EntityWorkspace,
				Risk:     RiskCritical,
				Decision: PolicyClarify,
				Message:  "What would you like to reset? (Tasks, Calendar, Notes, Files, or Everything)",
			}
		}

		return PolicyEvaluation{
			Intent:   "reset_workspace",
			Scope:    ScopeWorkspace,
			Entity:   EntityWorkspace,
			Risk:     RiskCritical,
			Decision: PolicyCritical,
			Message:  "You are about to reset workspace data. This cannot be undone.",
		}

	default:
		return PolicyEvaluation{
			Intent:   "unknown",
			Scope:    ScopeSingle,
			Entity:   EntityWorkspace,
			Risk:     RiskCritical,
			Decision: PolicyReject,
			Message:  fmt.Sprintf("Unknown tool requested: %s", toolName),
		}
	}
}
