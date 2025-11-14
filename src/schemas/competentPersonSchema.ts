import z from "zod";


export const InspectionSchema = z.object({
    scaffholdId: z.number(),
    Date: z.string(),
    shift: z.string(),
    notes: z.string().optional(),
})

export const GetInspectionsSchema = z.object({
    scaffholdId: z.coerce.number()
})

export const statusScahema = z.object({
    scaffholdId: z.coerce.number()
})

export const timeLine = z.object({
    scaffholdId: z.number(),
    timeLineStatus: z.enum(["PRE_ERECTED", "ERECTED", "DISMANTLED"]).optional(),
    notes: z.string().optional(),
    images: z.array(z.string()).optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
})

export const timeLineTag = z.object({
    scaffholdId: z.number(),
    tag: z.enum(["UNTAGED", "GREEN", "RED", "YELLOW"]).optional(),
    notes: z.string().optional(), 
})




export type InspectionDTO = z.infer<typeof InspectionSchema>;
export type GetInspectionsDTO = z.infer<typeof GetInspectionsSchema>;
export type TimeLineDTO = z.infer<typeof timeLine>;
export type TimeLineTagDTO = z.infer<typeof timeLineTag>;
export type statusDTO = z.infer<typeof statusScahema>;