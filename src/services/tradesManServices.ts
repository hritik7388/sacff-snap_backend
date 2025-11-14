import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { generateToken, reqscaffHoldIdGenerator } from "../helpers/utils";
import { RegisterTradesManDTO, LoginTradesManDTO, TradesManCraftDTO, UpadateProfileDTO, joinCraftTradesManDTO, GetTradesManDetailsDTO, seacrchJobDTO, requestScaffOldDTO, updateScaffOldSRequestchemaDTO, jobApplicationDTO, SearchScaffHoldDTO, scaffHoldIdDTO, requestSacffHoldDTO, ScaffHoldDetailsDTO, getparentSacffHoldDTO, SearchFilterDTO, } from "../schemas/tradesManSchema";
import { MediaType } from "@prisma/client";
import { create } from "domain";


export class tradesManServices {


    async dashboard(userId: number) {
        try {
            const tradesman = await prisma.tradesMan.findUnique({
                where: { userId },
            });

            if (!tradesman) {
                throw new CustomError(RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND, 404, "Tradesman not found");
            }
            const [joinedScaffCount, requestCount] = await Promise.all([
                prisma.tradesManOnScaffhold.count({
                    where: { tradesManId: tradesman.id },
                }),
                prisma.scaffholdRequest.count({
                    where: { createdById: tradesman.id },
                }),
            ]);
            return {
                message: RESPONSE_MESSAGES.TRADESMAN.DASHBOARD_SUCCESS,
                data: {
                    tradesmanId: tradesman.id,
                    totalJoinedScaffholds: joinedScaffCount,
                    totalRequestsMade: requestCount,
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
                    RESPONSE_MESSAGES.TRADESMAN.DASHBOARD_FAILED,
                    500,
                    error.message
                );
        }
    }


    async registerTradesManServices(data: RegisterTradesManDTO) {
        try {
            const existingTradesMan = await prisma.user.findUnique({
                where: { email: data.email, isDeleted: false, status: "ACTIVE" }
            })
            if (existingTradesMan) {
                throw new CustomError(RESPONSE_MESSAGES.TRADESMAN.ALREADY_EXISTS, 500, "TradesMan with this email already exists");
            }
            const hashedPassword = await bcrypt.hash(data.password, 10);
            const createtradesMan = await prisma.user.create({
                data: {
                    uuid: uuidv4(),
                    name: data.name,
                    email: data.email,
                    mobileNumber: data.mobileNumber,
                    countryCode: data.countryCode,
                    password: hashedPassword,
                    user_type: "TRADESMAN",
                    status: "ACTIVE",
                    isDeleted: false,
                },
            });
            const craftData = await prisma.craft.findFirst({
                where: {
                    name: data.craft
                }
            })
            const tradeData = await prisma.tradesMan.create({
                data: {
                    uuid: createtradesMan.uuid,
                    userId: createtradesMan.id,
                    craftId: craftData ? craftData.id : null,
                    craft: data.craft,
                    experience: data.experience,
                    address: data.address,
                    longitude: data.longitude,
                    latitude: data.latitude,
                }
            });
            if (data.idProofImage) {
                await prisma.userMedia.create({
                    data: {
                        userId: createtradesMan.id,
                        mediaType: "ID_PROOF_IMAGE",
                        url: data.idProofImage,
                    },
                });
            }
            const tradesManData = {
                name: createtradesMan.name,
                email: createtradesMan.email,
                mobileNumber: createtradesMan.mobileNumber,
                craft: tradeData.craft,
                experience: tradeData.experience,
                user_type: createtradesMan.user_type,
                status: createtradesMan.status,
                isDeleted: createtradesMan.isDeleted,
                address: tradeData.address,
                countryCode: createtradesMan.countryCode,
                idProofImage: data.idProofImage,
                longitude: tradeData.longitude,
                latitude: tradeData.latitude,

            }

            return {
                message: RESPONSE_MESSAGES.TRADESMAN.REGISTER_SUCCESS,
                data: tradesManData
            };
        } catch (error: any) {
            console.error("❌ Register error:", error);


            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError ? error : new CustomError(RESPONSE_MESSAGES.TRADESMAN.REGISTER_FAILED, 500, error.message);
        }
    }

    async tradesmanloginServices(data: LoginTradesManDTO) {
        try {

            const tradesManData = await prisma.user.findUnique({
                where: { email: data.email, isDeleted: false, status: "ACTIVE" },
            });

            if (!tradesManData) {
                throw new CustomError(RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND, 500, "The provided email does not match any tradesman");
            }
            if (data.user_type !== tradesManData.user_type) {
                throw new CustomError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 500, "Unauthorized");
            }

            const isPasswordValid = tradesManData.password && (await bcrypt.compare(data.password, tradesManData.password));
            if (!isPasswordValid) {
                throw new CustomError(RESPONSE_MESSAGES.TRADESMAN.INVALID_PASSWORD, 500, "Invalid password");
            }

            if (tradesManData.user_type !== "TRADESMAN") {
                throw new CustomError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 500, "Unauthorized");
            }

            const jwtPayload = {
                login_id: tradesManData.email,
                id: tradesManData.id.toString(),
                uuid: tradesManData.uuid,
                user_type: tradesManData.user_type,
                userId: tradesManData.id,
            };

            const token = generateToken(jwtPayload);

            const user = {
                id: tradesManData.id,
                uuid: tradesManData.uuid,
                name: tradesManData.name,
                email: tradesManData.email,
                user_type: tradesManData.user_type,
                userId: tradesManData.id,
            };
            await prisma.user.update({
                where: { id: tradesManData.id },
                data: { lastLogin: new Date() },
            });

            return {
                message: RESPONSE_MESSAGES.TRADESMAN.LOGIN_SUCCESS,
                token,
                data: user,
            };


        } catch (error: any) {
            console.error("❌ Register error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError ? error : new CustomError(RESPONSE_MESSAGES.TRADESMAN.LOGIN_FAILED, 500, error.message);
        }
    }

    async getTradesManDetails(id: number) {
        console.log("id========================>>>>>", id)
        try {
            const user = await prisma.user.findUnique({
                where: { id: id },
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
                    tradesman: {
                        select: {
                            address: true,
                            craftId: true,
                            craft: true,
                            experience: true,
                            latitude: true,
                            longitude: true,
                            scaffholds: {
                                select: {
                                    scaffholdId: true,
                                    scaffhold: {
                                        select: {
                                            SCAFFID: true,
                                        },
                                    },
                                },
                                take: 1,
                            },
                        },
                    },
                },
            });

            if (!user) {
                throw new CustomError("USER_NOT_FOUND", 404, "User not found");
            }

            // Ensure user is a tradesman
            if (user.user_type !== "TRADESMAN") {
                throw new CustomError("INVALID_ROLE", 400, "User is not a tradesman");
            }
            const idProofImage =
                user.userMedias.find(media => media.mediaType === "ID_PROOF_IMAGE")?.url || null;
            const photoImage =
                user.userMedias.find(media => media.mediaType === "PHOTO_IMAGE")?.url || null;
            const tradesman = user.tradesman;
            const scaff = tradesman?.scaffholds?.[0];

            return {
                message: "Tradesman details fetched successfully",
                data: {
                    id: user.id,
                    uuid: user.uuid,
                    name: user.name,
                    email: user.email,
                    mobileNumber: user.mobileNumber,
                    countryCode: user.countryCode,
                    user_type: user.user_type,
                    status: user.status,
                    isVerified: user.isVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    lastLogin: user.lastLogin,
                    address: tradesman?.address || null,
                    craftId: tradesman?.craftId || null,
                    craft: tradesman?.craft || null,
                    experience: tradesman?.experience || null,
                    latitude: tradesman?.latitude || null,
                    longitude: tradesman?.longitude || null,
                    scaffholdId: scaff?.scaffholdId || null,
                    SCAFFId: scaff?.scaffhold?.SCAFFID || null,
                    idProofImage,
                    photoImage,
                },
            };
        } catch (error: any) {
            console.error("❌ Get tradesman details error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError("FETCH_FAILED", 500, error.message);
        }
    }

    async getCraftListServices() {
        try {
            const craftData = await prisma.craft.findMany({
                select: {
                    id: true,
                    name: true,
                    craftImage: true,
                },
            });

            return {
                message: RESPONSE_MESSAGES.TRADESMAN.FETCH_ALL_SUCCESS,
                data: craftData,
            };
        } catch (error: any) {
            console.error("❌ Fetch error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.TRADESMAN.FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async getTradesManCraftListServices(data: TradesManCraftDTO, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const searchTerm = data?.search?.trim() || "";
            const craftData = await prisma.craft.findFirst({
                where: { name: data.name },
                select: {
                    id: true,
                    name: true,
                    craftImage: true,
                },
            });

            if (!craftData) {
                throw new CustomError(RESPONSE_MESSAGES.CRAFT.NOT_FOUND, 401, "Craft not found");
            }

            const assigned = await prisma.tradesManOnScaffhold.findMany({
                where: { scaffholdId: data.scaffHoldId },
                select: { tradesManId: true }
            });
            const assignedTradesmanIds = assigned.map(a => a.tradesManId);
            if (assignedTradesmanIds.length === 0) {
                return {
                    message: RESPONSE_MESSAGES.CRAFT.TRADESMAN_CRAFT_NOT_FOUND,
                    craft: craftData,
                    data: [],
                    pagination: { total: 0, page, limit, totalPages: 0 },
                };
            }

            const whereCondition: any = {
                craft: craftData.name,
                id: { in: assignedTradesmanIds }
            };

            if (searchTerm !== "") {
                whereCondition.user = {
                    name: {
                        contains: searchTerm,

                    },
                };
            }
            const [tradeManData, totalCount] = await Promise.all([
                prisma.tradesMan.findMany({
                    where: whereCondition,
                    select: {
                        id: true,
                        uuid: true,
                        userId: true,
                        address: true,
                        experience: true,
                        latitude: true,
                        longitude: true,
                        craft: true,
                        user: {
                            select: {
                                uuid: true,
                                name: true,
                                email: true,
                                mobileNumber: true,
                                countryCode: true,
                                user_type: true,
                                userMedias: {
                                    select: { id: true, url: true, mediaType: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { id: "desc" },
                }),

                prisma.tradesMan.count({ where: whereCondition }),
            ]);

            if (tradeManData.length === 0) {
                return {
                    message: RESPONSE_MESSAGES.CRAFT.TRADESMAN_CRAFT_FETCH_SUCCESS,
                    craft: craftData,
                    data: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                    },
                };
            }
            const formattedTradesmen = tradeManData.map((tm) => ({
                id: tm.id,
                uuid: tm.uuid,
                userId: tm.userId,
                craft: tm.craft,
                address: tm.address,
                experience: tm.experience,
                latitude: tm.latitude,
                longitude: tm.longitude,
                name: tm.user?.name || null,
                email: tm.user?.email || null,
                mobileNumber: tm.user?.mobileNumber || null,
                countryCode: tm.user?.countryCode || null,
                user_type: tm.user?.user_type || null,
                image: tm.user?.userMedias?.length > 0 ? tm.user.userMedias[0].url : null,
            }));

            return {
                message: RESPONSE_MESSAGES.CRAFT.TRADESMAN_CRAFT_FETCH_SUCCESS,
                craft: craftData,
                data: formattedTradesmen,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❌ Fetch error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.CRAFT.TRADESMAN_CRAFT_FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async updateTradesManProfile(data: UpadateProfileDTO) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: data.id },
            });

            if (!user) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.NOT_FOUND,
                    404,
                    "User not found"
                );
            }
            const updatedUser = await prisma.user.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    mobileNumber: data.mobileNumber,
                    countryCode: data.countryCode,
                },
            });
            const existingTrade = await prisma.tradesMan.findUnique({
                where: { userId: data.id },
            });

            if (!existingTrade) {
                throw new CustomError(
                    RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND,
                    404,
                    "TradesMan profile not found"
                );
            }
            const craftData = await prisma.craft.findFirst({
                where: {
                    name: data.craft
                }
            })
            const updatedTrade = await prisma.tradesMan.update({
                where: { userId: data.id },
                data: {
                    craft: data.craft ?? existingTrade.craft,
                    craftId: craftData ? craftData.id : null,
                    experience: data.experience ?? existingTrade.experience,
                    address: data.address ?? existingTrade.address,
                    longitude: data.longitude ?? existingTrade.longitude,
                    latitude: data.latitude ?? existingTrade.latitude,
                },
            });

            if (data.photoImage) {
                const existingMedia = await prisma.userMedia.findFirst({
                    where: {
                        userId: updatedUser.id,
                        mediaType: "PHOTO_IMAGE",
                    },
                });

                if (existingMedia) {
                    await prisma.userMedia.update({
                        where: { id: existingMedia.id },
                        data: { url: data.photoImage },
                    });
                } else {
                    await prisma.userMedia.create({
                        data: {
                            userId: updatedUser.id,
                            mediaType: "PHOTO_IMAGE",
                            url: data.photoImage,
                        },
                    });
                }
            }

            // Prepare response
            const responseData = {
                id: updatedUser.id,
                uuid: updatedUser.uuid,
                name: updatedUser.name,
                email: user.email,
                mobileNumber: updatedUser.mobileNumber,
                craftId: updatedTrade.craftId,
                craft: updatedTrade.craft,
                experience: updatedTrade.experience,
                user_type: updatedUser.user_type,
                status: updatedUser.status,
                isDeleted: updatedUser.isDeleted,
                address: updatedTrade.address,
                countryCode: updatedUser.countryCode,
                longitude: updatedTrade.longitude,
                latitude: updatedTrade.latitude,
                photoImage: data.photoImage || null,
            };

            return {
                message: RESPONSE_MESSAGES.USER.PROFILE_UPDATED,
                data: responseData,
            };
        } catch (error: any) {
            console.error("❌ Update profile error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.TRADESMAN.UPDATE_FAILED,
                    500,
                    error.message
                );
        }
    }



    async searchJob(data: seacrchJobDTO) {
        try {
            const scaffhold = await prisma.scaffhold.findFirst({
                where: {
                    SCAFFID: data.SCAFFID,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                    },
                    isDeleted: false,
                    company: {
                        CMPId: data.CMPID,
                    },
                },
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
                    RESPONSE_MESSAGES.JOB.NOT_FOUND,
                    404,
                    "No job found for given CMPId and SCAFFID"
                );
            }

            // 🔹 Flatten jobCrafts like your getJobAndCraftDetails
            const formattedJobCrafts = scaffhold.jobCrafts.map((jc) => ({
                id: jc.id,
                craftId: jc.craftId,
                counts: jc.counts,
                name: jc.craft?.name || null,
                craftImage: jc.craft?.craftImage || null,
                createdAt: jc.craft?.createdAt || jc.createdAt,
                updatedAt: jc.craft?.updatedAt || jc.updatedAt,
            }));

            const { jobCrafts, company, project, ...rest } = scaffhold;

            const responseData = {
                ...rest,
                CMPId: company?.CMPId || null,
                companyName: company?.name || null,
                clientName: project?.clientName || null,
                clientMobile: project?.clientMobile || null,
                jobCrafts: formattedJobCrafts,
            };

            return {
                message: RESPONSE_MESSAGES.JOB.FETCH_SUCCESS,
                data: responseData,
            };
        } catch (error: any) {
            console.error("❗ Error in searchJob:", error);
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

    async requestScaffHoldServices(userId: number, data: requestScaffOldDTO) {
        try {
            const tradesManData = await prisma.user.findUnique({
                where: {
                    id: userId,
                    status: "ACTIVE",
                    isDeleted: false,
                    user_type: "TRADESMAN",
                }
            })
            if (!tradesManData) {
                throw new CustomError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401, "Unauthorized");
            }
            const scaffholdData = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffHoldId,
                    isDeleted: false,
                    status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                    },
                }
            })
            if (!scaffholdData) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
            }
            const existingTradesman = await prisma.tradesMan.findUnique({
                where: {
                    userId: tradesManData.id
                }
            })
            if (!existingTradesman) {
                throw new CustomError(RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND, 404, "Tradesman profile not found");
            }
            const REQID = reqscaffHoldIdGenerator();
            const newRequest = await prisma.scaffholdRequest.create({
                data: {
                    uuid: uuidv4(),
                    scaffholdId: scaffholdData.id,
                    craft: existingTradesman.craft,
                    length: data.length,
                    width: data.width,
                    height: data.height,
                    priority: data.priority,
                    REQID: REQID,
                    expectedEndDate: data.expectedEndDate,
                    notes: data.notes,
                    createdById: existingTradesman.id,
                    status: "PENDING",
                }
            })
            const requestData = {
                id: newRequest.id,
                uuid: newRequest.uuid,
                scaffholdId: newRequest.scaffholdId,
                SCAFFID: scaffholdData.SCAFFID,
                projectName: scaffholdData.projectName,
                craft: existingTradesman.craft,
                address: scaffholdData.address,
                longitude: scaffholdData.longitude,
                latitude: scaffholdData.latitude,
                length: newRequest.length,
                width: newRequest.width,
                height: newRequest.height,
                priority: newRequest.priority,
                REQID: newRequest.REQID,
                expectedEndDate: newRequest.expectedEndDate,
                notes: newRequest.notes,
                status: newRequest.status,
                createdAt: newRequest.createdAt,
                updatedAt: newRequest.updatedAt,
            }
            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_SUCCESS,
                data: requestData
            }

        } catch (error: any) {
            console.error("❗ Error in requestScaffOld:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_FAILED,
                    500,
                    error.message
                );
        }

    }

    async updateScaffHoldRequest(userId: any, data: updateScaffOldSRequestchemaDTO) {
        try {
            const tradesManData = await prisma.tradesMan.findUnique({
                where: {
                    userId: userId,
                },

            });
            if (!tradesManData) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "USER not found");
            }
            const request = await prisma.scaffholdRequest.findUnique({
                where: {
                    id: data.requestId,

                },
            });
            if (!request) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Request not found");
            }
            if (request.createdById !== tradesManData.id) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLDREQUEST.INVALID_STATUS,
                    403,
                    "You are not authorized to update this request"
                );
            }
            const updatedRequest = await prisma.scaffholdRequest.update({
                where: {
                    id: request.id
                },
                data: {
                    uuid: uuidv4(),
                    scaffholdId: request.scaffholdId,
                    craft: request.craft,
                    REQID: request.REQID,
                    createdById: request.createdById,
                    status: request.status,
                    length: data.length,
                    width: data.width,
                    height: data.height,
                    priority: data.priority,
                    expectedEndDate: data.expectedEndDate,
                    notes: data.notes,
                    parentId: request.id,
                },
            });
            const scaffHoldUpdate = await prisma.scaffhold.update({
                where: { id: request.scaffholdId },
                data: {
                    priority: data.priority
                }
            })
            const historyEntry = await prisma.updateScaffHoldRequest.create({
                data: {
                    requestId: updatedRequest.id,
                    scaffholdId: updatedRequest.scaffholdId,
                    length: updatedRequest.length,
                    width: updatedRequest.width,
                    height: updatedRequest.height,
                    priority: updatedRequest.priority,
                    expectedEndDate: updatedRequest.expectedEndDate,
                    notes: updatedRequest.notes,
                },
            });
            const scaffholdData = await prisma.scaffhold.findUnique({
                where: { id: updatedRequest.scaffholdId },
            });
            const responseData = {
                id: updatedRequest.id,
                uuid: updatedRequest.uuid,
                scaffholdId: updatedRequest.scaffholdId,
                SCAFFID: scaffholdData?.SCAFFID || null,
                projectName: scaffholdData?.projectName || null,
                REQID: updatedRequest.REQID,
                craft: request.craft,
                address: scaffholdData?.address || null,
                longitude: scaffholdData?.longitude || null,
                latitude: scaffholdData?.latitude || null,
                length: updatedRequest.length,
                width: updatedRequest.width,
                height: updatedRequest.height,
                priority: updatedRequest.priority,
                expectedEndDate: updatedRequest.expectedEndDate,
                notes: updatedRequest.notes,
                status: updatedRequest.status,
                createdAt: updatedRequest.createdAt,
                updatedAt: updatedRequest.updatedAt,
                parentId: updatedRequest.parentId,
            };

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_SUCCESS,
                data: responseData
            };

        } catch (error: any) {
            console.error("❗ Error in updateScaffHoldRequest:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_FAILED, 500, error.message);
        }
    }

    async getTrademanRequestListServices(data: SearchScaffHoldDTO, page: number = 1, limit: number = 10) {
        console.log("📩 Incoming pagination:", { page, limit });
        try {
            const skip = (page - 1) * limit;
            const whereCondition: any = {};

            const searchTerm = data?.search?.trim();

            if (searchTerm && searchTerm !== "") {
                const term = searchTerm;

                if (!isNaN(Number(term))) {
                    whereCondition.id = Number(term);
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
                    totalPages
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


    async joinProjectServices(tradesManId: number, data: jobApplicationDTO) {
        try {
            // 1️⃣ Fetch tradesman linked to user
            const tradesManData = await prisma.user.findUnique({
                where: { id: tradesManId },
                include: { tradesman: true },
            });

            if (
                !tradesManData ||
                tradesManData.status !== "ACTIVE" ||
                tradesManData.isDeleted ||
                tradesManData.user_type !== "TRADESMAN" ||
                !tradesManData.tradesman
            ) {
                throw new CustomError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401, "Unauthorized");
            }

            const tradesmanCraft = tradesManData.tradesman.craft;
            if (!tradesmanCraft) {
                throw new CustomError(RESPONSE_MESSAGES.JOB.APPLICATION_FAILED, 400, "Tradesman craft not specified");
            }

            // 2️⃣ Fetch scaffhold with job crafts
            const scaffholdData = await prisma.scaffhold.findUnique({
                where: {
                    id: data.scaffHoldId, status: {
                        in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                    },
                },
                include: { jobCrafts: { include: { craft: true } } },
            });

            if (!scaffholdData || scaffholdData.isDeleted) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
            }

            // 3️⃣ Check craft match
            const craftMatch = scaffholdData.jobCrafts.find(
                (jc) => jc.craft?.name?.toLowerCase() === tradesmanCraft.toLowerCase()
            );

            if (!craftMatch) {
                throw new CustomError(RESPONSE_MESSAGES.JOB.CRAFT_MISMATCH, 400, "Ye job aapke liye nahi hai");
            }

            // 4️⃣ Check vacancy
            if (craftMatch.joinedCount >= craftMatch.counts) {
                throw new CustomError(RESPONSE_MESSAGES.JOB.VACANCY_FULL, 400, "Vacancy full for this craft");
            }

            // 5️⃣ Check if tradesman already joined
            const alreadyJoined = await prisma.tradesManOnScaffhold.findUnique({
                where: {
                    scaffholdId_tradesManId: {
                        scaffholdId: data.scaffHoldId,
                        tradesManId: tradesManData.tradesman.id,
                    },
                },
            });

            if (alreadyJoined) {
                throw new CustomError(RESPONSE_MESSAGES.JOB.ALREADY_JOINED, 400, "Already joined this job");
            }

            // 6️⃣ Atomic transaction: join + jobCraftTradesman + decrement counts
            await prisma.$transaction([
                // (A) Add tradesman to scaffhold
                prisma.tradesManOnScaffhold.create({
                    data: {
                        scaffholdId: data.scaffHoldId,
                        tradesManId: tradesManData.tradesman.id,
                    },
                }),
                // (B) Add tradesman to job craft
                prisma.jobCraftTradesman.create({
                    data: {
                        jobCraftId: craftMatch.id,
                        tradesmanId: tradesManData.tradesman.id,
                    },
                }),
                // (C) Decrement craft counts
                prisma.jobCraft.update({
                    where: { id: craftMatch.id },
                    data: { joinedCount: { increment: 1 } },
                }),
            ]);

            return {
                message: RESPONSE_MESSAGES.JOB.JOIN_SUCCESS,
            };

        } catch (error: any) {
            console.error("❗ Error in joinProjectServices:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.JOB.APPLICATION_FAILED, 500, error.message);
        }
    }

    async getJoinedScaffholds(userId: number, page: number = 1, limit: number = 10) {


        try {
            // 1️⃣ Find tradesman by userId
            const tradesManData = await prisma.tradesMan.findUnique({
                where: { userId },
            });

            if (!tradesManData) {
                throw new CustomError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401, "Tradesman not found");
            }

            console.log("Tradesman found with ID:", tradesManData.id);

            // 2️⃣ Calculate pagination values
            const skip = (page - 1) * limit;

            // 3️⃣ Fetch total count for pagination
            const totalCount = await prisma.scaffhold.count({
                where: {
                    tradesMen: {
                        some: { tradesManId: tradesManData.id },
                    },
                },
            });

            // 4️⃣ Fetch paginated scaffholds
            const joinedScaffholds = await prisma.scaffhold.findMany({
                where: {
                    tradesMen: {
                        some: { tradesManId: tradesManData.id },
                    },
                },
                include: {
                    project: true,
                    company: true,
                    jobCrafts: { include: { craft: true } },
                },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" }, // 🕒 latest first
            });

            console.log("Joined scaffholds count:", joinedScaffholds.length);

            // 5️⃣ Format response
            const responseData = joinedScaffholds.map((s) => ({
                scaffholdId: s.id,
                uuid: s.uuid,
                startDate: s.startDate,
                latitude: s.latitude,
                longitude: s.longitude,
                endDate: s.endDate,
                address: s.address,
                priority: s.priority,
                SCAFFID: s.SCAFFID,
                tag: s.tag,
                descreption: s.descreption,
                status: s.status,
                projectId: s.projectId,
                createdAt: s.createdAt,
                updatedAt: s.updatedAt,
                projectName: s.project?.projectName || null,
                companyId: s.companyId,
                companyName: s.company?.name || null,
                jobCrafts: s.jobCrafts.map((jc) => ({
                    id: jc.id,
                    craftId: jc.craftId,
                    name: jc.craft?.name,
                    counts: jc.counts,
                })),
            }));

            // 6️⃣ Pagination meta info
            const totalPages = Math.ceil(totalCount / limit);

            return {
                message: RESPONSE_MESSAGES.JOB.FETCH_SUCCESS,
                data: responseData,
                pagination: {
                    totalRecords: totalCount,
                    totalPages,
                    currentPage: page,
                    pageSize: limit,
                },
            };

        } catch (error: any) {
            console.error("❗ Error in getJoinedScaffholds:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.JOB.FETCH_FAILED, 500, error.message);
        }
    }

    async filterScaffHolds(data: SearchScaffHoldDTO, page: number, limit: number) {
        try {
            const skip = (page - 1) * limit;

            const whereCondition: any = {
                isDeleted: false,
            };

            const searchTerm = data?.search?.trim();
            if (searchTerm && searchTerm !== "") {
                const term = searchTerm;

                if (!isNaN(Number(term))) {
                    whereCondition.id = Number(term);
                } else {
                    whereCondition.OR = [
                        { SCAFFID: { contains: term, } },
                        { address: { contains: term, } },
                    ];
                }
            }
            const [scaffholds, totalCount] = await Promise.all([
                prisma.scaffhold.findMany({
                    where: whereCondition,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        company: { select: { CMPId: true, name: true } },
                        project: { select: { clientName: true, clientMobile: true } },
                        jobCrafts: { include: { craft: true } },
                    },
                }),
                prisma.scaffhold.count({ where: whereCondition }),
            ]);
            const formattedScaffholds = scaffholds.map((sc) => ({
                id: sc.id,
                uuid: sc.uuid,
                startDate: sc.startDate,
                endDate: sc.endDate,
                address: sc.address,
                latitude: sc.latitude,
                longitude: sc.longitude,
                priority: sc.priority,
                tag: sc.tag,
                descreption: sc.descreption,
                SCAFFID: sc.SCAFFID,
                status: sc.status,
                isDeleted: sc.isDeleted,
                isJobLinkCreated: sc.isJobLinkCreated,
                projectId: sc.projectId,
                projectName: sc.projectName,
                companyId: sc.companyId,
                createdById: sc.createdById,
                createdAt: sc.createdAt,
                updatedAt: sc.updatedAt,
                CMPId: sc.company?.CMPId || null,
                companyName: sc.company?.name || null,
                clientName: sc.project?.clientName || null,
                clientMobile: sc.project?.clientMobile || null,
                jobCrafts: sc.jobCrafts.map((jc) => ({
                    id: jc.id,
                    craftId: jc.craftId,
                    counts: jc.counts,
                    name: jc.craft?.name || null,
                    craftImage: jc.craft?.craftImage || null,
                    createdAt: jc.createdAt,
                    updatedAt: jc.updatedAt,
                })),
            }));


            const totalPages = Math.ceil(totalCount / limit);

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: formattedScaffholds,
                pagination: {
                    total: totalCount,
                    totalPages,
                    currentPage: page,
                    limit,
                },
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

    async deleteScaffHoldRequest(requestId: scaffHoldIdDTO) {

        try {
            const existingRequest = await prisma.scaffholdRequest.findUnique({
                where: {
                    id: requestId.scaffHoldId,
                }
            });
            if (!existingRequest) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Scaffhold request not found");
            }
            if (existingRequest.status !== "PENDING") {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.REVOKE_NOT_ALLOWED, 400, "Only pending requests can be revoked");
            }

            await prisma.updateScaffHoldRequest.deleteMany({
                where: {
                    requestId: requestId.scaffHoldId,
                },
            });
            await prisma.scaffholdRequest.delete({
                where: {
                    id: requestId.scaffHoldId,
                }
            });


            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.REVOKE_SUCCESS,
            };

        } catch (error: any) {
            console.error("❗ Error in deleteScaffHoldRequest:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.DELETE_FAILED, 500, error.message);
        }

    }


    async getRequestScaffHoldById(requestId: requestSacffHoldDTO) {
        try {


            const request = await prisma.scaffholdRequest.findUnique({
                where: { id: requestId.scaffHoldId },
                include: {
                    scaffhold: {
                        include: {
                            project: true,
                            company: true,
                        },
                    },
                    createdBy: {  // ✅ include createdBy (TradesMan)
                        include: {
                            user: {  // ✅ include user to get name + profile
                                select: {
                                    name: true,
                                    userMedias: { take: 1, select: { url: true } },
                                },
                            },
                        },
                    },
                },
            });
            if (!request) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Scaffhold request not found");
            }


            const scaffholdData = request.scaffhold;
            const responseData = {
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
                createdById: request.createdBy?.id || null,
                createdByName: request.createdBy?.user?.name || null,
                createdByImage: request.createdBy?.user?.userMedias?.[0]?.url || null,
            };

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_DETAILS_FETCH_SUCCESS,
                data: responseData,
            };
        } catch (error: any) {
            console.error("❌ Error in getDetailsOfRequestScaffHoldById:", error);

            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_DETAILS_FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }


    async getModifiedRequestsByParentId(data: getparentSacffHoldDTO) {
        try {
            const mainRequest = await prisma.scaffholdRequest.findUnique({
                where: {
                    id: BigInt(data.parentId),
                },
                include: {
                    scaffhold: {
                        include: {
                            project: true,
                            company: true,
                        },
                    }, createdBy: {
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
            });

            if (!mainRequest) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND,
                    404,
                    "Scaffhold request not found"
                );
            }

            // Fetch updates
            const updates = await prisma.updateScaffHoldRequest.findMany({
                where: { requestId: mainRequest.id },
                orderBy: { createdAt: 'asc' },
            });

            const mappedUpdates = updates.map((u) => ({
                length: u.length,
                width: u.width,
                height: u.height,
                priority: u.priority,
                expectedEndDate: u.expectedEndDate,
                notes: u.notes,
                createdAt: u.createdAt,
            }));

            const scaffholdData = mainRequest.scaffhold;

            const responseData = {
                id: mainRequest.id,
                uuid: mainRequest.uuid,
                REQID: mainRequest.REQID,
                status: mainRequest.status,
                craft: mainRequest.craft,
                priority: mainRequest.priority,
                length: mainRequest.length,
                width: mainRequest.width,
                height: mainRequest.height,
                expectedEndDate: mainRequest.expectedEndDate,
                notes: mainRequest.notes,
                createdAt: mainRequest.createdAt,
                updatedAt: mainRequest.updatedAt,
                scaffholdId: scaffholdData?.id,
                SCAFFID: scaffholdData?.SCAFFID,
                projectName: scaffholdData?.projectName,
                address: scaffholdData?.address,
                latitude: scaffholdData?.latitude,
                longitude: scaffholdData?.longitude,
                parentId: mainRequest.parentId,
                createdById: mainRequest.createdBy?.id || null,
                createdByName: mainRequest.createdBy?.user?.name || null,
                createdByImage: mainRequest.createdBy?.user?.userMedias?.[0]?.url || null,
                updates: mappedUpdates,
            };

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_DETAILS_FETCH_SUCCESS,
                data: responseData,
            };
        } catch (error: any) {
            console.error("❌ Error in getModifiedRequestsWithHistory:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_DETAILS_FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }


    async getAllModifiedRequestsByParentId(data: SearchScaffHoldDTO, page: number = 1, limit: number = 10) {


        try {
            const skip = (page - 1) * limit;
            const whereCondition: any = {
                parentId: { not: null },

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
                limit,
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

    async getTradesManScaffHoldDetailsById(id: number, data: ScaffHoldDetailsDTO) {
        try {
            const userData = await prisma.user.findUnique({
                where: {
                    id: id,
                    status: "ACTIVE",
                    isDeleted: false,
                    user_type: "TRADESMAN",
                },
                select: {
                    id: true,
                    tradesman: {
                        select: {
                            craft: true, // ✅ only exists under tradesman relation
                            jobCraftsJoined: {
                                select: {
                                    jobCraft: {
                                        select: {
                                            id: true,
                                            craft: {
                                                select: {
                                                    name: true,
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!userData) {
                throw new CustomError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401, "Unauthorized");
            }

            // ✅ Get Scaffhold details
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
                    tradesMen: {
                        select: {
                            tradesMan: {
                                select: {
                                    id: true,
                                    craft: true,
                                    jobCraftsJoined: {
                                        select: {
                                            jobCraft: {
                                                select: {
                                                    id: true,
                                                    craft: {
                                                        select: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        take: 1,
                    },
                },
            });

            if (!scaffhold) {
                throw new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
            }

            const craftName =
                userData?.tradesman?.jobCraftsJoined?.[0]?.jobCraft?.craft?.name ||
                userData?.tradesman?.craft ||
                null;

            const craftId =
                userData?.tradesman?.jobCraftsJoined?.[0]?.jobCraft?.id || null;
            // ✅ Flatten the response
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
                craftName: craftName,
                craftId: craftId,
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

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async getSearchFilterData(data: SearchFilterDTO, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;


            const scaffholdWhere: any = { isDeleted: false };

            const { priority, tags, status, sort } = data; // ✅ FIXED: use `tags` instead of `tag`


            if (priority) {
                if (Array.isArray(priority)) {
                    scaffholdWhere.priority = { in: priority.map((p) => p.toUpperCase()) };
                } else {
                    scaffholdWhere.priority = priority.toUpperCase();
                }
            }

            if (tags) {
                if (Array.isArray(tags)) {
                    scaffholdWhere.tag = { in: tags.map((t) => t.toUpperCase()) };
                } else {
                    scaffholdWhere.tag = tags.toUpperCase();
                }
            }

            if (status) {
                if (Array.isArray(status)) {
                    scaffholdWhere.status = { in: status.map((s) => s.toUpperCase()) };
                } else {
                    scaffholdWhere.status = status.toUpperCase();
                }
            }


            const totalCount = await prisma.scaffhold.count({
                where: scaffholdWhere,
            });


            const totalPages = Math.ceil(totalCount / limit);


            const scaffholds = await prisma.scaffhold.findMany({
                where: scaffholdWhere,
                orderBy: {
                    createdAt: sort?.toLowerCase() === "asc" ? "asc" : "desc",
                },
                skip,
                take: limit,
                include: {
                    project: { select: { projectName: true, clientName: true } },
                    company: { select: { name: true } },
                },
            });


            const formattedData = scaffholds.map((item) => ({
                uuid: item.uuid,
                projectName: item.project?.projectName || null,
                clientName: item.project?.clientName || null,
                companyName: item.company?.name || null,
                priority: item.priority,
                tag: item.tag,
                status: item.status,
                startDate: item.startDate,
                endDate: item.endDate,
                createdAt: item.createdAt,
            }));

            return {
                success: true,
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: formattedData,
                pagination: {
                    total: totalCount,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            };
        } catch (error: any) {
            console.error("❌ Error in getSearchFilterData:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
        }
    }


    async getFilteredScaffHolds(id: number, data: SearchFilterDTO, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;

            const whereCondition: any = { isDeleted: false };
            const user = await prisma.user.findUnique({
                where: { id: id },
                select: { user_type: true }
            });

            if (!user) {
                throw new CustomError("User not found", 404);
            }

            const userType = user.user_type;
            if (userType === "PROJECT_MANAGER") {
                whereCondition.createdById = id;
            }
            else if (userType === "COMPETENT_PERSON") {
                whereCondition.competentPersons = {
                    some: {
                        competentPerson: {
                            userId: id
                        }
                    }
                };
            } else if (userType === "TRADESMAN") {

            }
            const { search, priority, tags, status, sort } = data || {};
            const searchTerm = search?.trim();

            if (searchTerm && searchTerm !== "") {
                if (!isNaN(Number(searchTerm))) {
                    whereCondition.id = Number(searchTerm);
                } else {
                    whereCondition.OR = [
                        { SCAFFID: { contains: searchTerm } },
                        { address: { contains: searchTerm } },
                    ];
                }
            }

            if (priority) {
                if (Array.isArray(priority)) {
                    whereCondition.priority = { in: priority.map((p) => p.toUpperCase()) };
                } else if (typeof priority === "string") {
                    whereCondition.priority = priority.toUpperCase();
                }
            }

            if (tags) {
                if (Array.isArray(tags)) {
                    whereCondition.tag = { in: tags.map((t) => t.toUpperCase()) };
                } else if (typeof tags === "string") {
                    whereCondition.tag = tags.toUpperCase();
                }
            }

            if (status) {
                if (Array.isArray(status)) {
                    whereCondition.status = { in: status.map((s) => s.toUpperCase()) };
                } else if (typeof status === "string") {
                    whereCondition.status = status.toUpperCase();
                }
            }
            const totalCount = await prisma.scaffhold.count({ where: whereCondition });
            const totalPages = Math.ceil(totalCount / limit);
            const scaffholds = await prisma.scaffhold.findMany({
                where: whereCondition,
                skip,
                take: limit,
                orderBy: { createdAt: sort?.toLowerCase() === "asc" ? "asc" : "desc" },
                include: {
                    company: { select: { CMPId: true, name: true } },
                    project: { select: { clientName: true, clientMobile: true, projectName: true } },
                },
            });
            const formattedData = scaffholds.map((sc) => ({
                id: sc.id,
                uuid: sc.uuid,
                SCAFFID: sc.SCAFFID,
                address: sc.address,
                latitude: sc.latitude,
                longitude: sc.longitude,
                descreption: sc.descreption,
                startDate: sc.startDate,
                endDate: sc.endDate,
                priority: sc.priority,
                tag: sc.tag,
                status: sc.status,
                isDeleted: sc.isDeleted,
                isJobLinkCreated: sc.isJobLinkCreated,
                projectId: sc.projectId,
                projectName: sc.project?.projectName || sc.projectName || null,
                companyId: sc.companyId,
                companyName: sc.company?.name || null,
                CMPId: sc.company?.CMPId || null,
                clientName: sc.project?.clientName || null,
                clientMobile: sc.project?.clientMobile || null,
                createdById: sc.createdById,
                createdAt: sc.createdAt,
                updatedAt: sc.updatedAt,
            }));

            return {
                success: true,
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: formattedData,
                pagination: {
                    total: totalCount,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            };

        } catch (error: any) {
            console.error("❌ Error in getFilteredScaffHolds:", error);
            if (error instanceof CustomError) {
                throw error;
            }

            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
        }
    }


}

