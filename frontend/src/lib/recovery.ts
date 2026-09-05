import { getRecoveryCode as apiGetRecoveryCode, generateRecoveryCode as apiGenerateRecoveryCode } from "./api/auth";

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
  
  const normalizedInput = inputCode.replace(/-/g, "").trim();
  return normalizedInput.length === 16;
}
