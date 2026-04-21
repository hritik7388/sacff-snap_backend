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
            const [totalScaffholds, totalProjects, pendingRequests, activeScaffholds] = await Promise.all([
                prisma.scaffhold.count({
                    where: {
                        createdById: projectManagerId
                    }
                }),
                prisma.project.count({
                    where: {
                        projectManagers: {
                            some: {
                                id: projectManagerId

                            }
                        }
                    }
                }),

                prisma.scaffholdRequest.count({
                    where: {
                        status: "PENDING",
                        scaffhold: {
                            createdById: projectManagerId
                        }
                    },
                }),
                prisma.scaffhold.count({
                    where: {
                        status: "ACTIVE", project: {
                            projectManagers: {
                                some: {
                                    id: projectManagerId
                                }
                            }
                        }
                    },
                }),
            ]);
            const dashboardData = {
                totalScaffholds,
                totalProjects,
                totalPendingRequests: pendingRequests,
                totalActiveScaffholds: activeScaffholds,
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
            throw error instanceof CustomError
                ? error
                : new CustomError(
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

    async getProjectListServices(id: number, page: number = 1, limit: number = 10, status?: string) {
        try {
            const skip = (page - 1) * limit;

            const whereCondition: any = {
                isDeleted: false,
                projectManagers: {
                    some: {
                        id: id,
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "PROJECT_MANAGER"
                    }
                }
            };
            if (status && typeof status === "string" && status.trim() !== "") {
                whereCondition.status = status.toUpperCase();
            }

            const [projects, totalCount] = await Promise.all([
                prisma.project.findMany({
                    where: whereCondition,
                    select: {
                        id: true,
                        uuid: true,
                        projectName: true,
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
                                scaffholds: true,
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
                totalScaffhold: p._count.scaffholds,
            }));

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

    async getRequestedScaffolds(data: requestedScaffoldsDTO, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;

            const [scaffolds, totalCount] = await Promise.all([
                prisma.scaffholdRequest.findMany({
                    where: {
                        scaffholdId: data.scaffHoldId,
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
                        scaffholdId: true,
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

                prisma.scaffholdRequest.count({
                    where: { scaffholdId: data.scaffHoldId },
                }),
            ]);
            const formattedData = scaffolds.map((req) => ({
                id: req.id,
                uuid: req.uuid,
                craft: req.craft,
                length: req.length,
                scaffHold: req.scaffholdId,
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
            // 1️⃣ Fetch the pending request
            const requestData = await prisma.scaffholdRequest.findUnique({
                where: { id: data.requestId },
                include: {
                    createdBy: { select: { id: true, craft: true } },
                    scaffhold: {
                        select: {
                            id: true, SCAFFID: true, projectId: true, projectName: true, companyId: true,
                            competentPersons: {
                                select: {
                                    id: true,
                                    competentPerson: {
                                        select: {
                                            id: true,
                                            userId: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            if (!requestData || requestData.status !== "PENDING") {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLDREQUEST.REQUEST_NOT_FOUND,
                    404,
                    "No pending request found with this ID and ScaffHold ID"
                );
            }

            const updatedRequest = await prisma.scaffholdRequest.update({
                where: { id: data.requestId },
                data: {
                    status: data.status,
                    reason: data.status === "REJECTED" ? data.reajectionReason ?? null : null,
                }, include: {
                    createdBy: {
                        select: {
                            userId: true
                        }

                    }
                }
            });
            const isModifiedRequest = updatedRequest.parentId !== null;
            const tradesmanId = updatedRequest.createdBy.userId;
            let notificationTitle;
            let notificationType: NotificationType;
            let notificationMessage;
            let notificationImage;

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
                    `Your modification request for Scaffold ${requestData.scaffhold.SCAFFID} | Project ${requestData.scaffhold.projectName} has been ${data.status}.`;

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
                    `Your scaffold request for Scaffold ${requestData.scaffhold.SCAFFID} | Project ${requestData.scaffhold.projectName} has been ${data.status}.`;

                notificationImage =
                    data.status === "APPROVED"
                        ? "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/requestAccepted.png"
                        : "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/requestRejected.png";
            }


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
                                scaffoldId: BigInt(updatedRequest.id),
                                scaffoldRequestId: "",
                                role: "TRADESMAN",
                                receiverId: BigInt(tradesmanId),
                                senderId: requestData.createdBy?.id?.toString() ?? "0",
                                isRead: false,
                                notificationImage: notificationImage,
                                tradesmanCraft: requestData.createdBy.craft || null,
                            },
                        });

                        const devices = await prisma.device.findMany({
                            where: {
                                userId: tradesmanId,
                                user_type: "TRADESMAN",
                                deviceToken: { not: null }
                            },
                            select: { deviceToken: true }
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





                const competentUserIds =
                    requestData.scaffhold.competentPersons.map(cp =>
                        cp.competentPerson.userId
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

                const competentPersonDevices = await prisma.device.findMany({
                    where: {
                        userId: { in: validCompetentUsers.map(u => u.id) },
                        deviceToken: { not: null }
                    },
                    select: { userId: true, deviceToken: true }
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
                            companyId: requestData.scaffhold.companyId
                                ? BigInt(requestData.scaffhold.companyId)
                                : null,
                            scaffoldId: BigInt(requestData.scaffhold.id),
                            scaffoldRequestId: updatedRequest.id.toString(),
                            receiverId: BigInt(cpUser.id),
                            senderId: requestData.createdBy?.id?.toString() ?? "0",
                            notificationImage: notificationImage,
                            tradesmanCraft: requestData.createdBy.craft || null,
                        }
                    });
                }

                const devices = await prisma.device.findMany({
                    where: {
                        userId: { in: validCompetentUsers.map(u => u.id) },
                        user_type: "COMPETENT_PERSON",
                        deviceToken: { not: null }
                    },
                    select: { deviceToken: true }
                });

                await Promise.all(
                    devices.map(d =>
                        pushNotificationDelhi(
                            d.deviceToken!,
                            notificationTitle,
                            notificationMessage
                        )
                    )
                );

                return {
                    message: RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_SUCCESS,
                    data: updatedRequest,
                };

            }
        } catch (error: any) {
            console.error("❌ Approve/Reject Scaffold Request error:", error);
            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED,
                500,
                error.message
            );
        }
    }




    async getAllPendingModifiedRequestsByParentId(userId: number, data: SearchScaffHoldDTO, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const whereCondition: any = {
                parentId: { not: null },
                status: "PENDING",
                scaffhold: {
                    project: {
                        projectManagers: {
                            some: {
                                id: userId,
                                isDeleted: false,
                                status: "ACTIVE",
                                isVerified: true,
                            },
                        },
                    },
                },
            };
            const searchTerm = data?.search?.trim();
            if (searchTerm && searchTerm !== "") {
                const term = searchTerm;

                if (!isNaN(Number(term))) {
                    whereCondition.OR = [
                        { id: Number(term) },
                        { REQID: { contains: term, } },
                    ];
                } else {
                    whereCondition.OR = [
                        { REQID: { contains: term, } },
                        { scaffhold: { projectName: { contains: term, } } },
                        { scaffhold: { address: { contains: term, } } },
                        { createdBy: { user: { name: { contains: term, } } } },
                    ];
                }
            }

            const [requests, totalCount] = await Promise.all([
                prisma.scaffholdRequest.findMany({
                    where: whereCondition,
                    include: {
                        scaffhold: true,
                        createdBy: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        userMedias: { take: 1, select: { url: true } },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),

                prisma.scaffholdRequest.count({ where: whereCondition }),
            ]);



            const totalPages = Math.ceil(totalCount / limit);
            const responseData = requests.map((request) => {
                const scaffholdData = request.scaffhold;
                return {
                    id: request.id,
                    uuid: request.uuid,
                    REQID: request.REQID,
                    status: request.status,
                    craft: request.craft,
                    priority: request.priority,
                    length: request.length,
                    width: request.width,
                    height: request.height,
                    expectedEndDate: request.expectedEndDate,
                    notes: request.notes,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                    scaffholdId: scaffholdData?.id,
                    SCAFFID: scaffholdData?.SCAFFID,
                    projectName: scaffholdData?.projectName,
                    address: scaffholdData?.address,
                    latitude: scaffholdData?.latitude,
                    longitude: scaffholdData?.longitude,
                    parentId: request.parentId,
                    createdByName: request.createdBy?.user?.name || null,
                    createdByImage: request.createdBy?.user?.userMedias?.[0]?.url || null,
                };
            });

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_MODIFICATIONS_FETCH_SUCCESS,
                data: responseData,
                totalCount,
                totalPages,
                currentPage: page,
                limit
            };
        } catch (error: any) {
            console.error("❌ Error in getModifiedRequestsByParentId:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError ? error :
                new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_MODIFICATIONS_FETCH_FAILED,
                    500,
                    error.message);
        }
    }


    async getTrademanPendingRequestListServices(userId: number, data: SearchScaffHoldDTO, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const whereCondition: any = {
                status: "PENDING",
                parentId: null,
                scaffhold: {
                    project: {
                        projectManagers: {
                            some: {
                                id: userId,
                                isDeleted: false,
                                status: "ACTIVE",
                                isVerified: true,
                            },
                        },
                    },
                },
            };

            const searchTerm = data?.search?.trim();

            if (searchTerm && searchTerm !== "") {
                const term = searchTerm;

                if (!isNaN(Number(term))) {
                    whereCondition.id = Number(term);
                } else {
                    whereCondition.OR = [
                        { REQID: { contains: term, } },
                        { scaffhold: { projectName: { contains: term, } } }, // ✅ project name
                        { scaffhold: { address: { contains: term, } } },
                        { createdBy: { user: { name: { contains: term, } } } }, // ✅ created by name
                    ];
                }
            }

            const [requests, totalCount] = await Promise.all([
                prisma.scaffholdRequest.findMany({
                    where: whereCondition,
                    include: {
                        scaffhold: true,
                        createdBy: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        userMedias: { take: 1, select: { url: true } },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),
                prisma.scaffholdRequest.count({ where: whereCondition }),
            ]);

            const formattedData = requests.map((req) => ({
                id: req.id,
                uuid: req.uuid,
                scaffholdId: req.scaffholdId,
                SCAFFID: req.scaffhold?.SCAFFID || null,
                projectName: req.scaffhold?.projectName || null,
                craftId: req.createdBy?.craftId || null,
                craft: req.createdBy?.craft || null,
                REQID: req.REQID,
                address: req.scaffhold?.address || null,
                longitude: req.scaffhold?.longitude || null,
                latitude: req.scaffhold?.latitude || null,
                length: req.length,
                width: req.width,
                height: req.height,
                priority: req.priority,
                expectedEndDate: req.expectedEndDate,
                notes: req.notes,
                status: req.status,
                createdAt: req.createdAt,
                updatedAt: req.updatedAt,
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
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async getScaffHoldJobAndCraftDetails(data: GetJobCraftDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findUnique({
                where: { id: data.scaffHoldId, isDeleted: false },
                include: {
                    jobCrafts: {
                        include: { craft: true },
                        orderBy: { id: 'desc' },
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

            const { jobCrafts } = scaffhold;
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


            const responseData = {

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

    async getScaffholdRequestsByCreator(data: getRequestCreatorById, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const [updates, totalCount] = await Promise.all([
                prisma.updateScaffHoldRequest.findMany({
                    where: {
                        requestId: data.requestId,
                    },
                    select: {
                        id: true,
                        requestId: true,
                        scaffholdId: true,
                        length: true,
                        width: true,
                        height: true,
                        priority: true,
                        expectedEndDate: true,
                        notes: true,
                        createdAt: true,
                        scaffholdRequest: {
                            select: {
                                createdById: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                    skip,
                    take: limit,
                }),

                prisma.updateScaffHoldRequest.count({
                    where: { requestId: data.requestId },
                }),
            ]);
            const formattedData = updates.map((u) => ({
                updateId: u.id,
                requestId: u.requestId,
                scaffholdId: u.scaffholdId,
                size: `${u.length || "N/A"} ft  x ${u.width || "N/A"} ft  x ${u.height || "N/A"} ft `,
                priority: u.priority || "N/A",
                expectedEndDate: u.expectedEndDate || "Not specified",
                notes: u.notes || "No notes available",
                createdAt: u.createdAt,
                createdBy: u.scaffholdRequest.createdById


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
            }

        } catch (error: any) {
            console.error("Error fetching scaffhold requests:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
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
}

