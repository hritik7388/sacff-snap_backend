// src/services/projectManagerServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { generateToken, pushNotificationDelhi } from "../helpers/utils";
import { approveRejectRequestDTO, GetJobCraftDTO, getRequestCreatorById, GetUserDetailsDTO, ImageDTO, LoginProjectManagerDTO, requestedScaffoldsDTO, SearchScaffHoldDTO, uploadImageDTO, } from "../schemas/projectManagerSchema";
import { request } from "http";
import { MediaType, NotificationType } from "@prisma/client";

export class ProjectManagerServices {

    async getDashboardStats(projectManagerId: number) {
        try {

            const [totalRequests, totalProjects, pendingRequests, activeRequests] = await Promise.all([

                // 🔥 TOTAL REQUESTS under projects managed by PM
                prisma.projectScaffholdRequest.count({
                    where: {
                        project: {
                            projectManagers: {
                                some: {
                                    id: projectManagerId,
                                },
                            },
                        },
                    },
                }),

                // 🔥 TOTAL PROJECTS
                prisma.project.count({
                    where: {
                        projectManagers: {
                            some: {
                                id: projectManagerId,
                            },
                        },
                    },
                }),

                // 🔥 PENDING REQUESTS
                prisma.projectScaffholdRequest.count({
                    where: {
                        status: "PENDING",
                        project: {
                            projectManagers: {
                                some: {
                                    id: projectManagerId,
                                },
                            },
                        },
                    },
                }),

                // 🔥 ACTIVE / APPROVED REQUESTS
                prisma.projectScaffholdRequest.count({
                    where: {
                        status: "APPROVED",
                        project: {
                            projectManagers: {
                                some: {
                                    id: projectManagerId,
                                },
                            },
                        },
                    },
                }),
            ]);

            const dashboardData = {
                totalRequests,
                totalProjects,
                totalPendingRequests: pendingRequests,
                totalActiveRequests: activeRequests,
            };

            return {
                message: RESPONSE_MESSAGES.PROJECTMANAGER.DASHBOARD_FETCH_SUCCESS,
                data: dashboardData,
            };

        } catch (error: any) {
            console.error("Error fetching dashboard stats:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.PROJECTMANAGER.DASHBOARD_FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async commonLoginServices(data: LoginProjectManagerDTO) {
        try {

            const existingProjectManager = await prisma.user.findUnique({
                where: { email: data.email, status: "ACTIVE", user_type: { in: ["PROJECT_MANAGER", "COMPETENT_PERSON"] }, isVerified: true }
            });
            if (!existingProjectManager) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Not found with this email");
            }

            if (existingProjectManager.isDeleted) {
                throw new CustomError(RESPONSE_MESSAGES.USER.DELETED, 403, "User DELETED by Subadmin")
            }
            const isPasswordValid = await bcrypt.compare(data.password, existingProjectManager.password);
            if (!isPasswordValid) {
                throw new CustomError(RESPONSE_MESSAGES.PROJECTMANAGER.INVALID_PASSWORD, 500, "Invalid password");
            }
            if (data.user_type !== existingProjectManager.user_type) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 400, "User type mismatch");
            }
            if (!data.companyId) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 400, "Company ID is required");
            }

            const company = await prisma.company.findFirst({
                where: {
                    CMPId: data.companyId,
                    isDeleted: false,
                    status: "ACTIVE",
                    isApproved: "APPROVED",
                    isVerified: true
                }
            });

            if (!company) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.NOT_FOUND,
                    404,
                    "Company not active or not approved or Deleted or not verified with this ID"
                );
            }
            if (data.user_type === "PROJECT_MANAGER") {
                const projectManager = await prisma.projectManager.findFirst({
                    where: {
                        cmpId: data.companyId,
                        userId: existingProjectManager.id


                    }
                });
                if (!projectManager) {
                    throw new CustomError(
                        RESPONSE_MESSAGES.USER.NOT_FOUND,
                        404,
                        "No user found for this company"
                    );
                }
            } else if (data.user_type === "COMPETENT_PERSON") {
                const competentPerson = await prisma.competentPerson.findFirst({
                    where: {
                        cmpId: data.companyId

                    }
                });
                if (!competentPerson) {
                    throw new CustomError(
                        RESPONSE_MESSAGES.USER.NOT_FOUND,
                        404,
                        "No competent person found for this company"
                    );
                }
            }

            const jwtPayload = {
                id: existingProjectManager.id.toString(),
                uuid: existingProjectManager.uuid,
                login_id: existingProjectManager.email,
                user_type: existingProjectManager.user_type,
            };
            const token = generateToken(jwtPayload);

            await prisma.user.update({
                where: { id: existingProjectManager.id },
                data: { lastLogin: new Date() },
            });
            const user = {
                id: existingProjectManager.id,
                uuid: existingProjectManager.uuid,
                name: existingProjectManager.name,
                email: existingProjectManager.email,
                user_type: existingProjectManager.user_type,
                companyId: data.companyId


            }
            return {
                message: RESPONSE_MESSAGES.USER.USER_SUCCESS,
                token,
                data:
                    user

            };

        } catch (error) {
            console.error("❌ Register error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.USER.LOGIN_FAILE, 500, "Login failed due to server error");
        }
    }

    async getProjectListServices(
        id: number,
        page: number = 1,
        limit: number = 10,
        status?: string,
        search?: string
    ) {
        console.log("=================>>>>", status)
        try {
            const skip = (page - 1) * limit;

            // ✅ BASE CONDITION
            const whereCondition: any = {
                isDeleted: false,


            };


            // ✅ STATUS FILTER (FINAL FIX)
            if (status && status.trim() !== "") {
                whereCondition.status = status.trim().toUpperCase();
            }
            if (search && search.trim() !== "") {
                whereCondition.projectName = {
                    contains: search.trim(),
                    // optional (remove if MySQL doesn't support it)
                };
            }
            whereCondition.projectManagers = {
                some: {
                    id: BigInt(id),
                },
            };
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

    async getUserDetails(id: number) {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: id,
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                },
                select: {
                    id: true,
                    uuid: true,
                    name: true,
                    email: true,
                    mobileNumber: true,
                    countryCode: true,
                    user_type: true,
                    status: true,
                    isVerified: true,
                    createdAt: true,
                    updatedAt: true,
                    lastLogin: true,
                    userMedias: {
                        select: {
                            id: true,
                            mediaType: true,
                            url: true,
                            createdAt: true,
                        }
                    },
                    projectManager: {
                        select: {
                            cmpId: true,
                        }
                    },
                    competentPerson: {
                        select: {
                            cmpId: true,
                        }
                    }
                }
            });

            if (!user) {
                throw new CustomError("USER_NOT_FOUND", 404, "User not found");
            }
            const cmpId = user.projectManager?.cmpId || user.competentPerson?.cmpId || null;
            const { userMedias, projectManager, competentPerson, ...rest } = user;
            const idProofImage =
                user.userMedias.find(media => media.mediaType === "ID_PROOF_IMAGE")?.url || null;
            const photoImage =
                user.userMedias.find(media => media.mediaType === "PHOTO_IMAGE")?.url || null;
            return {
                message: "User details fetched successfully",
                data: {
                    ...rest,
                    cmpId,
                    idProofImage: idProofImage,
                    photoImage: photoImage
                }
            };

        } catch (error: any) {
            console.error("❌ Get user details error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError("FETCH_FAILED", 500, error.message);
        }
    }

    async getRequestedScaffolds(
        data: requestedScaffoldsDTO,
        page: number = 1,
        limit: number = 10
    ) {
        try {
            const skip = (page - 1) * limit;

            const [requests, totalCount] = await Promise.all([
                prisma.projectScaffholdRequest.findMany({
                    where: {
                        projectId: data.scaffHoldId, // 🔥 FIXED (was scaffholdId)
                        status: "PENDING",
                    },
                    select: {
                        id: true,
                        uuid: true,

                        craft: true,
                        length: true,
                        width: true,
                        height: true,

                        expectedEndDate: true,
                        REQID: true,
                        notes: true,

                        priority: true,
                        status: true,

                        createdAt: true,

                        createdBy: {
                            select: {
                                id: true,
                                craft: true,
                                user: {
                                    select: {
                                        name: true,
                                        userMedias: {
                                            take: 1,
                                            select: { url: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                }),

                prisma.projectScaffholdRequest.count({
                    where: {
                        projectId: data.scaffHoldId, // 🔥 FIXED
                        status: "PENDING",
                    },
                }),
            ]);

            const formattedData = requests.map((req) => ({
                id: req.id,
                uuid: req.uuid,

                craft: req.craft,
                length: req.length,
                width: req.width,
                height: req.height,

                status: req.status,
                priority: req.priority,

                expectedEndDate: req.expectedEndDate,
                notes: req.notes,
                REQID: req.REQID,

                createdAt: req.createdAt,

                createdById: req.createdBy?.id || null,
                createdByName: req.createdBy?.user?.name || null,
                createdByCraft: req.createdBy?.craft || null,
                createdByImage: req.createdBy?.user?.userMedias?.[0]?.url || null,
            }));

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_SUCCESS,
                data: formattedData,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };

        } catch (error: any) {
            console.error("❌ Get Requested Scaffolds error:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async approveOrRejectScaffHoldRequest(data: approveRejectRequestDTO) {
        try {

            // ✅ 1. FETCH REQUEST (NEW MODEL)
            const requestData = await prisma.projectScaffholdRequest.findUnique({
                where: { id: data.requestId },
                include: {
                    createdBy: {
                        select: { id: true, craft: true, userId: true }
                    },
                    project: {
                        include: {
                            competentPersons: {
                                include: {
                                    competentPerson: {
                                        select: {
                                            id: true,
                                            userId: true
                                        }
                                    }
                                }
                            },
                            createdBy: true
                        }
                    }
                }
            });

            if (!requestData || requestData.status !== "PENDING") {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLDREQUEST.REQUEST_NOT_FOUND,
                    404,
                    "No pending request found"
                );
            }

            // ✅ 2. UPDATE REQUEST
            const updatedRequest = await prisma.projectScaffholdRequest.update({
                where: { id: data.requestId },
                data: {
                    status: data.status,
                    reajectionReason:
                        data.status === "REJECTED"
                            ? data.reajectionReason ?? null
                            : null,
                },
                include: {
                    createdBy: {
                        select: { userId: true, craft: true }
                    }
                }
            });

            const isModifiedRequest = updatedRequest.parentId !== null;
            const tradesmanId = updatedRequest.createdBy.userId;

            // ===============================
            // 🔥 NOTIFICATION LOGIC
            // ===============================

            let notificationTitle: string;
            let notificationType: NotificationType;
            let notificationMessage: string;
            let notificationImage: string;

            if (isModifiedRequest) {
                notificationTitle =
                    data.status === "APPROVED"
                        ? "Scaffold Modification Approved"
                        : "Scaffold Modification Declined";

                notificationType =
                    data.status === "APPROVED"
                        ? "MODIFICATION_ACCEPTED"
                        : "MODIFICATION_REJECTED";

                notificationMessage =
                    `Your modification request for Project ${requestData.project.projectName} has been ${data.status}.`;

                notificationImage =
                    data.status === "APPROVED"
                        ? "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/accept.png"
                        : "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/reject.png";

            } else {
                notificationTitle =
                    data.status === "APPROVED"
                        ? "Scaffold Request Approved"
                        : "Scaffold Request Declined";

                notificationType =
                    data.status === "APPROVED"
                        ? NotificationType.REQUEST_ACCEPTED
                        : NotificationType.REQUEST_REJECTED;

                notificationMessage =
                    `Your scaffold request for Project ${requestData.project.projectName} has been ${data.status}.`;

                notificationImage =
                    data.status === "APPROVED"
                        ? "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/requestAccepted.png"
                        : "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/requestRejected.png";
            }

            // ===============================
            // 🔥 TRADESMAN NOTIFICATION
            // ===============================
            if (tradesmanId) {

                const validTradesman = await prisma.user.findFirst({
                    where: {
                        id: tradesmanId,
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "TRADESMAN"
                    }
                });

                if (validTradesman) {

                    await prisma.notification.create({
                        data: {
                            uuid: uuidv4(),
                            title: notificationTitle,
                            message: notificationMessage,
                            type: notificationType,
                            role: "TRADESMAN",
                            receiverId: BigInt(tradesmanId),
                            senderId: requestData.createdBy?.id?.toString() ?? "0",
                            isRead: false,
                            notificationImage,
                            tradesmanCraft: requestData.createdBy.craft || null,
                            scaffoldRequestId: updatedRequest.id.toString(),
                        }
                    });

                    const devices = await prisma.device.findMany({
                        where: {
                            userId: tradesmanId,
                            user_type: "TRADESMAN",
                            deviceToken: { not: null }
                        }
                    });

                    await Promise.all(
                        devices.map(d =>
                            d.deviceToken
                                ? pushNotificationDelhi(
                                    d.deviceToken,
                                    notificationTitle,
                                    notificationMessage
                                )
                                : Promise.resolve()
                        )
                    );
                }
            }

            // ===============================
            // 🔥 COMPETENT PERSON NOTIFICATION
            // ===============================

            const competentUserIds =
                requestData.project.competentPersons.map(
                    cp => cp.competentPerson.userId
                );

            const validCompetentUsers = await prisma.user.findMany({
                where: {
                    id: { in: competentUserIds },
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                    user_type: "COMPETENT_PERSON"
                }
            });

            for (const cpUser of validCompetentUsers) {

                await prisma.notification.create({
                    data: {
                        uuid: uuidv4(),
                        title: notificationTitle,
                        message: notificationMessage,
                        type: notificationType,
                        role: "COMPETENT_PERSON",
                        isRead: false,
                        companyId: requestData.project.createdById
                            ? BigInt(requestData.project.createdById)
                            : null,

                        scaffoldRequestId: updatedRequest.id.toString(),
                        receiverId: BigInt(cpUser.id),
                        senderId: requestData.createdBy?.id?.toString() ?? "0",
                        notificationImage,
                        tradesmanCraft: requestData.createdBy.craft || null,
                    }
                });
            }

            const devices = await prisma.device.findMany({
                where: {
                    userId: { in: validCompetentUsers.map(u => u.id) },
                    user_type: "COMPETENT_PERSON",
                    deviceToken: { not: null }
                }
            });

            await Promise.all(
                devices.map(d =>
                    d.deviceToken
                        ? pushNotificationDelhi(
                            d.deviceToken,
                            notificationTitle,
                            notificationMessage
                        )
                        : Promise.resolve()
                )
            );

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_SUCCESS,
                data: updatedRequest,
            };

        } catch (error: any) {
            console.error("❌ Approve/Reject Request error:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED,
                500,
                error.message
            );
        }
    }


    async getAllPendingModifiedRequestsByParentId(
        userId: number,
        data: SearchScaffHoldDTO,
        page: number = 1,
        limit: number = 10,
       projectId?: number
    ) {
        try {
            const skip = (page - 1) * limit;

           const pm = await prisma.projectManager.findUnique({
    where: {
        userId: BigInt(userId),
    },
    select: {
        userId: true,
    },
});

if (!pm) {
    throw new CustomError(
        "Project Manager not found",
        404,
        "Project Manager not found"
    );
}

const whereCondition: any = {
    parentId: {
        not: null,
    },
    status: "PENDING",

    project: {
        projectManagers: {
            some: {
                id: pm.userId, // same as tradesman pending API
            },
        },
    },
};

if (projectId) {
    whereCondition.projectId = BigInt(projectId);
}
            const searchTerm = data?.search?.trim();

            if (searchTerm) {
                const term = searchTerm;

                if (!isNaN(Number(term))) {
                    whereCondition.OR = [
                        { id: Number(term) },
                        { REQID: { contains: term } },
                    ];
                } else {
                    whereCondition.OR = [
                        { REQID: { contains: term } },
                        { project: { projectName: { contains: term } } },
                        { project: { clientAddress: { contains: term } } },
                        { createdBy: { user: { name: { contains: term } } } },
                    ];
                }
            }

            const [requests, totalCount] = await Promise.all([
                prisma.projectScaffholdRequest.findMany({
                    where: whereCondition,
                    include: {
                        project: true,
                        createdBy: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        userMedias: {
                                            take: 1,
                                            select: { url: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),

                prisma.projectScaffholdRequest.count({
                    where: whereCondition,
                }),
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            const responseData = requests.map((request) => ({
                id: request.id,
                uuid: request.uuid,
                REQID: request.REQID,
                status: request.status,
                SCAFFID: request.SCAFFID,

                craft: request.craft,
                priority: request.priority,
                length: request.length,
                width: request.width,
                height: request.height,

                expectedEndDate: request.expectedEndDate,
                notes: request.notes,

                createdAt: request.createdAt,
                updatedAt: request.updatedAt,

                // project data
                projectId: request.project?.id,
                projectName: request.project?.projectName,
                address: request.project?.clientAddress,

                latitude: request.latitude,
                longitude: request.longitude,

                parentId: request.parentId ?? null,

                createdByName: request.createdBy?.user?.name || null,
                createdByImage:
                    request.createdBy?.user?.userMedias?.[0]?.url || null,
            }));

            return {
                message:
                    RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_MODIFICATIONS_FETCH_SUCCESS,
                data: responseData,
                totalCount,
                totalPages,
                currentPage: page,
                limit,
            };
        } catch (error: any) {
            console.error("❌ Error in modified requests:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_MODIFICATIONS_FETCH_FAILED,
                500,
                error.message
            );
        }
    }


    async getTrademanPendingRequestListServices(
        userId: number,
        data: SearchScaffHoldDTO,
        page: number = 1,
        limit: number = 10,
        projectId?: number
    ) { 
        try {
            const skip = (page - 1) * limit;

const pm = await prisma.projectManager.findUnique({
    where: {
        userId: BigInt(userId), // token wali PM id
    },
    select: {
        userId: true,
    },
}); 

if (!pm) {
    throw new CustomError(
        "Project Manager not found",
        404,
        "Project Manager not found"
    );
}
const whereCondition: any = {
    status: "PENDING",
    parentId: null,

    project: {
        projectManagers: {
            some: {
                id: pm.userId, // ✅ User.id
            },
        },
    },
}; 

if (projectId) {
    whereCondition.projectId = BigInt(projectId);
} 

            const searchTerm = data?.search?.trim();

            if (searchTerm) {
                const term = searchTerm;

                if (!isNaN(Number(term))) {
                    whereCondition.id = Number(term);
                } else {
                    whereCondition.OR = [
                        { REQID: { contains: term } },
                        { project: { projectName: { contains: term } } },
                        { project: { clientAddress: { contains: term } } },
                        { createdBy: { user: { name: { contains: term } } } },
                    ];
                }
            }

            const [requests, totalCount] = await Promise.all([
                prisma.projectScaffholdRequest.findMany({
                    where: whereCondition,
                    include: {
                        project: true,
                        createdBy: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        userMedias: {
                                            take: 1,
                                            select: { url: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),

                prisma.projectScaffholdRequest.count({
                    where: whereCondition,
                }),
            ]);
            console.log("Fetched requests:", requests, "Total count:", totalCount);

            const formattedData = requests.map((req) => ({
                id: req.id,
                uuid: req.uuid,

                REQID: req.REQID,
                status: req.status,
                SCAFFID: req.SCAFFID,

                craftId: req.createdBy?.craftId || null,
                craft: req.createdBy?.craft || null,

                length: req.length,
                width: req.width,
                height: req.height,

                priority: req.priority,
                expectedEndDate: req.expectedEndDate,
                notes: req.notes,

                createdAt: req.createdAt,
                updatedAt: req.updatedAt,

                // project info
                projectId: req.project?.id || null,
                projectName: req.project?.projectName || null,
                address: req.project?.clientAddress || null,
                latitude: req.latitude,
                longitude: req.longitude,

                createdById: req.createdById,
                createdByName: req.createdBy?.user?.name || null,
                createdByImage: req.createdBy?.user?.userMedias?.[0]?.url || null,
            }));

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_SUCCESS,
                data: formattedData,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❗ Error in getTrademanRequestListServices:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED,
                500,
                error.message
            );
        }
    }
    async getScaffHoldJobAndCraftDetails(data: GetJobCraftDTO) {
        try {

            // 🔥 NEW: direct jobCraft table (no scaffhold dependency)
            const jobCrafts = await prisma.projectJobCraft.findMany({
                where: {
                    projectId: data.scaffHoldId, // ✅ IMPORTANT CHANGE
                },
                include: {
                    craft: true,
                },
                orderBy: {
                    id: "desc",
                },
            });

            if (!jobCrafts || jobCrafts.length === 0) {
                throw new CustomError(
                    RESPONSE_MESSAGES.JOB_CRAFT.NOT_FOUND,
                    404,
                    "No job crafts found"
                );
            }

            // 🔥 FORMAT RESPONSE
            const formattedJobCrafts = jobCrafts.map((jc) => ({
                id: jc.id,
                craftId: jc.craftId,
                counts: jc.counts,
                joinedCount: jc.joinedCount,

                name: jc.craft?.name || null,
                craftImage: jc.craft?.craftImage || null,

                createdAt: jc.createdAt,
                updatedAt: jc.updatedAt,
            }));

            return {
                message: RESPONSE_MESSAGES.JOB_CRAFT.FETCH_SUCCESS,
                data: {
                    jobCrafts: formattedJobCrafts,
                },
            };

        } catch (error: any) {
            console.error("❗ Error in getJobAndCraftDetails:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.JOB.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async getScaffholdRequestsByCreator(
        data: getRequestCreatorById,
        page: number = 1,
        limit: number = 10
    ) {
        try {

            const skip = (page - 1) * limit;

            const [updates, totalCount] = await Promise.all([
                prisma.updateProjectScaffHoldRequest.findMany({
                    where: {
                        requestId: data.requestId,
                    },
                    select: {
                        id: true,
                        requestId: true,

                        length: true,
                        width: true,
                        height: true,

                        priority: true,
                        expectedEndDate: true,
                        notes: true,

                        createdAt: true,

                        // 🔥 IMPORTANT FIX: go via request → project
                        scaffholdRequest: {
                            select: {
                                createdById: true,
                                project: {
                                    select: {
                                        id: true,
                                        projectName: true,
                                        clientAddress: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),

                prisma.updateProjectScaffHoldRequest.count({
                    where: { requestId: data.requestId },
                }),
            ]);

            const formattedData = updates.map((u) => ({
                updateId: u.id,
                requestId: u.requestId,

                size: `${u.length || "N/A"} ft x ${u.width || "N/A"} ft x ${u.height || "N/A"} ft`,
                priority: u.priority || "N/A",
                expectedEndDate: u.expectedEndDate || "Not specified",
                notes: u.notes || "No notes available",

                createdAt: u.createdAt,

                // 🔥 FIXED: proper creator mapping
                createdBy: u.scaffholdRequest?.createdById || null,

                // 🔥 OPTIONAL: project info (useful in UI)
                projectName: u.scaffholdRequest?.project?.projectName || null,
                projectAddress: u.scaffholdRequest?.project?.clientAddress || null,
            }));

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_SUCCESS,
                data: formattedData,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };

        } catch (error: any) {
            console.error("Error fetching scaffhold requests:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async updateProfileImage(userId: number, data: uploadImageDTO) {
        try {

            const userExists = await prisma.userMedia.findFirst({
                where: { userId: userId },
            });
            if (!userExists) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "NOT found ")
            }

            const updatedImage = await prisma.userMedia.update({
                where: { id: userExists.id },
                data: { url: data.idProofImage },
            });

            return {
                message: RESPONSE_MESSAGES.IMAGE.UPADTE_IMAGE,
                data: updatedImage,
            };


        } catch (error: any) {
            console.error("Error fetching image data:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.IMAGE.FAIL_UPADTE_IMAGE,
                    500,
                    error.message
                );

        }

    }

    async updateUserProfileImage(userId: number, data: ImageDTO) {
        try {

            const userExists = await prisma.userMedia.findFirst({
                where: {
                    userId: userId,
                    mediaType: MediaType.PHOTO_IMAGE,
                },
            });
            if (!userExists) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "NOT found ")
            }

            const updatedImage = await prisma.userMedia.update({
                where: { id: userExists.id },
                data: { url: data.profileImage },
            });

            return {
                message: RESPONSE_MESSAGES.IMAGE.UPADTE_IMAGE,
                data: updatedImage,
            };


        } catch (error: any) {
            console.error("Error fetching image data:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.IMAGE.FAIL_UPADTE_IMAGE,
                    500,
                    error.message
                );

        }

    }

    async generateProjectJobLink(
        projectId: string
    ) {
        try {
            console.log("PJT==================>>>", projectId)

            console.log("projectId:", projectId);

            // ✅ FIND PROJECT
            const project = await prisma.project.findFirst({
                where: {
                    PJT: projectId,
                },
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
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            // ✅ PROJECT NOT FOUND
            if (!project) {
                throw new CustomError(
                    "Project not found",
                    404,
                    "PROJECT_NOT_FOUND"
                );
            }

            // ✅ GENERATE JOB LINK
            const jobLink =
                `https://api.scaffsnapp.com/api/v1/projectManager/job/${project.PJT}`;

            // ✅ RESPONSE
            return {
                success: true,
                message: "Job link generated successfully",

                data: {
                    id: project.id.toString(),
                    uuid: project.uuid,
                    projectName: project.projectName,
                    PJT: project.PJT,
                    clientName: project.clientName,
                    clientEmail: project.clientEmail,
                    clientMobile: project.clientMobile,
                    clientCountryCode: project.clientCountryCode,
                    clientAddress: project.clientAddress,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    latitude: project.latitude,
                    longitude: project.longitude,
                    status: project.status,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,

                    // ✅ GENERATED LINK
                    jobLink,
                },
            };

        } catch (error: any) {

            console.error(
                "❌ Service error:",
                error
            );
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                error.message ||
                "Failed to generate project job link",

                error.statusCode || 500,

                error.details ||
                "INTERNAL_ERROR"
            );
        }
    }
}

