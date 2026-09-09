package assistant

import (
	"context"
	"fmt"
	"strings"
	"time"

	"chisa-assistant-backend/internal/calendar"
	"chisa-assistant-backend/internal/files"
	"chisa-assistant-backend/internal/models"
	"chisa-assistant-backend/internal/notes"
	"chisa-assistant-backend/internal/tasks"

	"github.com/google/uuid"
)

type Router struct {
	taskService     tasks.Service
	calendarService calendar.Service
	notesService    notes.Service
	filesService    files.Service
}

func NewRouter(taskService tasks.Service, calendarService calendar.Service, notesService notes.Service, filesService files.Service) *Router {
	return &Router{
		taskService:     taskService,
		calendarService: calendarService,
		notesService:    notesService,
		filesService:    filesService,
	}
}

type RouteResult struct {
	Status  string                 `json:"status"`
	Tool    string                 `json:"tool"`
	Message string                 `json:"message"`
	Data    map[string]interface{} `json:"data,omitempty"`
	Error   *RouteError            `json:"error,omitempty"`
}

type RouteError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (r *Router) resolveEntityID(ctx context.Context, args map[string]interface{}, entityType string, idKey string, titleKey string) error {
	idStr, _ := args[idKey].(string)
	if idStr != "" {
		return nil
	}

	titleStr, _ := args[titleKey].(string)
	if titleStr == "" {
		return fmt.Errorf("%s is required if %s is not provided", titleKey, idKey)
	}

	var id string
	var err error

	userID, _ := ctx.Value("userID").(uuid.UUID)

	switch entityType {
	case "task":
		list, e := r.taskService.ListTasks(ctx, userID)
		if e != nil {
			return e
		}
		id, err = MatchEntity(titleStr, wrapTasks(list))
	case "event":
		list, e := r.calendarService.ListEvents(ctx, userID)
		if e != nil {
			return e
		}
		id, err = MatchEntity(titleStr, wrapEvents(list))
	case "note":
		list, e := r.notesService.ListNotes(ctx, userID)
		if e != nil {
			return e
		}
		id, err = MatchEntity(titleStr, wrapNotes(list))
	case "file":
		list, e := r.filesService.ListFiles(ctx, userID)
		if e != nil {
			return e
		}
		id, err = MatchEntity(titleStr, wrapFiles(list))
	case "folder":
		list, e := r.filesService.ListFolders(ctx, userID)
		if e != nil {
			return e
		}
		id, err = MatchEntity(titleStr, wrapFolders(list))
	}

	if err != nil {
		return err
	}

	args[idKey] = id
	return nil
}

func (r *Router) ValidateToolCall(ctx context.Context, toolName string, args map[string]interface{}) (string, PolicyEvaluation, error) {
	eval := EvaluateAction(toolName, args)

	if eval.Decision == PolicyReject {
		return "", eval, fmt.Errorf("%s", eval.Message)
	}

	switch toolName {
	case "get_task", "update_task", "delete_task":
		if err := r.resolveEntityID(ctx, args, "task", "id", "title"); err != nil {
			return "", eval, err
		}
	case "add_subtask", "update_subtask", "delete_subtask":
		if err := r.resolveEntityID(ctx, args, "task", "taskId", "taskTitle"); err != nil {
			return "", eval, err
		}
	case "update_event", "delete_event":
		if err := r.resolveEntityID(ctx, args, "event", "id", "title"); err != nil {
			return "", eval, err
		}
	case "update_note", "delete_note":
		if err := r.resolveEntityID(ctx, args, "note", "id", "title"); err != nil {
			return "", eval, err
		}
	case "update_file":
		if err := r.resolveEntityID(ctx, args, "file", "id", "name"); err != nil {
			return "", eval, err
		}
	case "update_folder":
		if err := r.resolveEntityID(ctx, args, "folder", "id", "name"); err != nil {
			return "", eval, err
		}
	}

	switch toolName {
	case "create_task":
		title, _ := args["title"].(string)
		if title == "" {
			return "", eval, fmt.Errorf("task title is required")
		}
		preview := fmt.Sprintf("I'll create a task:\nTitle: %s", title)
		if due, ok := args["dueDate"].(string); ok && due != "" {
			preview += fmt.Sprintf("\nDue: %s", due)
		}
		return preview, eval, nil

	case "search_tasks", "get_task":
		return "Searching tasks...", eval, nil

	case "update_task":
		return "I'll update the task.", eval, nil

	case "add_subtask", "update_subtask":
		return "I'll update the task's subtasks.", eval, nil

	case "delete_subtask":
		title, _ := args["originalTitle"].(string)
		return fmt.Sprintf("I will DELETE the subtask: %s", title), eval, nil

	case "delete_task":
		title := getString(args, "title")
		if title == "" {
			title = getString(args, "id")
		}
		return fmt.Sprintf("I will DELETE the task: %s", title), eval, nil

	case "bulk_update_tasks":
		taskIds, _ := args["taskIds"].([]interface{})
		return fmt.Sprintf("I will update %d tasks.", len(taskIds)), eval, nil

	case "bulk_delete_tasks":
		taskIds, _ := args["taskIds"].([]interface{})
		return fmt.Sprintf("I will DELETE %d tasks.", len(taskIds)), eval, nil

	case "create_event":
		title, _ := args["title"].(string)
		date, _ := args["date"].(string)
		if title == "" || date == "" {
			return "", eval, fmt.Errorf("event title and date are required")
		}
		return fmt.Sprintf("I'll schedule an event:\n%s on %s", title, date), eval, nil

	case "search_events", "get_event":
		return "Checking calendar...", eval, nil

	case "update_event":
		return "I'll update the event.", eval, nil

	case "delete_event":
		title := getString(args, "title")
		if title == "" {
			title = getString(args, "id")
		}
		return fmt.Sprintf("I will DELETE the event: %s", title), eval, nil

	case "create_note":
		title, _ := args["title"].(string)
		if title == "" {
			return "", eval, fmt.Errorf("note title is required")
		}
		return fmt.Sprintf("I'll create a note:\n%s", title), eval, nil

	case "search_notes", "get_note":
		return "Searching notes...", eval, nil

	case "update_note":
		return "I'll update the note.", eval, nil

	case "delete_note":
		title := getString(args, "title")
		if title == "" {
			title = getString(args, "id")
		}
		return fmt.Sprintf("I will DELETE the note: %s", title), eval, nil

	case "search_files", "search_folders":
		return "Searching files...", eval, nil

	case "create_folder":
		name, _ := args["name"].(string)
		if name == "" {
			return "", eval, fmt.Errorf("folder name is required")
		}
		return fmt.Sprintf("I'll create a folder: %s", name), eval, nil

	case "update_file", "update_folder":
		return fmt.Sprintf("I'll %s.", toolName), eval, nil

	case "delete_file", "delete_folder":
		name := getString(args, "name")
		if name == "" {
			name = getString(args, "id")
		}
		return fmt.Sprintf("I will DELETE %s: %s", toolName, name), eval, nil

	case "reset_workspace":
		scopes, _ := args["scope"].([]interface{})
		var scopeNames []string
		for _, s := range scopes {
			if str, ok := s.(string); ok {
				scopeNames = append(scopeNames, str)
			}
		}
		return fmt.Sprintf("You are about to PERMANENTLY RESET: %s.", strings.Join(scopeNames, ", ")), eval, nil

	default:
		return "", eval, fmt.Errorf("unsupported tool action: %s", toolName)
	}
}

func (r *Router) ExecuteTool(ctx context.Context, toolName string, args map[string]interface{}) RouteResult {
	_, eval, err := r.ValidateToolCall(ctx, toolName, args)
	if err != nil && eval.Decision != PolicyClarify {
		return RouteResult{
			Status: "error",
			Tool:   toolName,
			Error:  &RouteError{Code: "validation_error", Message: err.Error()},
		}
	}

	var executeErr error
	userID, _ := ctx.Value("userID").(uuid.UUID)

	switch toolName {
	case "create_task":
		var subtasks []models.Subtask
		if stList, ok := args["subtasks"].([]interface{}); ok {
			for _, stItem := range stList {
				if stMap, ok := stItem.(map[string]interface{}); ok {
					if title, ok := stMap["title"].(string); ok && title != "" {
						subtasks = append(subtasks, models.Subtask{
							Title:       title,
							IsCompleted: false,
						})
					}
				}
			}
		}

		executeErr = r.taskService.CreateTask(ctx, userID, &models.Task{
			Title:       getString(args, "title"),
			Description: getString(args, "description"),
			Priority:    normalizePriority(getString(args, "priority")),
			Status:      normalizeStatus(getString(args, "status")),
			StartDate:   parseOptionalString(getString(args, "startDate")),
			DueDate:     parseOptionalString(getString(args, "dueDate")),
			Subtasks:    subtasks,
		})
	case "update_task":
		taskID := parseUUID(getString(args, "id"))
		existingTask, err := r.taskService.GetTask(ctx, userID, taskID)
		if err != nil {
			executeErr = fmt.Errorf("task not found: %w", err)
			break
		}
		if val, ok := args["title"].(string); ok {
			existingTask.Title = val
		}
		if val, ok := args["description"].(string); ok {
			existingTask.Description = val
		}
		if val, ok := args["priority"].(string); ok {
			existingTask.Priority = normalizePriority(val)
		}
		if val, ok := args["status"].(string); ok {
			existingTask.Status = normalizeStatus(val)
		}
		if val, ok := args["startDate"]; ok {
			if val == nil {
				existingTask.StartDate = nil
			} else if s, ok := val.(string); ok {
				if s == "" {
					existingTask.StartDate = nil
				} else {
					existingTask.StartDate = &s
				}
			}
		}
		if val, ok := args["dueDate"]; ok {
			if val == nil {
				existingTask.DueDate = nil
			} else if s, ok := val.(string); ok {
				if s == "" {
					existingTask.DueDate = nil
				} else {
					existingTask.DueDate = &s
				}
			}
		}
		executeErr = r.taskService.UpdateTask(ctx, userID, existingTask)

	case "add_subtask":
		taskID := parseUUID(getString(args, "taskId"))
		existingTask, err := r.taskService.GetTask(ctx, userID, taskID)
		if err != nil {
			executeErr = fmt.Errorf("task not found: %w", err)
			break
		}
		title := getString(args, "title")
		if title == "" {
			executeErr = fmt.Errorf("subtask title is required")
			break
		}
		existingTask.Subtasks = append(existingTask.Subtasks, models.Subtask{
			Title:       title,
			IsCompleted: false,
		})
		executeErr = r.taskService.UpdateTask(ctx, userID, existingTask)

	case "update_subtask":
		taskID := parseUUID(getString(args, "taskId"))
		existingTask, err := r.taskService.GetTask(ctx, userID, taskID)
		if err != nil {
			executeErr = fmt.Errorf("task not found: %w", err)
			break
		}
		originalTitle := getString(args, "originalTitle")
		var matchIndex = -1
		var matchCount = 0
		for i, st := range existingTask.Subtasks {
			if strings.EqualFold(st.Title, originalTitle) {
				matchIndex = i
				matchCount++
			}
		}
		if matchCount == 0 {
			executeErr = fmt.Errorf("subtask '%s' not found", originalTitle)
			break
		}
		if matchCount > 1 {
			executeErr = fmt.Errorf("found %d subtasks named '%s'. Please ask the user for clarification", matchCount, originalTitle)
			break
		}
		if val, ok := args["newTitle"].(string); ok && val != "" {
			existingTask.Subtasks[matchIndex].Title = val
		}
		if val, ok := args["isCompleted"].(bool); ok {
			existingTask.Subtasks[matchIndex].IsCompleted = val
		}
		executeErr = r.taskService.UpdateTask(ctx, userID, existingTask)

	case "delete_subtask":
		taskID := parseUUID(getString(args, "taskId"))
		existingTask, err := r.taskService.GetTask(ctx, userID, taskID)
		if err != nil {
			executeErr = fmt.Errorf("task not found: %w", err)
			break
		}
		originalTitle := getString(args, "originalTitle")
		var newSubtasks []models.Subtask
		var matchCount = 0
		for _, st := range existingTask.Subtasks {
			if strings.EqualFold(st.Title, originalTitle) {
				matchCount++
			} else {
				newSubtasks = append(newSubtasks, st)
			}
		}
		if matchCount == 0 {
			executeErr = fmt.Errorf("subtask '%s' not found", originalTitle)
			break
		}
		if matchCount > 1 {
			executeErr = fmt.Errorf("found %d subtasks named '%s'. Please ask the user for clarification", matchCount, originalTitle)
			break
		}
		existingTask.Subtasks = newSubtasks
		executeErr = r.taskService.UpdateTask(ctx, userID, existingTask)

	case "delete_task":
		executeErr = r.taskService.DeleteTask(ctx, userID, parseUUID(getString(args, "id")))

	case "bulk_update_tasks":
		if taskIds, ok := args["taskIds"].([]interface{}); ok {
			var errs []string
			for _, idInterface := range taskIds {
				if idStr, ok := idInterface.(string); ok {
					taskID := parseUUID(idStr)
					existingTask, err := r.taskService.GetTask(ctx, userID, taskID)
					if err != nil {
						errs = append(errs, fmt.Sprintf("Failed to get %s: %v", idStr, err))
						continue
					}
					if val, ok := args["priority"].(string); ok {
						existingTask.Priority = normalizePriority(val)
					}
					if val, ok := args["status"].(string); ok {
						existingTask.Status = normalizeStatus(val)
					}
					err = r.taskService.UpdateTask(ctx, userID, existingTask)
					if err != nil {
						errs = append(errs, fmt.Sprintf("Failed to update %s: %v", idStr, err))
					}
				}
			}
			if len(errs) > 0 {
				executeErr = fmt.Errorf("bulk update partial failure: %s", strings.Join(errs, "; "))
			}
		}

	case "bulk_delete_tasks":
		if taskIds, ok := args["taskIds"].([]interface{}); ok {
			var errs []string
			for _, idInterface := range taskIds {
				if idStr, ok := idInterface.(string); ok {
					err := r.taskService.DeleteTask(ctx, userID, parseUUID(idStr))
					if err != nil {
						errs = append(errs, fmt.Sprintf("Failed to delete %s: %v", idStr, err))
					}
				}
			}
			if len(errs) > 0 {
				executeErr = fmt.Errorf("bulk delete partial failure: %s", strings.Join(errs, "; "))
			}
		}

	case "search_tasks":
		tasksList, err := r.taskService.ListTasks(ctx, userID)
		if err == nil {
			compact := make([]map[string]interface{}, 0)
			for i, t := range tasksList {
				if i >= 7 {
					break
				}
				compact = append(compact, map[string]interface{}{
					"id": t.ID, "title": t.Title, "priority": t.Priority, "status": t.Status,
					"startDate": t.StartDate, "dueDate": t.DueDate,
				})
			}
			args["results"] = compact
		} else {
			executeErr = err
		}

	case "get_task":
		taskID := parseUUID(getString(args, "id"))
		if taskID == uuid.Nil {
			executeErr = fmt.Errorf("invalid or missing task id")
			break
		}
		task, err := r.taskService.GetTask(ctx, userID, taskID)
		if err == nil {
			args["task"] = task
		} else {
			executeErr = err
		}

	case "create_event":
		allDay := false
		if v, ok := args["allDay"].(bool); ok {
			allDay = v
		}
		executeErr = r.calendarService.CreateEvent(ctx, userID, &models.CalendarEvent{
			Title:       getString(args, "title"),
			Description: getString(args, "description"),
			Date:        getString(args, "date"),
			StartTime:   parseOptionalString(getString(args, "startTime")),
			EndTime:     parseOptionalString(getString(args, "endTime")),
			AllDay:      allDay,
			Calendar:    getString(args, "calendar"),
		})
	case "delete_event":
		executeErr = r.calendarService.DeleteEvent(ctx, userID, parseUUID(getString(args, "id")))
	case "search_events", "get_event":
		eventsList, err := r.calendarService.ListEvents(ctx, userID)
		if err == nil {
			compact := make([]map[string]interface{}, 0)
			for i, e := range eventsList {
				if i >= 5 {
					break
				}
				compact = append(compact, map[string]interface{}{
					"id": e.ID, "title": e.Title, "date": e.Date, "allDay": e.AllDay,
				})
			}
			args["results"] = compact
		} else {
			executeErr = err
		}

	case "create_note":
		executeErr = r.notesService.CreateNote(ctx, userID, &models.Note{
			Title:   getString(args, "title"),
			Content: getString(args, "content"),
		})
	case "delete_note":
		executeErr = r.notesService.DeleteNote(ctx, userID, parseUUID(getString(args, "id")))
	case "search_notes", "get_note":
		notesList, err := r.notesService.ListNotes(ctx, userID)
		if err == nil {
			compact := make([]map[string]interface{}, 0)
			for i, n := range notesList {
				if i >= 5 {
					break
				}
				contentSnippet := n.Content
				if len(contentSnippet) > 100 {
					contentSnippet = contentSnippet[:100] + "..."
				}
				compact = append(compact, map[string]interface{}{
					"id": n.ID, "title": n.Title, "content": contentSnippet,
				})
			}
			args["results"] = compact
		} else {
			executeErr = err
		}

	case "create_folder":
		parentIDStr := getString(args, "parentId")
		var parentID *uuid.UUID
		if parentIDStr != "" && parentIDStr != "null" {
			pid := parseUUID(parentIDStr)
			if pid != uuid.Nil {
				parentID = &pid
			}
		}
		executeErr = r.filesService.CreateFolder(ctx, userID, &models.Folder{
			Name:     getString(args, "name"),
			ParentID: parentID,
		})
	case "update_folder":
		folderID := parseUUID(getString(args, "id"))
		existingFolder, err := r.filesService.GetFolder(ctx, userID, folderID)
		if err != nil {
			executeErr = fmt.Errorf("folder not found: %w", err)
			break
		}
		if val, ok := args["newName"].(string); ok && val != "" {
			existingFolder.Name = val
		}
		if val, ok := args["isStarred"].(bool); ok {
			existingFolder.IsStarred = val
		}
		if folderIDStr := getString(args, "folderId"); folderIDStr != "" {
			if folderIDStr == "null" {
				existingFolder.ParentID = nil
			} else {
				pid := parseUUID(folderIDStr)
				if pid != uuid.Nil {
					existingFolder.ParentID = &pid
				}
			}
		}
		executeErr = r.filesService.UpdateFolder(ctx, userID, existingFolder)
		
	case "delete_folder":
		executeErr = r.filesService.DeleteFolder(ctx, userID, parseUUID(getString(args, "id")))
		
	case "update_file":
		fileID := parseUUID(getString(args, "id"))
		existingFile, err := r.filesService.GetFile(ctx, userID, fileID)
		if err != nil {
			executeErr = fmt.Errorf("file not found: %w", err)
			break
		}
		if val, ok := args["newName"].(string); ok && val != "" {
			existingFile.Name = val
		}
		if val, ok := args["isStarred"].(bool); ok {
			existingFile.IsStarred = val
		}
		if folderIDStr := getString(args, "folderId"); folderIDStr != "" {
			if folderIDStr == "null" {
				existingFile.FolderID = nil
			} else {
				pid := parseUUID(folderIDStr)
				if pid != uuid.Nil {
					existingFile.FolderID = &pid
				}
			}
		}
		executeErr = r.filesService.UpdateFile(ctx, userID, existingFile)
		
	case "delete_file":
		executeErr = r.filesService.DeleteFile(ctx, userID, parseUUID(getString(args, "id")))
	case "search_files", "search_folders":
		filesList, err1 := r.filesService.ListFiles(ctx, userID)
		foldersList, err2 := r.filesService.ListFolders(ctx, userID)
		if err1 == nil && err2 == nil {
			compactFiles := make([]map[string]interface{}, 0)
			for i, f := range filesList {
				if i >= 5 {
					break
				}
				compactFiles = append(compactFiles, map[string]interface{}{
					"id": f.ID, "name": f.Name, "kind": f.Kind,
				})
			}
			compactFolders := make([]map[string]interface{}, 0)
			for i, f := range foldersList {
				if i >= 5 {
					break
				}
				compactFolders = append(compactFolders, map[string]interface{}{
					"id": f.ID, "name": f.Name,
				})
			}
			args["results"] = map[string]interface{}{
				"files":   compactFiles,
				"folders": compactFolders,
			}
		} else {
			if err1 != nil {
				executeErr = err1
			} else {
				executeErr = err2
			}
		}

	case "reset_workspace":
		scopes, _ := args["scope"].([]interface{})
		for _, s := range scopes {
			if str, ok := s.(string); ok {
				switch str {
				case "tasks":
					tasksList, _ := r.taskService.ListTasks(ctx, userID)
					for _, t := range tasksList {
						r.taskService.DeleteTask(ctx, userID, t.ID)
					}
				case "calendar":
					eventsList, _ := r.calendarService.ListEvents(ctx, userID)
					for _, e := range eventsList {
						r.calendarService.DeleteEvent(ctx, userID, e.ID)
					}
				case "notes":
					notesList, _ := r.notesService.ListNotes(ctx, userID)
					for _, n := range notesList {
						r.notesService.DeleteNote(ctx, userID, n.ID)
					}
				case "files":
					filesList, _ := r.filesService.ListFiles(ctx, userID)
					for _, f := range filesList {
						r.filesService.DeleteFile(ctx, userID, f.ID)
					}
					foldersList, _ := r.filesService.ListFolders(ctx, userID)
					for _, f := range foldersList {
						r.filesService.DeleteFolder(ctx, userID, f.ID)
					}
				}
			}
		}

	default:
	}

	if executeErr != nil {
		return RouteResult{
			Status: "error",
			Tool:   toolName,
			Error:  &RouteError{Code: "execution_error", Message: executeErr.Error()},
		}
	}

	return RouteResult{
		Status:  "success",
		Tool:    toolName,
		Message: fmt.Sprintf("%s executed successfully.", toolName),
		Data:    args,
	}
}

type StoredAction struct {
	ConfirmationID string
	ToolName       string
	Args           map[string]interface{}
	ExpiresAt      time.Time
	Executed       bool
}

func getString(args map[string]interface{}, key string) string {
	if v, ok := args[key].(string); ok {
		return v
	}
	return ""
}

func parseOptionalString(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func parseOptionalDate(s string) *time.Time {
	if s == "" {
		return nil
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return nil
	}
	return &t
}

func parseUUID(s string) uuid.UUID {
	id, err := uuid.Parse(s)
	if err != nil {
		return uuid.Nil
	}
	return id
}

func normalizePriority(p string) string {
	if p == "" {
		return "None"
	}
	return p
}

func normalizeStatus(s string) string {
	if s == "" {
		return "backlog"
	}
	return s
}
