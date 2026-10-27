// src/schemas/superAdminSchema.ts
import z, { date } from "zod";

export const superAdminSchema = z.object({
    email: z.string().email(),
    password: z.string(),

})  

export const searchQuestionnaireSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SearchQuestionnaireDTO = z.infer<
  typeof searchQuestionnaireSchema
>; 

export const generateVideoUploadSchema = z.object({
  filename: z.string().trim().min(1, "Filename is required"),
  contentType: z.enum([
    "video/mp4",
    "video/webm",
    "video/quicktime",
  ]),
});

export const createQuestionnaireSchema = z.object({
    testName: z.string().trim().min(1, "Test title is required"),
    description: z.string().trim().min(1, "Description is required"),
    status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
    videoUrl: z.string().url("Valid video URL is required"),
    certificateTemplateUrl: z.string().url("Valid certificate URL is required"),

    questions: z.array(
        z.object({
            questionText: z.string().trim().min(1, "Question is required"),
            options: z.array(
                z.object({
                    optionText: z.string().trim().min(1, "Option text is required"),
                    isCorrect: z.boolean(),
                })
            ).length(4, "Each question must have exactly 4 options"),
        }).superRefine((question, ctx) => {
            const correctCount = question.options.filter(
                (option) => option.isCorrect
            ).length;

            if (correctCount !== 1) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "Exactly one option must be correct",
                    path: ["options"],
                });
            }
        })
    ).min(1, "At least one question is required"),
});

export type CreateQuestionnaireDTO = z.infer<
    typeof createQuestionnaireSchema
>;


export const approveCompanyRequestSchema = z.object({
    id: z.number(),
});
export const rejectCompanyRequestSchema = z.object({
    id: z.number(),
});

export const companyStatus = z.object({
    id: z.number(),
});

export const updateQuestionnaireSchema =
  createQuestionnaireSchema.partial();

export const changeQuestionnaireStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export type UpdateQuestionnaireDTO = z.infer<
  typeof updateQuestionnaireSchema
>;

export type ChangeQuestionnaireStatusDTO = z.infer<
  typeof changeQuestionnaireStatusSchema
>;

export const addNewCompanySchema = z.object({
    name: z.string().min(1, "Company Name is required"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    image: z.string(),
    password: z.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: z
        .string()
        .min(8, "Phone number mustbe at least 10 characters long")
        .max(16, "Phone number cannot exceed 15 characters"),
    countryCode: z.string().min(1, "Country code is required").optional(),
    address: z.string().min(1, "Address is required"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
});



export const notifictaion = z.object({
    id: z.number(),
});

export const blogSchema = z.object({

    blogTitle: z.string(),
    category: z.string(),
    publishDate: z.string(),
    image: z.string(),
    blogBody: z.string(),
    status: z.string()

})
export const publishblogSchema = z.object({
    id: z.number(),
    blogTitle: z.string(),
    category: z.string(),
    publishDate: z.string(),
    image: z.string(),
    blogBody: z.string(),
    status: z.string()

})
export const deleteblogSchema = z.object({
    id: z.coerce.number(),

})

export const contact = z.object({
    name: z.string().min(1, "Company Name is required"),
    email: z.string().email("Invalid email format").min(1, "Email is required"),
    mobileNumber: z
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
    countryCode: z.string().min(1, "Country code is required").optional(),
    message: z.string().min(1, "Message is required"),
    submittedAt: z.string().optional(),
})

export const deleteContact = z.object({
    id: z.coerce.number(),

})

export const Contactinfo = z.object({
    id: z.coerce.number(),

})
export const blogByIdSchema = z.object({
    id: z.coerce.number(),

})

export const updateProfileImageSchema = z.object({
    profileImage: z.string(),
})


export const logout = z.object({
    deviceToken: z.string()
})
export type UpdateProfileImageDTO = z.infer<typeof updateProfileImageSchema>;

export type SuperAdminDTO = z.infer<typeof superAdminSchema>;
export type ApproveCompanyRequestDTO = z.infer<typeof approveCompanyRequestSchema>;
export type RejectCompanyRequestDTO = z.infer<typeof rejectCompanyRequestSchema>;

export type CompanyStatusDTO = z.infer<typeof companyStatus>;
export type AddNewCompanyDTO = z.infer<typeof addNewCompanySchema>;
export type notifictaionDTO = z.infer<typeof notifictaion>;
export type blogDTO = z.infer<typeof blogSchema>;
export type publishblogSchemaDTO = z.infer<typeof publishblogSchema>;

export type deleteblogSchemaDTO = z.infer<typeof deleteblogSchema>;

export type contactSchemaDTO = z.infer<typeof contact>;
export type deleteContactSchemaDTO = z.infer<typeof deleteContact>;
export type ContactinfochemaDTO = z.infer<typeof Contactinfo>;

export type blogByIdDTO = z.infer<typeof blogByIdSchema>;
export type LogoutDTO = z.infer<typeof logout>;