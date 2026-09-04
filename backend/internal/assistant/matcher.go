package assistant

import (
	"errors"
	"fmt"
	"strings"

	"chisa-assistant-backend/internal/models"
)

type Matchable interface {
	GetID() string
	GetTitle() string
	GetMetadata() string
}

func MatchEntity(query string, entities []Matchable) (string, error) {
	if query == "" {
		return "", fmt.Errorf("search query is empty")
	}

	var exact []Matchable
	var caseInsens []Matchable
	var normalized []Matchable
	var partial []Matchable

	normQuery := normalizeString(query)
	lowerQuery := strings.ToLower(query)

	for _, e := range entities {
		title := e.GetTitle()
		lowerTitle := strings.ToLower(title)
		normTitle := normalizeString(title)

		if title == query {
			exact = append(exact, e)
		} else if lowerTitle == lowerQuery {
			caseInsens = append(caseInsens, e)
		} else if normTitle == normQuery {
			normalized = append(normalized, e)
		} else if strings.Contains(lowerTitle, lowerQuery) {
			partial = append(partial, e)
		}
	}

	if len(exact) > 0 {
		return checkSingleMatch(exact, query)
	}
	if len(caseInsens) > 0 {
		return checkSingleMatch(caseInsens, query)
	}
	if len(normalized) > 0 {
		return checkSingleMatch(normalized, query)
	}
	if len(partial) > 0 {
		return checkSingleMatch(partial, query)
	}

	return "", fmt.Errorf("could not find any item matching '%s'", query)
}

func checkSingleMatch(matches []Matchable, query string) (string, error) {
	if len(matches) == 1 {
		return matches[0].GetID(), nil
	}

	var b strings.Builder
	b.WriteString(fmt.Sprintf("I found %d items matching '%s'. Which one do you mean?\n", len(matches), query))
	for i, m := range matches {
		if i >= 5 {
			b.WriteString(fmt.Sprintf("- ... and %d more\n", len(matches)-5))
			break
		}
		b.WriteString(fmt.Sprintf("- Title: '%s'", m.GetTitle()))
		if m.GetMetadata() != "" {
			b.WriteString(fmt.Sprintf(" (%s)", m.GetMetadata()))
		}
		b.WriteString("\n")
	}
	return "", errors.New(b.String())
}

func normalizeString(s string) string {
	return strings.Join(strings.Fields(strings.ToLower(s)), " ")
}

// Entity Wrappers

type noteMatcher struct{ *models.Note }
func (m noteMatcher) GetID() string       { return m.ID.String() }
func (m noteMatcher) GetTitle() string    { return m.Title }
func (m noteMatcher) GetMetadata() string { return "" }

func wrapNotes(items []*models.Note) []Matchable {
	res := make([]Matchable, len(items))
	for i, v := range items {
		res[i] = noteMatcher{v}
	}
	return res
}

type taskMatcher struct{ *models.Task }
func (m taskMatcher) GetID() string       { return m.ID.String() }
func (m taskMatcher) GetTitle() string    { return m.Title }
func (m taskMatcher) GetMetadata() string { return fmt.Sprintf("Status: %s", m.Status) }

func wrapTasks(items []*models.Task) []Matchable {
	res := make([]Matchable, len(items))
	for i, v := range items {
		res[i] = taskMatcher{v}
	}
	return res
}

type eventMatcher struct{ *models.CalendarEvent }
func (m eventMatcher) GetID() string       { return m.ID.String() }
func (m eventMatcher) GetTitle() string    { return m.Title }
func (m eventMatcher) GetMetadata() string { return fmt.Sprintf("Date: %s", m.Date) }

func wrapEvents(items []*models.CalendarEvent) []Matchable {
	res := make([]Matchable, len(items))
	for i, v := range items {
		res[i] = eventMatcher{v}
	}
	return res
}

type fileMatcher struct{ *models.File }
func (m fileMatcher) GetID() string       { return m.ID.String() }
func (m fileMatcher) GetTitle() string    { return m.Name }
func (m fileMatcher) GetMetadata() string { return fmt.Sprintf("Kind: %s", m.Kind) }

func wrapFiles(items []*models.File) []Matchable {
	res := make([]Matchable, len(items))
	for i, v := range items {
		res[i] = fileMatcher{v}
	}
	return res
}

type folderMatcher struct{ *models.Folder }
func (m folderMatcher) GetID() string       { return m.ID.String() }
func (m folderMatcher) GetTitle() string    { return m.Name }
func (m folderMatcher) GetMetadata() string { return "" }

func wrapFolders(items []*models.Folder) []Matchable {
	res := make([]Matchable, len(items))
	for i, v := range items {
		res[i] = folderMatcher{v}
	}
	return res
}
