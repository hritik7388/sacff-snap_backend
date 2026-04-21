// src/services/jobServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { v4 as uuidv4 } from "uuid";
import { deleteJobCraftDTO, getJobCraftDTO, JobCraftDTO, JobSchemaDTO, updateJobCraftDTO } from "../schemas/jobSchema";


export class JobServices {

    async updateJobDescreption(userId: number, data: JobSchemaDTO) {
        try {

            const userData= await prisma.user.findUnique({
                where:{
                    id:userId,
                    status:"ACTIVE",
                    isDeleted:false,
                    isVerified:true,
                }
            })

            if(!userData){
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND,404,"User not found or inactive")
            }
            const scaffData = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffHoldId,
                    isDeleted: false,
                },
                include: {
                    project: true,
                    company: true,
                    jobCrafts: true,
                },
            });

            if (!scaffData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    404,
                    "Scaffhold not found or inactive"
                );
            }

            const isJobLinkCreated = !!(
                data.descreption &&
                scaffData.jobCrafts.length > 0
            );
            const newJob = await prisma.scaffhold.update({
                where: { id: data.scaffHoldId },
                data: {
                    descreption: data.descreption,
                    isJobLinkCreated,
                },
            });

            return {
                message: RESPONSE_MESSAGES.JOB.CREATE_JOB_DESCREPTION,

            };
        } catch (error: any) {
            console.error("❗ Error in createJobDescreption:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.JOB.FETCH_JOBS_FAILED,
                    500,
                    error.message
                );
        }
    }


    async addAndUpdateJobCraft(data: JobCraftDTO) {
        try {
            const jobData = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffId,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"]
                    },
                    isDeleted: false,
                },
                include: { jobCrafts: true },
            });

            if (!jobData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.JOB.JOB_NOT_FOUND,
                    404,
                    "Job not found"
                );
            }
            const craftData = await prisma.craft.findUnique({
                where: { id: data.craftId },
            });

            if (!craftData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.CRAFT.NOT_FOUND,
                    404,
                    "Craft not found"
                );
            }

            let jobCraft;
            const existingJobCraft = await prisma.jobCraft.findFirst({
                where: {
                    scaffholdId: data.scaffId,
                    craftId: data.craftId,
                },
            });

            if (existingJobCraft) {
                if (existingJobCraft.counts === data.counts) {
                    return {
                        message:
                            RESPONSE_MESSAGES.JOB_CRAFT.COUNT_ALREADY_EXISTS ||
                            "This count is already added, please change the count number",
                        data: existingJobCraft,
                    };
                }
                jobCraft = await prisma.jobCraft.update({
                    where: { id: existingJobCraft.id },
                    data: { counts: data.counts },
                    include: { craft: true },
                });
            } else {
                jobCraft = await prisma.jobCraft.create({
                    data: {
                        scaffholdId: data.scaffId,
                        craftId: data.craftId,
                        counts: data.counts,
                    },
                    include: { craft: true },
                });
            }

            const totalJobCrafts = [...jobData.jobCrafts, jobCraft];
            const isJobLinkCreated = !!(
                jobData.descreption &&
                totalJobCrafts.length > 0
            );

            await prisma.scaffhold.update({
                where: { id: data.scaffId },
                data: { isJobLinkCreated },
            });

            return {
                message: existingJobCraft
                    ? RESPONSE_MESSAGES.JOB_CRAFT.COUNT_UPDATED_SUCCESS
                    : RESPONSE_MESSAGES.JOB_CRAFT.ADD_SUCCESS,
                data: jobCraft,
            };
        } catch (error: any) {
            console.error("Error in addJobCraft:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.CRAFT.CREATE_FAILED,
                    500,
                    error.message
                );
        }
    }


    async getJobAndCraftDetails(data: getJobCraftDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findUnique({
                where: { id: data.id, isDeleted: false },
                include: {
                    jobCrafts: {
                        include: { craft: true },
                        orderBy: { id: 'desc' },
                    },
                    company: {
                        select: {
                            id: true,
                            name: true,
                            CMPId: true,
                        },
                    },
                    project: {
                        select: {
                            id: true,
                            clientName: true,
                            clientMobile: true,
                        },
                    },
                },
            });

            if (!scaffhold) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    404,
                    "Scaffhold not found"
                );
            }

            const { jobCrafts, company, project, ...rest } = scaffhold;
            const formattedJobCrafts = jobCrafts.map((jc) => ({
                id: jc.id,
                craftId: jc.craftId,
                counts: jc.counts,
                joinedCount: jc.joinedCount,
                name: jc.craft?.name || null,
                craftImage: jc.craft?.craftImage || null,
                createdAt: jc.craft?.createdAt || jc.createdAt,
                updatedAt: jc.craft?.updatedAt || jc.updatedAt,
            }));
            const totalCount = formattedJobCrafts.reduce((sum, jc) => sum + (jc.counts || 0), 0);
            const totalJoined = formattedJobCrafts.reduce((sum, jc) => sum + (jc.joinedCount || 0), 0);
            const vacancyClosed = totalCount === totalJoined;

            const responseData = {
                ...rest,
                CMPId: company?.CMPId || null,
                companyName: company?.name || null,
                clientName: project?.clientName || null,
                clientMobile: project?.clientMobile || null,
                totalCount,
                totalJoined,
                vacancyClosed,
                jobCrafts: formattedJobCrafts,
            };

            return {
                message: RESPONSE_MESSAGES.JOB_CRAFT.FETCH_SUCCESS,
                data: responseData,
            };
        } catch (error: any) {
            console.error("❗ Error in getJobAndCraftDetails:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.JOB.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async getCraftandCountlist() {
        try {
            const jobCrafts = await prisma.jobCraft.findMany({
                include: {
                    craft: {
                        select: {
                            name: true,
                            craftImage: true,
                        },
                    },
                },
                orderBy: { id: "asc" },
            });

            const craftList = jobCrafts.map((jc) => ({
                id: jc.id,                      // JobCraft ID
                scaffholdId: jc.scaffholdId,    // ✅ updated field name
                craftName: jc.craft.name,
                craftImage: jc.craft.craftImage,
                counts: jc.counts,
            }));

            return {
                message: RESPONSE_MESSAGES.CRAFT.LIST_FETCH_SUCCESS,
                data: craftList,
            };
        } catch (error: any) {
            console.error("Error in getCraftandCountlist:", error);
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.CRAFT.LIST_FETCH_FAILED,
                500,
                error.message
            );
        }
    }


    async deleteJobCrfats(data: deleteJobCraftDTO) {
        try {
            const job = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffId,
                    status: "ACTIVE",
                    isDeleted: false,
                },
            });

            if (!job) {
                throw new CustomError(
                    RESPONSE_MESSAGES.JOB.JOB_NOT_FOUND,
                    404,
                    "Job not found"
                );
            }
            const jobCraft = await prisma.jobCraft.findFirst({
                where: {
                    scaffholdId: data.scaffId,
                    id: data.craftId,
                },
            });

            if (!jobCraft) {
                throw new CustomError(
                    RESPONSE_MESSAGES.JOB_CRAFT.NOT_FOUND,
                    404,
                    "Craft not found for this job"
                );
            }
            await prisma.jobCraft.delete({
                where: {
                    id: jobCraft.id,
                },
            });

            return {
                message: RESPONSE_MESSAGES.JOB_CRAFT.DELETE_SUCCESS,
            };
        } catch (error: any) {
            console.error("Error in deleteJobCrfats:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error;
        }
    }



}