// src/schemas/subAdminSchema.ts

import z, { late, string } from "zod";

export const subAdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});
export const addTeamMemberSchema = z.object({
  name: z.string().min(2).max(100),
  user_type: z.enum(["PROJECT_MANAGER", "COMPETENT_PERSON"]),
  email: z.string().email(),
  mobileNumber: z.string().min(6).max(15),
  countryCode: z.string().min(1).max(5).optional(),
  address: z.string().min(5).max(200).optional(),
  password: z.string().min(6).max(100),
  idProofImage: z.string().min(1).max(500).optional(),
  photoImage: z.string().min(1).max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateTeamMemberSchema = z.object({
  id: z.number(),
  name: z.string().min(2).max(100),
  user_type: z.enum(["PROJECT_MANAGER", "COMPETENT_PERSON"]),
  email: z.string().email(),
  mobileNumber: z.string().min(6, { message: "Mobile number must be at least 6 digits" })
  .max(15, { message: "Mobile number must not exceed 15 digits" })
  .optional(),
  countryCode: z.string().min(1).max(5).optional(),
  address: z.string().min(5).max(200).optional(),
  idProofImage: z.string().min(1).max(500).optional(),
  photoImage: z.string().min(1).max(500).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});
export const addNewProjectSchema = z.object({
  projectName: z.string().min(2).max(100),
  clientName: z.string().min(2).max(100),
  clientEmail: z.string().email(),
  clientMobile: z.string().min(6, { message: "Mobile number must be at least 6 digits" })
  .max(15, { message: "Mobile number must not exceed 15 digits" })
  .optional(),
  clientCountryCode: z.string().min(1).max(5).optional(),
  clientAddress: z.string().min(5).max(200).optional(),
  startDate: z.string(), // ✅ required and valid date
  endDate: z.string(),
  projectManagerId: z.array(z.number()).min(1, "At least 1 projectManger persons are required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

})

export const updateProjectSchema = z.object({
  id: z.number(),
  projectName: z.string().min(2).max(100).optional(),
  clientName: z.string().min(2).max(100).optional(),
  clientEmail: z.string().email().optional(),
  clientMobile: z.string().min(6).max(15).optional(),
  clientCountryCode: z.string().min(1).max(5).optional(),
  clientAddress: z.string().min(5).max(200).optional(),
  startDate: z.string().optional(), // ✅ required and valid date
  endDate: z.string().optional(),
  projectManagerId: z.array(z.number()).min(1, "At least 1 projectManger persons are required"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),

})

export const searchTeamMemberSchema = z.object({
  user_type: z.enum(["PROJECT_MANAGER", "COMPETENT_PERSON"]),
  search: z.string().min(1).max(100).optional(),
});

export const TeamMemberSchema = z.object({
  user_type: z.enum(["PROJECT_MANAGER", "COMPETENT_PERSON", "TRADESMAN"]),
  scaffHoldId: z.coerce.number(),
});


export const scaffHoldRequest = z.object({
  scaffHoldId: z.coerce.number(),
  search: z.string().min(0).max(100).optional(),
});

export const TimelineImageFilter = z.object({
  scaffHoldId: z.coerce.number().optional(),
  status: z.string().optional(),
})




export type LoginSubAdminDTO = z.infer<typeof subAdminLoginSchema>;
export type AddTeamMemberDTO = z.infer<typeof addTeamMemberSchema>;
export type UpdateTeamMemberDTO = z.infer<typeof updateTeamMemberSchema>;
export type AddNewProjectDTO = z.infer<typeof addNewProjectSchema>;
export type SearchTeamMemberDTO = z.infer<typeof searchTeamMemberSchema>;
export type TeamMemberDTO = z.infer<typeof TeamMemberSchema>;
export type ScaffHoldRequestDTO = z.infer<typeof scaffHoldRequest>;
export type TimelineImageFilterDTO = z.infer<typeof TimelineImageFilter>;

export type updateProjectDTO = z.infer<typeof updateProjectSchema>

