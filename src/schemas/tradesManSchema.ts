import { Priority } from "@prisma/client";
import e from "express";
import z from "zod";
const emptyToUndefined = z.string().transform((val) => (val.trim() === "" ? undefined : val));

export const tradesManRegisterSchema = z.object({
    name: z.string().min(1, "Tradesman Name is required"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    mobileNumber: z
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
    craft: z.string().min(1, "Craft is required"),
    experience: z.string().min(1, "Experience is required"),
    address: z.string().min(1, "Address is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    countryCode: z.string().min(1, "Country code is required").optional(),
    idProofImage: z.string().min(1, "ID Proof is required"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
})

export const updateProfileSchema = z.object({
    id: z.number(),
    name: z.string().min(1, "Tradesman Name is required").optional(),

    mobileNumber: z
        .string()
        .min(10, "Phone number must be at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters").optional(),
    craft: z.string().min(1, "Craft is required").optional(),
    experience: z.string().min(1, "Experience is required").optional(),
    address: z.string().min(1, "Address is required").optional(),
    password: z.string().min(8, "Password must be at least 8 characters long").optional(),
    countryCode: z.string().min(1, "Country code is required").optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
     photoImage: z.string().min(1, "ID Proof is required").optional(),
});

export const tradesManLoginSchema = z.object({
    user_type: z.string(),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
})


export const tradesManCraftSchema = z.object({
    name: z.coerce.string().min(1, "Craft Name is required"),
     search: z.string().min(0).max(100).optional(),
    scaffHoldId:z.coerce.number(),
})

export const joinCraftTradesManSchema = z.object({
    jobId: z.number(),
    craftId: z.number(),
    tradesManId:z.number()
})

export const seacrchJobSchema=z.object({
    CMPID:z.string(),
    SCAFFID:z.string()
})

export const requestScaffOldSchema=z.object({
    scaffHoldId:z.number(), 
    length:z.string().optional(),
    width:z.string().optional(),
    height:z.string().optional(),
    priority:z.enum(["LOW","MEDIUM","HIGH"]).optional(),
    expectedEndDate:z.string().optional(),
    notes:z.string().optional()

})

export const updateScaffOldSRequestchema=z.object({
    requestId:z.number(), 
    length:z.string().optional(),
    width:z.string().optional(),
    height:z.string().optional(),
    priority:z.enum(["LOW","MEDIUM","HIGH"]).optional(),
    expectedEndDate:z.string().optional(),
    notes:z.string().optional()

})

export const jobApplicationSchema=z.object({
  
    scaffHoldId:z.coerce.number(),
})
export const GetTradesManDetailsSchema=z.object({
    id:z.number(),
})

export const deleteRequest=z.object({
  
    scaffHoldId:z.number(),
})

export const searchScaffHold = z.object({ 
  search: z.string().min(0).max(100).optional(),
});

export const requestSacffHold=z.object({
  
    scaffHoldId:z.coerce.number(),
})

export const getrequestSacffHold=z.object({
  
    parentId:z.coerce.number(),
})

export const scaffHoldDetailsById = z.object({
    id: z.coerce.number()
})

 

export const searchFilter = z.object({
     search: z.string().min(0).max(100).optional(),
  sort: z.enum(["ASC", "DESC"]).optional().or(emptyToUndefined),

  status: z
    .union([
      z.enum(["ACTIVE","PRE_ERECTED", "ERECTED", "DISMANTLED"]),
      z.array(z.enum(["PRE_ERECTED", "ERECTED", "DISMANTLED"]))
    ])
    .optional() .or(z.literal(""))
,

  tags: z
    .union([
      z.enum([ "GREEN", "RED", "YELLOW"]),
      z.array(z.enum([ "GREEN", "RED", "YELLOW"]))
    ])
    .optional() .or(z.literal("")),


  priority: z
    .union([
      z.enum(["LOW", "MEDIUM", "HIGH"]),
      z.array(z.enum(["LOW", "MEDIUM", "HIGH"]))
    ])
    .optional() .or(z.literal("")),

});


export type RegisterTradesManDTO = z.infer<typeof tradesManRegisterSchema>;
export type LoginTradesManDTO = z.infer<typeof tradesManLoginSchema>;
export type TradesManCraftDTO = z.infer<typeof tradesManCraftSchema>;
export type UpadateProfileDTO = z.infer<typeof updateProfileSchema>;

export type joinCraftTradesManDTO = z.infer<typeof joinCraftTradesManSchema>;
export type seacrchJobDTO = z.infer<typeof seacrchJobSchema>;
export type requestScaffOldDTO = z.infer<typeof requestScaffOldSchema>;
export type updateScaffOldSRequestchemaDTO = z.infer<typeof updateScaffOldSRequestchema>;
export type jobApplicationDTO = z.infer<typeof jobApplicationSchema>;
export type SearchScaffHoldDTO = z.infer<typeof searchScaffHold>;
export type scaffHoldIdDTO = z.infer<typeof deleteRequest>;
export type requestSacffHoldDTO = z.infer<typeof requestSacffHold>;
export type GetTradesManDetailsDTO = z.infer<typeof GetTradesManDetailsSchema>;
export type ScaffHoldDetailsDTO = z.infer<typeof scaffHoldDetailsById>
export type getparentSacffHoldDTO = z.infer<typeof getrequestSacffHold>;
export type SearchFilterDTO = z.infer<typeof searchFilter>;