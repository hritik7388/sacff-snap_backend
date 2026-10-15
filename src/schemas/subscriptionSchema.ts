// src/schemas/subscriptionSchema.ts
import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
    // Company Registration Fields (all fields from create company)
    name: z.string().min(1, "Company Name is required"),
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

export type CreateCheckoutSessionDTO = z.infer<typeof createCheckoutSessionSchema>;
export type CancelSubscriptionDTO = z.infer<typeof cancelSubscriptionSchema>;

