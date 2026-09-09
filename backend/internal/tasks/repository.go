package tasks

import (
	"context"
	"fmt"
	"time"

	"chisa-assistant-backend/internal/database"
	"chisa-assistant-backend/internal/models"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, userID uuid.UUID, task *models.Task) error
	GetByID(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*models.Task, error)
	List(ctx context.Context, userID uuid.UUID) ([]*models.Task, error)
	Update(ctx context.Context, userID uuid.UUID, task *models.Task) error
	Delete(ctx context.Context, userID uuid.UUID, id uuid.UUID) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) Create(ctx context.Context, userID uuid.UUID, task *models.Task) error {
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO tasks (user_id, title, description, status, priority, start_date, due_date, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id
	`
	now := time.Now()
	task.CreatedAt = now
	task.UpdatedAt = now

	err = tx.QueryRow(ctx, query,
		userID,
		task.Title,
		task.Description,
		task.Status,
		task.Priority,
		task.StartDate,
		task.DueDate,
		task.CreatedAt,
		task.UpdatedAt,
	).Scan(&task.ID)

	if err != nil {
		return fmt.Errorf("failed to create task: %w", err)
	}

	if len(task.Subtasks) > 0 {
		for i, st := range task.Subtasks {
			stQuery := `
				INSERT INTO subtasks (user_id, task_id, title, is_completed, position, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id
			`
			st.CreatedAt = now
			st.UpdatedAt = now
			err = tx.QueryRow(ctx, stQuery, userID, task.ID, st.Title, st.IsCompleted, i, st.CreatedAt, st.UpdatedAt).Scan(&st.ID)
			if err != nil {
				return fmt.Errorf("failed to create subtask: %w", err)
			}
			task.Subtasks[i] = st
		}
	}

	if task.Subtasks == nil {
		task.Subtasks = []models.Subtask{}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

func (r *repository) GetByID(ctx context.Context, userID uuid.UUID, id uuid.UUID) (*models.Task, error) {
	query := `
		SELECT id, title, description, status, priority, start_date::text, due_date::text, created_at, updated_at
		FROM tasks
		WHERE id = $1 AND user_id = $2
	`
	task := &models.Task{}
	err := database.Pool.QueryRow(ctx, query, id, userID).Scan(
		&task.ID,
		&task.Title,
		&task.Description,
		&task.Status,
		&task.Priority,
		&task.StartDate,
		&task.DueDate,
		&task.CreatedAt,
		&task.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	stQuery := `SELECT id, task_id, title, is_completed, position, created_at, updated_at FROM subtasks WHERE task_id = $1 AND user_id = $2 ORDER BY position ASC`
	rows, err := database.Pool.Query(ctx, stQuery, id, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get subtasks: %w", err)
	}
	defer rows.Close()

	task.Subtasks = []models.Subtask{}
	for rows.Next() {
		var st models.Subtask
		if err := rows.Scan(&st.ID, &st.TaskID, &st.Title, &st.IsCompleted, &st.Position, &st.CreatedAt, &st.UpdatedAt); err != nil {
			return nil, fmt.Errorf("failed to scan subtask: %w", err)
		}
		task.Subtasks = append(task.Subtasks, st)
	}

	return task, nil
}

func (r *repository) List(ctx context.Context, userID uuid.UUID) ([]*models.Task, error) {
	query := `
		SELECT id, title, description, status, priority, start_date::text, due_date::text, created_at, updated_at
		FROM tasks
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := database.Pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to list tasks: %w", err)
	}
	defer rows.Close()

	var tasks []*models.Task
	taskIDs := []uuid.UUID{}
	
	for rows.Next() {
		task := &models.Task{}
		err := rows.Scan(
			&task.ID,
			&task.Title,
			&task.Description,
			&task.Status,
			&task.Priority,
			&task.StartDate,
			&task.DueDate,
			&task.CreatedAt,
			&task.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan task: %w", err)
		}
		task.Subtasks = []models.Subtask{}
		tasks = append(tasks, task)
		taskIDs = append(taskIDs, task.ID)
	}
	rows.Close()

	if len(tasks) > 0 {
		stQuery := `SELECT id, task_id, title, is_completed, position, created_at, updated_at FROM subtasks WHERE user_id = $1 ORDER BY task_id, position ASC`
		stRows, err := database.Pool.Query(ctx, stQuery, userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get subtasks: %w", err)
		}
		defer stRows.Close()

		subtasksByTask := make(map[uuid.UUID][]models.Subtask)
		for stRows.Next() {
			var st models.Subtask
			if err := stRows.Scan(&st.ID, &st.TaskID, &st.Title, &st.IsCompleted, &st.Position, &st.CreatedAt, &st.UpdatedAt); err != nil {
				return nil, fmt.Errorf("failed to scan subtask: %w", err)
			}
			subtasksByTask[st.TaskID] = append(subtasksByTask[st.TaskID], st)
		}
		
		for _, task := range tasks {
			if stList, ok := subtasksByTask[task.ID]; ok {
				task.Subtasks = stList
			}
		}
	}

	return tasks, nil
}

func (r *repository) Update(ctx context.Context, userID uuid.UUID, task *models.Task) error {
	tx, err := database.Pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	query := `
		UPDATE tasks
		SET title = $1, description = $2, status = $3, priority = $4, start_date = $5, due_date = $6, updated_at = $7
		WHERE id = $8 AND user_id = $9
	`
	task.UpdatedAt = time.Now()
	_, err = tx.Exec(ctx, query,
		task.Title,
		task.Description,
		task.Status,
		task.Priority,
		task.StartDate,
		task.DueDate,
		task.UpdatedAt,
		task.ID,
		userID,
	)
	if err != nil {
		return fmt.Errorf("failed to update task: %w", err)
	}

	delQuery := `DELETE FROM subtasks WHERE task_id = $1 AND user_id = $2`
	if _, err := tx.Exec(ctx, delQuery, task.ID, userID); err != nil {
		return fmt.Errorf("failed to clear subtasks: %w", err)
	}

	if len(task.Subtasks) > 0 {
		for i, st := range task.Subtasks {
			stQuery := `
				INSERT INTO subtasks (user_id, task_id, title, is_completed, position, created_at, updated_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id
			`
			st.CreatedAt = time.Now()
			st.UpdatedAt = time.Now()
			err = tx.QueryRow(ctx, stQuery, userID, task.ID, st.Title, st.IsCompleted, i, st.CreatedAt, st.UpdatedAt).Scan(&st.ID)
			if err != nil {
				return fmt.Errorf("failed to insert subtask: %w", err)
			}
			task.Subtasks[i] = st
		}
	} else {
		task.Subtasks = []models.Subtask{}
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}
	return nil
}

func (r *repository) Delete(ctx context.Context, userID uuid.UUID, id uuid.UUID) error {
	query := `DELETE FROM tasks WHERE id = $1 AND user_id = $2`
	_, err := database.Pool.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}
	return nil
}
