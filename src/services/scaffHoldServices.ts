// src/services/scaffHoldServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { pushNotificationDelhi, sendMail, scaffHoldIdGenerator } from "../helpers/utils";

import { v4 as uuidv4 } from "uuid";
import { changePriorityAndTagsDTO, ProjectScaffHoldDTO, RemoveScaffCompetentPersonDTO, scaffCompetentPersonDTO, ScaffCompetentPersonDTO, ScaffHoldDetailsDTO, ScaffHoldDTO } from "../schemas/scaffHoldSchema";
import { RequestStatus } from "@prisma/client";


export class ScaffHoldsServices {


    async getAllScaffHolds(page: number, limit: number) {
        try {
            const skip = (page - 1) * limit;

            const [requests, totalCount] = await Promise.all([
                prisma.projectScaffholdRequest.findMany({
                    skip,
                    take: limit,
                    where: {
                        project: {
                            isDeleted: false,
                        },
                    },
                    include: {
                        project: true,
                        createdBy: {
                            include: {
                                user: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                }),

                prisma.projectScaffholdRequest.count({
                    where: {
                        project: {
                            isDeleted: false,
                        },
                    },
                }),
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            // 🔥 optional clean response mapping
            const data = requests.map((r) => ({
                id: r.id,
                uuid: r.uuid,
                status: r.status,
                tag: r.tag,
                address: r.address,
                latitude: r.latitude,
                longitude: r.longitude,
                priority: r.priority,
                projectId: r.projectId,
                projectName: r.project?.projectName || null,

                tradesmanName: r.createdBy?.user?.name || null,
                tradesmanEmail: r.createdBy?.user?.email || null,

                createdAt: r.createdAt,
            }));

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data,
                totalCount,
                totalPages,
                currentPage: page,
            };

        } catch (error: any) {
            console.error("❌ Get all scaffhold requests error:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async getScaffHoldById(data: ScaffHoldDetailsDTO) {
        try {

            // 🔥 NEW SOURCE: ProjectScaffholdRequest
            const request = await prisma.projectScaffholdRequest.findFirst({
                where: {
                    id: data.id,
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
                    404,
                    "Request not found"
                );
            }

            // 🔥 FORMATTED RESPONSE (UPDATED STRUCTURE)
            const formattedResponse = {
                id: request.id,
                uuid: request.uuid,

                startDate: request.startDate,
                endDate: request.endDate,
                latitude: request.latitude,
                longitude: request.longitude,

                priority: request.priority,
                tag: request.tag,
                SCAFFID: request.SCAFFID,
                REQID: request.REQID,

                address: request.address,
                description: request.description,

                craft: request.craft,
                length: request.length,
                width: request.width,
                height: request.height,

                status: request.status,
                projectId: request.projectId,

                createdAt: request.createdAt,
                updatedAt: request.updatedAt,

                // 🔥 TRADESMAN INFO
                createdById: request.createdById,
                tradesmanName: request.createdBy?.user?.name || null,
                tradesmanEmail: request.createdBy?.user?.email || null,
                tradesmanMobile: request.createdBy?.user?.mobileNumber || null,

                // 🔥 PROJECT INFO
                projectName: request.project?.projectName || null,
                clientName: request.project?.clientName || null,
                clientMobile: request.project?.clientMobile || null,
                clientEmail: request.project?.clientEmail || null,
            };

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_BY_ID_SUCCESS,
                data: formattedResponse,
            };

        } catch (error: any) {
            console.error("❌ Get scaffhold request by id error:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async getProjectScaffHold(
        data: ProjectScaffHoldDTO,
        page: number,
        limit: number,
        projectId: bigint
    ) {
        try {
            const skip = (page - 1) * limit;

            const { search, priority, status, tags, sort } = data;
            const BLOCKED_STATUSES = [
                RequestStatus.PENDING,
                RequestStatus.REJECTED,
                RequestStatus.SUSPENDED,
            ];
            const whereCondition: any = {
                projectId,
                status: {
                    notIn: BLOCKED_STATUSES,
                },
            };

            // 🔍 SEARCH
            if (search?.trim()) {
                const searchTerm = search.trim();

                if (!isNaN(Number(searchTerm))) {
                    whereCondition.id = Number(searchTerm);
                } else {
                    whereCondition.OR = [
                        { REQID: { contains: searchTerm } },
                        { SCAFFID: { contains: searchTerm } },
                        { notes: { contains: searchTerm } },
                        { craft: { contains: searchTerm } },
                    ];
                }
            }

            // ⚡ PRIORITY
            if (priority) {
                const values = Array.isArray(priority)
                    ? priority
                    : [priority];

                whereCondition.priority = {
                    in: values.map((p) => p.toUpperCase()),
                };
            }

            // ⚡ STATUS
            if (status) {
                const values = Array.isArray(status)
                    ? status
                    : [status];

                whereCondition.status = {
                    in: values.map((s) => s.toUpperCase()),
                };
            }

            // ⚡ TAGS
            if (tags) {
                const values = Array.isArray(tags)
                    ? tags
                    : [tags];

                whereCondition.tag = {
                    in: values.map((t) => t.toUpperCase()),
                };
            }

            // 📊 COUNT
            const totalCount = await prisma.projectScaffholdRequest.count({
                where: whereCondition,
            });

            const totalPages = Math.ceil(totalCount / limit);

            // 📦 PROJECT
            const projectData = await prisma.project.findUnique({
                where: {
                    id: projectId,
                    status: {
                        in: ["CREATED", "ONGOING", "COMPLETED"]
                    }
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
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            CMPId: true,
                        }
                    }


                },
            });

            if (!projectData) {
                throw new CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
            }

            // 🔥 SORT LOGIC (NEW FIX)
            const orderBy: any =
                sort === "ASC"
                    ? { createdAt: "asc" }
                    : { createdAt: "desc" };

            // 📦 LIST
            const scaffholdList = await prisma.projectScaffholdRequest.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy,
                select: {
                    id: true,
                    uuid: true,
                    REQID: true,
                    SCAFFID: true,
                    projectId: true,
                    expectedEndDate: true,
                    craft: true,
                    length: true,
                    width: true,
                    height: true,
                    priority: true,
                    status: true,
                    tag: true,
                    notes: true,
                    address: true,
                    latitude: true,
                    longitude: true,
                    createdAt: true,
                    updatedAt: true,
                    createdBy: {
                        select: {
                            id: true,
                            craft: true,

                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });
            const { createdBy, ...projectWithoutCreatedBy } = projectData as any;
            const company = projectData.createdBy;

            return {
                message: RESPONSE_MESSAGES.PROJECT.FETCH_BY_ID_SUCCESS,
                data: {
                    ...projectWithoutCreatedBy,

                    companyId: company?.id,
                    companyName: company?.name,
                    companyCMPId: company?.CMPId,
                    scaffholdList: scaffholdList.map((item) => ({
                        id: item.id,

                        uuid: item.uuid,

                        REQID: item.REQID,

                        SCAFFID: item.SCAFFID,

                        projectId: item.projectId,

                        craft: item.craft,

                        length: item.length,
                        width: item.width,
                        height: item.height,

                        priority: item.priority,

                        status: item.status,

                        tag: item.tag,

                        notes: item.notes,

                        address: item.address,

                        latitude: item.latitude,
                        longitude: item.longitude,

                        expectedEndDate:
                            item.expectedEndDate,

                        createdByCraft:
                            item.createdBy?.craft,

                        createdAt: item.createdAt,

                        updatedAt: item.updatedAt,
                    })),

                },
                pagination: {
                    total: totalCount,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            };
        } catch (error: any) {
            console.error("❌ Get Project ScaffHold error:", error);
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


    async projectCompetentPersons(data: scaffCompetentPersonDTO) {
        try {
            const searchTerm = data?.search?.trim() || "";

            const whereCondition: any = {
                projectid: BigInt(data.id),
            };

            if (searchTerm !== "") {
                whereCondition.competentPerson = {
                    user: {
                        name: {
                            contains: searchTerm,
                        },
                    },
                };
            }

            const competentPersons = await prisma.competentPersonOnProject.findMany({
                where: whereCondition,
                orderBy: {
                    createdAt: "desc",
                },
                select: {
                    competentPersonId: true,
                    competentPerson: {
                        select: {
                            user: {
                                select: {
                                    name: true,
                                    userMedias: {
                                        take: 1,
                                        orderBy: { createdAt: "desc" },
                                        select: { url: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            const formatted = competentPersons.map(cp => ({
                id: cp.competentPersonId,
                name: cp.competentPerson.user?.name,
                image: cp.competentPerson.user?.userMedias[0]?.url || null,
            }));

            return {
                message: RESPONSE_MESSAGES.PROJECT.FETCH_ALL_SUCCESS,
                data: formatted,
            };
        } catch (error: any) {
            console.error("❌ Get project CP error:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.PROJECT.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async addCompetentPersonToProject(userId: number, data: ScaffCompetentPersonDTO) {
        try {
            console.log("Adding competent person to project with data:", data);

            // =========================
            // ✅ VALIDATE PROJECT MANAGER
            // =========================
            const userData = await prisma.projectManager.findFirst({
                where: {
                    userId: userId,
                    user: {
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "PROJECT_MANAGER",
                    },
                    company: {
                        isApproved: "APPROVED",
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "COMPANY",
                    },
                },
            });

            if (!userData) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found");
            }

            // =========================
            // ✅ VALIDATE PROJECT
            // =========================
            const projectData = await prisma.project.findUnique({
                where: {
                    id: BigInt(data.projectId),
                    isDeleted: false,
                },
            });
            console.log("Project Data:", projectData);

            if (!projectData) {
                throw new CustomError(RESPONSE_MESSAGES.PROJECT.NOT_FOUND, 404, "Project not found");
            }

            // =========================
            // ✅ VALIDATE CPs
            // =========================
            const competentPersonsData = await prisma.competentPerson.findMany({
                where: {
                    id: { in: data.competentPersonIds.map(BigInt) },
                    user: {
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "COMPETENT_PERSON",
                    },
                },
            });
            console.log("Competent Persons Data:", competentPersonsData);

            if (competentPersonsData.length !== data.competentPersonIds.length) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 400, "Some competent persons not found");
            }


            // =========================
            // 🔄 EXISTING RELATION
            // =========================
            const existing = await prisma.competentPersonOnProject.findMany({
                where: { projectid: BigInt(data.projectId) },
                select: { competentPersonId: true },
            });

            const existingIds = existing.map(e => Number(e.competentPersonId));

            const newIdsToAdd = data.competentPersonIds.filter(id => !existingIds.includes(Number(id)));
            const idsToRemove = existingIds.filter(id => !data.competentPersonIds.includes(Number(id)));

            // =========================
            // ➕ ADD CP
            // =========================
            if (newIdsToAdd.length > 0) {
                await prisma.competentPersonOnProject.createMany({
                    data: newIdsToAdd.map(id => ({
                        projectid: BigInt(data.projectId),
                        competentPersonId: BigInt(id),
                    })),
                    skipDuplicates: true,
                });
            }

            // =========================
            // ➖ REMOVE CP
            // =========================
            if (idsToRemove.length > 0) {
                await prisma.competentPersonOnProject.deleteMany({
                    where: {
                        projectid: BigInt(data.projectId),
                        competentPersonId: { in: idsToRemove.map(BigInt) },
                    },
                });
            }

            // =========================
            // 🔄 UPDATED PROJECT
            // =========================
            const updatedProject = await prisma.project.findUnique({
                where: { id: BigInt(data.projectId) },
                include: {
                    competentPersons: {
                        include: {
                            competentPerson: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                            userMedias: { select: { url: true } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });

            const formattedCP = updatedProject!.competentPersons.map(cp => ({
                id: cp.competentPerson.id,
                userId: cp.competentPerson.user.id,
                name: cp.competentPerson.user.name,
                email: cp.competentPerson.user.email,
                url: cp.competentPerson.user.userMedias[0]?.url || null,
            }));

            // =========================
            // 📩 CP NOTIFICATION (ALWAYS)
            // =========================
            if (newIdsToAdd.length > 0) {
                const newCPUsers = formattedCP.filter(cp =>
                    newIdsToAdd.includes(Number(cp.id))
                );

                await prisma.notification.createMany({
                    data: newCPUsers.map(cp => ({
                        uuid: uuidv4(),
                        title: "PROJECT ASSIGNED",
                        message: `You have been assigned to Project ${projectData.projectName}.`,
                        type: "PROJECT_ASSIGNED",
                        role: "COMPETENT_PERSON",
                        isRead: false,
                        projectId: BigInt(projectData.id),
                        receiverId: BigInt(cp.userId),
                        senderId: userId.toString(),
                        notificationImage:
                            "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/assigned.png"
                    })),
                });

                console.log("✅ CP notifications created for users:", newCPUsers.map(cp => cp.userId));

                // PUSH NOTIFICATION FOR CP
                const cpUserIds = newCPUsers.map(cp => Number(cp.userId));

                const cpDevices = await prisma.device.findMany({
                    where: {
                        userId: { in: cpUserIds },
                        deviceToken: { not: null }
                    },
                    select: {
                        deviceToken: true
                    }
                });

                console.log("CP Devices =>", cpDevices);

                for (const device of cpDevices) {
                    console.log("🚀 Sending push to:", device.deviceToken);
                    await pushNotificationDelhi(
                        device.deviceToken!,
                        "PROJECT ASSIGNED",
                        `You have been assigned to Project ${projectData.projectName}.`
                    );
                }
            }


            // =========================
            // 🏢 SUPER ADMIN + COMPANY OWNER ONLY
            // =========================

            const superAdmins = await prisma.user.findMany({
                where: {
                    user_type: "SUPER_ADMIN",
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                },
                select: { id: true, email: true }
            });

            const companyOwner = await prisma.company.findUnique({
                where: { id: projectData.createdById! },
                select: { id: true }
            });

            const receiverIds = [
                ...superAdmins.map(s => Number(s.id)),
                Number(companyOwner?.id || 0)
            ].filter(Boolean);

            const settings = await prisma.notificationSetting.findMany({
                where: {
                    userId: { in: receiverIds }
                }
            });

            const allowedUsers = receiverIds.filter(id => {
                const setting = settings.find(s => Number(s.userId) === id);
                return setting ? setting.teamMemberChanged === true : true;
            });

            const message = `Competent Person updated in project ${projectData.projectName}`;

            // =========================
            // 📩 DB NOTIFICATION
            // =========================
            await prisma.notification.createMany({
                data: allowedUsers.map(id => ({
                    uuid: uuidv4(),
                    title: "Team Member Updated",
                    message,
                    type: newIdsToAdd.length > 0
                        ? "TRADESMAN_JOINED_PROJECT"
                        : "TRADESMAN_REMOVED",
                    role: id === Number(companyOwner?.id)
                        ? "COMPANY"
                        : "SUPER_ADMIN",
                    isRead: false,
                    projectId: BigInt(projectData.id),
                    receiverId: BigInt(id),
                    senderId: userId.toString(),
                }))
            });

            // =========================
            // 📧 EMAIL (TOGGLE ONLY)
            // =========================
            const emailUsers = await prisma.user.findMany({
                where: {
                    id: {
                        in: settings.filter(s => s.emailEnabled).map(s => Number(s.userId))
                    }
                },
                select: { email: true, id: true }
            });

            for (const user of emailUsers) {
                await sendMail(
                    user.email,
                    "Team Member Update",
                    message
                );
            }

            // =========================
            // 📱 PUSH NOTIFICATION (POPUP FIXED)
            // =========================
            const devices = await prisma.device.findMany({
                where: {
                    userId: { in: allowedUsers },
                    deviceToken: { not: null }
                },
                select: { deviceToken: true }
            });

            for (const device of devices) {
                await pushNotificationDelhi(
                    device.deviceToken!,
                    "Team Member Updated",
                    message
                );
            }

            // =========================
            // RESPONSE
            // =========================
            return {
                message: "Competent persons updated successfully",
                data: {
                    ...updatedProject!,
                    competentPersons: formattedCP,
                },
            };

        } catch (error: any) {
            console.error("❌ Add CP error:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.PROJECT.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async removeCompetentPersonFromProject(data: RemoveScaffCompetentPersonDTO) {
        try {

            // =========================
            // ✅ VALIDATE PROJECT
            // =========================
            const projectData = await prisma.project.findUnique({
                where: {
                    id: BigInt(data.projectId),
                    isDeleted: false,
                },
            });

            if (!projectData) {
                throw new CustomError("Project not found", 404);
            }

            // =========================
            // ✅ VALIDATE CP
            // =========================
            const cpData = await prisma.competentPerson.findUnique({
                where: { id: BigInt(data.competentPersonId) },
                include: { user: true }
            });

            if (!cpData) {
                throw new CustomError("Competent person not found", 404);
            }

            // =========================
            // ❌ REMOVE RELATION
            // =========================
            await prisma.competentPersonOnProject.delete({
                where: {
                    projectid_competentPersonId: {
                        projectid: BigInt(data.projectId),
                        competentPersonId: BigInt(data.competentPersonId),
                    },
                },
            });

            const message = `You have been removed from project ${projectData.projectName}`;

            // =========================
            // 📩 CP NOTIFICATION (ALWAYS)
            // =========================
            await prisma.notification.create({
                data: {
                    uuid: uuidv4(),
                    title: "REMOVED FROM PROJECT",
                    message,
                    type: "TRADESMAN_REMOVED",
                    role: "COMPETENT_PERSON",
                    isRead: false,
                    projectId: BigInt(projectData.id),
                    receiverId: BigInt(cpData.userId),
                    senderId: data.projectId.toString(),
                }
            });

            // =========================
            // 🏢 SUPER ADMIN + COMPANY OWNER ONLY
            // =========================

            const superAdmins = await prisma.user.findMany({
                where: {
                    user_type: "SUPER_ADMIN",
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                },
                select: { id: true, email: true }
            });

            const companyOwner = await prisma.company.findUnique({
                where: { id: projectData.createdById! },
                select: { id: true }
            });

            const receiverIds = [
                ...superAdmins.map(s => Number(s.id)),
                Number(companyOwner?.id || 0)
            ].filter(Boolean);

            const settings = await prisma.notificationSetting.findMany({
                where: {
                    userId: { in: receiverIds }
                }
            });

            const allowedUsers = receiverIds.filter(id => {
                const setting = settings.find(s => Number(s.userId) === id);
                return setting ? setting.teamMemberChanged === true : true;
            });

            // =========================
            // 📩 DB NOTIFICATION
            // =========================
            await prisma.notification.createMany({
                data: allowedUsers.map(id => ({
                    uuid: uuidv4(),
                    title: "Team Member Removed",
                    message,
                    type: "TRADESMAN_REMOVED",
                    role: id === Number(companyOwner?.id)
                        ? "COMPANY"
                        : "SUPER_ADMIN",
                    isRead: false,
                    projectId: BigInt(projectData.id),
                    receiverId: BigInt(id),
                    senderId: data.projectId.toString(),
                }))
            });

            // =========================
            // 📧 EMAIL (ONLY IF TOGGLE ON)
            // =========================
            const emailSettings = settings.filter(s => s.emailEnabled === true);

            const emailUsers = await prisma.user.findMany({
                where: {
                    id: { in: emailSettings.map(s => Number(s.userId)) }
                },
                select: { email: true }
            });

            for (const user of emailUsers) {
                await sendMail(
                    user.email,
                    "Team Member Removed",
                    message
                );
            }

            // =========================
            // 📱 PUSH NOTIFICATION (POPUP FIXED)
            // =========================
            const devices = await prisma.device.findMany({
                where: {
                    userId: { in: allowedUsers },
                    deviceToken: { not: null }
                },
                select: { deviceToken: true }
            });

            for (const device of devices) {
                await pushNotificationDelhi(
                    device.deviceToken!,
                    "Team Member Removed",
                    message
                );
            }

            // =========================
            // RESPONSE
            // =========================
            return {
                message: "Competent person removed successfully",
            };

        } catch (error: any) {
            console.error("❌ Remove CP error:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                "Failed to remove competent person",
                500,
                error.message
            );
        }
    }

  async projectAndCompetentPersons(
    data: {
        id: number;
        scaffoldRequestId?: number;
    },
    user?: any
) {
    try {

        // =====================================
        // QR SCAN AUTHORIZATION
        // =====================================

        if (
            data.scaffoldRequestId &&
            user &&
            user.user_type !== "TRADESMAN"
        ) {

            const scaffoldRequest =
                await prisma.projectScaffholdRequest.findUnique({
                    where: {
                        id: BigInt(data.scaffoldRequestId),
                    },
                    include: {
                        project: {
                            include: {
                                createdBy: {
                                    select: {
                                        CMPId: true,
                                    },
                                },
                            },
                        },
                    },
                });

            if (!scaffoldRequest) {
                throw new CustomError(
                    "Scaffold request not found",
                    404,
                    "Scaffold request not found"
                );
            }

            const projectCmpId =
                scaffoldRequest.project?.createdBy?.CMPId;

            const userCmpId =
                user.companyId;

            if (
                !projectCmpId ||
                !userCmpId ||
                projectCmpId !== userCmpId
            ) {
                throw new CustomError(
                    "You are not authorized to access this scaffold",
                    403,
                    "Unauthorized"
                );
            }
        }

        // =========================
        // 🔥 FETCH REQUEST (MAIN)
        // =========================

        const request = await prisma.projectScaffholdRequest.findFirst({
            where: {
                id: BigInt(data.id),
            },
            include: {
                project: {
                    select: {
                        id: true,
                        uuid: true,
                        projectName: true,
                        PJT: true,
                        clientName: true,
                        clientEmail: true,
                        clientMobile: true,
                        clientAddress: true,
                        status: true,
                    },
                },

                createdBy: {
                    select: {
                        id: true,
                        craft: true,
                        experience: true,
                        user: {
                            select: {
                                name: true,
                                mobileNumber: true,
                                userMedias: {
                                    take: 1,
                                    orderBy: { createdAt: "desc" },
                                    select: {
                                        url: true,
                                    },
                                },
                            },
                        },
                    },
                },

                updatesRequest: {
                    orderBy: { createdAt: "desc" },
                },

                rentalCycles: {
                    orderBy: { createdAt: "desc" },
                },

                parent: true,
                children: true,
            },
        });

        if (!request) {
            throw new CustomError(
                RESPONSE_MESSAGES.PROJECT.NOT_FOUND,
                404,
                "Request not found"
            );
        }

        const projectId = request.projectId;

        // =========================
        // 👷 COMPETENT PERSONS
        // =========================

        const competentPersons =
            await prisma.competentPersonOnProject.findMany({
                where: {
                    projectid: projectId,
                    competentPerson: {
                        user: {
                            isDeleted: false,
                            status: "ACTIVE",
                            isVerified: true,
                            user_type: "COMPETENT_PERSON",
                        },
                    },
                },
                select: {
                    competentPersonId: true,
                    competentPerson: {
                        select: {
                            user: {
                                select: {
                                    name: true,
                                    userMedias: {
                                        take: 1,
                                        orderBy: { createdAt: "desc" },
                                        select: { url: true },
                                    },
                                },
                            },
                        },
                    },
                },
            });

        const formattedCP = competentPersons.map((cp: any) => ({
            id: cp.competentPersonId,
            name: cp.competentPerson.user?.name,
            image: cp.competentPerson.user?.userMedias?.[0]?.url || null,
        }));

        return {
            message: "Request details fetched successfully",

            data: {
                id: request.id,
                uuid: request.uuid,

                status: request.status,
                priority: request.priority,
                tag: request.tag,

                SCAFFID: request.SCAFFID,
                REQID: request.REQID,

                craft: request.craft,

                description: request.description,
                notes: request.notes,
                rejectionReason: request.reajectionReason,

                length: request.length,
                width: request.width,
                height: request.height,

                address: request.address,
                latitude: request.latitude,
                longitude: request.longitude,

                startDate: request.startDate,
                endDate: request.endDate,
                expectedEndDate: request.expectedEndDate,

                isConvertedToScaffold:
                    request.isConvertedToScaffold,

                parentId: request.parentId,

                createdAt: request.createdAt,
                updatedAt: request.updatedAt,

                projectId: request.project?.id || null,
                projectUuid: request.project?.uuid || null,
                PJT: request.project?.PJT || null,
                projectName: request.project?.projectName || null,

                projectStatus: request.project?.status || null,

                clientName: request.project?.clientName || null,
                clientEmail: request.project?.clientEmail || null,
                clientMobile: request.project?.clientMobile || null,
                clientAddress: request.project?.clientAddress || null,

                createdById: request.createdBy?.id || null,
                createdByName:
                    request.createdBy?.user?.name || null,

                createdByMobile:
                    request.createdBy?.user?.mobileNumber || null,

                createdByCraft:
                    request.createdBy?.craft || null,

                createdByExperience:
                    request.createdBy?.experience || null,

                createdByImage:
                    request.createdBy?.user?.userMedias?.[0]?.url ||
                    null,

                rentalCycleId:
                    request.rentalCycles?.[0]?.id || null,

                rentalCycleUuid:
                    request.rentalCycles?.[0]?.uuid || null,

                rentalCycleErectedAt:
                    request.rentalCycles?.[0]?.erectedAt || null,

                rentalCycleTaggedAt:
                    request.rentalCycles?.[0]?.taggedAt || null,

                rentalCycleTotalDays:
                    request.rentalCycles?.[0]?.totalDays || 0,

                rentalCycleCount:
                    request.rentalCycles?.[0]?.cycleCount || 0,

                rentalCycleDays:
                    request.rentalCycles?.[0]?.rentalDays || 0,

                competentPersons: formattedCP,
            },
        };
    } catch (error: any) {
        console.error("❌ Request detail error:", error);

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

    async changePriorityAndTags(data: changePriorityAndTagsDTO) {
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

            // 1. FIND REQUEST (safe + correct)
            const scaffhold = await prisma.projectScaffholdRequest.findUnique({
                where: {
                    id: data.scaffHoldId,
                },
                include: {
                    project: true,
                },
            });

            if (!scaffhold) {
                throw new CustomError(
                    "Scaffold request not found",
                    404
                );
            }

            // OPTIONAL SAFETY CHECK
            if (scaffhold.status === "REJECTED") {
                throw new CustomError(
                    "Cannot update rejected scaffold",
                    400
                );
            }

            // 2. UPDATE
            const updatedScaffhold =
                await prisma.projectScaffholdRequest.update({
                    where: {
                        id: data.scaffHoldId,
                    },

                    data: {

                        priority: data.priority,

                        tag: data.tag,

                        ...(data.lightDuty !== undefined && {
                            lightDuty: data.lightDuty,
                        }),

                        ...(data.mediumDuty !== undefined && {
                            mediumDuty: data.mediumDuty,
                        }),

                        ...(data.heavyDuty !== undefined && {
                            heavyDuty: data.heavyDuty,
                        }),
                           ...(data.fallProtection !== undefined && {
                fallProtection: data.fallProtection,
            }),

            ...(data.ladder !== undefined && {
                ladder: data.ladder,
            }),

            ...(data.handRail !== undefined && {
                handRail: data.handRail,
            }),

            ...(data.midRail !== undefined && {
                midRail: data.midRail,
            }),

            ...(data.toeBoard !== undefined && {
                toeBoard: data.toeBoard,
            }),

            ...(data.platform !== undefined && {
                platform: data.platform,
            }),

            ...(data.note !== undefined && {
                note: data.note,
            }),

            ...(data.other !== undefined && {
                other: data.other,
            }),

                    },
                });

            // 3. GET PROJECT OWNER
            const project = await prisma.project.findUnique({
                where: { id: scaffhold.projectId },
                select: {
                    createdById: true,
                },
            });

            // 4. NOTIFICATION MESSAGE
            const notificationMessage =
                `Scaffold ${scaffhold.SCAFFID} updated to ${data.tag}`;

            // 5. CREATE NOTIFICATION
            await prisma.notification.create({
                data: {
                    uuid: uuidv4(),
                    title: "Scaffold Updated",
                    message: notificationMessage,
                    type: "SCAFFOLD_STATUS_UPDATE",

                    role: "COMPANY",
                    companyId: project?.createdById ?? null,
                    receiverId: project?.createdById ?? null,

                    senderId: scaffhold.createdById.toString(), // ✅ FIXED

                    isRead: false,
                },
            });

            // 6. GET DEVICES
      

            // 8. RESPONSE
            return {
                success: true,
                message: "Scaffold updated successfully",
                data: updatedScaffhold,
            };

        } catch (error: any) {

            console.error(
                "❌ Change priority and tags error:",
                error
            );
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                error.message || "Update failed",
                error.statusCode || 500
            );
        }
    }


    async getCompanyNotifications(userId: number) {
        try {
            const notifications = await prisma.notification.findMany({
                where: {
                    companyId: userId,
                    role: "COMPANY"
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            const unreadCount = await prisma.notification.count({
                where: {
                    companyId: userId,
                    role: "COMPANY",
                    isRead: false
                }
            });

            return {
                message: RESPONSE_MESSAGES.NOTIFICATION.SUCCESS_GET,
                data: {
                    count: unreadCount,
                    notifications: notifications.map(n => ({
                        id: n.id,
                        uuid: n.uuid,
                        title: n.title,
                        message: n.message,
                        type: n.type,
                        role: n.role,
                        isRead: n.isRead,
                        companyId: n.companyId,
                        projectId: n.projectId,
                        receiverId: n.receiverId,
                        senderId: n.senderId,
                        createdAt: n.createdAt,
                        updatedAt: n.updatedAt
                    }))
                }
            };
        } catch (error: any) {
            console.error("❗ Error in getSuperAdminNotifications:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch notifications", 500, error.message);
        }
    }


    async getScaffholdRequestHistory(requestId: number) {
        try {
            const request = await prisma.projectScaffholdRequest.findFirst({
                where: { id: requestId },
                include: {
                    project: {
                        include: {
                            createdBy: true
                        }
                    },

                    createdBy: {
                        include: {
                            user: {
                                include: {
                                    userMedias: true // ✅ ADD THIS
                                }
                            },
                        }
                    },

                    updatesRequest: {
                        orderBy: {
                            createdAt: "asc"
                        }
                    }
                }
            });

            if (!request) {
                throw new CustomError(
                    "Request not found",
                    404,
                    "NOT_FOUND"
                );
            }

            const tradesman = request.createdBy;
            const createdUser = tradesman?.user;

            return {
                message: "Scaffold request history fetched successfully",

                data: {

                    // =======================
                    // LATEST REQUEST
                    // =======================
                    latestRequest: {
                        id: request.id,
                        uuid: request.uuid,

                        projectId: request.projectId,

                        startDate: request.startDate,
                        endDate: request.endDate,

                        address: request.address,
                        latitude: request.latitude,
                        longitude: request.longitude,

                        tag: request.tag,
                        SCAFFID: request.SCAFFID,

                        createdBy: request.createdById,

                        tradesmanId: tradesman?.id || null,
                        tradesmanName: tradesman?.user?.name || null,

                        craftName: tradesman?.craft || null,

                        // =======================
                        // CREATED USER INFO (FIXED)
                        // =======================
                        createdByUser: {
                            name: createdUser?.name || null,
                            image:
                                createdUser?.userMedias?.[0]?.url || null, // ✅ FIXED
                            craftName: tradesman?.craft || null
                        },

                        company: request.project?.createdBy?.name || null,

                        description: request.description,

                        length: request.length,
                        width: request.width,
                        height: request.height,

                        priority: request.priority,
                        expectedEndDate: request.expectedEndDate,

                        status: request.status,
                        REQID: request.REQID,

                        notes: request.notes,

                        createdAt: request.createdAt,
                        updatedAt: request.updatedAt
                    },

                    // =======================
                    // HISTORY
                    // =======================
                    history: request.updatesRequest.map((item) => ({
                        id: item.id,

                        requestId: item.requestId,
                        projectId: item.projectId,

                        company: request.project?.createdBy?.name || null,

                        createdBy: request.createdById,

                        tradesmanId: tradesman?.id || null,
                        tradesmanName: tradesman?.user?.name || null,

                        craftName: tradesman?.craft || null,

                        createdByUser: {
                            name: createdUser?.name || null,
                            image:
                                createdUser?.userMedias?.[0]?.url || null, // ✅ FIXED
                            craftName: tradesman?.craft || null
                        },

                        length: item.length,
                        width: item.width,
                        height: item.height,

                        priority: item.priority,
                        expectedEndDate: item.expectedEndDate,

                        notes: item.notes,

                        createdAt: item.createdAt
                    }))
                }
            };

        } catch (error: any) {
            console.error("Error in getScaffholdRequestHistory:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                "Failed to fetch scaffold request history",
                500,
                error.message
            );
        }
    }
}






