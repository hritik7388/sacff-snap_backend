import { Priority } from "@prisma/client";
import z from "zod";

export const scaffHoldSchema = z.object({
    startDate: z.string(), // ✅ required and valid date
    endDate: z.string(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    priority: z.enum([Priority.HIGH, Priority.MEDIUM, Priority.LOW]).optional(),
    projectId: z.number().optional(),
    competentPersonIds: z.array(z.number()).min(2, "At least 2 competent persons are required"),
    descreption: z.string().optional(),

})

export const scaffHoldDetailsById = z.object({
    id: z.coerce.number(),
    
})

export const scaffCompetentPerson = z.object({
    id: z.coerce.number(),
    search: z.string().min(0).max(100).optional(),
    
})


export const projectScaffhold = z.object({
    id: z.coerce.number()
})
 
export const ScaffCompetentPerson=z.object({
    scaffHoldId:z.number(),
    competentPersonIds: z.array(z.number()).min(1, "At least 1 competent persons are required"),
})
export const removeScaffCompetentPerson=z.object({
    scaffHoldId:z.coerce.number(),
    competentPersonIds: z.coerce.number(),
})

export const changePriorityAndTagsSchema = z.object({
  scaffholdId: z.number(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(), // match Prisma enum
  tag: z.enum(["UNTAGED", "GREEN", "RED", "YELLOW"]).optional(), // match Prisma enum
});



export type ScaffHoldDTO = z.infer<typeof scaffHoldSchema>;
export type ScaffHoldDetailsDTO = z.infer<typeof scaffHoldDetailsById>

export type ProjectScaffHoldDTO = z.infer<typeof projectScaffhold>
export type ScaffCompetentPersonDTO=z.infer<typeof ScaffCompetentPerson>
export type RemoveScaffCompetentPersonDTO=z.infer<typeof removeScaffCompetentPerson>
export type changePriorityAndTagsDTO=z.infer<typeof changePriorityAndTagsSchema>
export type scaffCompetentPersonDTO=z.infer<typeof scaffCompetentPerson>

 