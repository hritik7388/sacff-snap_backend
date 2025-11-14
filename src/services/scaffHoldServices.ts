import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { generateCompanyId, generateToken, pushNotificationDelhi, scaffHoldIdGenerator } from "../helpers/utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { changePriorityAndTagsDTO, ProjectScaffHoldDTO, RemoveScaffCompetentPersonDTO, scaffCompetentPersonDTO, ScaffCompetentPersonDTO, ScaffHoldDetailsDTO, ScaffHoldDTO } from "../schemas/scaffHoldSchema";
import { UserStatus } from "@prisma/client";

export class ScaffHoldsServices {
    async createScaffHold(userId: number, data: ScaffHoldDTO) {
        try {
            const userData = await prisma.projectManager.findFirst({
                where: { userId },
                include: {
                    user: true,
                    company: true
                }
            });
            if (!userData) throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found");

            const projectData = await prisma.project.findFirst({
                where: { id: data.projectId, isDeleted: false },
            });
            if (!projectData) throw new CustomError(RESPONSE_MESSAGES.PROJECT.NOT_FOUND, 404, "Project not found");

            if (data.latitude && data.longitude) {
                const existingScaffHold = await prisma.scaffhold.findFirst({
                    where: { latitude: data.latitude, longitude: data.longitude, status: "ACTIVE" },
                });
                if (existingScaffHold)
                    throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.ALREADY_EXISTS, 409, "ScaffHold with this location already exists");
            }

            const competentPersonsData = await prisma.competentPerson.findMany({
                where: { id: { in: data.competentPersonIds } },
                include: {
                    user: { include: { userMedias: true } },
                },
            });

            if (competentPersonsData.length !== data.competentPersonIds.length) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 400, "Some competent persons not found");
            }
            const scaffHold = await prisma.scaffhold.create({
                data: {
                    uuid: uuidv4(),
                    startDate: data.startDate,
                    endDate: data.endDate,
                    address: data.address,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    priority: data.priority,
                    SCAFFID: scaffHoldIdGenerator(),
                    projectName: projectData.projectName,
                    projectId: data.projectId,
                    companyId: userData.companyId,
                    createdById: userData.userId,
                    descreption: data.descreption || "",
                },
            });

            await prisma.competentPersonOnScaffhold.createMany({
                data: competentPersonsData.map(cp => ({
                    scaffholdId: scaffHold.id,
                    competentPersonId: cp.id,
                })),
            });
            await prisma.project.update({
                where: { id: data.projectId },
                data: { status: "ONGOING" },
            });
            const scaffHoldWithCPs = await prisma.scaffhold.findUnique({
                where: { id: scaffHold.id },
                include: {
                    competentPersons: {
                        include: {
                            competentPerson: {
                                include: {
                                    user: { include: { userMedias: true } },
                                },
                            },
                        },
                    },
                },
            });
            if (!scaffHoldWithCPs) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "ScaffHold not found after creation");
            }

            const formattedCompetentPersons = scaffHoldWithCPs.competentPersons.map(cp => ({
                id: cp.competentPerson.id,
                userId: cp.competentPerson.user.id,
                name: cp.competentPerson.user.name,
                url: cp.competentPerson.user.userMedias[0]?.url || null,
            }));
            const companyId = userData.companyId;
            const notificationMessage =
                `A new scaffold ${scaffHold.SCAFFID} has been created by Project Manager ${userData.user.name}` +
                ` for Project ${projectData.id} | ${projectData.projectName} | ${userData.company?.name}.`;
            const companyUsers = await prisma.projectManager.findMany({
                where: { companyId: projectData.createdById },
                select: { id: true },
            });
            const devices = await prisma.device.findMany({
                where: {
                    userId: { in: companyUsers.map(u => u.id) },
                    deviceToken: { not: null }
                },
                select: { deviceToken: true }
            });


            await prisma.notification.createMany({
                data: {
                    uuid: uuidv4(),
                    title: "New ScaffHold Created",
                    message: notificationMessage,
                    type: "NEW_SCAFFOLD_CREATED",
                    role: "COMPANY",
                    companyId: companyId,
                    isRead: false,
                    receiverId: userData.companyId,
                    senderId: userId.toString(),
                },
            });

            for (const d of devices) {
                if (!d.deviceToken) continue;
                await pushNotificationDelhi(
                    d.deviceToken,
                    "New ScaffHold Created",
                    notificationMessage
                );
            }

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.CREATE_SUCCESS,
                data: {
                    ...scaffHoldWithCPs,
                    competentPersons: formattedCompetentPersons,
                },
            };
        } catch (error: any) {
            console.error("❌ Create scaffhold error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.CREATE_FAILED, 500, "Create scaffhold failed due to server error");
        }
    }

    async getAllScaffHolds(page: number, limit: number) {
        try {
            const skip = (page - 1) * limit;


            const [scaffholds, totalCount] = await Promise.all([
                prisma.scaffhold.findMany({

                    skip,
                    take: limit,
                    where: {
                        isDeleted: false,

                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                }),
                prisma.scaffhold.count({
                    where: {
                        isDeleted: false,
                    },
                }),
            ]);

            const totalPages = Math.ceil(totalCount / limit);

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: scaffholds,
                totalCount,
                totalPages,
                currentPage: page,
            };
        } catch (error: any) {
            console.error("❌ Get all scaffholds error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error

                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async getScaffHoldById(data: ScaffHoldDetailsDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findFirst({
                where: {
                    id: data.id,
                    isDeleted: false,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                    },
                },
                select: {
                    id: true,
                    uuid: true,
                    startDate: true,
                    endDate: true,
                    latitude: true,
                    longitude: true,
                    priority: true,
                    tag: true,
                    SCAFFID: true,
                    address: true,
                    projectName: true,
                    status: true,
                    projectId: true,
                    companyId: true,
                    createdById: true,
                    createdAt: true,
                    updatedAt: true,
                    project: {
                        select: {
                            projectName: true,
                            clientName: true,
                            clientMobile: true,
                        },
                    },
                    company: {
                        select: {
                            CMPId: true,
                            name: true,
                        },
                    },
                },
            });

            if (!scaffhold) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    401,
                    "ScaffHold not found"
                );
            }

            // ✅ Flatten the nested fields
            const formattedResponse = {
                id: scaffhold.id,
                uuid: scaffhold.uuid,
                startDate: scaffhold.startDate,
                endDate: scaffhold.endDate,
                latitude: scaffhold.latitude,
                longitude: scaffhold.longitude,
                priority: scaffhold.priority,
                tag: scaffhold.tag,
                SCAFFID: scaffhold.SCAFFID,
                address: scaffhold.address,
                projectName: scaffhold.projectName,
                status: scaffhold.status,
                projectId: scaffhold.projectId,
                companyId: scaffhold.companyId,
                createdById: scaffhold.createdById,
                createdAt: scaffhold.createdAt,
                updatedAt: scaffhold.updatedAt,
                CMPId: scaffhold.company?.CMPId || null,
                companyName: scaffhold.company?.name || null,
                clientName: scaffhold.project?.clientName || null,
                clientMobile: scaffhold.project?.clientMobile || null,
            };

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_BY_ID_SUCCESS,
                data: formattedResponse,
            };
        } catch (error: any) {
            console.error("❌ Get scaffhold by id error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async getProjectScaffHold(data: ProjectScaffHoldDTO, page: number, limit: number) {
        try {
            const skip = (page - 1) * limit;
            const totalCount = await prisma.scaffhold.count({
                where: {
                    projectId: data.id,
                    isDeleted: false,
                },
            });
            const projectData = await prisma.project.findUnique({
                where: { id: data.id },
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
                    projectManagerId: true,
                    status: true,
                    isDeleted: true,
                    createdAt: true,
                    updatedAt: true,
                    scaffholds: {
                        where: { isDeleted: false },
                        orderBy: { createdAt: "desc" },
                        skip,
                        take: limit, // ✅ Pagination applied here
                    },
                },
            });

            if (!projectData) {
                throw new CustomError(RESPONSE_MESSAGES.PROJECT.NOT_FOUND, 404, "Project not found");
            }

            const totalPages = Math.ceil(totalCount / limit);

            return {
                message: RESPONSE_MESSAGES.PROJECT.FETCH_BY_ID_SUCCESS,
                data: projectData,
                totalCount,
                totalPages,
                currentPage: page,
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


    async scaffHoldCompetentPersons(data: scaffCompetentPersonDTO) {
        try {
            const searchTerm = data?.search?.trim() || "";
            const whereCondition: any = {
                scaffholdId: data.id,
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

            const competentPersons = await prisma.competentPersonOnScaffhold.findMany({

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
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: formatted,
            };
        } catch (error: any) {
            console.error("❌ Get competent persons error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }


    async addCompetentPersonToScaffHold(data: ScaffCompetentPersonDTO) {
        try {
            const scaffData = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffHoldId,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                    },
                    isDeleted: false
                }
            });

            if (!scaffData) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 401, "ScaffHold not found");
            }
            const competentPersonsData = await prisma.competentPerson.findMany({
                where: { id: { in: data.competentPersonIds.map(BigInt) } },
            });

            if (competentPersonsData.length !== data.competentPersonIds.length) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 400, "Some competent persons not found");
            }
            const existingAssociations = await prisma.competentPersonOnScaffhold.findMany({
                where: { scaffholdId: BigInt(data.scaffHoldId) },
                select: { competentPersonId: true },
            });

            const existingCompetentPersonIds = existingAssociations.map(a => Number(a.competentPersonId));

            const newIdsToAdd = data.competentPersonIds.filter(
                id => !existingCompetentPersonIds.includes(Number(id))
            );

            const idsToRemove = existingCompetentPersonIds.filter(
                id => !data.competentPersonIds.includes(Number(id))
            );
            if (newIdsToAdd.length > 0) {
                await prisma.competentPersonOnScaffhold.createMany({
                    data: newIdsToAdd.map(id => ({
                        scaffholdId: BigInt(scaffData.id),
                        competentPersonId: BigInt(id),
                    })),
                    skipDuplicates: true,
                });
            }
            if (idsToRemove.length > 0) {
                await prisma.competentPersonOnScaffhold.deleteMany({
                    where: {
                        scaffholdId: BigInt(scaffData.id),
                        competentPersonId: { in: idsToRemove.map(BigInt) },
                    },
                });
            }
            const updatedScaffHold = await prisma.scaffhold.findUnique({
                where: { id: BigInt(data.scaffHoldId) },
                include: {
                    competentPersons: {
                        include: {
                            competentPerson: {
                                include: {
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            userMedias: { select: { url: true } },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            const formattedCompetentPersons = updatedScaffHold!.competentPersons.map(cp => ({
                id: cp.competentPerson.id,
                userId: cp.competentPerson.user.id,
                name: cp.competentPerson.user.name,
                url: cp.competentPerson.user.userMedias[0]?.url || null,
            }));
            return {
                message: "Competent persons updated successfully",
                data: {
                    ...updatedScaffHold!,
                    competentPersons: formattedCompetentPersons,
                },
            };
        } catch (error: any) {
            console.error("❌ Add competent person error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }


    async removeCompetentPersonFromScaffHold(data: RemoveScaffCompetentPersonDTO) {
        try {
            const scaffData = await prisma.scaffhold.findUnique({
                where: { id: data.scaffHoldId },
                select: { id: true, status: true, isDeleted: true },
            });

            if (!scaffData || scaffData.status !== "ACTIVE" || scaffData.isDeleted) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    401,
                    "ScaffHold not found"
                );
            }
            const competentPersonData = await prisma.competentPerson.findUnique({
                where: { id: data.competentPersonIds },
            });

            if (!competentPersonData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.NOT_FOUND,
                    401,
                    "Competent person not found"
                );
            }
            const mapping = await prisma.competentPersonOnScaffhold.findUnique({
                where: {
                    scaffholdId_competentPersonId: {
                        scaffholdId: data.scaffHoldId,
                        competentPersonId: data.competentPersonIds,
                    },
                },
            });

            if (!mapping) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    400,
                    "This competent person is not associated with the given ScaffHold"
                );
            }
            await prisma.competentPersonOnScaffhold.delete({
                where: {
                    scaffholdId_competentPersonId: {
                        scaffholdId: data.scaffHoldId,
                        competentPersonId: data.competentPersonIds,
                    },
                },
            });

            return {
                message: "Competent person removed successfully",
            };
        } catch (error: any) {
            console.error("❌ Remove competent person error:", error);
            if (error instanceof CustomError) {
                throw error;
            }

            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async scaffAndCompetentPersons(data: ScaffHoldDetailsDTO) {
        try {
            const scaffData = await prisma.scaffhold.findUnique({
                where: {
                    id: data.id,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                    },
                }
            })
            if (!scaffData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    401,
                    "ScaffHold not found"
                );
            }

            const competentPersons = await prisma.competentPersonOnScaffhold.findMany({

                where: {
                    scaffholdId: data.id,
                },
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
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: { scaffData, formatted, }
            };
        } catch (error: any) {
            console.error("❌ Get competent persons error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async changePriorityAndTags(data: changePriorityAndTagsDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffholdId, status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"],
                    },
                }
            });

            if (!scaffhold) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    404,
                    "ScaffHold not found"
                );
            }
            const updatedScaffhold = await prisma.scaffhold.update({
                where: { id: data.scaffholdId },
                data: {
                    priority: data.priority,
                    tag: data.tag
                },
            });

            const userData = await prisma.projectManager.findUnique({

                where: { userId: scaffhold?.createdById ?? undefined }

            })
            const notificationMessage = `ScaffHold ${scaffhold.SCAFFID} has been marked as Tagged – Safe to Use.`;
            await prisma.notification.create({
                data: {
                    uuid: uuidv4(),
                    title: "ScaffHold Tagged – Safe to Use",
                    message: notificationMessage,
                    type: "SCAFFOLD_STATUS_UPDATE",
                    role: "COMPANY",
                    companyId: scaffhold.companyId,
                    receiverId: scaffhold.companyId,
                    senderId: scaffhold?.createdById?.toString() ?? null,
                    isRead: false,
                },
            });
            const companyUsers = await prisma.projectManager.findMany({
                where: { companyId: scaffhold.companyId },
                select: { id: true },
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
                    "ScaffHold Tagged – Safe to Use",
                    notificationMessage
                );
            }
            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.UPDATE_SUCCESS,
                data: updatedScaffhold
            };

        } catch (error: any) {
            console.error("❌ Change priority and tags error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.UPDATE_FAILED,
                    500,
                    error.message
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
                        scaffoldId: n.scaffoldId,
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

}






