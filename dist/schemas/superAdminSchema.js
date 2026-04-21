"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.updateProfileImageSchema = exports.blogByIdSchema = exports.Contactinfo = exports.deleteContact = exports.contact = exports.deleteblogSchema = exports.publishblogSchema = exports.blogSchema = exports.notifictaion = exports.addNewCompanySchema = exports.companyStatus = exports.rejectCompanyRequestSchema = exports.approveCompanyRequestSchema = exports.superAdminSchema = void 0;
// src/schemas/superAdminSchema.ts
const zod_1 = __importDefault(require("zod"));
exports.superAdminSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string(),
});
exports.approveCompanyRequestSchema = zod_1.default.object({
    id: zod_1.default.number(),
});
exports.rejectCompanyRequestSchema = zod_1.default.object({
    id: zod_1.default.number(),
});
exports.companyStatus = zod_1.default.object({
    id: zod_1.default.number(),
});
exports.addNewCompanySchema = zod_1.default.object({
    name: zod_1.default.string().min(1, "Company Name is required"),
    email: zod_1.default.string().email("Invalid email format").min(1, "Email is required"),
    image: zod_1.default.string(),
    password: zod_1.default.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: zod_1.default
        .string()
        .min(8, "Phone number mustbe at least 10 characters long")
        .max(16, "Phone number cannot exceed 15 characters"),
    countryCode: zod_1.default.string().min(1, "Country code is required").optional(),
    address: zod_1.default.string().min(1, "Address is required"),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.notifictaion = zod_1.default.object({
    id: zod_1.default.number(),
});
exports.blogSchema = zod_1.default.object({
    blogTitle: zod_1.default.string(),
    category: zod_1.default.string(),
    publishDate: zod_1.default.string(),
    image: zod_1.default.string(),
    blogBody: zod_1.default.string(),
    status: zod_1.default.string()
});
exports.publishblogSchema = zod_1.default.object({
    id: zod_1.default.number(),
    blogTitle: zod_1.default.string(),
    category: zod_1.default.string(),
    publishDate: zod_1.default.string(),
    image: zod_1.default.string(),
    blogBody: zod_1.default.string(),
    status: zod_1.default.string()
});
exports.deleteblogSchema = zod_1.default.object({
    id: zod_1.default.coerce.number(),
});
exports.contact = zod_1.default.object({
    name: zod_1.default.string().min(1, "Company Name is required"),
    email: zod_1.default.string().email("Invalid email format").min(1, "Email is required"),
    mobileNumber: zod_1.default
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
    countryCode: zod_1.default.string().min(1, "Country code is required").optional(),
    message: zod_1.default.string().min(1, "Message is required"),
    submittedAt: zod_1.default.string().optional(),
});
exports.deleteContact = zod_1.default.object({
    id: zod_1.default.coerce.number(),
});
exports.Contactinfo = zod_1.default.object({
    id: zod_1.default.coerce.number(),
});
exports.blogByIdSchema = zod_1.default.object({
    id: zod_1.default.coerce.number(),
});
exports.updateProfileImageSchema = zod_1.default.object({
    profileImage: zod_1.default.string(),
});
exports.logout = zod_1.default.object({
    deviceToken: zod_1.default.string()
});
