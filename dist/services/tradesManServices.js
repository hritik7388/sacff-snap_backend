"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradesManServices = void 0;
// src/services/tradesManServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
class tradesManServices {
    dashboard(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tradesman = yield prismaClient_1.default.tradesMan.findUnique({
                    where: { userId },
                });
                if (!tradesman) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND, 404, "Tradesman not found");
                }
                const [joinedScaffCount, requestCount] = yield Promise.all([
                    prismaClient_1.default.tradesManOnProject.count({
                        where: { tradesManId: tradesman.id },
                    }),
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: { createdById: tradesman.id },
                    }),
                ]);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.DASHBOARD_SUCCESS,
                    data: {
                        tradesmanId: tradesman.id,
                        totalJoinedScaffholds: joinedScaffCount,
                        totalRequestsMade: requestCount,
                    },
                };
            }
            catch (error) {
                console.error("❗ Error in dashboard:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.DASHBOARD_FAILED, 500, error.message);
            }
        });
    }
    registerTradesManServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTradesMan = yield prismaClient_1.default.user.findFirst({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" }
                });
                if (existingTradesMan) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.ALREADY_EXISTS, 500, "TradesMan with this email already exists");
                }
                const hashedPassword = yield bcryptjs_1.default.hash(data.password, 10);
                const createtradesMan = yield prismaClient_1.default.user.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
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
                const craftData = yield prismaClient_1.default.craft.findFirst({
                    where: {
                        name: data.craft
                    }
                });
                const tradeData = yield prismaClient_1.default.tradesMan.create({
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
                    yield prismaClient_1.default.userMedia.create({
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
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.REGISTER_SUCCESS,
                    data: tradesManData
                };
            }
            catch (error) {
                console.error("❌ Register error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError ? error : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.REGISTER_FAILED, 500, error.message);
            }
        });
    }
    tradesmanloginServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // ✅ STEP 1: USER FIND
                const user = yield prismaClient_1.default.user.findFirst({
                    where: {
                        email: data.email,
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                    },
                    include: {
                        tradesman: true, // 🔥 IMPORTANT
                    },
                });
                if (!user) {
                    throw new customError_1.CustomError("Tradesman not found", 404);
                }
                // ✅ STEP 2: PASSWORD CHECK
                const isPasswordValid = user.password &&
                    (yield bcryptjs_1.default.compare(data.password, user.password));
                if (!isPasswordValid) {
                    throw new customError_1.CustomError("Invalid password", 400);
                }
                // ✅ STEP 3: ROLE CHECK
                if (user.user_type !== "TRADESMAN") {
                    throw new customError_1.CustomError("Unauthorized", 403);
                }
                // ✅ STEP 4: TRADESMAN CHECK
                if (!user.tradesman) {
                    throw new customError_1.CustomError("Tradesman profile not found", 404);
                }
                const tradesman = user.tradesman;
                // ✅ STEP 5: PROJECT FIND
                const project = yield prismaClient_1.default.project.findFirst({
                    where: {
                        PJT: data.PJT,
                        isDeleted: false,
                    },
                });
                if (!project) {
                    throw new customError_1.CustomError("You dont have project to start the project", 404);
                }
                // ✅ STEP 6: EMPLOYER NAME VALIDATION
                if (!data.employerName) {
                    throw new customError_1.CustomError("Employer name is required", 400);
                }
                // ✅ STEP 7: UPSERT CONTEXT (🔥 CORE LOGIC)
                yield prismaClient_1.default.tradesmanProjectContext.upsert({
                    where: {
                        tradesmanId_projectId: {
                            tradesmanId: tradesman.id,
                            projectId: project.id,
                        },
                    },
                    update: {
                        employerName: data.employerName,
                    },
                    create: {
                        tradesmanId: tradesman.id,
                        projectId: project.id,
                        employerName: data.employerName,
                    },
                });
                // ✅ STEP 8: TOKEN
                const jwtPayload = {
                    login_id: user.email,
                    id: user.id.toString(),
                    uuid: user.uuid,
                    user_type: user.user_type,
                    userId: user.id,
                    PJT: data.PJT
                };
                const token = (0, utils_1.generateToken)(jwtPayload);
                // ✅ STEP 9: UPDATE LAST LOGIN
                yield prismaClient_1.default.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                });
                // ✅ STEP 10: RESPONSE
                return {
                    message: "Login successful",
                    token,
                    projectId: project.id,
                    projectCode: project.PJT,
                    employerName: data.employerName, // 🔥 return for frontend
                    user_type: user.user_type,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Login failed", 500, error.message);
            }
        });
    }
    getTradesManDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const user = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: id,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true,
                    },
                    include: {
                        userMedias: true,
                        tradesman: {
                            include: {
                                craftInfo: true, // ✅ correct relation
                                projectContexts: {
                                    include: {
                                        project: {
                                            select: {
                                                id: true,
                                                PJT: true,
                                                projectName: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
                if (!user) {
                    throw new customError_1.CustomError("USER_NOT_FOUND", 404, "User not found");
                }
                if (user.user_type !== "TRADESMAN") {
                    throw new customError_1.CustomError("INVALID_ROLE", 400, "User is not a tradesman");
                }
                const tradesman = user.tradesman;
                if (!tradesman) {
                    throw new customError_1.CustomError("TRADESMAN_NOT_FOUND", 404, "Tradesman profile not found");
                }
                // ✅ Media extraction
                const idProofImage = ((_a = user.userMedias.find(m => m.mediaType === "ID_PROOF_IMAGE")) === null || _a === void 0 ? void 0 : _a.url) || null;
                const photoImage = ((_b = user.userMedias.find(m => m.mediaType === "PHOTO_IMAGE")) === null || _b === void 0 ? void 0 : _b.url) || null;
                // ✅ Project + Employer Mapping
                const projectDetails = tradesman.projectContexts.map(ctx => ({
                    projectId: ctx.project.id,
                    projectCode: ctx.project.PJT,
                    projectName: ctx.project.projectName,
                    employerName: ctx.employerName,
                }));
                return {
                    message: "Tradesman details fetched successfully",
                    data: {
                        // 🔹 USER INFO
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
                        // 🔹 TRADESMAN INFO
                        address: tradesman.address || null,
                        craftId: tradesman.craftId || null,
                        craftName: ((_c = tradesman.craftInfo) === null || _c === void 0 ? void 0 : _c.name) || null,
                        craftImage: ((_d = tradesman.craftInfo) === null || _d === void 0 ? void 0 : _d.craftImage) || null,
                        experience: tradesman.experience || null,
                        latitude: tradesman.latitude || null,
                        longitude: tradesman.longitude || null,
                        // 🔹 MEDIA
                        idProofImage,
                        photoImage,
                        // 🔥 NEW (IMPORTANT)
                        projects: projectDetails, // employer per project
                    },
                };
            }
            catch (error) {
                console.error("❌ Get tradesman details error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("FETCH_FAILED", 500, error.message || "Something went wrong");
            }
        });
    }
    getCraftListServices() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const craftData = yield prismaClient_1.default.craft.findMany({
                    select: {
                        id: true,
                        name: true,
                        craftImage: true,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.FETCH_ALL_SUCCESS,
                    data: craftData,
                };
            }
            catch (error) {
                console.error("❌ Fetch error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getTradesManCraftListServices(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const searchTerm = ((_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                // ✅ STEP 1: GET CRAFT
                const craftData = yield prismaClient_1.default.craft.findFirst({
                    where: { name: data.name },
                    select: {
                        id: true,
                        name: true,
                        craftImage: true,
                    },
                });
                if (!craftData) {
                    throw new customError_1.CustomError("Craft not found", 404);
                }
                // ✅ STEP 2: GET TRADESMAN IDS FROM PROJECT
                const assigned = yield prismaClient_1.default.tradesManOnProject.findMany({
                    where: {
                        projectId: data.scaffHoldId, // 🔥 use projectId instead
                        project: {
                            isDeleted: false,
                        },
                    },
                    select: {
                        tradesManId: true,
                    },
                });
                const assignedIds = assigned.map(a => a.tradesManId);
                if (assignedIds.length === 0) {
                    return {
                        message: "No tradesman found",
                        craft: craftData,
                        data: [],
                        pagination: { total: 0, page, limit, totalPages: 0 },
                    };
                }
                // ✅ STEP 3: FILTER CONDITION
                const whereCondition = {
                    id: { in: assignedIds },
                    craft: craftData.name,
                };
                if (searchTerm) {
                    whereCondition.user = {
                        name: {
                            contains: searchTerm,
                        },
                    };
                }
                // ✅ STEP 4: FETCH DATA
                const [tradeManData, totalCount] = yield Promise.all([
                    prismaClient_1.default.tradesMan.findMany({
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
                                        select: {
                                            id: true,
                                            url: true,
                                            mediaType: true,
                                        },
                                        take: 1,
                                    },
                                },
                            },
                        },
                        skip,
                        take: limit,
                        orderBy: { id: "desc" },
                    }),
                    prismaClient_1.default.tradesMan.count({
                        where: whereCondition,
                    }),
                ]);
                // ✅ STEP 5: FORMAT
                const formattedTradesmen = tradeManData.map((tm) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    return ({
                        id: tm.id,
                        uuid: tm.uuid,
                        userId: tm.userId,
                        craft: tm.craft,
                        address: tm.address,
                        experience: tm.experience,
                        latitude: tm.latitude,
                        longitude: tm.longitude,
                        name: ((_a = tm.user) === null || _a === void 0 ? void 0 : _a.name) || null,
                        email: ((_b = tm.user) === null || _b === void 0 ? void 0 : _b.email) || null,
                        mobileNumber: ((_c = tm.user) === null || _c === void 0 ? void 0 : _c.mobileNumber) || null,
                        countryCode: ((_d = tm.user) === null || _d === void 0 ? void 0 : _d.countryCode) || null,
                        user_type: ((_e = tm.user) === null || _e === void 0 ? void 0 : _e.user_type) || null,
                        image: ((_g = (_f = tm.user) === null || _f === void 0 ? void 0 : _f.userMedias) === null || _g === void 0 ? void 0 : _g.length) > 0
                            ? tm.user.userMedias[0].url
                            : null,
                    });
                });
                return {
                    message: "Tradesman fetched successfully",
                    craft: craftData,
                    data: formattedTradesmen,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ Fetch error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to fetch tradesman", 500, error.message);
            }
        });
    }
    updateTradesManProfile(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const user = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: data.id,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true,
                    },
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found");
                }
                const updatedUser = yield prismaClient_1.default.user.update({
                    where: { id: data.id },
                    data: {
                        name: data.name,
                        mobileNumber: data.mobileNumber,
                        countryCode: data.countryCode,
                    },
                });
                const existingTrade = yield prismaClient_1.default.tradesMan.findUnique({
                    where: { userId: data.id },
                });
                if (!existingTrade) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND, 404, "TradesMan profile not found");
                }
                const craftData = yield prismaClient_1.default.craft.findFirst({
                    where: {
                        name: data.craft
                    }
                });
                const updatedTrade = yield prismaClient_1.default.tradesMan.update({
                    where: { userId: data.id },
                    data: {
                        craft: (_a = data.craft) !== null && _a !== void 0 ? _a : existingTrade.craft,
                        craftId: craftData ? craftData.id : null,
                        experience: (_b = data.experience) !== null && _b !== void 0 ? _b : existingTrade.experience,
                        address: (_c = data.address) !== null && _c !== void 0 ? _c : existingTrade.address,
                        longitude: (_d = data.longitude) !== null && _d !== void 0 ? _d : existingTrade.longitude,
                        latitude: (_e = data.latitude) !== null && _e !== void 0 ? _e : existingTrade.latitude,
                    },
                });
                if (data.photoImage) {
                    const existingMedia = yield prismaClient_1.default.userMedia.findFirst({
                        where: {
                            userId: updatedUser.id,
                            mediaType: "PHOTO_IMAGE",
                        },
                    });
                    if (existingMedia) {
                        yield prismaClient_1.default.userMedia.update({
                            where: { id: existingMedia.id },
                            data: { url: data.photoImage },
                        });
                    }
                    else {
                        yield prismaClient_1.default.userMedia.create({
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
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.PROFILE_UPDATED,
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❌ Update profile error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.UPDATE_FAILED, 500, error.message);
            }
        });
    }
    requestProjectScaffHoldServices(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // ✅ 1. AUTH CHECK
                const tradesManData = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                        isDeleted: false,
                        user_type: "TRADESMAN",
                        isVerified: true,
                    }
                });
                if (!tradesManData) {
                    throw new customError_1.CustomError("Unauthorized", 401);
                }
                // ✅ 2. GET PROJECT
                const projectData = yield prismaClient_1.default.project.findUnique({
                    where: {
                        id: data.projectId,
                        isDeleted: false,
                    },
                    include: {
                        projectManagers: {
                            select: { id: true }
                        }
                    }
                });
                if (!projectData) {
                    throw new customError_1.CustomError("Project not found", 404);
                }
                // ✅ 3. GET TRADESMAN PROFILE
                const existingTradesman = yield prismaClient_1.default.tradesMan.findUnique({
                    where: {
                        userId: tradesManData.id
                    }
                });
                if (!existingTradesman) {
                    throw new customError_1.CustomError("Tradesman profile not found", 404);
                }
                // ✅ 4. GENERATE IDS
                const REQID = (0, utils_1.reqscaffHoldIdGenerator)();
                const SCAFFID = (0, utils_1.scaffHoldIdGenerator)();
                // ✅ 5. CREATE PROJECT REQUEST
                const newRequest = yield prismaClient_1.default.projectScaffholdRequest.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        projectId: projectData.id,
                        craft: existingTradesman.craft,
                        length: data.length,
                        width: data.width,
                        height: data.height,
                        priority: data.priority,
                        REQID: REQID,
                        SCAFFID: SCAFFID,
                        expectedEndDate: data.expectedEndDate,
                        notes: data.notes,
                        createdById: existingTradesman.id,
                        status: "PENDING",
                    }
                });
                yield prismaClient_1.default.project.update({
                    where: {
                        id: projectData.id,
                    },
                    data: {
                        status: "ONGOING",
                    },
                });
                // ✅ 6. RESPONSE FORMAT
                const requestData = {
                    id: newRequest.id,
                    uuid: newRequest.uuid,
                    projectId: newRequest.projectId,
                    projectName: projectData.projectName,
                    PJT: projectData.PJT,
                    craft: existingTradesman.craft,
                    length: newRequest.length,
                    width: newRequest.width,
                    height: newRequest.height,
                    priority: newRequest.priority,
                    SCAFFID: newRequest.SCAFFID,
                    REQID: newRequest.REQID,
                    expectedEndDate: newRequest.expectedEndDate,
                    notes: newRequest.notes,
                    status: newRequest.status,
                    createdAt: newRequest.createdAt,
                    updatedAt: newRequest.updatedAt,
                };
                // ✅ 7. SEND NOTIFICATION TO PROJECT MANAGERS
                const pmUserIds = projectData.projectManagers.map(pm => pm.id);
                const notificationMessage = `New Project Scaffold request ${newRequest.REQID} has been created for project ${projectData.PJT} by ${tradesManData.name}.`;
                if (pmUserIds.length > 0) {
                    for (const pmId of pmUserIds) {
                        yield prismaClient_1.default.notification.create({
                            data: {
                                uuid: (0, uuid_1.v4)(),
                                title: "New Project Scaffold Request",
                                message: notificationMessage,
                                type: "SCAFFHOLD_REQUEST",
                                scaffoldRequestId: newRequest.id.toString(),
                                role: "PROJECT_MANAGER",
                                receiverId: pmId,
                                senderId: userId.toString(),
                                isRead: false,
                                notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/requestReg.png"
                            }
                        });
                    }
                }
                // ✅ 8. PUSH NOTIFICATION (OPTIONAL)
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: { in: pmUserIds },
                        deviceToken: { not: null }
                    }
                });
                for (const d of devices) {
                    if (!d.deviceToken)
                        continue;
                    yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, "New Project Scaffold Request", notificationMessage);
                }
                // ✅ FINAL RESPONSE
                return {
                    message: "Project scaffold request created successfully",
                    data: requestData
                };
            }
            catch (error) {
                console.error("❗ Error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Project scaffold request failed", 500, error.message);
            }
        });
    }
    updateProjectScaffHoldRequest(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // ✅ 1. Validate Tradesman
                const tradesManData = yield prismaClient_1.default.tradesMan.findUnique({
                    where: { userId: userId },
                    include: {
                        user: {
                            select: {
                                name: true,
                                status: true,
                                isDeleted: true,
                                user_type: true,
                            },
                        },
                    },
                });
                if (!tradesManData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found");
                }
                if (tradesManData.user.isDeleted ||
                    tradesManData.user.status !== "ACTIVE") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.INACTIVE_ACCOUNT, 403, "You are not allowed to perform this action");
                }
                // ✅ 2. Find Request
                const request = yield prismaClient_1.default.projectScaffholdRequest.findUnique({
                    where: {
                        id: data.requestId,
                        status: "PENDING",
                    },
                });
                if (!request) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Request not found");
                }
                // ❗ IMPORTANT (as per your requirement):
                // ANY tradesman can update (remove ownership check)
                // 👉 if you want restriction, uncomment below:
                /*
                if (request.createdById !== tradesManData.id) {
                  throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLDREQUEST.INVALID_STATUS,
                    403,
                    "You are not authorized"
                  );
                }
                */
                // ✅ 3. Update Request (versioning style)
                const updatedRequest = yield prismaClient_1.default.projectScaffholdRequest.update({
                    where: { id: request.id },
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        projectId: request.projectId,
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
                        parentId: request.id, // versioning
                    },
                });
                // ✅ 4. Update Project (optional like scaffhold)
                yield prismaClient_1.default.project.update({
                    where: { id: request.projectId },
                    data: {
                    // optional: keep priority if needed
                    },
                });
                // ✅ 5. Create HISTORY
                yield prismaClient_1.default.updateProjectScaffHoldRequest.create({
                    data: {
                        requestId: updatedRequest.id,
                        projectId: updatedRequest.projectId,
                        length: updatedRequest.length,
                        width: updatedRequest.width,
                        height: updatedRequest.height,
                        priority: updatedRequest.priority,
                        expectedEndDate: updatedRequest.expectedEndDate,
                        notes: updatedRequest.notes,
                    },
                });
                // ✅ 6. Get Project + PMs
                const projectData = yield prismaClient_1.default.project.findUnique({
                    where: { id: updatedRequest.projectId },
                    include: {
                        projectManagers: {
                            select: { id: true },
                        },
                    },
                });
                // ✅ 7. Response
                const responseData = {
                    id: updatedRequest.id,
                    uuid: updatedRequest.uuid,
                    projectId: updatedRequest.projectId,
                    projectName: (projectData === null || projectData === void 0 ? void 0 : projectData.projectName) || null,
                    PJT: (projectData === null || projectData === void 0 ? void 0 : projectData.PJT) || null,
                    REQID: updatedRequest.REQID,
                    craft: updatedRequest.craft,
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
                // ✅ 8. Notifications (PM)
                const pmUserIds = ((_a = projectData === null || projectData === void 0 ? void 0 : projectData.projectManagers) === null || _a === void 0 ? void 0 : _a.map((pm) => pm.id)) || [];
                const notificationMessage = `Project scaffold request ${updatedRequest.REQID} has been modified for Project ${projectData === null || projectData === void 0 ? void 0 : projectData.PJT} by ${tradesManData.user.name}.`;
                if (pmUserIds.length > 0) {
                    for (const pmId of pmUserIds) {
                        yield prismaClient_1.default.notification.create({
                            data: {
                                uuid: (0, uuid_1.v4)(),
                                title: "Modification Request",
                                message: notificationMessage,
                                type: "MODIFICATION_REQUEST",
                                role: "PROJECT_MANAGER",
                                receiverId: pmId,
                                senderId: userId.toString(),
                                isRead: false,
                                notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/modifictaionReq.png",
                            },
                        });
                    }
                }
                // ✅ 9. Push Notification
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: Number(projectData === null || projectData === void 0 ? void 0 : projectData.createdById),
                        deviceToken: { not: null },
                    },
                });
                for (const d of devices) {
                    if (!d.deviceToken)
                        continue;
                    yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, "Project Modification Request", notificationMessage);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_SUCCESS,
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❗ Error in updateProjectScaffHoldRequest:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_FAILED, 500, error.message);
            }
        });
    }
    getTrademanRequestListServices(userId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (userId, data, page = 1, limit = 10) {
            var _a;
            try {
                const skip = (page - 1) * limit;
                // ✅ STEP 1: FIND TRADESMAN (FIXED)
                const tradesman = yield prismaClient_1.default.tradesMan.findFirst({
                    where: {
                        userId: userId,
                        user: {
                            isDeleted: false,
                            status: "ACTIVE",
                            isVerified: true,
                        },
                    },
                });
                if (!tradesman) {
                    throw new customError_1.CustomError("Tradesman not found for this user", 404);
                }
                // ✅ STEP 2: WHERE CONDITION
                const whereCondition = {
                    createdById: tradesman.id,
                    parentId: null,
                };
                // ✅ STEP 3: SEARCH
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm) {
                    if (!isNaN(Number(searchTerm))) {
                        whereCondition.id = Number(searchTerm);
                    }
                    else {
                        whereCondition.OR = [
                            { REQID: { contains: searchTerm } },
                            {
                                project: {
                                    projectName: { contains: searchTerm },
                                },
                            },
                            {
                                project: {
                                    clientAddress: { contains: searchTerm },
                                },
                            },
                            {
                                createdBy: {
                                    user: {
                                        name: { contains: searchTerm },
                                    },
                                },
                            },
                        ];
                    }
                }
                // ✅ STEP 4: FETCH DATA
                const [requests, totalCount] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.findMany({
                        where: Object.assign(Object.assign({}, whereCondition), { project: {
                                isDeleted: false,
                            } }),
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
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: whereCondition,
                    }),
                ]);
                // ✅ STEP 5: FORMAT
                const formattedData = requests.map((req) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    return ({
                        id: req.id,
                        uuid: req.uuid,
                        projectId: req.projectId,
                        SCAFFID: req.SCAFFID || null,
                        projectName: ((_a = req.project) === null || _a === void 0 ? void 0 : _a.projectName) || null,
                        craft: ((_b = req.createdBy) === null || _b === void 0 ? void 0 : _b.craft) || null,
                        REQID: req.REQID,
                        address: req.address || null,
                        longitude: req.longitude || null,
                        latitude: req.latitude || null,
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
                        createdByName: ((_d = (_c = req.createdBy) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.name) || null,
                        createdByImage: ((_h = (_g = (_f = (_e = req.createdBy) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.userMedias) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.url) || null,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_SUCCESS,
                    data: formattedData,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❗ Error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED, 500, error.message);
            }
        });
    }
    joinProjectServices(tradesManUserId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // ✅ STEP 1: USER + TRADESMAN
                const user = yield prismaClient_1.default.user.findFirst({
                    where: {
                        id: tradesManUserId,
                        status: "ACTIVE",
                        isDeleted: false,
                        user_type: "TRADESMAN",
                        isVerified: true,
                    },
                    include: {
                        tradesman: true,
                    },
                });
                if (!user || !user.tradesman) {
                    throw new customError_1.CustomError("Unauthorized", 401);
                }
                const tradesman = user.tradesman;
                if (!tradesman.craft) {
                    throw new customError_1.CustomError("Tradesman craft not specified", 400);
                }
                // ✅ STEP 2: PROJECT FETCH
                const project = yield prismaClient_1.default.project.findFirst({
                    where: {
                        id: data.scaffHoldId,
                        isDeleted: false,
                    },
                    include: {
                        jobCrafts: {
                            include: {
                                craft: true,
                            },
                        },
                        projectManagers: true,
                    },
                });
                if (!project) {
                    throw new customError_1.CustomError("Project not found", 404);
                }
                // ✅ STEP 3: MATCH CRAFT
                const craftMatch = project.jobCrafts.find((jc) => {
                    var _a, _b;
                    return ((_b = (_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()) ===
                        tradesman.craft.toLowerCase();
                });
                if (!craftMatch) {
                    throw new customError_1.CustomError("Craft mismatch", 400);
                }
                if (craftMatch.joinedCount >= craftMatch.counts) {
                    throw new customError_1.CustomError("Vacancy full", 400);
                }
                // ✅ STEP 4: CHECK ALREADY JOINED
                const alreadyJoined = yield prismaClient_1.default.tradesManOnProject.findUnique({
                    where: {
                        projectId_tradesManId: {
                            projectId: project.id,
                            tradesManId: tradesman.id,
                        },
                    },
                });
                if (alreadyJoined) {
                    throw new customError_1.CustomError("Already joined this project", 400);
                }
                // ✅ STEP 5: TRANSACTION
                yield prismaClient_1.default.$transaction([
                    prismaClient_1.default.tradesManOnProject.create({
                        data: {
                            projectId: project.id,
                            tradesManId: tradesman.id,
                        },
                    }),
                    prismaClient_1.default.jobCraftTradesman.create({
                        data: {
                            jobCraftId: craftMatch.id,
                            tradesmanId: tradesman.id,
                            projectJobCraftId: craftMatch.id,
                        },
                    }),
                    prismaClient_1.default.projectJobCraft.update({
                        where: { id: craftMatch.id },
                        data: {
                            joinedCount: { increment: 1 },
                        },
                    }),
                ]);
                // ✅ STEP 6: NOTIFICATION
                const projectManagerIds = project.projectManagers.map(pm => pm.id);
                const message = `Tradesman ${user.name} (${tradesman.craft}) joined project ${project.projectName}`;
                for (const pmId of projectManagerIds) {
                    yield prismaClient_1.default.notification.create({
                        data: {
                            uuid: (0, uuid_1.v4)(),
                            title: "TRADESMAN JOINED PROJECT",
                            message,
                            type: "TRADESMAN_JOINED_PROJECT",
                            role: "PROJECT_MANAGER",
                            receiverId: BigInt(pmId),
                            senderId: user.id.toString(),
                            isRead: false,
                            notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/join.png",
                            tradesmanCraft: tradesman.craft,
                        },
                    });
                }
                // ✅ STEP 7: PUSH NOTIFICATION
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: { in: projectManagerIds },
                        deviceToken: { not: null },
                    },
                });
                yield Promise.all(devices.map((d) => d.deviceToken
                    ? (0, utils_1.pushNotificationDelhi)(d.deviceToken, "TRADESMAN JOINED PROJECT", message)
                    : null));
                return {
                    message: "Joined project successfully",
                };
            }
            catch (error) {
                console.error("❗ Error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Join project failed", 500, error.message);
            }
        });
    }
    getJoinedProjects(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                // ✅ STEP 1: FIND TRADESMAN
                const tradesman = yield prismaClient_1.default.tradesMan.findFirst({
                    where: {
                        userId: userId,
                        user: {
                            isDeleted: false,
                            status: "ACTIVE",
                            isVerified: true,
                            user_type: "TRADESMAN",
                        },
                    },
                });
                if (!tradesman) {
                    throw new customError_1.CustomError("Tradesman not found", 404);
                }
                // ✅ STEP 2: TOTAL COUNT
                const totalCount = yield prismaClient_1.default.tradesManOnProject.count({
                    where: {
                        tradesManId: tradesman.id,
                        project: {
                            isDeleted: false,
                        },
                    },
                });
                // ✅ STEP 3: FETCH PROJECTS
                const joinedProjects = yield prismaClient_1.default.tradesManOnProject.findMany({
                    where: {
                        tradesManId: tradesman.id,
                        project: {
                            isDeleted: false,
                        },
                    },
                    include: {
                        project: {
                            include: {
                                jobCrafts: {
                                    include: {
                                        craft: true,
                                    },
                                },
                                tradesmanContexts: {
                                    where: { tradesmanId: tradesman.id },
                                    select: { employerName: true },
                                },
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                });
                // ✅ STEP 4: FORMAT RESPONSE
                const responseData = joinedProjects.map((jp) => {
                    var _a, _b;
                    return ({
                        projectId: jp.project.id,
                        uuid: jp.project.uuid,
                        projectName: jp.project.projectName,
                        clientName: jp.project.clientName,
                        clientMobile: jp.project.clientMobile,
                        address: jp.project.clientAddress,
                        startDate: jp.project.startDate,
                        endDate: jp.project.endDate,
                        latitude: jp.project.latitude,
                        longitude: jp.project.longitude,
                        status: jp.project.status,
                        employerName: ((_b = (_a = jp.project.tradesmanContexts) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.employerName) || null,
                        jobCrafts: jp.project.jobCrafts.map((jc) => {
                            var _a;
                            return ({
                                id: jc.id,
                                craftId: jc.craftId,
                                name: (_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name,
                                total: jc.counts,
                                joined: jc.joinedCount,
                            });
                        }),
                    });
                });
                return {
                    message: "Joined projects fetched successfully",
                    data: responseData,
                    pagination: {
                        totalRecords: totalCount,
                        totalPages: Math.ceil(totalCount / limit),
                        currentPage: page,
                        pageSize: limit,
                    },
                };
            }
            catch (error) {
                console.error("❗ Error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to fetch joined projects", 500, error.message);
            }
        });
    }
    filterProjects(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {
                    isDeleted: false,
                };
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm) {
                    if (!isNaN(Number(searchTerm))) {
                        whereCondition.id = Number(searchTerm);
                    }
                    else {
                        whereCondition.OR = [
                            { projectName: { contains: searchTerm } },
                            { clientName: { contains: searchTerm } },
                            { clientAddress: { contains: searchTerm } },
                        ];
                    }
                }
                const [projects, totalCount] = yield Promise.all([
                    prismaClient_1.default.project.findMany({
                        where: whereCondition,
                        skip,
                        take: limit,
                        orderBy: { createdAt: "desc" },
                        include: {
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    CMPId: true,
                                },
                            },
                            jobCrafts: {
                                include: {
                                    craft: true,
                                },
                            },
                        },
                    }),
                    prismaClient_1.default.project.count({ where: whereCondition }),
                ]);
                const formattedData = projects.map((p) => {
                    var _a, _b;
                    return ({
                        projectId: p.id,
                        uuid: p.uuid,
                        projectName: p.projectName,
                        clientName: p.clientName,
                        clientMobile: p.clientMobile,
                        clientAddress: p.clientAddress,
                        startDate: p.startDate,
                        endDate: p.endDate,
                        latitude: p.latitude,
                        longitude: p.longitude,
                        status: p.status,
                        createdAt: p.createdAt,
                        companyName: ((_a = p.createdBy) === null || _a === void 0 ? void 0 : _a.name) || null,
                        CMPId: ((_b = p.createdBy) === null || _b === void 0 ? void 0 : _b.CMPId) || null,
                        jobCrafts: p.jobCrafts.map((jc) => {
                            var _a, _b;
                            return ({
                                id: jc.id,
                                craftId: jc.craftId,
                                name: (_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name,
                                craftImage: (_b = jc.craft) === null || _b === void 0 ? void 0 : _b.craftImage,
                                total: jc.counts,
                                joined: jc.joinedCount,
                            });
                        }),
                    });
                });
                return {
                    message: "Projects fetched successfully",
                    data: formattedData,
                    pagination: {
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limit),
                        currentPage: page,
                        limit,
                    },
                };
            }
            catch (error) {
                console.error("❌ Error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to fetch projects", 500, error.message);
            }
        });
    }
    deleteProjectScaffHoldRequest(requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // ✅ 1. Find existing request
                const existingRequest = yield prismaClient_1.default.projectScaffholdRequest.findUnique({
                    where: { id: requestId.scaffHoldId },
                    include: {
                        project: {
                            include: {
                                projectManagers: true, // get PMs
                            },
                        },
                    },
                });
                if (!existingRequest) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Project scaffhold request not found");
                }
                // ✅ 2. Only PENDING allowed
                if (existingRequest.status !== "PENDING") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REVOKE_NOT_ALLOWED, 400, "Only pending requests can be revoked");
                }
                // ✅ 3. Delete history
                yield prismaClient_1.default.updateProjectScaffHoldRequest.deleteMany({
                    where: {
                        requestId: requestId.scaffHoldId,
                    },
                });
                // ✅ 4. Get PM IDs
                const pmUserIds = ((_b = (_a = existingRequest.project) === null || _a === void 0 ? void 0 : _a.projectManagers) === null || _b === void 0 ? void 0 : _b.map((pm) => pm.id)) || [];
                // ✅ 5. Delete notifications for those PMs
                if (pmUserIds.length > 0) {
                    yield prismaClient_1.default.notification.deleteMany({
                        where: {
                            receiverId: { in: pmUserIds },
                        },
                    });
                }
                // ✅ 6. Delete main request
                yield prismaClient_1.default.projectScaffholdRequest.delete({
                    where: {
                        id: requestId.scaffHoldId,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REVOKE_SUCCESS,
                };
            }
            catch (error) {
                console.error("❗ Error in deleteProjectScaffHoldRequest:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.DELETE_FAILED, 500, error.message);
            }
        });
    }
    getRequestScaffHoldById(requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            try {
                const request = yield prismaClient_1.default.projectScaffholdRequest.findUnique({
                    where: { id: requestId.scaffHoldId },
                    include: {
                        project: {
                            select: {
                                id: true,
                                projectName: true,
                                clientAddress: true,
                                latitude: true,
                                longitude: true,
                            },
                        },
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
                });
                if (!request) {
                    throw new customError_1.CustomError("Scaffhold request not found", 404);
                }
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
                    address: request.address,
                    latitude: request.latitude,
                    longitude: request.longitude,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                    // ✅ PROJECT INFO
                    projectId: request.projectId,
                    projectName: ((_a = request.project) === null || _a === void 0 ? void 0 : _a.projectName) || null,
                    projectAddress: ((_b = request.project) === null || _b === void 0 ? void 0 : _b.clientAddress) || null,
                    // ✅ CREATED BY
                    createdById: ((_c = request.createdBy) === null || _c === void 0 ? void 0 : _c.id) || null,
                    createdByName: ((_e = (_d = request.createdBy) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.name) || null,
                    createdByImage: ((_j = (_h = (_g = (_f = request.createdBy) === null || _f === void 0 ? void 0 : _f.user) === null || _g === void 0 ? void 0 : _g.userMedias) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.url) || null,
                };
                return {
                    message: "Request details fetched successfully",
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❌ Error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Failed to fetch request details", 500, error.message);
            }
        });
    }
    getModifiedRequestsByParentId(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            try {
                const mainRequest = yield prismaClient_1.default.projectScaffholdRequest.findUnique({
                    where: {
                        id: BigInt(data.parentId),
                    },
                    include: {
                        project: {
                            select: {
                                id: true,
                                projectName: true,
                                clientAddress: true,
                                latitude: true,
                                longitude: true,
                            },
                        },
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
                        // ✅ VERSION HISTORY
                        children: {
                            orderBy: { createdAt: "desc" },
                        },
                    },
                });
                if (!mainRequest) {
                    throw new customError_1.CustomError("Scaffhold request not found", 404);
                }
                // ✅ MAP CHILDREN AS UPDATES
                const mappedUpdates = mainRequest.children.map((u) => ({
                    id: u.id,
                    uuid: u.uuid,
                    length: u.length,
                    width: u.width,
                    height: u.height,
                    priority: u.priority,
                    expectedEndDate: u.expectedEndDate,
                    notes: u.notes,
                    status: u.status,
                    createdAt: u.createdAt,
                }));
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
                    address: mainRequest.address,
                    latitude: mainRequest.latitude,
                    longitude: mainRequest.longitude,
                    createdAt: mainRequest.createdAt,
                    updatedAt: mainRequest.updatedAt,
                    // ✅ PROJECT
                    projectId: mainRequest.projectId,
                    projectName: ((_a = mainRequest.project) === null || _a === void 0 ? void 0 : _a.projectName) || null,
                    projectAddress: ((_b = mainRequest.project) === null || _b === void 0 ? void 0 : _b.clientAddress) || null,
                    // ✅ PARENT
                    parentId: mainRequest.parentId,
                    // ✅ USER
                    createdById: ((_c = mainRequest.createdBy) === null || _c === void 0 ? void 0 : _c.id) || null,
                    createdByName: ((_e = (_d = mainRequest.createdBy) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.name) || null,
                    createdByImage: ((_j = (_h = (_g = (_f = mainRequest.createdBy) === null || _f === void 0 ? void 0 : _f.user) === null || _g === void 0 ? void 0 : _g.userMedias) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.url) || null,
                    // ✅ HISTORY
                    updates: mappedUpdates,
                };
                return {
                    message: "Request details with history fetched successfully",
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❌ Error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Failed to fetch request history", 500, error.message);
            }
        });
    }
    getAllModifiedRequestsByParentId(userId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (userId, data, page = 1, limit = 10) {
            var _a;
            try {
                const tradesman = yield prismaClient_1.default.tradesMan.findUnique({
                    where: { userId: userId },
                });
                if (!tradesman) {
                    throw new customError_1.CustomError("Tradesman not found", 404);
                }
                const skip = (page - 1) * limit;
                const whereCondition = {
                    parentId: { not: null },
                    createdById: tradesman.id,
                };
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm) {
                    if (!isNaN(Number(searchTerm))) {
                        whereCondition.OR = [
                            { id: Number(searchTerm) },
                            { REQID: { contains: searchTerm } },
                        ];
                    }
                    else {
                        whereCondition.OR = [
                            { REQID: { contains: searchTerm } },
                            { address: { contains: searchTerm } },
                            {
                                project: {
                                    projectName: { contains: searchTerm },
                                },
                            },
                            {
                                createdBy: {
                                    user: {
                                        name: { contains: searchTerm },
                                    },
                                },
                            },
                        ];
                    }
                }
                const [requests, totalCount] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.findMany({
                        where: whereCondition,
                        include: {
                            project: {
                                select: {
                                    id: true,
                                    projectName: true,
                                    clientAddress: true,
                                    latitude: true,
                                    longitude: true,
                                },
                            },
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
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: whereCondition,
                    }),
                ]);
                const responseData = requests.map((req) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    return ({
                        id: req.id,
                        uuid: req.uuid,
                        REQID: req.REQID,
                        status: req.status,
                        craft: req.craft,
                        priority: req.priority,
                        length: req.length,
                        width: req.width,
                        height: req.height,
                        expectedEndDate: req.expectedEndDate,
                        notes: req.notes,
                        address: req.address,
                        latitude: req.latitude,
                        longitude: req.longitude,
                        createdAt: req.createdAt,
                        updatedAt: req.updatedAt,
                        parentId: req.parentId,
                        // ✅ PROJECT
                        projectId: req.projectId,
                        projectName: ((_a = req.project) === null || _a === void 0 ? void 0 : _a.projectName) || null,
                        projectAddress: ((_b = req.project) === null || _b === void 0 ? void 0 : _b.clientAddress) || null,
                        // ✅ USER
                        createdByName: ((_d = (_c = req.createdBy) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.name) || null,
                        createdByImage: ((_h = (_g = (_f = (_e = req.createdBy) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.userMedias) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.url) || null,
                    });
                });
                return {
                    message: "Modified requests fetched successfully",
                    data: responseData,
                    pagination: {
                        total: totalCount,
                        totalPages: Math.ceil(totalCount / limit),
                        currentPage: page,
                        limit,
                    },
                };
            }
            catch (error) {
                console.error("❌ Error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Failed to fetch modified requests", 500, error.message);
            }
        });
    }
    getTradesManScaffHoldDetailsById(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            try {
                // ✅ USER VALIDATION
                const userData = yield prismaClient_1.default.user.findUnique({
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
                                id: true,
                                craft: true,
                                jobCraftsJoined: {
                                    select: {
                                        projectJobCraft: {
                                            select: {
                                                id: true,
                                                craft: {
                                                    select: { name: true },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
                if (!userData || !userData.tradesman) {
                    throw new customError_1.CustomError("Unauthorized", 401);
                }
                // ✅ PROJECT FETCH (instead of scaffhold)
                const project = yield prismaClient_1.default.project.findFirst({
                    where: {
                        id: data.id,
                        isDeleted: false,
                    },
                    include: {
                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                CMPId: true,
                            },
                        },
                        jobCrafts: {
                            include: {
                                craft: true,
                            },
                        },
                    },
                });
                if (!project) {
                    throw new customError_1.CustomError("Project not found", 404);
                }
                // ✅ CRAFT RESOLVE
                const craftName = ((_d = (_c = (_b = (_a = userData.tradesman.jobCraftsJoined) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.projectJobCraft) === null || _c === void 0 ? void 0 : _c.craft) === null || _d === void 0 ? void 0 : _d.name) ||
                    userData.tradesman.craft ||
                    null;
                const craftId = ((_g = (_f = (_e = userData.tradesman.jobCraftsJoined) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.projectJobCraft) === null || _g === void 0 ? void 0 : _g.id) || null;
                // ✅ RESPONSE
                const formattedResponse = {
                    projectId: project.id,
                    uuid: project.uuid,
                    projectName: project.projectName,
                    startDate: project.startDate,
                    endDate: project.endDate,
                    latitude: project.latitude,
                    longitude: project.longitude,
                    status: project.status,
                    clientName: project.clientName,
                    clientMobile: project.clientMobile,
                    clientAddress: project.clientAddress,
                    companyId: project.createdById,
                    companyName: ((_h = project.createdBy) === null || _h === void 0 ? void 0 : _h.name) || null,
                    CMPId: ((_j = project.createdBy) === null || _j === void 0 ? void 0 : _j.CMPId) || null,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                    // ✅ JOB CRAFTS
                    jobCrafts: project.jobCrafts.map((jc) => {
                        var _a;
                        return ({
                            id: jc.id,
                            craftId: jc.craftId,
                            craftName: (_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name,
                            total: jc.counts,
                            joined: jc.joinedCount,
                        });
                    }),
                    // ✅ USER CRAFT CONTEXT
                    userCraftName: craftName,
                    userCraftId: craftId,
                };
                return {
                    message: "Project details fetched successfully",
                    data: formattedResponse,
                };
            }
            catch (error) {
                console.error("❌ Error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to fetch project details", 500, error.message);
            }
        });
    }
    getProjectRequestFilterData(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {};
                const { priority, status, sort } = data;
                if (priority) {
                    whereCondition.priority = Array.isArray(priority)
                        ? { in: priority.map((p) => p.toUpperCase()) }
                        : priority.toUpperCase();
                }
                if (status) {
                    whereCondition.status = Array.isArray(status)
                        ? { in: status.map((s) => s.toUpperCase()) }
                        : status.toUpperCase();
                }
                const totalCount = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: whereCondition,
                });
                const totalPages = Math.ceil(totalCount / limit);
                const requests = yield prismaClient_1.default.projectScaffholdRequest.findMany({
                    where: whereCondition,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: (sort === null || sort === void 0 ? void 0 : sort.toLowerCase()) === "asc" ? "asc" : "desc",
                    },
                    include: {
                        project: {
                            select: {
                                projectName: true,
                                clientName: true,
                                PJT: true,
                            },
                        },
                    },
                });
                const formatted = requests.map((r) => {
                    var _a, _b;
                    return ({
                        id: r.id,
                        uuid: r.uuid,
                        REQID: r.REQID,
                        SCAFFID: r.SCAFFID,
                        projectId: r.projectId,
                        projectName: (_a = r.project) === null || _a === void 0 ? void 0 : _a.projectName,
                        PJT: (_b = r.project) === null || _b === void 0 ? void 0 : _b.PJT,
                        craft: r.craft,
                        length: r.length,
                        width: r.width,
                        height: r.height,
                        priority: r.priority,
                        status: r.status,
                        createdAt: r.createdAt,
                    });
                });
                return {
                    success: true,
                    message: "Project request fetched successfully",
                    data: formatted,
                    pagination: {
                        total: totalCount,
                        totalPages,
                        currentPage: page,
                        limit,
                    },
                };
            }
            catch (error) {
                console.error("❌ Error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Fetch failed", 500, error.message);
            }
        });
    }
    getFilteredProjectRequestsByProjectId(projectId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (projectId, data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {
                    projectId: projectId,
                };
                const { search, priority, status, sort } = data || {};
                const searchTerm = search === null || search === void 0 ? void 0 : search.trim();
                // ✅ Search
                if (searchTerm && searchTerm !== "") {
                    if (!isNaN(Number(searchTerm))) {
                        whereCondition.id = Number(searchTerm);
                    }
                    else {
                        whereCondition.OR = [
                            { REQID: { contains: searchTerm } },
                            { SCAFFID: { contains: searchTerm } },
                            { notes: { contains: searchTerm } },
                        ];
                    }
                }
                // ✅ Priority
                if (priority) {
                    whereCondition.priority = Array.isArray(priority)
                        ? { in: priority.map((p) => p.toUpperCase()) }
                        : priority.toUpperCase();
                }
                // ✅ Status
                if (status) {
                    whereCondition.status = Array.isArray(status)
                        ? { in: status.map((s) => s.toUpperCase()) }
                        : status.toUpperCase();
                }
                // ✅ Count
                const totalCount = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: whereCondition,
                });
                const totalPages = Math.ceil(totalCount / limit);
                // ✅ Fetch
                const requests = yield prismaClient_1.default.projectScaffholdRequest.findMany({
                    where: whereCondition,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: (sort === null || sort === void 0 ? void 0 : sort.toLowerCase()) === "asc" ? "asc" : "desc",
                    },
                    include: {
                        project: {
                            select: {
                                projectName: true,
                                PJT: true,
                            },
                        },
                        createdBy: {
                            include: {
                                user: {
                                    select: {
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        updatesRequest: true,
                    },
                });
                // ✅ Format like scaffhold API
                const formattedData = requests.map((r) => {
                    var _a, _b, _c, _d, _e, _f, _g;
                    return ({
                        id: r.id,
                        uuid: r.uuid,
                        REQID: r.REQID,
                        SCAFFID: r.SCAFFID,
                        projectId: r.projectId,
                        projectName: ((_a = r.project) === null || _a === void 0 ? void 0 : _a.projectName) || null,
                        PJT: ((_b = r.project) === null || _b === void 0 ? void 0 : _b.PJT) || null,
                        craft: r.craft,
                        length: r.length,
                        width: r.width,
                        height: r.height,
                        priority: r.priority,
                        status: r.status,
                        createdById: r.createdById,
                        createdByName: ((_d = (_c = r.createdBy) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.name) || null,
                        createdByEmail: ((_f = (_e = r.createdBy) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.email) || null,
                        history: ((_g = r.updatesRequest) === null || _g === void 0 ? void 0 : _g.map((h) => ({
                            id: h.id,
                            length: h.length,
                            width: h.width,
                            height: h.height,
                            priority: h.priority,
                            expectedEndDate: h.expectedEndDate,
                            notes: h.notes,
                            createdAt: h.createdAt,
                        }))) || [],
                        createdAt: r.createdAt,
                        updatedAt: r.updatedAt,
                    });
                });
                return {
                    success: true,
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS, // ✅ same style
                    data: formattedData,
                    pagination: {
                        total: totalCount,
                        totalPages,
                        currentPage: page,
                        limit,
                    },
                };
            }
            catch (error) {
                console.error("❌ Error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    deleteTradesman(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingTradesman = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: id,
                        status: "ACTIVE",
                        isDeleted: false,
                    },
                });
                if (!existingTradesman) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND, 404, "Tradesman not found");
                }
                yield prismaClient_1.default.user.update({
                    where: { id: existingTradesman.id },
                    data: { isDeleted: true, status: "DELETED" },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.DELETE_SUCCESS,
                };
            }
            catch (error) {
                console.error("❗ Error in deleteTradesman:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.DELETE_FAILED, 500, error.message);
            }
        });
    }
}
exports.tradesManServices = tradesManServices;
