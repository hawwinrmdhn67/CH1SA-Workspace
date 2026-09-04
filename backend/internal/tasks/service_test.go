package tasks

import (
	"testing"
)

func TestValidateDates(t *testing.T) {
	strPtr := func(s string) *string { return &s }

	tests := []struct {
		name    string
		start   *string
		due     *string
		wantErr bool
	}{
		{"both nil", nil, nil, false},
		{"start nil", nil, strPtr("2026-09-06"), false},
		{"due nil", strPtr("2026-09-04"), nil, false},
		{"valid range", strPtr("2026-09-04"), strPtr("2026-09-06"), false},
		{"same day", strPtr("2026-09-04"), strPtr("2026-09-04"), false},
		{"invalid range", strPtr("2026-09-06"), strPtr("2026-09-04"), true},
		{"invalid start format", strPtr("04-09-2026"), strPtr("2026-09-04"), true},
		{"invalid due format", strPtr("2026-09-04"), strPtr("04-09-2026"), true},
		{"empty string", strPtr(""), strPtr(""), false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateDates(tt.start, tt.due)
			if (err != nil) != tt.wantErr {
				t.Errorf("validateDates() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
