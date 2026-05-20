// src/schemas/uploadImageSChema.ts
import z, { string } from "zod"

export const uploadImageSchema = z.object({
    filename: z.string(),
    contentType: z.string()
})

export const ImageKeySchema = z.object({
    key: z.string(),
})


export type uploadImageDTO = z.infer<typeof uploadImageSchema>;

export type ImageKeyDTO = z.infer<typeof ImageKeySchema>;