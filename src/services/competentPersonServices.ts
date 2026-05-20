// src/services/competentPersonServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { GetInspectionsDTO, InspectionDTO, statusDTO, TimeLineDTO, TimeLineTagDTO } from "../schemas/competentPersonSchema";
import { ProjectStatus, RequestStatus, ScaffholdStatus, ScaffholdTags } from "@prisma/client";
import { pushNotificationDelhi } from "../helpers/utils";

export class CompetentPersonServices {
    async dashboard(userId: number) {
        try {

            // 🔥 GET ALL REQUESTS ASSIGNED TO COMPETENT PERSON
            const assignedRequests = await prisma.projectScaffholdRequest.count({
                where: {
                    project: {
                        competentPersons: {
                            some: {
                                competentPerson: {
                                    userId: userId,
                                },
                            },
                        },
                    },
                },
            });

            // 🔥 UNTAGED (default state)
            const untaggedCount = await prisma.projectScaffholdRequest.count({
                where: {
                    tag: "UNTAGED",
                    project: {
                        competentPersons: {
                            some: {
                                competentPerson: {
                                    userId: userId,
                                },
                            },
                        },
                    },
                },
            });

            // 🔥 ACTIVE
            const activeCount = await prisma.projectScaffholdRequest.count({
                where: {
                    status: "APPROVED", // or ACTIVE equivalent in request flow
                    project: {
                        competentPersons: {
                            some: {
                                competentPerson: {
                                    userId: userId,
                                },
                            },
                        },
                    },
                },
            });

            // 🔥 DISMANTLED (if mapped via status in request system)
            const dismantledCount = await prisma.projectScaffholdRequest.count({
                where: {
                    status: "REJECTED", // adjust if you use different lifecycle
                    project: {
                        competentPersons: {
                            some: {
                                competentPerson: {
                                    userId: userId,
                                },
                            },
                        },
                    },
                },
            });

            return {
                message: RESPONSE_MESSAGES.COMPETENTPERSON.DASHBOARD_SUCCESS,
                data: {
                    assignedRequests: assignedRequests,
                    untaggedRequests: untaggedCount,
                    activeRequests: activeCount,
                    dismantledRequests: dismantledCount,
                },
            };

        } catch (error: any) {
            console.error("❗ Error in dashboard:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.COMPETENTPERSON.DASHBOARD_FAILED,
                500,
                error.message
            );
        }
    }

    async getCompetentProjectListServices(
        id: number,
        page: number = 1,
        limit: number = 10,
        status?: string
    ) {
        console.log("=================>>>>", status)
        try {
            const skip = (page - 1) * limit;

            // ✅ BASE CONDITION
            const whereCondition: any = {
                isDeleted: false,
                competentPersons: {
                    some: {
                        competentPerson: {
                            userId: id,
                        },
                    },
                },


            };


            // ✅ STATUS FILTER (FINAL FIX)
            if (status && status.trim() !== "") {
                whereCondition.status = status.trim().toUpperCase();
            }

            const [projects, totalCount] = await Promise.all([
                prisma.project.findMany({
                    where: whereCondition,
                    select: {
                        id: true,
                        uuid: true,
                        projectName: true,
                        PJT: true,
                        clientName: true,
                        clientEmail: true,
                        clientMobile: true,
                        clientCountryCode: true,
                        clientAddress: true,
                        startDate: true,
                        endDate: true,
                        latitude: true,
                        longitude: true,
                        createdById: true,
                        projectManagers: true,
                        status: true,
                        isDeleted: true,
                        createdAt: true,
                        updatedAt: true,

                        _count: {
                            select: {
                                projectTimelines: true,
                                TradesManRequests: true,
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: "desc",
                    },
                }),

                prisma.project.count({ where: whereCondition }),
            ]);

            const formattedProjects = projects.map((p) => ({
                id: p.id,
                uuid: p.uuid,
                projectName: p.projectName,
                clientName: p.clientName,
                clientEmail: p.clientEmail,
                clientMobile: p.clientMobile,
                clientCountryCode: p.clientCountryCode,
                clientAddress: p.clientAddress,
                startDate: p.startDate,
                endDate: p.endDate,
                latitude: p.latitude,
                longitude: p.longitude,
                createdById: p.createdById,
                projectManager: p.projectManagers,
                status: p.status,
                isDeleted: p.isDeleted,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,

                totalRequests: p._count.TradesManRequests,
                totalTimelines: p._count.projectTimelines,
            }));
            console.log("formattedProjects==============>>>>", formattedProjects)

            return {
                message: RESPONSE_MESSAGES.PROJECT.FETCH_ALL_SUCCESS,
                data: formattedProjects,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };

        } catch (error: any) {
            console.error("❌ Get Project List error:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.PROJECT.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async createInspection(userId: number, data: InspectionDTO) {
        try {
            // =========================
            // 👷 CHECK COMPETENT PERSON
            // =========================
            const competentPerson = await prisma.competentPerson.findFirst({
                where: {
                    userId: userId,
                },
                select: {
                    user: {
                        select: {
                            status: true,
                            isDeleted: true,
                        },
                    },
                },
            });

            if (!competentPerson || competentPerson.user?.status !== "ACTIVE") {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.NOT_FOUND,
                    404,
                    "Competent person not found"
                );
            }

            if (competentPerson.user?.isDeleted) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.DELETED,
                    400,
                    "Competent person is deleted"
                );
            }

            // =========================
            // 🔥 GET REQUEST
            // =========================
            const request = await prisma.projectScaffholdRequest.findFirst({
                where: {
                    id: BigInt(data.scaffHoldId),
                },
                select: {
                    id: true,
                    projectId: true,
                },
            });

            if (!request) {
                throw new CustomError(
                    "Scaffold request not found",
                    404,
                    "REQUEST_NOT_FOUND"
                );
            }

            // =========================
            // 🔥 CREATE INSPECTION
            // =========================
            const inspection =
                await prisma.competentPersonProjectInspection.create({
                    data: {
                        projectId: request.projectId, // ✅ CORRECT FIX

                        Date: data.Date,
                        shift: data.shift,
                        note: data.notes,

                        createdById: BigInt(userId),
                    },
                });

            return {
                message:
                    RESPONSE_MESSAGES.COMPETENTPERSON
                        .SUCCESS_INSPECTION_CREATION,

                data: inspection,
            };
        } catch (error: any) {
            console.error("❗ Error in createInspection:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.COMPETENTPERSON
                    .FAILED_INSPECTION_CREATION,
                500,
                error.message
            );
        }
    }

    async getInspectionsByScaffholdId(
        data: GetInspectionsDTO,
        page: number = 1,
        limit: number = 10
    ) {
        try {
            const skip = (page - 1) * limit;

            // =========================
            // 🔥 STEP 1: GET REQUEST
            // =========================
            const request = await prisma.projectScaffholdRequest.findFirst({
                where: {
                    id: BigInt(data.scaffHoldId),
                },
                select: {
                    projectId: true,
                },
            });

            if (!request) {
                throw new CustomError("Request not found", 404, "NOT_FOUND");
            }

            const projectId = request.projectId;

            // =========================
            // 🔥 STEP 2: INSPECTIONS
            // =========================
            const [inspections, totalCount] = await Promise.all([
                prisma.competentPersonProjectInspection.findMany({
                    where: {
                        projectId: projectId, // ✅ FIXED
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        projectId: true,
                        createdById: true,
                        shift: true,
                        note: true,
                        Date: true,
                        createdAt: true,
                        updatedAt: true,

                        createdBy: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                }),

                prisma.competentPersonProjectInspection.count({
                    where: {
                        projectId: projectId,
                    },
                }),
            ]);

            // =========================
            // 🔥 FLAT RESPONSE
            // =========================
            const newResponse = inspections.map((i) => ({
                id: i.id,
                projectId: i.projectId,

                shift: i.shift,
                note: i.note,
                Date: i.Date,

                createdAt: i.createdAt,
                updatedAt: i.updatedAt,

                createdByName: i.createdBy?.name || null,
                createdByEmail: i.createdBy?.email || null,
            }));

            return {
                message:
                    RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_GET_INSPECTIONS,

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

            // 🔥 USER VALIDATION (same)
            const user = await prisma.user.findFirst({
                where: {
                    id: userId,
                    status: "ACTIVE",
                    isDeleted: false,
                    isVerified: true,
                },
            });

            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
            }

            if (user.isDeleted === true) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.DELETED,
                    400,
                    "Competent person is deleted"
                );
            }

            // 🔥 REPLACE scaffhold → ProjectScaffholdRequest
            const request = await prisma.projectScaffholdRequest.findFirst({
                where: {
                    id: data.scaffHoldId,
                },
                include: {
                    project: true,
                    createdBy: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            if (!request) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    404
                );
            }

            // 🔥 duplicate timeline check
            if (data.timeLineStatus) {

                const existingTimeline =
                    await prisma.projectScaffholdTimeline.findFirst({
                        where: {

                            // ✅ FIXED
                            scaffoldRequestId: request.id,

                            timeLineStatus:
                                data.timeLineStatus as ScaffholdStatus,
                        },
                    });

                if (existingTimeline) {
                    throw new CustomError(
                        RESPONSE_MESSAGES.COMPETENTPERSON
                            .DUPLICATE_TIMELINE_STATUS,
                        400
                    );
                }
            }

            // 🔥 CREATE TIMELINE
            const timeline =
                await prisma.projectScaffholdTimeline.create({
                    data: {

                        uuid: uuidv4(),

                        // ✅ PROJECT
                        projectId: request.projectId,

                        // ✅ REQUEST
                        scaffoldRequestId: request.id,

                        timeLineStatus:
                            data.timeLineStatus as ScaffholdStatus,

                        note: data.notes,

                        createdById: userId,

                        address: data.address,

                        latitude: data.latitude,

                        longitude: data.longitude,

                        image:
                            data.images &&
                                data.images.length > 0
                                ? {
                                    create: data.images.map((url) => ({
                                        url,
                                        status: data.timeLineStatus,
                                    })),
                                }
                                : undefined,
                    },

                    include: {
                        image: true,
                    },
                });

            // =======================================
            // START RENTAL CYCLE
            // =======================================

            if (data.timeLineStatus === "ERECTED") {

                // 🔥 Close previous cycle
                const lastCycle =
                    await prisma.rentalCycle.findFirst({
                        where: {
                            scaffoldRequestId: request.id,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    });

                if (lastCycle) {

                    const diffMs =
                        new Date().getTime() -
                        lastCycle.erectedAt.getTime();

                    const totalDays = Math.max(
                        1,
                        Math.ceil(
                            diffMs /
                            (1000 * 60 * 60 * 24)
                        )
                    );

                    await prisma.rentalCycle.update({
                        where: {
                            id: lastCycle.id,
                        },
                        data: {
                            totalDays,
                        },
                    });
                }

                // 🔥 CREATE NEW CYCLE
                await prisma.rentalCycle.create({
                    data: {

                        uuid: uuidv4(),

                        projectId: request.projectId,

                        scaffoldRequestId: request.id,

                        erectedAt: new Date(),

                        totalDays: 0,

                        cycleCount: 0,

                        rentalDays: 0,
                    },
                });
            }

            // 🔥 UPDATE REQUEST STATUS
            await prisma.projectScaffholdRequest.update({
                where: {
                    id: request.id,
                },
                data: {
                    status:
                        data.timeLineStatus as RequestStatus,
                },
            });



            // 🔥 RESPONSE FORMAT
            const formattedResponse = {
                id: timeline.id,

                uuid: timeline.uuid,

                projectId: timeline.projectId,

                scaffoldRequestId:
                    timeline.scaffoldRequestId,

                date: request.startDate,

                timeLineStatus:
                    timeline.timeLineStatus,

                note: timeline.note,

                createdById:
                    timeline.createdById,

                createdAt: timeline.createdAt,

                updatedAt: timeline.updatedAt,

                images: timeline.image.map(
                    (img) => img.url
                ),

                address: timeline.address,

                latitude: timeline.latitude,

                longitude: timeline.longitude,
            };

            // 🔥 FULL PROJECT DATA
            const projectFullData =
                await prisma.project.findUnique({
                    where: {
                        id: request.projectId,
                    },
                    select: {
                        createdById: true,

                        tradesMen: {
                            select: {
                                tradesMan: {
                                    select: {
                                        userId: true,
                                    },
                                },
                            },
                        },

                        competentPersons: {
                            select: {
                                competentPerson: {
                                    select: {
                                        userId: true,
                                    },
                                },
                            },
                        },
                    },
                });

            // 🔥 NOTIFICATION MESSAGE
            const notificationMessage =
                `Project ${request.projectId} | ${request.project?.projectName
                } has been ${data.timeLineStatus
                }. Action performed by ${user.name
                }.`;

            // 🔥 COMPANY NOTIFICATION
            if (projectFullData) {

                await prisma.notification.create({
                    data: {

                        uuid: uuidv4(),

                        title:
                            `Project ${data.timeLineStatus}`,

                        message: notificationMessage,

                        type: "SCAFFOLD_STATUS_UPDATE",

                        role: "COMPANY",

                        companyId:
                            projectFullData.createdById,

                        receiverId:
                            projectFullData.createdById,

                        senderId: userId.toString(),

                        scaffoldRequestId:
                            request.id.toString(),

                        isRead: false,

                        notificationImage:
                            "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/scaffDismented.png",
                    },
                });

                // 🔥 DEVICE PUSH (COMPANY)
                const companyDevice =
                    await prisma.device.findMany({
                        where: {
                            userId: Number(
                                projectFullData.createdById
                            ),
                            user_type: "COMPANY",
                            deviceToken: { not: null },
                        },
                        select: {
                            deviceToken: true,
                        },
                    });

                for (const d of companyDevice) {

                    if (!d.deviceToken) continue;

                    await pushNotificationDelhi(
                        d.deviceToken,
                        `Project ${data.timeLineStatus}`,
                        notificationMessage
                    );
                }
            }

            // 🔥 PROJECT MANAGERS
            const projectWithPMs =
                await prisma.project.findUnique({
                    where: {
                        id: request.projectId,
                    },
                    include: {
                        projectManagers: {
                            select: {
                                id: true,
                            },
                        },
                    },
                });

            const projectManagerIds =
                projectWithPMs?.projectManagers.map(
                    (pm) => pm.id
                ) || [];

            for (const pmId of projectManagerIds) {

                await prisma.notification.create({
                    data: {

                        uuid: uuidv4(),

                        title:
                            `Project ${data.timeLineStatus}`,

                        message: notificationMessage,

                        type: "SCAFFOLD_STATUS_UPDATE",

                        role: "PROJECT_MANAGER",

                        companyId:
                            projectFullData?.createdById ??
                            undefined,

                        receiverId: pmId,

                        senderId: userId.toString(),

                        scaffoldRequestId:
                            request.id.toString(),

                        isRead: false,

                        notificationImage:
                            "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/status.png",
                    },
                });

                const pmDevices =
                    await prisma.device.findMany({
                        where: {
                            userId: pmId,
                            user_type: "PROJECT_MANAGER",
                            deviceToken: { not: null },
                        },
                        select: {
                            deviceToken: true,
                        },
                    });

                for (const d of pmDevices) {

                    if (!d.deviceToken) continue;

                    await pushNotificationDelhi(
                        d.deviceToken,
                        `Project ${data.timeLineStatus}`,
                        notificationMessage
                    );
                }
            }

            // 🔥 TRADESMEN
            const tradesmenData =
                await prisma.project.findFirst({
                    where: {
                        id: request.projectId,
                    },
                    select: {
                        tradesMen: {
                            select: {
                                tradesMan: {
                                    select: {
                                        userId: true,
                                    },
                                },
                            },
                        },
                    },
                });

            if (tradesmenData?.tradesMen?.length) {

                for (const tm of tradesmenData.tradesMen) {

                    const receiverId =
                        tm.tradesMan?.userId;

                    if (!receiverId) continue;

                    await prisma.notification.create({
                        data: {

                            uuid: uuidv4(),

                            title:
                                `Project ${data.timeLineStatus}`,

                            message:
                                notificationMessage,

                            type:
                                "SCAFFOLD_STATUS_UPDATE",

                            role: "TRADESMAN",

                            companyId:
                                projectFullData?.createdById ??
                                undefined,

                            scaffoldRequestId:
                                request.id.toString(),

                            receiverId,

                            senderId:
                                userId.toString(),

                            isRead: false,

                            notificationImage:
                                "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/status.png",
                        },
                    });

                    const tmDevices =
                        await prisma.device.findMany({
                            where: {
                                userId: receiverId,
                                user_type: "TRADESMAN",
                                deviceToken: { not: null },
                            },
                            select: {
                                deviceToken: true,
                            },
                        });

                    for (const d of tmDevices) {

                        if (!d.deviceToken) continue;

                        await pushNotificationDelhi(
                            d.deviceToken,
                            `Project ${data.timeLineStatus}`,
                            notificationMessage
                        );
                    }
                }
            }

            // 🔥 COMPETENT PERSONS
            const competentPersonsData =
                projectFullData?.competentPersons?.map(
                    (cp) => ({
                        userId:
                            cp.competentPerson.userId,
                    })
                ) || [];

            if (competentPersonsData.length > 0) {

                const userIds =
                    competentPersonsData.map(
                        (cp) => cp.userId
                    );

                const cpDevices =
                    await prisma.device.findMany({
                        where: {
                            userId: { in: userIds },
                            deviceToken: { not: null },
                        },
                        select: {
                            userId: true,
                            deviceToken: true,
                        },
                    });

                await prisma.notification.createMany({
                    data:
                        competentPersonsData.map((cp) => ({
                            uuid: uuidv4(),

                            title:
                                `Project ${data.timeLineStatus}`,

                            message:
                                notificationMessage,

                            type:
                                "SCAFFOLD_STATUS_UPDATE",

                            role:
                                "COMPETENT_PERSON",

                            isRead: false,

                            companyId:
                                projectFullData?.createdById
                                    ? BigInt(
                                        projectFullData.createdById
                                    )
                                    : null,

                            receiverId:
                                BigInt(cp.userId),

                            senderId:
                                userId.toString(),

                            scaffoldRequestId:
                                request.id.toString(),

                            notificationImage:
                                "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/status.png",
                        })),
                });

                for (const d of cpDevices) {

                    if (!d.deviceToken) continue;

                    await pushNotificationDelhi(
                        d.deviceToken,
                        "Project Update",
                        notificationMessage
                    );
                }
            }

            // 🔥 FINAL RETURN
            return {
                message:
                    RESPONSE_MESSAGES
                        .COMPETENTPERSON
                        .SUCCESS_CREATE_TIMELINE,

                data: formattedResponse,
            };

        } catch (error: any) {

            console.error(
                "❗ Error in competentPersonTimeline:",
                error
            );

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES
                    .COMPETENTPERSON
                    .FAILED_CREATE_TIMELINE,
                500,
                error.message
            );
        }
    }
    async Timelinetag(
        userId: number,
        data: TimeLineTagDTO
    ) {
        try {

            const dutyCount = [
                data.lightDuty,
                data.mediumDuty,
                data.heavyDuty,
            ].filter(Boolean).length;

            if (dutyCount > 1) {
                throw new CustomError(
                    "Only one duty type can be selected",
                    400
                );
            }

            // =======================================
            // USER VALIDATION
            // =======================================

            const user = await prisma.user.findFirst({
                where: {
                    id: userId,
                    status: "ACTIVE",
                },
            });

            if (!user) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.NOT_FOUND,
                    404
                );
            }

            // =======================================
            // GET REQUEST
            // =======================================

            const request =
                await prisma.projectScaffholdRequest.findFirst({
                    where: {
                        id: data.scaffHoldId,
                    },

                    include: {
                        project: {
                            select: {
                                id: true,
                                PJT: true,
                                createdById: true,

                                competentPersons: {
                                    include: {
                                        competentPerson: true,
                                    },
                                },

                                tradesMen: {
                                    select: {
                                        tradesMan: {
                                            select: {
                                                userId: true,
                                            },
                                        },

                                        tradesManId: true,
                                    },
                                },
                            },
                        },
                    },
                });

            if (!request) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    404
                );
            }

            const project = request.project;

            // =======================================
            // GET LAST TIMELINE STATUS
            // =======================================

            const lastTimeline =
                await prisma.projectScaffholdTimeline.findFirst({
                    where: {
                        scaffoldRequestId: request.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

            if (!lastTimeline) {
                throw new CustomError(
                    "No timeline found for this scaffold request",
                    400
                );
            }

            // =======================================
            // DUPLICATE TAG CHECK
            // =======================================

            const existingTagTimeline =
                await prisma.projectScaffholdTimeline.findFirst({
                    where: {
                        scaffoldRequestId: request.id,
                        tag: data.tag,
                    },
                });

            if (existingTagTimeline) {
                throw new CustomError(
                    "This tag has already been applied.",
                    400
                );
            }

            // =======================================
            // CREATE TIMELINE
            // =======================================

            const timeline =
                await prisma.projectScaffholdTimeline.create({
                    data: {

                        uuid: uuidv4(),

                        projectId: request.projectId,

                        scaffoldRequestId: request.id,

                        // ✅ FETCHED FROM LAST TIMELINE
                        timeLineStatus:
                            lastTimeline.timeLineStatus,

                        tag: data.tag,

                        note: data.notes,

                        createdById: userId,
                    },
                });

            // =======================================
            // UPDATE RENTAL CYCLE
            // =======================================

            const activeCycle =
                await prisma.rentalCycle.findFirst({
                    where: {
                        scaffoldRequestId: request.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });

            if (activeCycle) {

                const now = new Date();

                const diffMs =
                    now.getTime() -
                    activeCycle.erectedAt.getTime();

                const totalDays = Math.max(
                    1,
                    Math.ceil(
                        diffMs /
                        (1000 * 60 * 60 * 24)
                    )
                );

                // ✅ NO 28 DAYS VALIDATION

                await prisma.rentalCycle.update({
                    where: {
                        id: activeCycle.id,
                    },
                    data: {

                        cycleCount:
                            activeCycle.cycleCount + 1,

                        rentalDays: totalDays,

                        totalDays,
                    },
                });
            }

            // =======================================
            // UPDATE REQUEST TAG
            // =======================================

            await prisma.projectScaffholdRequest.update({
                where: {
                    id: request.id,
                },

                data: {

                    tag: data.tag as ScaffholdTags,

                    ...(data.lightDuty !== undefined && {
                        lightDuty: data.lightDuty,
                    }),

                    ...(data.mediumDuty !== undefined && {
                        mediumDuty: data.mediumDuty,
                    }),

                    ...(data.heavyDuty !== undefined && {
                        heavyDuty: data.heavyDuty,
                    }),
                },
            });

            // =======================================
            // RESPONSE FORMAT
            // =======================================

            const formattedResponse = {

                id: timeline.id,

                uuid: timeline.uuid,

                projectId: timeline.projectId,

                scaffoldRequestId:
                    timeline.scaffoldRequestId,

                timeLineStatus:
                    timeline.timeLineStatus,

                tag: timeline.tag,

                note: timeline.note,

                createdById:
                    timeline.createdById,

                createdAt: timeline.createdAt,

                updatedAt: timeline.updatedAt,
            };

            const companyId =
                project?.createdById;

            const notificationMessage =
                `Project ${project?.PJT} has been marked as ${data.tag}. Action performed by ${user.name}.`;

            // =======================================
            // COMPANY NOTIFICATION
            // =======================================

            await prisma.notification.create({
                data: {

                    uuid: uuidv4(),

                    title: `Project ${data.tag}`,

                    message: notificationMessage,

                    type: "SCAFFOLD_STATUS_UPDATE",

                    role: "COMPANY",

                    scaffoldRequestId:
                        request.id.toString(),

                    companyId,

                    receiverId: companyId,

                    senderId: userId.toString(),

                    isRead: false,

                    notificationImage:
                        "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/tag.png",
                },
            });

            // =======================================
            // COMPANY PUSH
            // =======================================

            const companyDevices =
                await prisma.device.findMany({
                    where: {
                        userId: Number(companyId),
                        deviceToken: {
                            not: null,
                        },
                    },
                    select: {
                        deviceToken: true,
                    },
                });

            for (const d of companyDevices) {

                if (!d.deviceToken) continue;

                await pushNotificationDelhi(
                    d.deviceToken,
                    `Project ${data.tag}`,
                    notificationMessage
                );
            }

            // =======================================
            // PROJECT MANAGER
            // =======================================

            if (companyId) {

                await prisma.notification.create({
                    data: {

                        uuid: uuidv4(),

                        title:
                            `Project ${data.tag}`,

                        message:
                            notificationMessage,

                        type:
                            "SCAFFOLD_STATUS_UPDATE",

                        role:
                            "PROJECT_MANAGER",

                        scaffoldRequestId:
                            request.id.toString(),

                        companyId,

                        receiverId:
                            companyId,

                        senderId:
                            userId.toString(),

                        isRead: false,

                        notificationImage:
                            "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/tag.png",
                    },
                });

                const creatorDevices =
                    await prisma.device.findMany({
                        where: {
                            userId: Number(companyId),
                            deviceToken: {
                                not: null,
                            },
                        },
                        select: {
                            deviceToken: true,
                        },
                    });

                for (const d of creatorDevices) {

                    if (!d.deviceToken) continue;

                    await pushNotificationDelhi(
                        d.deviceToken,
                        `Project ${data.tag}`,
                        notificationMessage
                    );
                }
            }

            // =======================================
            // TRADESMEN
            // =======================================

            if (project?.tradesMen?.length) {

                for (const tm of project.tradesMen) {

                    await prisma.notification.create({
                        data: {

                            uuid: uuidv4(),

                            title:
                                `Project ${data.tag}`,

                            message:
                                notificationMessage,

                            type:
                                "SCAFFOLD_STATUS_UPDATE",

                            companyId,

                            scaffoldRequestId:
                                request.id.toString(),

                            role: "TRADESMAN",

                            receiverId:
                                tm.tradesMan?.userId,

                            senderId:
                                userId.toString(),

                            isRead: false,

                            notificationImage:
                                "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/tag.png",
                        },
                    });

                    const tmDevices =
                        await prisma.device.findMany({
                            where: {
                                userId:
                                    tm.tradesManId,
                                deviceToken: {
                                    not: null,
                                },
                            },
                            select: {
                                deviceToken: true,
                            },
                        });

                    for (const d of tmDevices) {

                        if (!d.deviceToken) continue;

                        await pushNotificationDelhi(
                            d.deviceToken,
                            `Project ${data.tag}`,
                            notificationMessage
                        );
                    }
                }
            }

            // =======================================
            // COMPETENT PERSONS
            // =======================================

            const competentPersonsData =
                project?.competentPersons
                    ?.map(
                        (cp) =>
                            cp.competentPerson
                                ?.userId
                    )
                    .filter(
                        (
                            id
                        ): id is bigint =>
                            id !== undefined
                    )
                    .map((id) => Number(id)) || [];

            if (competentPersonsData.length > 0) {

                const cpNotificationMessage =
                    `Project ${project?.PJT} has been ${data.tag}. Action by ${user.name}.`;

                await prisma.notification.createMany({
                    data:
                        competentPersonsData.map(
                            (cp) => ({
                                uuid: uuidv4(),

                                title:
                                    `Project ${data.tag}`,

                                message:
                                    cpNotificationMessage,

                                type:
                                    "SCAFFOLD_STATUS_UPDATE",

                                role:
                                    "COMPETENT_PERSON",

                                isRead: false,

                                companyId:
                                    project?.createdById
                                        ? BigInt(
                                            project.createdById
                                        )
                                        : null,

                                scaffoldRequestId:
                                    request.id.toString(),

                                receiverId:
                                    BigInt(cp),

                                senderId:
                                    userId.toString(),

                                notificationImage:
                                    "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/tag.png",
                            })
                        ),
                });

                const competentPersonDevices =
                    await prisma.device.findMany({
                        where: {
                            userId: {
                                in:
                                    competentPersonsData,
                            },
                            deviceToken: {
                                not: null,
                            },
                        },
                    });

                for (const d of competentPersonDevices) {

                    if (!d.deviceToken) continue;

                    await pushNotificationDelhi(
                        d.deviceToken,
                        `Project ${data.tag}`,
                        cpNotificationMessage
                    );
                }
            }

            // =======================================
            // FINAL RESPONSE
            // =======================================

            return {
                message:
                    RESPONSE_MESSAGES
                        .COMPETENTPERSON
                        .SUCCESS_CREATE_TIMELINE,

                data: formattedResponse,
            };

        } catch (error: any) {

            console.error(
                "❗ Error in Timelinetag:",
                error
            );

            if (error instanceof CustomError)
                throw error;

            throw new CustomError(
                RESPONSE_MESSAGES
                    .COMPETENTPERSON
                    .FAILED_CREATE_TIMELINE,
                500,
                error.message
            );
        }
    }

    async getRentalCycle(scaffHoldId: number) {

        const cycle = await prisma.rentalCycle.findFirst({
            where: {
                scaffoldRequestId: scaffHoldId
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        if (!cycle) {
            return {
                message: "No rental cycle found",
                data: {
                    totalDays: 0,
                    cycleCount: 0,
                    rentalDays: 0,
                    canClear: false
                }
            };
        }

        // 🔥 calculate total days till now
        const diffMs =
            new Date().getTime() -
            cycle.erectedAt.getTime();

        const totalDays = Math.max(
            1,
            Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        );

        // 🔥 current running cycle days
        const rentalDays =
            totalDays - (cycle.cycleCount * 28);

        return {
            message: "Rental cycle fetched successfully",

            data: {
                scaffoldRequestId: cycle.scaffoldRequestId,

                projectId: cycle.projectId,

                totalDays,              // never resets

                cycleCount: cycle.cycleCount, // manual count

                rentalDays,            // current cycle progress

                progress: Number(
                    ((rentalDays / 28) * 100).toFixed(1)
                ),

                canClear: rentalDays >= 28,

                erectedAt: cycle.erectedAt
            }
        };
    }

    async clearRentalCycle(scaffHoldId: number) {

        const cycle = await prisma.rentalCycle.findFirst({
            where: {
                scaffoldRequestId: scaffHoldId
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        if (!cycle) {
            throw new CustomError(
                "Rental cycle not found",
                404
            );
        }

        // 🔥 calculate current total days
        const diffMs =
            new Date().getTime() -
            cycle.erectedAt.getTime();

        const totalDays = Math.max(
            1,
            Math.ceil(diffMs / (1000 * 60 * 60 * 24))
        );

        // 🔥 current cycle usage
        const rentalDays =
            totalDays - (cycle.cycleCount * 28);

        // ❌ BLOCK if not completed 28 days
        if (rentalDays < 28) {
            throw new CustomError(
                "28 days cycle not completed yet",
                400
            );
        }

        // 🔥 UPDATE CYCLE
        const updated = await prisma.rentalCycle.update({
            where: {
                id: cycle.id
            },
            data: {

                // ✔ increase cycle
                cycleCount: cycle.cycleCount + 1,

                // ✔ reset current cycle
                rentalDays: 0,

                // ✔ keep total updated
                totalDays
            }
        });

        return {
            message: "Cycle cleared successfully",

            data: {
                scaffoldRequestId: updated.scaffoldRequestId,
                cycleCount: updated.cycleCount,
                rentalDays: updated.rentalDays,
                totalDays
            }
        };
    }

    async getScaffholdTimeline(scaffholdId: GetInspectionsDTO) {
        try {

            // 🔥 REQUEST CHECK
            const request =
                await prisma.projectScaffholdRequest.findFirst({
                    where: {
                        id: BigInt(scaffholdId.scaffHoldId),
                    },
                });

            if (!request) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    404
                );
            }

            // 🔥 FETCH TIMELINES BY REQUEST ID
            const timelines =
                await prisma.projectScaffholdTimeline.findMany({
                    where: {
                        scaffoldRequestId: BigInt(
                            scaffholdId.scaffHoldId
                        ),
                    },
                    include: {
                        image: true,
                        createdBy: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                });

            if (!timelines.length) {
                throw new CustomError(
                    RESPONSE_MESSAGES.TIMELINE.NO_TIMELINE_FOUND,
                    404
                );
            }

            const formattedTimeline = timelines.map((t) => ({
                id: t.id,
                uuid: t.uuid,

                projectId: t.projectId,
                scaffoldRequestId: t.scaffoldRequestId,

                timeLineStatus: t.timeLineStatus,
                note: t.note,
                tag: t.tag,

                address: t.address,
                latitude: t.latitude,
                longitude: t.longitude,

                images: t.image.map((img) => img.url),

                createdById: t.createdById,
                createdByName: t.createdBy?.name,
                createdByEmail: t.createdBy?.email,

                createdAt: t.createdAt,
                updatedAt: t.updatedAt,

                date: t.createdAt,
            }));

            return {
                message:
                    RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_GET_TIMELINE,
                data: formattedTimeline,
            };

        } catch (error: any) {
            console.error(
                "❗ Error in getScaffholdTimeline:",
                error
            );

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.COMPETENTPERSON
                    .FAILED_GET_TIMELINE,
                500,
                error.message
            );
        }
    }

    async getAllTimelineImages(scaffholdId: GetInspectionsDTO) {
        try {

            // 🔥 REQUEST CHECK
            const request =
                await prisma.projectScaffholdRequest.findFirst({
                    where: {
                        id: BigInt(scaffholdId.scaffHoldId),
                    },
                });

            if (!request) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    404
                );
            }

            // 🔥 FETCH TIMELINES USING REQUEST ID
            const timelines =
                await prisma.projectScaffholdTimeline.findMany({
                    where: {
                        scaffoldRequestId: BigInt(
                            scaffholdId.scaffHoldId
                        ),
                    },
                    select: {
                        id: true,
                    },
                });

            if (!timelines.length) {
                throw new CustomError(
                    RESPONSE_MESSAGES.TIMELINE.NO_TIMELINE_FOUND,
                    404
                );
            }

            const timelineIds = timelines.map((t) => t.id);

            // 🔥 FETCH IMAGES
            const images = await prisma.timelineImage.findMany({
                where: {
                    timelineId: {
                        in: timelineIds,
                    },
                },
                select: {
                    id: true,
                    url: true,
                    status: true,
                    timelineId: true,
                },
                orderBy: {
                    id: "desc",
                },
            });

            if (!images.length) {
                throw new CustomError(
                    RESPONSE_MESSAGES.TIMELINE.NO_IMAGES_FOUND,
                    404
                );
            }

            return {
                message:
                    RESPONSE_MESSAGES.TIMELINE
                        .SUCCESS_FETCH_IMAGES,
                data: images,
            };

        } catch (error: any) {
            console.error(
                "❗ Error in getAllTimelineImages:",
                error
            );

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.TIMELINE
                    .FAILED_FETCH_IMAGES,
                500,
                error.message
            );
        }
    }


    async getScaffHoldListForCompetentPerson(
        userId: number,
        page: number = 1,
        limit: number = 10
    ) {
        try {

            // 🔥 USER VALIDATION
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { user_type: true },
            });

            if (!user) {
                throw new CustomError("User not found", 404);
            }

            let projectWhere: any = {
                isDeleted: false,
            };

            // 🔥 COMPETENT PERSON FILTER
            if (user.user_type === "COMPETENT_PERSON") {
                const competentPerson = await prisma.competentPerson.findFirst({
                    where: { userId },
                });

                if (!competentPerson) {
                    throw new CustomError(
                        RESPONSE_MESSAGES.USER.NOT_FOUND,
                        404,
                        "Competent Person not found"
                    );
                }

                projectWhere.competentPersons = {
                    some: {
                        competentPersonId: competentPerson.id,
                    },
                };
            }

            // 🔥 PROJECT MANAGER FILTER
            if (user.user_type === "PROJECT_MANAGER") {
                projectWhere.projectManagers = {
                    some: {
                        id: userId,
                    },
                };
            }

            // 🔥 FETCH PROJECTS (REPLACED SCAFFHOLD)
            const [projectList, total] = await Promise.all([
                prisma.project.findMany({
                    where: projectWhere,
                    include: {
                        createdBy: true,
                    },
                    orderBy: { createdAt: "desc" },
                    skip: (page - 1) * limit,
                    take: limit,
                }),

                prisma.project.count({
                    where: projectWhere,
                }),
            ]);

            // 🔥 FORMAT RESPONSE
            const formattedList = projectList.map((p) => ({
                id: p.id?.toString() || null,
                uuid: p.uuid || null,

                projectName: p.projectName || null,
                PJT: p.PJT || null,

                clientName: p.clientName || null,
                clientMobile: p.clientMobile || null,

                address: p.clientAddress || null,
                latitude: p.latitude || null,
                longitude: p.longitude || null,

                startDate: p.startDate || null,
                endDate: p.endDate || null,

                status: p.status || null,

                companyId: p.createdById?.toString() || null,
                companyName: p.createdBy?.name || null,

                createdAt: p.createdAt?.toISOString() || null,
                updatedAt: p.updatedAt?.toISOString() || null,
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
            console.error(
                "❌ Fetch Project list for competent person error:",
                error
            );

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                500,
                "Failed to fetch project list"
            );
        }
    }

}