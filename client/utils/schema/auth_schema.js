import { z } from 'zod';

export const SignupSchema = z.object({
  username: z.string().min(1, { message: "Name is required" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
  phone: z.string().min(1, { message: "Phone number is required" }),
  role: z.string().min(1, { message: "Role is required" }),
});

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export const GenerateOTPSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
});

export const ChangePasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  otp: z.string().min(4, { message: "OTP must be at least 4 characters long" }),
  new_password: z.string().min(8, { message: "New password must be at least 8 characters long" })
});