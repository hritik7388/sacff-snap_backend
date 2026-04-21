// src/schemas/projectManagerSchema.ts
import z from "zod";


export const projectManagerLoginSchema = z.object({
    user_type: z.string(),
    companyId: z.string(),
    email: z.string().email(),
    password: z.string(),
});
export const projectDetailById = z.object({
    id: z.coerce.number()
})

export const GetUserDetailsSchema = z.object({
    userId: z.coerce.number()
})

export const requestedScaffolds = z.object({
    scaffHoldId: z.coerce.number()
})

export const approveRejectRequestSchema = z.object({
    scaffHoldId: z.coerce.number(),
    requestId: z.coerce.number(),
    status: z.enum(["APPROVED", "REJECTED"]),
    reajectionReason: z.string().optional()
})


export const searchScaffHold = z.object({
    search: z.string().min(0).max(100).optional(),
});


export const getJobCraftSchema = z.object({
    scaffHoldId: z.coerce.number(),
})


export const getScaffholdRequestsByCreator = z.object({
    requestId: z.coerce.number(),
})
export const uploadImage = z.object({

    idProofImage: z.string().min(1, "ID Proof is required"),
})

export const ImageSchema = z.object({

    profileImage: z.string(),
})


export type LoginProjectManagerDTO = z.infer<typeof projectManagerLoginSchema>;

export type ProjectDetailDTO = z.infer<typeof projectDetailById>
export type GetUserDetailsDTO = z.infer<typeof GetUserDetailsSchema>
export type requestedScaffoldsDTO = z.infer<typeof requestedScaffolds>
export type approveRejectRequestDTO = z.infer<typeof approveRejectRequestSchema>
export type SearchScaffHoldDTO = z.infer<typeof searchScaffHold>;
export type GetJobCraftDTO = z.infer<typeof getJobCraftSchema>

export type getRequestCreatorById = z.infer<typeof getScaffholdRequestsByCreator>
export type uploadImageDTO = z.infer<typeof uploadImage>
export type ImageDTO = z.infer<typeof ImageSchema>