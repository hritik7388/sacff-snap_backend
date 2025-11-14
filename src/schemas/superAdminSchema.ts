import z from "zod";

export const superAdminSchema=z.object({
  email: z.string().email(),
  password: z.string(), 

})

 


export const approveCompanyRequestSchema = z.object({
    id: z.number(),
});
export const rejectCompanyRequestSchema = z.object({
    id: z.number(),
});

export const companyStatus = z.object({
    id: z.number(),
});

export const addNewCompanySchema = z.object({
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



export const notifictaion = z.object({
    id: z.number(),
});

export type SuperAdminDTO = z.infer<typeof superAdminSchema>; 
export type ApproveCompanyRequestDTO = z.infer<typeof approveCompanyRequestSchema>; 
export type RejectCompanyRequestDTO = z.infer<typeof rejectCompanyRequestSchema>;
 
export type CompanyStatusDTO = z.infer<typeof companyStatus>; 
export type AddNewCompanyDTO = z.infer<typeof addNewCompanySchema>;
export type notifictaionDTO = z.infer<typeof notifictaion>;