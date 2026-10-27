// src/schemas/roiSchema.ts
import { z } from "zod";

// Submission schema (Operation inputs + Lead details)
export const submitRoiLeadSchema = z.object({
  // Lead details (Modal Popup in screenshot 2)
  firstName: z.string().min(1, "First Name is required").trim(),
  email: z.string().email("Valid work email is required").trim().toLowerCase(),
  company: z.string().min(1, "Company is required").trim(),
  state: z.string().min(1, "State is required").trim(),
  notes: z.string().optional(),

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

export type SubmitRoiLeadDTO = z.infer<typeof submitRoiLeadSchema>;
export type AdminRoiQueryDTO = z.infer<typeof adminRoiQuerySchema>;
export type RoiLeadIdDTO = z.infer<typeof roiLeadIdSchema>;
export type UpdateRoiStatusDTO = z.infer<typeof updateRoiStatusSchema>;
