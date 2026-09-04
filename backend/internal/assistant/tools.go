package assistant

import (
	"github.com/sashabaranov/go-openai"
	"github.com/sashabaranov/go-openai/jsonschema"
)

// GetToolDefinitions returns the canonical schema for all available CHISA tools
func GetToolDefinitions() []openai.Tool {
	return []openai.Tool{
		// TASKS
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "create_task",
				Description: "Create a task.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"title":       {Type: jsonschema.String},
						"description": {Type: jsonschema.String},
						"priority":    {Type: jsonschema.String, Description: "None, Low, Medium, High"},
						"status":      {Type: jsonschema.String, Description: "backlog, todo, in-progress, review, done, cancelled"},
						"startDate":   {Type: jsonschema.String, Description: "YYYY-MM-DD"},
						"dueDate":     {Type: jsonschema.String, Description: "YYYY-MM-DD"},
						"subtasks": {
							Type: jsonschema.Array,
							Items: &jsonschema.Definition{
								Type: jsonschema.Object,
								Properties: map[string]jsonschema.Definition{
									"title": {Type: jsonschema.String},
								},
								Required: []string{"title"},
							},
						},
					},
					Required: []string{"title"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "search_tasks",
				Description: "Search tasks.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"query": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "get_task",
				Description: "Get task details.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id": {Type: jsonschema.String},
					},
					Required: []string{"id"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "update_task",
				Description: "Update task.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":          {Type: jsonschema.String, Description: "Optional if title uniquely identifies the task"},
						"title":       {Type: jsonschema.String, Description: "Provide to identify the task if ID is unknown"},
						"description": {Type: jsonschema.String},
						"priority":    {Type: jsonschema.String, Description: "None, Low, Medium, High"},
						"status":      {Type: jsonschema.String, Description: "backlog, todo, in-progress, review, done, cancelled"},
						"startDate":   {Type: jsonschema.String, Description: "YYYY-MM-DD. Pass empty string to remove."},
						"dueDate":     {Type: jsonschema.String, Description: "YYYY-MM-DD. Pass empty string to remove."},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "add_subtask",
				Description: "Add a subtask to an existing task.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"taskId": {Type: jsonschema.String, Description: "Optional if taskTitle uniquely identifies the task"},
						"taskTitle": {Type: jsonschema.String, Description: "Provide to identify the task if taskId is unknown"},
						"title":  {Type: jsonschema.String},
					},
					Required: []string{"title"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "update_subtask",
				Description: "Update a subtask's title or completion status. Use originalTitle to match.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"taskId":        {Type: jsonschema.String, Description: "Optional if taskTitle uniquely identifies the task"},
						"taskTitle":     {Type: jsonschema.String, Description: "Provide to identify the task if taskId is unknown"},
						"originalTitle": {Type: jsonschema.String},
						"newTitle":      {Type: jsonschema.String},
						"isCompleted":   {Type: jsonschema.Boolean},
					},
					Required: []string{"originalTitle"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "delete_subtask",
				Description: "Delete a subtask.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"taskId":        {Type: jsonschema.String, Description: "Optional if taskTitle uniquely identifies the task"},
						"taskTitle":     {Type: jsonschema.String, Description: "Provide to identify the task if taskId is unknown"},
						"originalTitle": {Type: jsonschema.String},
					},
					Required: []string{"originalTitle"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "delete_task",
				Description: "Delete task.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":    {Type: jsonschema.String},
						"title": {Type: jsonschema.String},
					},
					Required: []string{"title"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "bulk_update_tasks",
				Description: "Update multiple tasks simultaneously.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"taskIds": {
							Type: jsonschema.Array,
							Items: &jsonschema.Definition{
								Type: jsonschema.String,
							},
						},
						"priority": {Type: jsonschema.String, Description: "None, Low, Medium, High"},
						"status":   {Type: jsonschema.String, Description: "backlog, todo, in-progress, review, done, cancelled"},
					},
					Required: []string{"taskIds"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "bulk_delete_tasks",
				Description: "Delete multiple tasks simultaneously.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"taskIds": {
							Type: jsonschema.Array,
							Items: &jsonschema.Definition{
								Type: jsonschema.String,
							},
						},
					},
					Required: []string{"taskIds"},
				},
			},
		},

		// EVENTS
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "create_event",
				Description: "Schedule event.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"title":       {Type: jsonschema.String},
						"date":        {Type: jsonschema.String, Description: "YYYY-MM-DD"},
						"startTime":   {Type: jsonschema.String, Description: "HH:MM"},
						"endTime":     {Type: jsonschema.String, Description: "HH:MM"},
						"calendar":    {Type: jsonschema.String, Description: "personal, work, team, focus"},
						"description": {Type: jsonschema.String},
						"allDay":      {Type: jsonschema.Boolean},
					},
					Required: []string{"title", "date"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "search_events",
				Description: "Search events.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"query": {Type: jsonschema.String},
						"date":  {Type: jsonschema.String, Description: "YYYY-MM-DD"},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "get_event",
				Description: "Get event details.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id": {Type: jsonschema.String},
					},
					Required: []string{"id"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "update_event",
				Description: "Update event.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":        {Type: jsonschema.String},
						"title":     {Type: jsonschema.String},
						"date":      {Type: jsonschema.String},
						"startTime": {Type: jsonschema.String},
						"endTime":   {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "delete_event",
				Description: "Delete event.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":    {Type: jsonschema.String},
						"title": {Type: jsonschema.String},
					},
					Required: []string{"title"},
				},
			},
		},

		// NOTES
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "create_note",
				Description: "Create note.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"title":   {Type: jsonschema.String},
						"content": {Type: jsonschema.String},
					},
					Required: []string{"title"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "search_notes",
				Description: "Search notes.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"query": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "get_note",
				Description: "Get note details.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id": {Type: jsonschema.String},
					},
					Required: []string{"id"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "update_note",
				Description: "Update note.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":      {Type: jsonschema.String},
						"title":   {Type: jsonschema.String},
						"content": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "delete_note",
				Description: "Delete note.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":    {Type: jsonschema.String},
						"title": {Type: jsonschema.String},
					},
					Required: []string{"title"},
				},
			},
		},

		// FILE MANAGER
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "search_files",
				Description: "Search files.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"query": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "search_folders",
				Description: "Search folders.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"query": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "create_folder",
				Description: "Create folder.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"name":     {Type: jsonschema.String},
						"parentId": {Type: jsonschema.String},
					},
					Required: []string{"name"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "rename_file",
				Description: "Rename file.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":      {Type: jsonschema.String},
						"name":    {Type: jsonschema.String, Description: "Current name of the file"},
						"newName": {Type: jsonschema.String},
					},
					Required: []string{"newName"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "rename_folder",
				Description: "Rename folder.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":      {Type: jsonschema.String},
						"name":    {Type: jsonschema.String, Description: "Current name of the folder"},
						"newName": {Type: jsonschema.String},
					},
					Required: []string{"newName"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "move_file",
				Description: "Move file.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":       {Type: jsonschema.String},
						"name":     {Type: jsonschema.String},
						"folderId": {Type: jsonschema.String},
					},
					Required: []string{"folderId"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "move_folder",
				Description: "Move folder.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":       {Type: jsonschema.String},
						"name":     {Type: jsonschema.String},
						"folderId": {Type: jsonschema.String},
					},
					Required: []string{"folderId"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "star_file",
				Description: "Star file.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":   {Type: jsonschema.String},
						"name": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "unstar_file",
				Description: "Unstar file.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":   {Type: jsonschema.String},
						"name": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "star_folder",
				Description: "Star folder.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":   {Type: jsonschema.String},
						"name": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "unstar_folder",
				Description: "Unstar folder.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":   {Type: jsonschema.String},
						"name": {Type: jsonschema.String},
					},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "delete_file",
				Description: "Delete file.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":   {Type: jsonschema.String},
						"name": {Type: jsonschema.String},
					},
					Required: []string{"name"},
				},
			},
		},
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "delete_folder",
				Description: "Delete folder.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"id":   {Type: jsonschema.String},
						"name": {Type: jsonschema.String},
					},
					Required: []string{"name"},
				},
			},
		},

		// WORKSPACE CRITICAL
		{
			Type: openai.ToolTypeFunction,
			Function: &openai.FunctionDefinition{
				Name:        "reset_workspace",
				Description: "Reset data for specific workspace modules. VERY DANGEROUS.",
				Parameters: jsonschema.Definition{
					Type: jsonschema.Object,
					Properties: map[string]jsonschema.Definition{
						"scope": {
							Type: jsonschema.Array,
							Items: &jsonschema.Definition{
								Type: jsonschema.String,
								Description: "tasks, calendar, notes, files",
							},
						},
					},
					Required: []string{"scope"},
				},
			},
		},
	}
}
