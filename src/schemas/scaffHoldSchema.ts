// src/schemas/scaffHoldSchema.ts
import { Priority } from "@prisma/client";
import { platform } from "os";
import z from "zod";

export const scaffHoldSchema = z.object({
  startDate: z.string(), // ✅ required and valid date
  endDate: z.string(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  priority: z.enum([Priority.HIGH, Priority.MEDIUM, Priority.LOW]).optional(),
  projectId: z.number().optional(),
  competentPersonIds: z.array(z.number()),
  descreption: z.string().optional(),

})

export const scaffHoldDetailsById = z.object({
  id: z.coerce.number(),

})

export const scaffCompetentPerson = z.object({
  id: z.coerce.number(),
  search: z.string().min(0).max(100).optional(),

})


const emptyToUndefined = z.string().transform((val) => (val.trim() === "" ? undefined : val));

export const searchFilter = z.object({
  search: z.string().min(0).max(100).optional(),
  sort: z.enum(["ASC", "DESC"]).optional().or(emptyToUndefined),

  status: z
    .union([
      z.enum(["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"]),
      z.array(z.enum(["PRE_ERECTED", "ERECTED", "DISMANTLED"]))
    ])
    .optional().or(z.literal(""))
  ,

  tags: z
    .union([
      z.enum(["GREEN", "RED", "YELLOW"]),
      z.array(z.enum(["GREEN", "RED", "YELLOW"]))
    ])
    .optional().or(z.literal("")),


  priority: z
    .union([
      z.enum(["LOW", "MEDIUM", "HIGH"]),
      z.array(z.enum(["LOW", "MEDIUM", "HIGH"]))
    ])
    .optional().or(z.literal("")),

});
export const ScaffCompetentPerson = z.object({
  projectId: z.number(),
  competentPersonIds: z.array(z.number()).min(1, "At least 1 competent persons are required"),
})
export const removeScaffCompetentPerson = z.object({
  projectId: z.coerce.number(),
  competentPersonId: z.coerce.number(),
})

export const changePriorityAndTagsSchema = z.object({
  scaffHoldId: z.number(),
  priority: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["LOW", "MEDIUM", "HIGH"]).optional()
  ),// match Prisma enum
  tag: z.enum(["UNTAGED", "GREEN", "RED", "YELLOW"]).optional(), // match Prisma enum
  lightDuty: z.boolean().optional(),

  mediumDuty: z.boolean().optional(),

  heavyDuty: z.boolean().optional(),
  fallProtection: z.boolean().optional(),

  handRail: z.boolean().optional(),
  midRail: z.boolean().optional(),
  toeBoard: z.boolean().optional(),
  platform: z.boolean().optional(),
  ladder: z.boolean().optional(),

  note: z.string().optional(),
  other: z.string().optional(),
});



export type ScaffHoldDTO = z.infer<typeof scaffHoldSchema>;
export type ScaffHoldDetailsDTO = z.infer<typeof scaffHoldDetailsById>

export type ProjectScaffHoldDTO = z.infer<typeof searchFilter>
export type ScaffCompetentPersonDTO = z.infer<typeof ScaffCompetentPerson>
export type RemoveScaffCompetentPersonDTO = z.infer<typeof removeScaffCompetentPerson>
export type changePriorityAndTagsDTO = z.infer<typeof changePriorityAndTagsSchema>
export type scaffCompetentPersonDTO = z.infer<typeof scaffCompetentPerson>

