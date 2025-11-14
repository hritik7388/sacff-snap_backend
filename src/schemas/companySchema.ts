import {z} from "zod";

export const companyRegisterSchema = z.object({
    name: z.string().min(1, "Company Name is required"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    image: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: z
    .string()
    .min(10, "Phone number mustbe at least 10 characters long")
    .max(15, "Phone number cannot exceed 15 characters"),
    countryCode: z.string().min(1, "Country code is required").optional(),
    address: z.string().min(1, "Address is required"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    
});


export const companyUpdateSchema = z.object({
    id: z.number(),
    name: z.string().min(1, "Company Name is required").optional(),
    email: z.string().email("Invalid email format").min(1, "Email is required").optional(),
    image: z.string().min(1, "Image URL is required").optional(),  
    address: z.string().min(1, "Address is required").optional(),
    countryCode: z.string().min(1, "Country code is required").optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});

export const companyIdSchema = z.object({
    id: z.coerce.number(),
});







export type RegisterCompanyDTO = z.infer<typeof companyRegisterSchema>;

export type UpdateCompanyDTO = z.infer<typeof companyUpdateSchema>;
export type CompanyIdDTO = z.infer<typeof companyIdSchema>;