package auth

import (
	"strings"
	"testing"
)

func TestGenerateRecoveryCode_Format(t *testing.T) {
	code := generateRecoveryCode()

	if len(code) != 19 {
		t.Errorf("Expected length 19, got %d for code %s", len(code), code)
	}

	parts := strings.Split(code, "-")
	if len(parts) != 4 {
		t.Errorf("Expected 4 groups, got %d", len(parts))
	}

	const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
	
	for _, part := range parts {
		if len(part) != 4 {
			t.Errorf("Expected each group to have 4 characters, got %d in %s", len(part), part)
		}
		
		for _, char := range part {
			if !strings.ContainsRune(charset, char) {
				t.Errorf("Character %c is not in allowed charset", char)
			}
		}
	}
}

func TestGenerateRecoveryCode_Uniqueness(t *testing.T) {
	generated := make(map[string]bool)
	const count = 1000

	for i := 0; i < count; i++ {
		code := generateRecoveryCode()
		
		if code == "SSSS-SSSS-SSSS-SSSS" {
			t.Errorf("Generated the known bad static placeholder")
		}

		if generated[code] {
			t.Errorf("Collision detected on code: %s at iteration %d", code, i)
		}
		generated[code] = true
	}

	if len(generated) != count {
		t.Errorf("Expected %d unique codes, got %d", count, len(generated))
	}
}
