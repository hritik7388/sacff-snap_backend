"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRoiLeadSchema = exports.updateRoiStatusSchema = exports.roiLeadIdSchema = exports.adminRoiQuerySchema = exports.submitRoiLeadSchema = exports.generateGuestUserName = void 0;
// src/schemas/roiSchema.ts
const zod_1 = require("zod");
// Helper to generate guest user with random unique digits
const generateGuestUserName = () => {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `Guest User ${randomDigits}`;
};
exports.generateGuestUserName = generateGuestUserName;
// Submission schema (Enterprise Operation inputs + Lead details)
exports.submitRoiLeadSchema = zod_1.z.object({
    // Existing lead identifier (if updating an existing lead)
    leadId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    // Lead contact fields
    contact_name: zod_1.z.string().nullable().optional(),
    contact_email: zod_1.z.string().nullable().optional(),
    firstName: zod_1.z
        .string()
        .nullable()
        .optional(),
    email: zod_1.z
        .string()
        .nullable()
        .optional(),
    company: zod_1.z
        .string()
        .nullable()
        .optional()
        .transform((val) => (val ? val.trim() : "")),
    state: zod_1.z
        .string()
        .nullable()
        .optional()
        .transform((val) => (val ? val.trim() : "")),
    notes: zod_1.z
        .string()
        .nullable()
        .optional()
        .transform((val) => (val ? val.trim() : "")),
    // Industry segment / profile (Commercial vs Industrial)
    segment: zod_1.z.enum(["commercial", "industrial"]).optional().default("commercial"),
    profile: zod_1.z.enum(["commercial", "industrial"]).optional(),
    // Enterprise ROI Engine Operation inputs
    volume: zod_1.z.coerce.number().optional(),
    annualBuildVolume: zod_1.z.coerce.number().optional(),
    annualScaffoldCount: zod_1.z.coerce.number().optional(),
    scaffolds: zod_1.z.coerce.number().optional(),
    laborRate: zod_1.z.coerce.number().optional(),
    fullyBurdenedLaborRate: zod_1.z.coerce.number().optional(),
    hourlyLaborRate: zod_1.z.coerce.number().optional(),
    hourlyRate: zod_1.z.coerce.number().optional(),
    rentalRate: zod_1.z.coerce.number().optional(),
    scaffoldRentalCostPerDay: zod_1.z.coerce.number().optional(),
    dailyRentalCost: zod_1.z.coerce.number().optional(),
    dailyCost: zod_1.z.coerce.number().optional(),
    erectionCost: zod_1.z.coerce.number().optional(),
    averageCostPerErection: zod_1.z.coerce.number().optional(),
    laborHours: zod_1.z.coerce.number().optional(),
    wastedLaborHoursPerBuild: zod_1.z.coerce.number().optional(),
    standbyHours: zod_1.z.coerce.number().optional(),
    standbyHrs: zod_1.z.coerce.number().optional(),
    rentalDays: zod_1.z.coerce.number().optional(),
    ghostRentalDaysPerBuild: zod_1.z.coerce.number().optional(),
    avgRentalDurationDays: zod_1.z.coerce.number().optional(),
    rebuildRate: zod_1.z.coerce.number().optional(),
    rebuildPct: zod_1.z.coerce.number().optional(),
    adminHours: zod_1.z.coerce.number().optional(),
    adminHoursPerBuild: zod_1.z.coerce.number().optional(),
    softwareTCO: zod_1.z.coerce.number().optional(),
    scaffSnappAnnualCost: zod_1.z.coerce.number().optional(),
    crewSize: zod_1.z.coerce.number().optional(),
    crewSizePerBuild: zod_1.z.coerce.number().optional(),
    // Nested inputs object payload compatibility (e.g. from handleFormSubmit webhook payload)
    inputs: zod_1.z.record(zod_1.z.any()).optional(),
}).transform((data) => {
    const resolvedName = (data.firstName || data.contact_name || "").trim();
    const finalFirstName = resolvedName.length > 0 ? resolvedName : (0, exports.generateGuestUserName)();
    let resolvedEmail = (data.email || data.contact_email || "").trim().toLowerCase();
    if (resolvedEmail && !zod_1.z.string().email().safeParse(resolvedEmail).success) {
        throw new zod_1.z.ZodError([
            {
                code: zod_1.z.ZodIssueCode.custom,
                path: ["email"],
                message: "Valid work email is required",
            },
        ]);
    }
    return Object.assign(Object.assign({}, data), { firstName: finalFirstName, email: resolvedEmail, company: data.company || "", state: data.state || "", notes: data.notes || "", segment: (data.segment || data.profile || "commercial").toLowerCase() });
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
// Update Lead Details (firstName, email, company, state, notes) & Send Calculation Email
exports.updateRoiLeadSchema = zod_1.z.object({
    leadId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    id: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    contact_name: zod_1.z.string().nullable().optional(),
    contact_email: zod_1.z.string().nullable().optional(),
    firstName: zod_1.z.string().trim().optional(),
    email: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .optional()
        .refine((val) => !val || zod_1.z.string().email().safeParse(val).success, {
        message: "Valid email is required",
    }),
    company: zod_1.z.string().trim().optional(),
    state: zod_1.z.string().trim().optional(),
    notes: zod_1.z.string().optional(),
    segment: zod_1.z.enum(["commercial", "industrial"]).optional(),
    profile: zod_1.z.enum(["commercial", "industrial"]).optional(),
    // Enterprise operational inputs
    volume: zod_1.z.coerce.number().optional(),
    annualBuildVolume: zod_1.z.coerce.number().optional(),
    annualScaffoldCount: zod_1.z.coerce.number().optional(),
    scaffolds: zod_1.z.coerce.number().optional(),
    laborRate: zod_1.z.coerce.number().optional(),
    fullyBurdenedLaborRate: zod_1.z.coerce.number().optional(),
    hourlyLaborRate: zod_1.z.coerce.number().optional(),
    hourlyRate: zod_1.z.coerce.number().optional(),
    rentalRate: zod_1.z.coerce.number().optional(),
    scaffoldRentalCostPerDay: zod_1.z.coerce.number().optional(),
    dailyRentalCost: zod_1.z.coerce.number().optional(),
    dailyCost: zod_1.z.coerce.number().optional(),
    erectionCost: zod_1.z.coerce.number().optional(),
    averageCostPerErection: zod_1.z.coerce.number().optional(),
    laborHours: zod_1.z.coerce.number().optional(),
    wastedLaborHoursPerBuild: zod_1.z.coerce.number().optional(),
    standbyHours: zod_1.z.coerce.number().optional(),
    standbyHrs: zod_1.z.coerce.number().optional(),
    rentalDays: zod_1.z.coerce.number().optional(),
    ghostRentalDaysPerBuild: zod_1.z.coerce.number().optional(),
    avgRentalDurationDays: zod_1.z.coerce.number().optional(),
    rebuildRate: zod_1.z.coerce.number().optional(),
    rebuildPct: zod_1.z.coerce.number().optional(),
    adminHours: zod_1.z.coerce.number().optional(),
    adminHoursPerBuild: zod_1.z.coerce.number().optional(),
    softwareTCO: zod_1.z.coerce.number().optional(),
    scaffSnappAnnualCost: zod_1.z.coerce.number().optional(),
    crewSize: zod_1.z.coerce.number().optional(),
    crewSizePerBuild: zod_1.z.coerce.number().optional(),
    inputs: zod_1.z.record(zod_1.z.any()).optional(),
}).transform((data) => {
    var _a, _b;
    const resolvedName = (_a = (data.firstName || data.contact_name || undefined)) === null || _a === void 0 ? void 0 : _a.trim();
    const resolvedEmail = (_b = (data.email || data.contact_email || undefined)) === null || _b === void 0 ? void 0 : _b.trim().toLowerCase();
    return Object.assign(Object.assign({}, data), { firstName: resolvedName, email: resolvedEmail });
});
