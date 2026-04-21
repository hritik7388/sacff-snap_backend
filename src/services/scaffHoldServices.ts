// src/services/scaffHoldServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { pushNotificationDelhi, scaffHoldIdGenerator } from "../helpers/utils";

import { v4 as uuidv4 } from "uuid";
import { changePriorityAndTagsDTO, ProjectScaffHoldDTO, RemoveScaffCompetentPersonDTO, scaffCompetentPersonDTO, ScaffCompetentPersonDTO, ScaffHoldDetailsDTO, ScaffHoldDTO } from "../schemas/scaffHoldSchema";


export class ScaffHoldsServices {
    async createScaffHold(userId: number, data: ScaffHoldDTO) {
        try {
            const userData = await prisma.projectManager.findFirst({
                where: {
                    userId: userId,

                    user: { 
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "PROJECT_MANAGER"
                    },

                    company: {
                        isApproved: "APPROVED",
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "COMPANY"
                    }
                },
                include: {
                    user: true,
                    company: true
                }
            });
            if (!userData) throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found");
            const projectData = await prisma.project.findFirst({
                where: {
                    id: data.projectId,
                    isDeleted: false,
                    
                    projectManagers: { some: { id: userId } }
                }
            });
            if (!projectData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.PROJECT.NOT_FOUND,
                    404,
                    "Project not found or you are not assigned as Project Manager"
                );
            }


            if (!data.competentPersonIds || data.competentPersonIds.length < 2) {
                throw new CustomError(
                    "At least 2 competent persons are required",
                    400
                );
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
                        where: {
                            competentPerson: {
                                user: {
                                    isDeleted: false,
                                    status: "ACTIVE",
                                    isVerified: true,
                                    user_type: "COMPETENT_PERSON",
                                }
                            }
                        },
                        include: {
                            competentPerson: {
                                include: {
                                    user: {
                                        include: {
                                            userMedias: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
            console.log("scaffHoldWithCPs===========================>>>>>>>", scaffHoldWithCPs)
            if (!scaffHoldWithCPs) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "ScaffHold not found after creation");
            }

            const formattedCompetentPersons = scaffHoldWithCPs.competentPersons.map(cp => ({
                id: cp.competentPerson.id,
                userId: cp.competentPerson.user.id,
                name: cp.competentPerson.user.name,
                url: cp.competentPerson.user.userMedias[0]?.url || null,
            }));
            console.log("formattedCompetentPersons============================>>>", formattedCompetentPersons)

            const competentPersonUserIds = competentPersonsData.map(cp => cp.userId);
            console.log("competentPersonUserIds======================>>>>>>", competentPersonUserIds)

            const competentPersonDevices = await prisma.device.findMany({
                where: {
                    userId: { in: competentPersonUserIds },
                    deviceToken: { not: null }
                },
                select: { userId: true, deviceToken: true }
            });
            console.log("competentPersonDevices=======================>>>>>>", competentPersonDevices)

            const cpNotificationMessage =
                `You have been assigned to Scaffold ${scaffHold.SCAFFID} under project ${projectData.projectName}.`;

            await prisma.notification.createMany({
                data: competentPersonsData.map(cp => ({
                    uuid: uuidv4(),
                    title: "SCAFFOLD ASSIGNED",
                    message: cpNotificationMessage,
                    type: "SCAFFOLD_ASSIGNED",
                    role: "COMPETENT_PERSON",
                    isRead: false,
                    companyId: scaffHold.companyId ? BigInt(scaffHold.companyId) : null,
                    scaffoldId: BigInt(scaffHold.id),        // FIXED
                    scaffoldRequestId: "", 
                    receiverId: BigInt(cp.userId),
                    senderId: userId.toString(),
                    notificationImage:
                        "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/assigned.png"
                })),
            });
            const device = await prisma.device.findMany({
                where: {
                    userId: { in: competentPersonUserIds },
                    deviceToken: { not: null }
                }
            });
            console.log("device=======================>>>>", device)

            for (const device of competentPersonDevices) {
                if (!device.deviceToken) continue;
                await pushNotificationDelhi(
                    device.deviceToken,
                    "Assigned to Scaffold",
                    cpNotificationMessage
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
                include: {

                    project: true,
                    company: true,
                },
            });

            if (!scaffhold) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    401,
                    "ScaffHold not found"
                );
            }
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
                    projectManagers: true,
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


    async addCompetentPersonToScaffHold(userId: number, data: ScaffCompetentPersonDTO) {
        try {
            const userData=await prisma.projectManager.findFirst({
                where:{
                    userId:userId,
                    user:{
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "PROJECT_MANAGER"
                    },
                    company:{
                        isApproved: "APPROVED",
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "COMPANY"
                    }
                },
            })

                if(!userData) throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND,404,"User not found");
            const scaffData = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffHoldId,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED",],
                    },
                    isDeleted: false,
                      project: {
            isDeleted: false
        }
                }
            });

            if (!scaffData) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 401, "ScaffHold not found");
            }
            const competentPersonsData = await prisma.competentPerson.findMany({
                where: { id: { in: data.competentPersonIds.map(BigInt) } ,
            user:{
                isDeleted: false,
                status: "ACTIVE",
                isVerified: true,
                user_type: "COMPETENT_PERSON"
            }
            },
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
            if (newIdsToAdd.length > 0) {
                const newCPUsers = formattedCompetentPersons.filter(cp =>
                    newIdsToAdd.includes(Number(cp.id))
                );

                const cpNotificationMessage = `You have been assigned to Scaffold ${scaffData.SCAFFID}.`;

                await prisma.notification.createMany({
                    data: newCPUsers.map(cp => ({
                        uuid: uuidv4(),
                        title: "SCAFFOLD ASSIGNED",
                        message: cpNotificationMessage,
                        type: "SCAFFOLD_ASSIGNED",
                        role: "COMPETENT_PERSON",
                        isRead: false,
                        companyId: scaffData.companyId ? BigInt(scaffData.companyId) : null,
                        scaffoldId: BigInt(scaffData.id),
                         scaffoldRequestId: "", 
                        receiverId: BigInt(cp.userId),
                        senderId: userId.toString(),
                        notificationImage:
                            "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/assigned.png",
                    })),
                });
            }
            const devices = await prisma.device.findMany({
                where: {
                    userId: { in: competentPersonsData.map(cp => Number(cp.userId)) },
                    deviceToken: { not: null }
                }
            });
            for (const device of devices) {
                if (!device.deviceToken) continue;
                await pushNotificationDelhi(
                    device.deviceToken,
                    "SCAFFOLD_ASSIGNED",
                    `You have been assigned to Scaffold ${scaffData.SCAFFID}.`
                );
            }
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
                 where: {
                    id: data.scaffHoldId,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED",],
                    },
                    isDeleted: false,
                      project: {
            isDeleted: false
        }
                }
            });

            if (!scaffData || scaffData.status === "DISMANTLED" || scaffData.isDeleted) {
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

            const cpCount = await prisma.competentPersonOnScaffhold.count({
                where: {
                    scaffholdId: data.scaffHoldId,
                },
            });

            if (cpCount <= 2) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.AT_LEAST_TWO_CP,
                    400,
                    "At least two Competent Person must be assigned to this ScaffHold"
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
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED","DISMANTLED"],
                    },
                    isDeleted: false,
                      project: {
            isDeleted: false
        }
                },
                include: {
                    TradesManRequests: {
                        orderBy: {
                            createdAt: "desc",
                        },
                        take: 1,
                        include: {
                            createdBy: {
                                include: {
                                    user: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!scaffData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    401,
                    "ScaffHold not found"
                );
            }

const competentPersons =
    await prisma.competentPersonOnScaffhold.findMany({
        where: {
            scaffholdId: data.id,
            competentPerson: {
                user: {
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                    user_type: "COMPETENT_PERSON"
                }
            }
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

            const formatted = competentPersons.map((cp: any) => ({ id: cp.competentPersonId, name: cp.competentPerson.user?.name, image: cp.competentPerson.user?.userMedias[0]?.url || null, }));
            // 🔥 last request info
            const lastRequest = scaffData.TradesManRequests?.[0] || null;
            const lastRequestedByName =
                lastRequest?.createdBy?.user?.name || null;

            // ❌ remove TradesManRequests from response
            const { TradesManRequests, ...safeScaffData } = scaffData;

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: {
                    scaffData: {
                        ...safeScaffData,
                        lastRequestedByName, // ✅ inside scaffData
                    },
                    formatted,
                },
            };
        } catch (error: any) {
            console.error("❌ Get competent persons error:", error);

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


    async changePriorityAndTags(data: changePriorityAndTagsDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffholdId,  status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED",],
                    },
                    isDeleted: false,
                      project: {
            isDeleted: false
        }
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
            const notificationMessage = `Scaffold ${scaffhold.SCAFFID} has been marked as Tagged – Safe to Use.`;
            await prisma.notification.create({
                data: {
                    uuid: uuidv4(),
                    title: "Scaffold Tagged – Safe to Use",
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
                    "Scaffold Tagged – Safe to Use",
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






