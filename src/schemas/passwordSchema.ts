// src/schemas/passwordSchema.ts
import z from "zod";
export const chnagePasswordSchema= z.object({
    oldPassword: z.string().min(6, "Old password must be at least 6 characters long"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"), 
});

export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const verifyOTPSchema = z.object({
    email: z.string().email("Invalid email address"),
   otp: z.string().length(6, "OTP must be 6 characters long"),
});

export const resetPasswordSchema = z.object({
     email: z.string().email("Invalid email address"),
     newPassword: z.string().min(6, "New password must be at least 6 characters long"), 
})

export type ChangePasswordDTO = z.infer<typeof chnagePasswordSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type verifyOTPDTO = z.infer<typeof verifyOTPSchema>;
export type ResetPasswordDTO=z.infer<typeof resetPasswordSchema>;

