// src/schemas/roiSchema.ts
import { z } from "zod";

// Helper to generate guest user with random unique digits
export const generateGuestUserName = (): string => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `Guest User ${randomDigits}`;
};

// Submission schema (Operation inputs + Lead details)
export const submitRoiLeadSchema = z.object({
  // Lead details (Modal Popup in screenshot 2 - optional with auto-guest fallback)
  firstName: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : generateGuestUserName())),
  email: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? val.trim().toLowerCase() : ""))
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Valid work email is required",
    }),
  company: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? val.trim() : "")),
  state: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? val.trim() : "")),
  notes: z
    .string()
    .nullable()
    .optional()
    .transform((val) => (val ? val.trim() : "")),

  // Operation inputs (Fields in screenshot 1)
  annualScaffoldCount: z.coerce.number().min(0).default(120),
  avgRentalDurationDays: z.coerce.number().min(0).default(18),
  dailyRentalCost: z.coerce.number().min(0).default(480),
  crewSizePerBuild: z.coerce.number().min(0).default(4),
  hourlyLaborRate: z.coerce.number().min(0).default(68),
  standbyHours: z.coerce.number().min(0).default(6),

  // Optional alternative aliases for input IDs
  scaffolds: z.coerce.number().optional(),
  rentalDays: z.coerce.number().optional(),
  dailyCost: z.coerce.number().optional(),
  crewSize: z.coerce.number().optional(),
  hourlyRate: z.coerce.number().optional(),
  standbyHrs: z.coerce.number().optional(),
});

// Admin Query Filters
export const adminRoiQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"]).optional(),
  state: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z.enum([
    "createdAt",
    "potentialRecoverableValue",
    "totalAnnualLeakage",
    "company",
    "annualScaffoldCount",
  ]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Lead ID param
export const roiLeadIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid lead ID"),
});

// Update Lead Status
export const updateRoiStatusSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"]),
  notes: z.string().optional(),
});

// Update Lead Details (firstName, email, company, state, notes) & Send Calculation Email
export const updateRoiLeadSchema = z.object({
  leadId: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),
  firstName: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Valid email is required",
    }),
  company: z.string().trim().optional(),
  state: z.string().trim().optional(),
  notes: z.string().optional(),

  // Optional operational inputs
  annualScaffoldCount: z.coerce.number().min(0).optional(),
  avgRentalDurationDays: z.coerce.number().min(0).optional(),
  dailyRentalCost: z.coerce.number().min(0).optional(),
  crewSizePerBuild: z.coerce.number().min(0).optional(),
  hourlyLaborRate: z.coerce.number().min(0).optional(),
  standbyHours: z.coerce.number().min(0).optional(),
});

export type SubmitRoiLeadDTO = z.infer<typeof submitRoiLeadSchema>;
export type AdminRoiQueryDTO = z.infer<typeof adminRoiQuerySchema>;
export type RoiLeadIdDTO = z.infer<typeof roiLeadIdSchema>;
export type UpdateRoiStatusDTO = z.infer<typeof updateRoiStatusSchema>;
export type UpdateRoiLeadDTO = z.infer<typeof updateRoiLeadSchema>;
