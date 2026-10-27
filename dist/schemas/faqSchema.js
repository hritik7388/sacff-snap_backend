"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFAQSchema = exports.createFAQSchema = void 0;
// src/schemas/faqSchema.ts
const zod_1 = require("zod");
exports.createFAQSchema = zod_1.z.object({
    question: zod_1.z.string().trim().min(1).max(500),
    answer: zod_1.z.string().trim().min(1),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).optional(),
    sortOrder: zod_1.z.number().int().min(0).optional(),
});
exports.updateFAQSchema = zod_1.z
    .object({
    question: zod_1.z.string().trim().min(1).max(500).optional(),
    answer: zod_1.z.string().trim().min(1).optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE"]).optional(),
    sortOrder: zod_1.z.number().int().min(0).optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update",
});
