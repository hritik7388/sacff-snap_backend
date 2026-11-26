// src/schemas/roiSchema.ts
import { z } from "zod";

// Helper to generate guest user with random unique digits
export const generateGuestUserName = (): string => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `Guest User ${randomDigits}`;
};

// Submission schema (Enterprise Operation inputs + Lead details)
export const submitRoiLeadSchema = z.object({
  // Existing lead identifier (if updating an existing lead)
  leadId: z.union([z.string(), z.number()]).optional(),
  id: z.union([z.string(), z.number()]).optional(),

  // Lead contact fields
  contact_name: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
  firstName: z
    .string()
    .nullable()
    .optional(),
  email: z
    .string()
    .nullable()
    .optional(),
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

  // Industry segment / profile (Commercial vs Industrial)
  segment: z.enum(["commercial", "industrial"]).optional().default("commercial"),
  profile: z.enum(["commercial", "industrial"]).optional(),

  // Enterprise ROI Engine Operation inputs
  volume: z.coerce.number().optional(),
  annualBuildVolume: z.coerce.number().optional(),
  annualScaffoldCount: z.coerce.number().optional(),
  scaffolds: z.coerce.number().optional(),

  laborRate: z.coerce.number().optional(),
  fullyBurdenedLaborRate: z.coerce.number().optional(),
  hourlyLaborRate: z.coerce.number().optional(),
  hourlyRate: z.coerce.number().optional(),

  rentalRate: z.coerce.number().optional(),
  scaffoldRentalCostPerDay: z.coerce.number().optional(),
  dailyRentalCost: z.coerce.number().optional(),
  dailyCost: z.coerce.number().optional(),

  erectionCost: z.coerce.number().optional(),
  averageCostPerErection: z.coerce.number().optional(),

  laborHours: z.coerce.number().optional(),
  wastedLaborHoursPerBuild: z.coerce.number().optional(),
  standbyHours: z.coerce.number().optional(),
  standbyHrs: z.coerce.number().optional(),

  rentalDays: z.coerce.number().optional(),
  ghostRentalDaysPerBuild: z.coerce.number().optional(),
  avgRentalDurationDays: z.coerce.number().optional(),

  rebuildRate: z.coerce.number().optional(),
  rebuildPct: z.coerce.number().optional(),

  adminHours: z.coerce.number().optional(),
  adminHoursPerBuild: z.coerce.number().optional(),

  softwareTCO: z.coerce.number().optional(),
  scaffSnappAnnualCost: z.coerce.number().optional(),

  crewSize: z.coerce.number().optional(),
  crewSizePerBuild: z.coerce.number().optional(),

  // Nested inputs object payload compatibility (e.g. from handleFormSubmit webhook payload)
  inputs: z.record(z.any()).optional(),
}).transform((data) => {
  const resolvedName = (data.firstName || data.contact_name || "").trim();
  const finalFirstName = resolvedName.length > 0 ? resolvedName : generateGuestUserName();

  let resolvedEmail = (data.email || data.contact_email || "").trim().toLowerCase();
  if (resolvedEmail && !z.string().email().safeParse(resolvedEmail).success) {
    throw new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message: "Valid work email is required",
      },
    ]);
  }

  return {
    ...data,
    firstName: finalFirstName,
    email: resolvedEmail,
    company: data.company || "",
    state: data.state || "",
    notes: data.notes || "",
    segment: (data.segment || data.profile || "commercial").toLowerCase() as "commercial" | "industrial",
  };
});

// Admin Query Filters
export const adminRoiQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "CLOSED"])
    .optional(),
  state: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sortBy: z
    .enum([
      "createdAt",
      "potentialRecoverableValue",
      "totalAnnualLeakage",
      "company",
      "annualScaffoldCount",
    ])
    .default("createdAt"),
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
  contact_name: z.string().nullable().optional(),
  contact_email: z.string().nullable().optional(),
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
  segment: z.enum(["commercial", "industrial"]).optional(),
  profile: z.enum(["commercial", "industrial"]).optional(),

  // Enterprise operational inputs
  volume: z.coerce.number().optional(),
  annualBuildVolume: z.coerce.number().optional(),
  annualScaffoldCount: z.coerce.number().optional(),
  scaffolds: z.coerce.number().optional(),

  laborRate: z.coerce.number().optional(),
  fullyBurdenedLaborRate: z.coerce.number().optional(),
  hourlyLaborRate: z.coerce.number().optional(),
  hourlyRate: z.coerce.number().optional(),

  rentalRate: z.coerce.number().optional(),
  scaffoldRentalCostPerDay: z.coerce.number().optional(),
  dailyRentalCost: z.coerce.number().optional(),
  dailyCost: z.coerce.number().optional(),

  erectionCost: z.coerce.number().optional(),
  averageCostPerErection: z.coerce.number().optional(),

  laborHours: z.coerce.number().optional(),
  wastedLaborHoursPerBuild: z.coerce.number().optional(),
  standbyHours: z.coerce.number().optional(),
  standbyHrs: z.coerce.number().optional(),

  rentalDays: z.coerce.number().optional(),
  ghostRentalDaysPerBuild: z.coerce.number().optional(),
  avgRentalDurationDays: z.coerce.number().optional(),

  rebuildRate: z.coerce.number().optional(),
  rebuildPct: z.coerce.number().optional(),

  adminHours: z.coerce.number().optional(),
  adminHoursPerBuild: z.coerce.number().optional(),

  softwareTCO: z.coerce.number().optional(),
  scaffSnappAnnualCost: z.coerce.number().optional(),

  crewSize: z.coerce.number().optional(),
  crewSizePerBuild: z.coerce.number().optional(),

  inputs: z.record(z.any()).optional(),
}).transform((data) => {
  const resolvedName = (data.firstName || data.contact_name || undefined)?.trim();
  const resolvedEmail = (data.email || data.contact_email || undefined)?.trim().toLowerCase();
  return {
    ...data,
    firstName: resolvedName,
    email: resolvedEmail,
  };
});

export type SubmitRoiLeadDTO = z.infer<typeof submitRoiLeadSchema>;
export type AdminRoiQueryDTO = z.infer<typeof adminRoiQuerySchema>;
export type RoiLeadIdDTO = z.infer<typeof roiLeadIdSchema>;
export type UpdateRoiStatusDTO = z.infer<typeof updateRoiStatusSchema>;
export type UpdateRoiLeadDTO = z.infer<typeof updateRoiLeadSchema>;
