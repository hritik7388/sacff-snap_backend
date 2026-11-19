"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPrinterCheckoutSchema = exports.updateSubscriptionStatusSchema = exports.adminSubscriptionQuerySchema = exports.cancelSubscriptionSchema = exports.webhookPayloadSchema = exports.createCheckoutSessionSchema = void 0;
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
const addressSchema = zod_1.z.object({
    company: zod_1.z.string().optional().default(""),
    contactName: zod_1.z.string().min(1, "Contact name is required"),
    email: zod_1.z.string().email("Invalid email address"),
    phone: zod_1.z.string().min(8).max(16),
    address: zod_1.z.string().min(1, "Address is required"),
    city: zod_1.z.string().min(1, "City is required"),
    state: zod_1.z.string().min(1, "State is required"),
    zipCode: zod_1.z.string().min(1, "ZIP code is required"),
});
exports.createPrinterCheckoutSchema = zod_1.z.object({
    customerName: zod_1.z.string().min(1, "Customer name is required"),
    customerEmail: zod_1.z.string().email("Invalid email address"),
    customerPhone: zod_1.z.string().min(8).max(16),
    items: zod_1.z.array(zod_1.z.object({
        printerId: zod_1.z.number().int().positive(),
        quantity: zod_1.z.number().int().min(1).max(100),
    })).min(1, "At least one printer is required"),
    billing: addressSchema,
    sameAsBilling: zod_1.z.boolean().default(false),
    shipping: addressSchema.optional(),
    successUrl: zod_1.z.string().url("successUrl must be a valid URL").optional(),
    cancelUrl: zod_1.z.string().url("cancelUrl must be a valid URL").optional(),
}).superRefine((data, ctx) => {
    const ids = data.items.map(item => item.printerId);
    if (new Set(ids).size !== ids.length) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Duplicate printer IDs are not allowed",
            path: ["items"],
        });
    }
    if (!data.sameAsBilling && !data.shipping) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: "Shipping address is required",
            path: ["shipping"],
        });
    }
});
