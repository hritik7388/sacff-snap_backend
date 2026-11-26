// src/schemas/subscriptionSchema.ts
import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
    // Company Registration Fields (all fields from create company)
    name: z.string().min(1, "Name is required"),
    company_name: z.string().optional().nullable(),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: z
        .string()
        .min(8, "Phone number must be at least 8 characters long")
        .max(16, "Phone number cannot exceed 16 characters"),
    countryCode: z.string().min(1, "Country code is required").optional().default("+91"),
    address: z.string().min(1, "Address is required"),
    image: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),

  // Subscription Plan Fields
  planType: z.enum(["MONTHLY", "YEARLY"], {
    errorMap: () => ({ message: "planType must be MONTHLY or YEARLY" }),
  }),
  successUrl: z.string().url("successUrl must be a valid URL").optional(),
  cancelUrl: z.string().url("cancelUrl must be a valid URL").optional(),
});

export const webhookPayloadSchema = z.object({
  id: z.string(),
  type: z.string(),
});

export const cancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, "Subscription ID is required"),
});

export const adminSubscriptionQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const updateSubscriptionStatusSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  subscriptionId: z.union([z.string(), z.number()]).optional(),
  status: z.string().min(1, "Status is required"),
});

export type CreateCheckoutSessionDTO = z.infer<
  typeof createCheckoutSessionSchema
>;
export type CancelSubscriptionDTO = z.infer<typeof cancelSubscriptionSchema>;
export type AdminSubscriptionQueryDTO = z.infer<
  typeof adminSubscriptionQuerySchema
>;
export type UpdateSubscriptionStatusDTO = z.infer<
  typeof updateSubscriptionStatusSchema
>;
const addressSchema = z.object({
  company: z.string().optional().default(""),
  contactName: z.string().min(1, "Contact name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8).max(16),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
});

export const createPrinterCheckoutSchema = z
  .object({
    customerName: z.string().min(1, "Customer name is required"),
    customerEmail: z.string().email("Invalid email address"),
    customerPhone: z.string().min(8).max(16),

    items: z
      .array(
        z.object({
          printerId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(100),
        }),
      )
      .min(1, "At least one printer is required"),

    billing: addressSchema,

    sameAsBilling: z.boolean().default(false),

    shipping: addressSchema.optional(),

    successUrl: z.string().url("successUrl must be a valid URL").optional(),
    cancelUrl: z.string().url("cancelUrl must be a valid URL").optional(),
  })
  .superRefine((data, ctx) => {
    const ids = data.items.map((item) => item.printerId);

    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duplicate printer IDs are not allowed",
        path: ["items"],
      });
    }

    if (!data.sameAsBilling && !data.shipping) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Shipping address is required",
        path: ["shipping"],
      });
    }
  });

export type CreatePrinterCheckoutDTO = z.infer<
  typeof createPrinterCheckoutSchema
>;
