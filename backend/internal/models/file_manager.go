package models

import (
	"time"

	"github.com/google/uuid"
)

type Folder struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"-"`
	Name      string     `json:"name"`
	ParentID  *uuid.UUID `json:"parentId"`
	IsStarred bool       `json:"isStarred"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

type File struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"-"`
	Name      string     `json:"name"`
	FolderID  *uuid.UUID `json:"folderId"`
	Kind      string     `json:"kind"`
	Size      int64      `json:"size"`
	IsStarred bool       `json:"isStarred"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}
