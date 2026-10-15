"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSubscriptionStatusSchema = exports.adminSubscriptionQuerySchema = exports.cancelSubscriptionSchema = exports.webhookPayloadSchema = exports.createCheckoutSessionSchema = void 0;
// src/schemas/subscriptionSchema.ts
const zod_1 = require("zod");
exports.createCheckoutSessionSchema = zod_1.z.object({
    // Company Registration Fields (all fields from create company)
    name: zod_1.z.string().min(1, "Company Name is required"),
    email: zod_1.z.string().email("Invalid email format").min(1, "Email is required"),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: zod_1.z
        .string()
        .min(8, "Phone number must be at least 8 characters long")
        .max(16, "Phone number cannot exceed 16 characters"),
    countryCode: zod_1.z.string().min(1, "Country code is required").optional().default("+91"),
    address: zod_1.z.string().min(1, "Address is required"),
    image: zod_1.z.string().optional(),
    latitude: zod_1.z.number().optional(),
    longitude: zod_1.z.number().optional(),
    // Subscription Plan Fields
    planType: zod_1.z.enum(["MONTHLY", "YEARLY"], {
        errorMap: () => ({ message: "planType must be MONTHLY or YEARLY" }),
    }),
    successUrl: zod_1.z.string().url("successUrl must be a valid URL").optional(),
    cancelUrl: zod_1.z.string().url("cancelUrl must be a valid URL").optional(),
});
exports.webhookPayloadSchema = zod_1.z.object({
    id: zod_1.z.string(),
    type: zod_1.z.string(),
});
exports.cancelSubscriptionSchema = zod_1.z.object({
    subscriptionId: zod_1.z.string().min(1, "Subscription ID is required"),
});
exports.adminSubscriptionQuerySchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    status: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().int().positive().optional().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).optional().default(10),
    sortBy: zod_1.z.string().optional().default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
});
exports.updateSubscriptionStatusSchema = zod_1.z.object({
    id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    subscriptionId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    status: zod_1.z.string().min(1, "Status is required"),
});
