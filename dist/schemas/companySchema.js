"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.verifyOTPSchema = exports.forgotPasswordSchema = exports.updateProfileImageSchema = exports.chnagePasswordSchema = exports.companyIdSchema = exports.companyProfileUpdateSchema = exports.companyUpdateSchema = exports.companyRegisterSchema = void 0;
// src/schemas/companySchema.ts
const zod_1 = require("zod");
exports.companyRegisterSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Company Name is required"),
    email: zod_1.z.string().email("Invalid email format").min(1, "Email is required"),
    image: zod_1.z.string().optional(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: zod_1.z
        .string()
        .min(8, "Phone number mustbe at least 10 characters long")
        .max(16, "Phone number cannot exceed 15 characters"),
    countryCode: zod_1.z.string().min(1, "Country code is required").optional(),
    address: zod_1.z.string().min(1, "Address is required"),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
});
exports.companyUpdateSchema = zod_1.z.object({
    id: zod_1.z.number(),
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().optional(),
    image: zod_1.z.string().optional(),
    address: zod_1.z.string().min(1, "Address is required").optional(),
    countryCode: zod_1.z.string().min(1, "Country code is required").optional(),
    mobileNumber: zod_1.z
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
});
exports.companyProfileUpdateSchema = zod_1.z.object({
    id: zod_1.z.number(),
    address: zod_1.z.string().min(1, "Address is required").optional(),
    countryCode: zod_1.z.string().min(1, "Country code is required").optional(),
    mobileNumber: zod_1.z
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
});
exports.companyIdSchema = zod_1.z.object({
    id: zod_1.z.coerce.number(),
});
exports.chnagePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(6, "Old password must be at least 6 characters long"),
    newPassword: zod_1.z.string().min(6, "New password must be at least 6 characters long"),
});
exports.updateProfileImageSchema = zod_1.z.object({
    profileImage: zod_1.z.string(),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
});
exports.verifyOTPSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    otp: zod_1.z.string().length(6, "OTP must be 6 characters long"),
});
exports.resetPasswordSchema = zod_1.z.object({
    newPassword: zod_1.z.string().min(6, "New password must be at least 6 characters long"),
});
