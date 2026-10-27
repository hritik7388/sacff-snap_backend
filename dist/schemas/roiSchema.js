"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoiStatusSchema = exports.roiLeadIdSchema = exports.adminRoiQuerySchema = exports.submitRoiLeadSchema = void 0;
// src/schemas/roiSchema.ts
const zod_1 = require("zod");
// Submission schema (Operation inputs + Lead details)
exports.submitRoiLeadSchema = zod_1.z.object({
    // Lead details (Modal Popup in screenshot 2)
    firstName: zod_1.z.string().min(1, "First Name is required").trim(),
    email: zod_1.z.string().email("Valid work email is required").trim().toLowerCase(),
    company: zod_1.z.string().min(1, "Company is required").trim(),
    state: zod_1.z.string().min(1, "State is required").trim(),
    notes: zod_1.z.string().optional(),
    // Operation inputs (Fields in screenshot 1)
    annualScaffoldCount: zod_1.z.coerce.number().min(0).default(120),
    avgRentalDurationDays: zod_1.z.coerce.number().min(0).default(18),
    dailyRentalCost: zod_1.z.coerce.number().min(0).default(480),
    crewSizePerBuild: zod_1.z.coerce.number().min(0).default(4),
    hourlyLaborRate: zod_1.z.coerce.number().min(0).default(68),
    standbyHours: zod_1.z.coerce.number().min(0).default(6),
    // Optional alternative aliases for input IDs
    scaffolds: zod_1.z.coerce.number().optional(),
    rentalDays: zod_1.z.coerce.number().optional(),
    dailyCost: zod_1.z.coerce.number().optional(),
    crewSize: zod_1.z.coerce.number().optional(),
    hourlyRate: zod_1.z.coerce.number().optional(),
    standbyHrs: zod_1.z.coerce.number().optional(),
});
// Admin Query Filters
exports.adminRoiQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(10),
    search: zod_1.z.string().optional(),
    status: zod_1.z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"]).optional(),
    state: zod_1.z.string().optional(),
    startDate: zod_1.z.string().optional(),
    endDate: zod_1.z.string().optional(),
    sortBy: zod_1.z.enum([
        "createdAt",
        "potentialRecoverableValue",
        "totalAnnualLeakage",
        "company",
        "annualScaffoldCount",
    ]).default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
});
// Lead ID param
exports.roiLeadIdSchema = zod_1.z.object({
    id: zod_1.z.coerce.number().int().positive("Invalid lead ID"),
});
// Update Lead Status
exports.updateRoiStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"]),
    notes: zod_1.z.string().optional(),
});
