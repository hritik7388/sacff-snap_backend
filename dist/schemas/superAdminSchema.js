"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.updateProfileImageSchema = exports.blogByIdSchema = exports.Contactinfo = exports.deleteContact = exports.contact = exports.deleteblogSchema = exports.publishblogSchema = exports.blogSchema = exports.notifictaion = exports.addNewCompanySchema = exports.changeQuestionnaireStatusSchema = exports.updateQuestionnaireSchema = exports.companyStatus = exports.rejectCompanyRequestSchema = exports.approveCompanyRequestSchema = exports.createQuestionnaireSchema = exports.generateVideoUploadSchema = exports.searchQuestionnaireSchema = exports.superAdminSchema = void 0;
// src/schemas/superAdminSchema.ts
const zod_1 = __importDefault(require("zod"));
exports.superAdminSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string(),
});
exports.searchQuestionnaireSchema = zod_1.default.object({
    search: zod_1.default.string().optional(),
    status: zod_1.default.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
    startDate: zod_1.default.string().optional(),
    endDate: zod_1.default.string().optional(),
});
exports.generateVideoUploadSchema = zod_1.default.object({
    filename: zod_1.default.string().trim().min(1, "Filename is required"),
    contentType: zod_1.default.enum([
        "video/mp4",
        "video/webm",
        "video/quicktime",
    ]),
});
exports.createQuestionnaireSchema = zod_1.default.object({
    testName: zod_1.default.string().trim().min(1, "Test title is required"),
    description: zod_1.default.string().trim().min(1, "Description is required"),
    status: zod_1.default.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
    videoUrl: zod_1.default.string().url("Valid video URL is required"),
    certificateTemplateUrl: zod_1.default.string().url("Valid certificate URL is required"),
    questions: zod_1.default.array(zod_1.default.object({
        questionText: zod_1.default.string().trim().min(1, "Question is required"),
        options: zod_1.default.array(zod_1.default.object({
            optionText: zod_1.default.string().trim().min(1, "Option text is required"),
            isCorrect: zod_1.default.boolean(),
        })).length(4, "Each question must have exactly 4 options"),
    }).superRefine((question, ctx) => {
        const correctCount = question.options.filter((option) => option.isCorrect).length;
        if (correctCount !== 1) {
            ctx.addIssue({
                code: zod_1.default.ZodIssueCode.custom,
                message: "Exactly one option must be correct",
                path: ["options"],
            });
        }
    })).min(1, "At least one question is required"),
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
exports.updateQuestionnaireSchema = exports.createQuestionnaireSchema.partial();
exports.changeQuestionnaireStatusSchema = zod_1.default.object({
    status: zod_1.default.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
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
