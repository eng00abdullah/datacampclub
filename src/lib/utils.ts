import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Validates password strength
 * Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) return { isValid: false, message: 'Password must be at least 8 characters long.' };
  if (!/[A-Z]/.test(password)) return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  if (!/[a-z]/.test(password)) return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  if (!/[0-9]/.test(password)) return { isValid: false, message: 'Password must contain at least one number.' };
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return { isValid: false, message: 'Password must contain at least one special character.' };
  return { isValid: true, message: 'Strong password.' };
};

