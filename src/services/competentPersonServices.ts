import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { GetInspectionsDTO, InspectionDTO, statusDTO, TimeLineDTO, TimeLineTagDTO } from "../schemas/competentPersonSchema";
import { inspect } from "util";
import { ScaffholdStatus } from "@prisma/client";
import { pushNotificationDelhi } from "../helpers/utils";

export class CompetentPersonServices {
    async dashboard(userId: number) {
        try {
            const assignedCount = await prisma.scaffhold.count({

                where: {
                    competentPersons: {
                        some: {
                            competentPerson: {
                                userId: userId,
                            },
                        },
                    },
                    isDeleted: false,
                },
            });
            const untaggedCount = await prisma.scaffhold.count({
                where: {
                    tag: 'UNTAGED',
                    isDeleted: false, competentPersons: {
                        some: {
                            competentPerson: {
                                userId: userId,
                            },
                        },
                    },
                },
            });
            const activeCount = await prisma.scaffhold.count({
                where: {
                    status: 'ACTIVE',
                    isDeleted: false, competentPersons: {
                        some: {
                            competentPerson: {
                                userId: userId,
                            },
                        },
                    },
                },
            });
            const dismantledCount = await prisma.scaffhold.count({
                where: {
                    status: 'DISMANTLED',
                    isDeleted: false, competentPersons: {
                        some: {
                            competentPerson: {
                                userId: userId,
                            },
                        },
                    },
                },
            });

            return {
                message: RESPONSE_MESSAGES.COMPETENTPERSON.DASHBOARD_SUCCESS,
                data: {
                    assignedScaffolds: assignedCount,
                    untaggedScaffolds: untaggedCount,
                    activeScaffolds: activeCount,
                    dismantledScaffolds: dismantledCount,
                },
            };
        } catch (error: any) {
            console.error("❗ Error in dashboard:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.COMPETENTPERSON.DASHBOARD_FAILED,
                    500,
                    error.message
                );
        }
    }

    async createInspection(userId: number, data: InspectionDTO) {
        try {
            const inspection = await prisma.competentPersonInspection.create({
                data: {
                    scaffholdId: data.scaffholdId,
                    Date: data.Date,
                    shift: data.shift,
                    note: data.notes,
                    createdById: userId,
                },
            });

            return {
                message: RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_INSPECTION_CREATION,
                data: inspection,
            };

        } catch (error: any) {
            console.error("❗ Error in createInspection:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_INSPECTION_CREATION,
                    500,
                    error.message
                );
        }

    }


    async getInspectionsByScaffholdId(data: GetInspectionsDTO, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const [inspections, totalCount] = await Promise.all([
                prisma.competentPersonInspection.findMany({
                    where: { scaffholdId: data.scaffholdId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        scaffholdId: true,
                        createdById: true,
                        shift: true,
                        note: true,
                        Date: true,
                        createdAt: true,
                        updatedAt: true,
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                }),
                prisma.competentPersonInspection.count({
                    where: { scaffholdId: data.scaffholdId },
                }),
            ]);
            const newResponse = inspections.map((inspection) => ({
                id: inspection.id,
                scaffholdId: inspection.scaffholdId,
                createdById: inspection.createdById,
                shift: inspection.shift,
                note: inspection.note,
                Date: inspection.Date,
                createdAt: inspection.createdAt,
                updatedAt: inspection.updatedAt,
                createdByName: inspection.createdBy.name,
                createdByEmail: inspection.createdBy.email,
            }));
            return {
                message: RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_GET_INSPECTIONS,
                data: newResponse,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❗ Error in getInspectionsByScaffholdId:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_GET_INSPECTIONS,
                500,
                error.message
            );
        }
    }

    async competentPersonTimeline(userId: number, data: TimeLineDTO) {
        try {
            const user = await prisma.user.findFirst({
                where: { id: userId, status: "ACTIVE" }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
            }

            const scaffholdData = await prisma.scaffhold.findFirst({
                where: { id: data.scaffholdId, isDeleted: false },

            });
            if (!scaffholdData) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404);
            }
            if (data.timeLineStatus) {
                const existingTimeline = await prisma.scaffholdTimeline.findFirst({
                    where: {
                        scaffholdId: data.scaffholdId,
                        timeLineStatus: data.timeLineStatus
                    }
                });
                if (existingTimeline) {
                    throw new CustomError(RESPONSE_MESSAGES.COMPETENTPERSON.DUPLICATE_TIMELINE_STATUS, 400);
                }
            }
            const timeline = await prisma.scaffholdTimeline.create({
                data: {
                    uuid: uuidv4(),
                    scaffholdId: data.scaffholdId,
                    timeLineStatus: data.timeLineStatus as ScaffholdStatus,
                    note: data.notes,
                    createdById: userId,
                    address: data.address,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    image: data.images && data.images.length > 0
                        ? {
                            create: data.images.map((url) => ({
                                url,
                                status: data.timeLineStatus
                            }))
                        }
                        : undefined
                },
                include: {
                    image: true
                }
            });

            await prisma.scaffhold.update({
                where: { id: data.scaffholdId },
                data: {
                    status: data.timeLineStatus as ScaffholdStatus
                }
            });

            const formattedResponse = {
                id: timeline.id,
                uuid: timeline.uuid,
                scaffholdId: timeline.scaffholdId,
                date: scaffholdData.startDate,
                timeLineStatus: timeline.timeLineStatus,
                note: timeline.note,
                createdById: timeline.createdById,
                createdAt: timeline.createdAt,
                updatedAt: timeline.updatedAt,
                images: timeline.image.map(img => img.url),
                address: timeline.address,
                latitude: timeline.latitude,
                longitude: timeline.longitude,
            }


            const companyId = scaffholdData.companyId;
            const notificationMessage =
                `Scaffold ${scaffholdData.SCAFFID} for Project ${scaffholdData.projectId} | ${scaffholdData.projectName} has been ${data.timeLineStatus}. Action performed by ${user.name}.`;
            await prisma.notification.create({
                data: {
                    uuid: uuidv4(),
                    title: `ScaffHold ${data.timeLineStatus}`,
                    message: notificationMessage,
                    type: "TIMELINE_UPDATE",
                    role: "COMPANY",
                    companyId: companyId,
                    receiverId: companyId,
                    senderId: userId.toString(),
                    isRead: false,
                },
            });
            const companyUsers = await prisma.projectManager.findMany({
                where: { companyId },
                select: { id: true }
            });

            const devices = await prisma.device.findMany({
                where: {
                    userId: { in: companyUsers.map(u => u.id) },
                    deviceToken: { not: null }
                },
                select: { deviceToken: true }
            });
            for (const d of devices) {
                if (!d.deviceToken) continue;

                await pushNotificationDelhi(
                    d.deviceToken,
                    `ScaffHold ${data.timeLineStatus}`,
                    notificationMessage
                );
            }

            return {
                message: RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_CREATE_TIMELINE,
                data: formattedResponse
            };
        } catch (error: any) {
            console.error("❗ Error in competentPersonTimeline:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_CREATE_TIMELINE,
                500,
                error.message
            );
        }
    }

    async Timelinetag(userId: number, data: TimeLineTagDTO) {
        try {
            // Fetch user
            const user = await prisma.user.findFirst({
                where: { id: userId, status: "ACTIVE" }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
            }

            const scaffholdData = await prisma.scaffhold.findFirst({
                where: { id: data.scaffholdId, isDeleted: false }
            });
            if (!scaffholdData) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404);
            }
            const timeline = await prisma.scaffholdTimeline.create({
                data: {
                    uuid: uuidv4(),
                    scaffholdId: data.scaffholdId,
                    timeLineStatus: scaffholdData.status,
                    tag: data.tag,
                    note: data.notes,
                    createdById: userId,
                }
            });
            await prisma.scaffhold.update({
                where: { id: data.scaffholdId },
                data: {
                    tag: data.tag
                }
            });
            const formattedResponse = {
                id: timeline.id,
                uuid: timeline.uuid,
                scaffholdId: timeline.scaffholdId,
                tag: timeline.tag,
                note: timeline.note,
                createdById: timeline.createdById,
                createdAt: timeline.createdAt,
                updatedAt: timeline.updatedAt,
            }
            return {
                message: RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_CREATE_TIMELINE,
                data: formattedResponse
            };
        } catch (error: any) {
            console.error("❗ Error in competentPersonTimeline:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_CREATE_TIMELINE,
                500,
                error.message
            );
        }
    }


    async getScaffholdTimeline(scaffholdId: GetInspectionsDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findFirst({
                where: { id: scaffholdId.scaffholdId, isDeleted: false },
            });

            if (!scaffhold) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404);
            }

            const timelines = await prisma.scaffholdTimeline.findMany({
                where: { scaffholdId: scaffholdId.scaffholdId },
                include: { image: true, createdBy: true },
                orderBy: { createdAt: 'asc' }
            });
            const formattedTimeline = timelines.map(t => ({
                id: t.id,
                uuid: t.uuid,
                scaffHoldId: t.scaffholdId,
                timeLineStatus: t.timeLineStatus,
                note: t.note,
                tag: t.tag,
                images: t.image.map(img => img.url),
                createdByid: t.createdById,
                createdByName: t.createdBy.name,
                createdByEmail: t.createdBy.email,
                createdAt: t.createdAt,
                updatedAt: t.updatedAt,
                date: t.createdAt
            }));

            return {
                message: RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_GET_TIMELINE,
                data: formattedTimeline
            };

        } catch (error: any) {
            console.error("❗ Error in getScaffholdTimeline:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_GET_TIMELINE,
                500,
                error.message
            );
        }
    }

    async getAllTimelineImages(scaffholdId: GetInspectionsDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findFirst({
                where: { id: scaffholdId.scaffholdId, isDeleted: false },
            });

            if (!scaffhold) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404);
            }
            const timelines = await prisma.scaffholdTimeline.findMany({
                where: { scaffholdId: scaffholdId.scaffholdId },
                select: { id: true }
            });

            if (!timelines.length) {
                throw new CustomError(RESPONSE_MESSAGES.TIMELINE.NO_TIMELINE_FOUND, 404);
            }
            const timelineIds = timelines.map((t) => t.id);
            const images = await prisma.timelineImage.findMany({
                where: { timelineId: { in: timelineIds } },
                select: { url: true, status: true },
                orderBy: { id: "desc" },
            });

            if (!images.length) {
                throw new CustomError(RESPONSE_MESSAGES.TIMELINE.NO_IMAGES_FOUND, 404);
            }
            const imageUrls = images.map((img) => ({
                url: img.url,
                status: img.status
            }));

            return {
                message: RESPONSE_MESSAGES.TIMELINE.SUCCESS_FETCH_IMAGES,
                data: images
            };
        } catch (error: any) {
            console.error("❗ Error in getAllTimelineImages:", error);
            if (error instanceof CustomError) throw error;
            throw new CustomError(
                RESPONSE_MESSAGES.TIMELINE.FAILED_FETCH_IMAGES,
                500,
                error.message
            );
        }
    }


    async getScaffHoldListForCompetentPerson(userId: number, page: number = 1, limit: number = 10) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { user_type: true },
            });

            if (!user) {
                throw new CustomError("User not found", 404);
            }
            let scaffholdWhere: any = {
                isDeleted: false,
            };
            if (user.user_type === "COMPETENT_PERSON") {
                const competentPerson = await prisma.competentPerson.findFirst({
                    where: { userId },
                });
                if (!competentPerson) {
                    throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Competent Person not found");
                }

                scaffholdWhere.competentPersons = {
                    some: { competentPersonId: competentPerson.id }
                };
            }
            if (user.user_type === "PROJECT_MANAGER") {
                scaffholdWhere.project = {
                    projectManagerId: userId
                };
            }
            const [scaffHoldList, total] = await Promise.all([
                prisma.scaffhold.findMany({
                    where: scaffholdWhere,
                    include: {
                        project: {
                            select: {
                                clientName: true,
                                clientEmail: true,
                                clientMobile: true,
                                clientCountryCode: true,
                                clientAddress: true,
                                projectManagerId: true,
                            },
                        },
                        company: {
                            select: {
                                CMPId: true,
                                name: true,
                            }
                        }
                    },
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                }),
                prisma.scaffhold.count({ where: scaffholdWhere })
            ]);
            const formattedList = scaffHoldList.map((s) => ({
                id: s.id?.toString() || null,
                uuid: s.uuid || null,
                SCAFFID: s.SCAFFID || null,
                address: s.address || null,
                latitude: s.latitude || null,
                longitude: s.longitude || null,
                descreption: s.descreption || null,
                startDate: s.startDate || null,
                endDate: s.endDate || null,
                priority: s.priority || null,
                tag: s.tag || null,
                status: s.status || null,
                isDeleted: s.isDeleted || false,
                isJobLinkCreated: s.isJobLinkCreated || false,
                projectId: s.projectId?.toString() || null,
                projectName: s.projectName || null,
                companyId: s.companyId?.toString() || null,
                companyName: s.company?.name || null,
                cmpid: s.companyId?.toString() || null,
                clientName: s.project?.clientName || null,
                clientMobile: s.project?.clientMobile || null,
                createdById: s.createdById?.toString() || null,
                createdAt: s.createdAt?.toISOString() || null,
                updatedAt: s.updatedAt?.toISOString() || null,
            }));
            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: formattedList,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error: any) {
            console.error("❌ Fetch ScaffHold list for competent person error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, "Failed to fetch scaffhold list");
        }
    }

}