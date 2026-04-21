// src/schemas/companySchema.ts
import { z } from "zod";

export const companyRegisterSchema = z.object({
    name: z.string().min(1, "Company Name is required"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    image: z.string().optional(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: z
        .string()
        .min(8, "Phone number mustbe at least 10 characters long")
        .max(16, "Phone number cannot exceed 15 characters"),
    countryCode: z.string().min(1, "Country code is required").optional(),
    address: z.string().min(1, "Address is required"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),

});


export const companyUpdateSchema = z.object({
    id: z.number(),
    name: z.string().optional(),
    email: z.string().optional(),
    image: z.string().optional(),
    address: z.string().min(1, "Address is required").optional(),
    countryCode: z.string().min(1, "Country code is required").optional(),
    mobileNumber: z
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});




export const companyProfileUpdateSchema = z.object({
    id: z.number(),

    address: z.string().min(1, "Address is required").optional(),
    countryCode: z.string().min(1, "Country code is required").optional(),
    mobileNumber: z
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
});

export const companyIdSchema = z.object({
    id: z.coerce.number(),
});
export const chnagePasswordSchema = z.object({
    oldPassword: z.string().min(6, "Old password must be at least 6 characters long"),
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
});

export const updateProfileImageSchema = z.object({
    profileImage: z.string(),
})

export type UpdateProfileImageDTO = z.infer<typeof updateProfileImageSchema>;




export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
});

export const verifyOTPSchema = z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be 6 characters long"),
});

export const resetPasswordSchema = z.object({
    newPassword: z.string().min(6, "New password must be at least 6 characters long"),
})
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type verifyOTPDTO = z.infer<typeof verifyOTPSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;



export type ChangePasswordDTO = z.infer<typeof chnagePasswordSchema>;

export type RegisterCompanyDTO = z.infer<typeof companyRegisterSchema>;

export type UpdateCompanyDTO = z.infer<typeof companyUpdateSchema>;

export type UpdateCompanyProfileDTO = z.infer<typeof companyProfileUpdateSchema>;
export type CompanyIdDTO = z.infer<typeof companyIdSchema>;