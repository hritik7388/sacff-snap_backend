// src/schemas/competentPersonSchema.ts
import z from "zod";


export const InspectionSchema = z.object({
  scaffHoldId: z.number(),
  Date: z.string(),
  shift: z.string(),
  notes: z.string().optional(),
})

export const GetInspectionsSchema = z.object({
  scaffHoldId: z.preprocess((val) => {
    if (Array.isArray(val)) return val[0];
    return val;
  },
    z
      .string()
      .min(1, "scaffHoldId is required")
      .refine((val) => !isNaN(Number(val)), {
        message: "Invalid scaffHoldId",
      })
      .transform(Number)
  ),
})

export const statusScahema = z.object({
  scaffHoldId: z.coerce.number()
})

export const timeLine = z.object({
  scaffHoldId: z.number(),
  timeLineStatus: z.enum(["PRE_ERECTED", "ERECTED", "DISMANTLED"]).optional(),
  notes: z.string().optional(),
  images: z.array(z.string()).optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

export const timeLineTag = z.object({
  scaffHoldId: z.number(),
  tag: z.enum(["UNTAGED", "GREEN", "RED", "YELLOW"]).optional(),
  notes: z.string().optional(),
  lightDuty: z.boolean().optional(),

  mediumDuty: z.boolean().optional(),

  heavyDuty: z.boolean().optional(),
})




export type InspectionDTO = z.infer<typeof InspectionSchema>;
export type GetInspectionsDTO = z.infer<typeof GetInspectionsSchema>;
export type TimeLineDTO = z.infer<typeof timeLine>;
export type TimeLineTagDTO = z.infer<typeof timeLineTag>;
export type statusDTO = z.infer<typeof statusScahema>;