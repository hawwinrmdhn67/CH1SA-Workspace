package assistant

import (
	"testing"
)

func TestPolicyEngine(t *testing.T) {
	tests := []struct {
		name         string
		toolName     string
		args         map[string]interface{}
		expectedDec  PolicyDecision
		expectedRisk Risk
	}{
		{
			name:         "Read Tasks (Allow)",
			toolName:     "search_tasks",
			args:         map[string]interface{}{},
			expectedDec:  PolicyAllow,
			expectedRisk: RiskLow,
		},
		{
			name:         "Create Task (Confirm)",
			toolName:     "create_task",
			args:         map[string]interface{}{"title": "New Task"},
			expectedDec:  PolicyAllow,
			expectedRisk: RiskLow,
		},
		{
			name:         "Delete Task (Confirm)",
			toolName:     "delete_task",
			args:         map[string]interface{}{"id": "123"},
			expectedDec:  PolicyConfirm,
			expectedRisk: RiskHigh,
		},
		{
			name:         "Reset Workspace (Clarify without Scope)",
			toolName:     "reset_workspace",
			args:         map[string]interface{}{},
			expectedDec:  PolicyClarify,
			expectedRisk: RiskCritical,
		},
		{
			name:         "Reset Workspace (Critical with Scope)",
			toolName:     "reset_workspace",
			args:         map[string]interface{}{"scope": []interface{}{"tasks"}},
			expectedDec:  PolicyCritical,
			expectedRisk: RiskCritical,
		},
		{
			name:         "Unknown Tool (Reject)",
			toolName:     "hack_the_gibson",
			args:         map[string]interface{}{},
			expectedDec:  PolicyReject,
			expectedRisk: RiskCritical,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			eval := EvaluateAction(tt.toolName, tt.args)
			if eval.Decision != tt.expectedDec {
				t.Errorf("Expected decision %s, got %s", tt.expectedDec, eval.Decision)
			}
			if eval.Risk != tt.expectedRisk {
				t.Errorf("Expected risk %s, got %s", tt.expectedRisk, eval.Risk)
			}
		})
	}
}
