import z from "zod";


 

export const jobSchema=z.object({
    
    scaffHoldId:z.number(), 
    descreption:z.string()   

})

export const jobCraftSchema=z.object({
    scaffId:z.number(),
    craftId:z.number(),
    counts:z.number()
})

export const updateJobCraftSchema=z.object({
    id:z.number(),
    craftId:z.number(),
    counts:z.number()
})

export const getJobCraftSchema=z.object({
   id: z.coerce.number(),
})

export const deleteJobCraftSchema=z.object({
    scaffId:z.number(),
    craftId:z.number(),
})

export type JobSchemaDTO = z.infer<typeof jobSchema>; 
export type JobCraftDTO=z.infer<typeof jobCraftSchema>
export type updateJobCraftDTO=z.infer<typeof updateJobCraftSchema>
export type getJobCraftDTO=z.infer<typeof getJobCraftSchema>
export type deleteJobCraftDTO=z.infer<typeof deleteJobCraftSchema>