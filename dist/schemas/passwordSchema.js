"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.verifyOTPSchema = exports.forgotPasswordSchema = exports.chnagePasswordSchema = void 0;
// src/schemas/passwordSchema.ts
const zod_1 = __importDefault(require("zod"));
exports.chnagePasswordSchema = zod_1.default.object({
    oldPassword: zod_1.default.string().min(6, "Old password must be at least 6 characters long"),
    newPassword: zod_1.default.string().min(6, "New password must be at least 6 characters long"),
});
exports.forgotPasswordSchema = zod_1.default.object({
    email: zod_1.default.string().email("Invalid email address"),
});
exports.verifyOTPSchema = zod_1.default.object({
    email: zod_1.default.string().email("Invalid email address"),
    otp: zod_1.default.string().length(6, "OTP must be 6 characters long"),
});
exports.resetPasswordSchema = zod_1.default.object({
    email: zod_1.default.string().email("Invalid email address"),
    newPassword: zod_1.default.string().min(6, "New password must be at least 6 characters long"),
});
