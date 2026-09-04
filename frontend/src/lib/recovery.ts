import { getRecoveryCode as apiGetRecoveryCode, generateRecoveryCode as apiGenerateRecoveryCode } from "./api/auth";

/**
 * Utility functions for managing recovery codes via the API.
 */

export async function generateRecoveryCode(): Promise<string> {
  return await apiGenerateRecoveryCode();
}

export async function fetchRecoveryCode(): Promise<string | null> {
  try {
    return await apiGetRecoveryCode();
  } catch (e) {
    return null;
  }
}

export function verifyRecoveryCodeFormat(inputCode: string): boolean {
  // Just a basic format check before sending to the API.
  const normalizedInput = inputCode.replace(/-/g, "").trim();
  return normalizedInput.length === 16;
}
