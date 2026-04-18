import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+20|0)?1[0125][0-9]{8}$/, 'Invalid Egyptian phone number'),
  password: passwordSchema,
  confirmPassword: z.string(),
  faculty: z.string().min(1, 'Faculty is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const profileSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  phone: z.string().regex(/^(\+20|0)?1[0125][0-9]{8}$/, 'Invalid Egyptian phone number'),
  faculty: z.string().min(1, 'Faculty is required'),
  academicYear: z.string().min(1, 'Academic year is required'),
  photoURL: z.string().optional(),
});
