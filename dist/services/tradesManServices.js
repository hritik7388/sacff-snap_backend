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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradesManServices = void 0;
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
                    prismaClient_1.default.tradesManOnScaffhold.count({
                        where: { tradesManId: tradesman.id },
                    }),
                    prismaClient_1.default.scaffholdRequest.count({
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
                const existingTradesMan = yield prismaClient_1.default.user.findUnique({
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
                const tradesManData = yield prismaClient_1.default.user.findUnique({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" },
                });
                if (!tradesManData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND, 500, "The provided email does not match any tradesman");
                }
                if (data.user_type !== tradesManData.user_type) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 500, "Unauthorized");
                }
                const isPasswordValid = tradesManData.password && (yield bcryptjs_1.default.compare(data.password, tradesManData.password));
                if (!isPasswordValid) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.INVALID_PASSWORD, 500, "Invalid password");
                }
                if (tradesManData.user_type !== "TRADESMAN") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 500, "Unauthorized");
                }
                const jwtPayload = {
                    login_id: tradesManData.email,
                    id: tradesManData.id.toString(),
                    uuid: tradesManData.uuid,
                    user_type: tradesManData.user_type,
                    userId: tradesManData.id,
                };
                const token = (0, utils_1.generateToken)(jwtPayload);
                const user = {
                    id: tradesManData.id,
                    uuid: tradesManData.uuid,
                    name: tradesManData.name,
                    email: tradesManData.email,
                    user_type: tradesManData.user_type,
                    userId: tradesManData.id,
                };
                yield prismaClient_1.default.user.update({
                    where: { id: tradesManData.id },
                    data: { lastLogin: new Date() },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.LOGIN_SUCCESS,
                    token,
                    data: user,
                };
            }
            catch (error) {
                console.error("❌ Register error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError ? error : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.LOGIN_FAILED, 500, error.message);
            }
        });
    }
    getTradesManDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            console.log("id========================>>>>>", id);
            try {
                const user = yield prismaClient_1.default.user.findUnique({
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
                    throw new customError_1.CustomError("USER_NOT_FOUND", 404, "User not found");
                }
                // Ensure user is a tradesman
                if (user.user_type !== "TRADESMAN") {
                    throw new customError_1.CustomError("INVALID_ROLE", 400, "User is not a tradesman");
                }
                const idProofImage = ((_a = user.userMedias.find(media => media.mediaType === "ID_PROOF_IMAGE")) === null || _a === void 0 ? void 0 : _a.url) || null;
                const photoImage = ((_b = user.userMedias.find(media => media.mediaType === "PHOTO_IMAGE")) === null || _b === void 0 ? void 0 : _b.url) || null;
                const tradesman = user.tradesman;
                const scaff = (_c = tradesman === null || tradesman === void 0 ? void 0 : tradesman.scaffholds) === null || _c === void 0 ? void 0 : _c[0];
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
                        address: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.address) || null,
                        craftId: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.craftId) || null,
                        craft: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.craft) || null,
                        experience: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.experience) || null,
                        latitude: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.latitude) || null,
                        longitude: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.longitude) || null,
                        scaffholdId: (scaff === null || scaff === void 0 ? void 0 : scaff.scaffholdId) || null,
                        SCAFFId: ((_d = scaff === null || scaff === void 0 ? void 0 : scaff.scaffhold) === null || _d === void 0 ? void 0 : _d.SCAFFID) || null,
                        idProofImage,
                        photoImage,
                    },
                };
            }
            catch (error) {
                console.error("❌ Get tradesman details error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError("FETCH_FAILED", 500, error.message);
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
                const craftData = yield prismaClient_1.default.craft.findFirst({
                    where: { name: data.name },
                    select: {
                        id: true,
                        name: true,
                        craftImage: true,
                    },
                });
                if (!craftData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CRAFT.NOT_FOUND, 401, "Craft not found");
                }
                const assigned = yield prismaClient_1.default.tradesManOnScaffhold.findMany({
                    where: { scaffholdId: data.scaffHoldId },
                    select: { tradesManId: true }
                });
                const assignedTradesmanIds = assigned.map(a => a.tradesManId);
                if (assignedTradesmanIds.length === 0) {
                    return {
                        message: responseMessages_1.RESPONSE_MESSAGES.CRAFT.TRADESMAN_CRAFT_NOT_FOUND,
                        craft: craftData,
                        data: [],
                        pagination: { total: 0, page, limit, totalPages: 0 },
                    };
                }
                const whereCondition = {
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
                    prismaClient_1.default.tradesMan.count({ where: whereCondition }),
                ]);
                if (tradeManData.length === 0) {
                    return {
                        message: responseMessages_1.RESPONSE_MESSAGES.CRAFT.TRADESMAN_CRAFT_FETCH_SUCCESS,
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
                        image: ((_g = (_f = tm.user) === null || _f === void 0 ? void 0 : _f.userMedias) === null || _g === void 0 ? void 0 : _g.length) > 0 ? tm.user.userMedias[0].url : null,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.CRAFT.TRADESMAN_CRAFT_FETCH_SUCCESS,
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
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CRAFT.TRADESMAN_CRAFT_FETCH_FAILED, 500, error.message);
            }
        });
    }
    updateTradesManProfile(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { id: data.id },
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
    searchJob(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffhold = yield prismaClient_1.default.scaffhold.findFirst({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.NOT_FOUND, 404, "No job found for given CMPId and SCAFFID");
                }
                // 🔹 Flatten jobCrafts like your getJobAndCraftDetails
                const formattedJobCrafts = scaffhold.jobCrafts.map((jc) => {
                    var _a, _b, _c, _d;
                    return ({
                        id: jc.id,
                        craftId: jc.craftId,
                        counts: jc.counts,
                        name: ((_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name) || null,
                        craftImage: ((_b = jc.craft) === null || _b === void 0 ? void 0 : _b.craftImage) || null,
                        createdAt: ((_c = jc.craft) === null || _c === void 0 ? void 0 : _c.createdAt) || jc.createdAt,
                        updatedAt: ((_d = jc.craft) === null || _d === void 0 ? void 0 : _d.updatedAt) || jc.updatedAt,
                    });
                });
                const { jobCrafts, company, project } = scaffhold, rest = __rest(scaffhold, ["jobCrafts", "company", "project"]);
                const responseData = Object.assign(Object.assign({}, rest), { CMPId: (company === null || company === void 0 ? void 0 : company.CMPId) || null, companyName: (company === null || company === void 0 ? void 0 : company.name) || null, clientName: (project === null || project === void 0 ? void 0 : project.clientName) || null, clientMobile: (project === null || project === void 0 ? void 0 : project.clientMobile) || null, jobCrafts: formattedJobCrafts });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.JOB.FETCH_SUCCESS,
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❗ Error in searchJob:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.FETCH_JOBS_FAILED, 500, error.message);
            }
        });
    }
    requestScaffHoldServices(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tradesManData = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                        isDeleted: false,
                        user_type: "TRADESMAN",
                    }
                });
                if (!tradesManData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401, "Unauthorized");
                }
                const scaffholdData = yield prismaClient_1.default.scaffhold.findUnique({
                    where: {
                        id: data.scaffHoldId,
                        isDeleted: false,
                        status: {
                            in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                        },
                    }
                });
                if (!scaffholdData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
                }
                const existingTradesman = yield prismaClient_1.default.tradesMan.findUnique({
                    where: {
                        userId: tradesManData.id
                    }
                });
                if (!existingTradesman) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TRADESMAN.NOT_FOUND, 404, "Tradesman profile not found");
                }
                const REQID = (0, utils_1.reqscaffHoldIdGenerator)();
                const newRequest = yield prismaClient_1.default.scaffholdRequest.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
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
                });
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
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_SUCCESS,
                    data: requestData
                };
            }
            catch (error) {
                console.error("❗ Error in requestScaffOld:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_FAILED, 500, error.message);
            }
        });
    }
    updateScaffHoldRequest(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const tradesManData = yield prismaClient_1.default.tradesMan.findUnique({
                    where: {
                        userId: userId,
                    },
                });
                if (!tradesManData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "USER not found");
                }
                const request = yield prismaClient_1.default.scaffholdRequest.findUnique({
                    where: {
                        id: data.requestId,
                    },
                });
                if (!request) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Request not found");
                }
                if (request.createdById !== tradesManData.id) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.INVALID_STATUS, 403, "You are not authorized to update this request");
                }
                const updatedRequest = yield prismaClient_1.default.scaffholdRequest.update({
                    where: {
                        id: request.id
                    },
                    data: {
                        uuid: (0, uuid_1.v4)(),
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
                const scaffHoldUpdate = yield prismaClient_1.default.scaffhold.update({
                    where: { id: request.scaffholdId },
                    data: {
                        priority: data.priority
                    }
                });
                const historyEntry = yield prismaClient_1.default.updateScaffHoldRequest.create({
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
                const scaffholdData = yield prismaClient_1.default.scaffhold.findUnique({
                    where: { id: updatedRequest.scaffholdId },
                });
                const responseData = {
                    id: updatedRequest.id,
                    uuid: updatedRequest.uuid,
                    scaffholdId: updatedRequest.scaffholdId,
                    SCAFFID: (scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.SCAFFID) || null,
                    projectName: (scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.projectName) || null,
                    REQID: updatedRequest.REQID,
                    craft: request.craft,
                    address: (scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.address) || null,
                    longitude: (scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.longitude) || null,
                    latitude: (scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.latitude) || null,
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
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_SUCCESS,
                    data: responseData
                };
            }
            catch (error) {
                console.error("❗ Error in updateScaffHoldRequest:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_FAILED, 500, error.message);
            }
        });
    }
    getTrademanRequestListServices(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            var _a;
            console.log("📩 Incoming pagination:", { page, limit });
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {};
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm && searchTerm !== "") {
                    const term = searchTerm;
                    if (!isNaN(Number(term))) {
                        whereCondition.id = Number(term);
                    }
                    else {
                        whereCondition.OR = [
                            { REQID: { contains: term, } },
                            { scaffhold: { projectName: { contains: term, } } },
                            { scaffhold: { address: { contains: term, } } },
                            { createdBy: { user: { name: { contains: term, } } } },
                        ];
                    }
                }
                const [requests, totalCount] = yield Promise.all([
                    prismaClient_1.default.scaffholdRequest.findMany({
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
                    prismaClient_1.default.scaffholdRequest.count({ where: whereCondition }),
                ]);
                const totalPages = Math.ceil(totalCount / limit);
                const formattedData = requests.map((req) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
                    return ({
                        id: req.id,
                        uuid: req.uuid,
                        scaffholdId: req.scaffholdId,
                        SCAFFID: ((_a = req.scaffhold) === null || _a === void 0 ? void 0 : _a.SCAFFID) || null,
                        projectName: ((_b = req.scaffhold) === null || _b === void 0 ? void 0 : _b.projectName) || null,
                        craftId: ((_c = req.createdBy) === null || _c === void 0 ? void 0 : _c.craftId) || null,
                        craft: ((_d = req.createdBy) === null || _d === void 0 ? void 0 : _d.craft) || null,
                        REQID: req.REQID,
                        address: ((_e = req.scaffhold) === null || _e === void 0 ? void 0 : _e.address) || null,
                        longitude: ((_f = req.scaffhold) === null || _f === void 0 ? void 0 : _f.longitude) || null,
                        latitude: ((_g = req.scaffhold) === null || _g === void 0 ? void 0 : _g.latitude) || null,
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
                        createdByName: ((_j = (_h = req.createdBy) === null || _h === void 0 ? void 0 : _h.user) === null || _j === void 0 ? void 0 : _j.name) || null,
                        createdByImage: ((_o = (_m = (_l = (_k = req.createdBy) === null || _k === void 0 ? void 0 : _k.user) === null || _l === void 0 ? void 0 : _l.userMedias) === null || _m === void 0 ? void 0 : _m[0]) === null || _o === void 0 ? void 0 : _o.url) || null,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_SUCCESS,
                    data: formattedData,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages
                    },
                };
            }
            catch (error) {
                console.error("❗ Error in getTrademanRequestListServices:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED, 500, error.message);
            }
        });
    }
    joinProjectServices(tradesManId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 1️⃣ Fetch tradesman linked to user
                const tradesManData = yield prismaClient_1.default.user.findUnique({
                    where: { id: tradesManId },
                    include: { tradesman: true },
                });
                if (!tradesManData ||
                    tradesManData.status !== "ACTIVE" ||
                    tradesManData.isDeleted ||
                    tradesManData.user_type !== "TRADESMAN" ||
                    !tradesManData.tradesman) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401, "Unauthorized");
                }
                const tradesmanCraft = tradesManData.tradesman.craft;
                if (!tradesmanCraft) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.APPLICATION_FAILED, 400, "Tradesman craft not specified");
                }
                // 2️⃣ Fetch scaffhold with job crafts
                const scaffholdData = yield prismaClient_1.default.scaffhold.findUnique({
                    where: {
                        id: data.scaffHoldId, status: {
                            in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                        },
                    },
                    include: { jobCrafts: { include: { craft: true } } },
                });
                if (!scaffholdData || scaffholdData.isDeleted) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
                }
                // 3️⃣ Check craft match
                const craftMatch = scaffholdData.jobCrafts.find((jc) => { var _a, _b; return ((_b = (_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.toLowerCase()) === tradesmanCraft.toLowerCase(); });
                if (!craftMatch) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.CRAFT_MISMATCH, 400, "Ye job aapke liye nahi hai");
                }
                // 4️⃣ Check vacancy
                if (craftMatch.joinedCount >= craftMatch.counts) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.VACANCY_FULL, 400, "Vacancy full for this craft");
                }
                // 5️⃣ Check if tradesman already joined
                const alreadyJoined = yield prismaClient_1.default.tradesManOnScaffhold.findUnique({
                    where: {
                        scaffholdId_tradesManId: {
                            scaffholdId: data.scaffHoldId,
                            tradesManId: tradesManData.tradesman.id,
                        },
                    },
                });
                if (alreadyJoined) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.ALREADY_JOINED, 400, "Already joined this job");
                }
                // 6️⃣ Atomic transaction: join + jobCraftTradesman + decrement counts
                yield prismaClient_1.default.$transaction([
                    // (A) Add tradesman to scaffhold
                    prismaClient_1.default.tradesManOnScaffhold.create({
                        data: {
                            scaffholdId: data.scaffHoldId,
                            tradesManId: tradesManData.tradesman.id,
                        },
                    }),
                    // (B) Add tradesman to job craft
                    prismaClient_1.default.jobCraftTradesman.create({
                        data: {
                            jobCraftId: craftMatch.id,
                            tradesmanId: tradesManData.tradesman.id,
                        },
                    }),
                    // (C) Decrement craft counts
                    prismaClient_1.default.jobCraft.update({
                        where: { id: craftMatch.id },
                        data: { joinedCount: { increment: 1 } },
                    }),
                ]);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.JOB.JOIN_SUCCESS,
                };
            }
            catch (error) {
                console.error("❗ Error in joinProjectServices:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.APPLICATION_FAILED, 500, error.message);
            }
        });
    }
    getJoinedScaffholds(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            try {
                // 1️⃣ Find tradesman by userId
                const tradesManData = yield prismaClient_1.default.tradesMan.findUnique({
                    where: { userId },
                });
                if (!tradesManData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401, "Tradesman not found");
                }
                console.log("Tradesman found with ID:", tradesManData.id);
                // 2️⃣ Calculate pagination values
                const skip = (page - 1) * limit;
                // 3️⃣ Fetch total count for pagination
                const totalCount = yield prismaClient_1.default.scaffhold.count({
                    where: {
                        tradesMen: {
                            some: { tradesManId: tradesManData.id },
                        },
                    },
                });
                // 4️⃣ Fetch paginated scaffholds
                const joinedScaffholds = yield prismaClient_1.default.scaffhold.findMany({
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
                const responseData = joinedScaffholds.map((s) => {
                    var _a, _b;
                    return ({
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
                        projectName: ((_a = s.project) === null || _a === void 0 ? void 0 : _a.projectName) || null,
                        companyId: s.companyId,
                        companyName: ((_b = s.company) === null || _b === void 0 ? void 0 : _b.name) || null,
                        jobCrafts: s.jobCrafts.map((jc) => {
                            var _a;
                            return ({
                                id: jc.id,
                                craftId: jc.craftId,
                                name: (_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name,
                                counts: jc.counts,
                            });
                        }),
                    });
                });
                // 6️⃣ Pagination meta info
                const totalPages = Math.ceil(totalCount / limit);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.JOB.FETCH_SUCCESS,
                    data: responseData,
                    pagination: {
                        totalRecords: totalCount,
                        totalPages,
                        currentPage: page,
                        pageSize: limit,
                    },
                };
            }
            catch (error) {
                console.error("❗ Error in getJoinedScaffholds:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.FETCH_FAILED, 500, error.message);
            }
        });
    }
    filterScaffHolds(data, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {
                    isDeleted: false,
                };
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm && searchTerm !== "") {
                    const term = searchTerm;
                    if (!isNaN(Number(term))) {
                        whereCondition.id = Number(term);
                    }
                    else {
                        whereCondition.OR = [
                            { SCAFFID: { contains: term, } },
                            { address: { contains: term, } },
                        ];
                    }
                }
                const [scaffholds, totalCount] = yield Promise.all([
                    prismaClient_1.default.scaffhold.findMany({
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
                    prismaClient_1.default.scaffhold.count({ where: whereCondition }),
                ]);
                const formattedScaffholds = scaffholds.map((sc) => {
                    var _a, _b, _c, _d;
                    return ({
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
                        CMPId: ((_a = sc.company) === null || _a === void 0 ? void 0 : _a.CMPId) || null,
                        companyName: ((_b = sc.company) === null || _b === void 0 ? void 0 : _b.name) || null,
                        clientName: ((_c = sc.project) === null || _c === void 0 ? void 0 : _c.clientName) || null,
                        clientMobile: ((_d = sc.project) === null || _d === void 0 ? void 0 : _d.clientMobile) || null,
                        jobCrafts: sc.jobCrafts.map((jc) => {
                            var _a, _b;
                            return ({
                                id: jc.id,
                                craftId: jc.craftId,
                                counts: jc.counts,
                                name: ((_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name) || null,
                                craftImage: ((_b = jc.craft) === null || _b === void 0 ? void 0 : _b.craftImage) || null,
                                createdAt: jc.createdAt,
                                updatedAt: jc.updatedAt,
                            });
                        }),
                    });
                });
                const totalPages = Math.ceil(totalCount / limit);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                    data: formattedScaffholds,
                    pagination: {
                        total: totalCount,
                        totalPages,
                        currentPage: page,
                        limit,
                    },
                };
            }
            catch (error) {
                console.error("❌ Get all scaffholds error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    deleteScaffHoldRequest(requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingRequest = yield prismaClient_1.default.scaffholdRequest.findUnique({
                    where: {
                        id: requestId.scaffHoldId,
                    }
                });
                if (!existingRequest) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Scaffhold request not found");
                }
                if (existingRequest.status !== "PENDING") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REVOKE_NOT_ALLOWED, 400, "Only pending requests can be revoked");
                }
                yield prismaClient_1.default.updateScaffHoldRequest.deleteMany({
                    where: {
                        requestId: requestId.scaffHoldId,
                    },
                });
                yield prismaClient_1.default.scaffholdRequest.delete({
                    where: {
                        id: requestId.scaffHoldId,
                    }
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REVOKE_SUCCESS,
                };
            }
            catch (error) {
                console.error("❗ Error in deleteScaffHoldRequest:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.DELETE_FAILED, 500, error.message);
            }
        });
    }
    getRequestScaffHoldById(requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                const request = yield prismaClient_1.default.scaffholdRequest.findUnique({
                    where: { id: requestId.scaffHoldId },
                    include: {
                        scaffhold: {
                            include: {
                                project: true,
                                company: true,
                            },
                        },
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
                });
                if (!request) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Scaffhold request not found");
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
                    scaffholdId: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.id,
                    SCAFFID: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.SCAFFID,
                    projectName: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.projectName,
                    address: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.address,
                    latitude: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.latitude,
                    longitude: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.longitude,
                    createdById: ((_a = request.createdBy) === null || _a === void 0 ? void 0 : _a.id) || null,
                    createdByName: ((_c = (_b = request.createdBy) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.name) || null,
                    createdByImage: ((_g = (_f = (_e = (_d = request.createdBy) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.userMedias) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.url) || null,
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_DETAILS_FETCH_SUCCESS,
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❌ Error in getDetailsOfRequestScaffHoldById:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_DETAILS_FETCH_FAILED, 500, error.message);
            }
        });
    }
    getModifiedRequestsByParentId(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                const mainRequest = yield prismaClient_1.default.scaffholdRequest.findUnique({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "Scaffhold request not found");
                }
                // Fetch updates
                const updates = yield prismaClient_1.default.updateScaffHoldRequest.findMany({
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
                    scaffholdId: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.id,
                    SCAFFID: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.SCAFFID,
                    projectName: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.projectName,
                    address: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.address,
                    latitude: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.latitude,
                    longitude: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.longitude,
                    parentId: mainRequest.parentId,
                    createdById: ((_a = mainRequest.createdBy) === null || _a === void 0 ? void 0 : _a.id) || null,
                    createdByName: ((_c = (_b = mainRequest.createdBy) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.name) || null,
                    createdByImage: ((_g = (_f = (_e = (_d = mainRequest.createdBy) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.userMedias) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.url) || null,
                    updates: mappedUpdates,
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_DETAILS_FETCH_SUCCESS,
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❌ Error in getModifiedRequestsWithHistory:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_DETAILS_FETCH_FAILED, 500, error.message);
            }
        });
    }
    getAllModifiedRequestsByParentId(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {
                    parentId: { not: null },
                };
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm && searchTerm !== "") {
                    const term = searchTerm;
                    if (!isNaN(Number(term))) {
                        whereCondition.OR = [
                            { id: Number(term) },
                            { REQID: { contains: term, } },
                        ];
                    }
                    else {
                        whereCondition.OR = [
                            { REQID: { contains: term, } },
                            { scaffhold: { projectName: { contains: term, } } },
                            { scaffhold: { address: { contains: term, } } },
                            { createdBy: { user: { name: { contains: term, } } } },
                        ];
                    }
                }
                const [requests, totalCount] = yield Promise.all([
                    prismaClient_1.default.scaffholdRequest.findMany({
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
                    prismaClient_1.default.scaffholdRequest.count({ where: whereCondition }),
                ]);
                const totalPages = Math.ceil(totalCount / limit);
                const responseData = requests.map((request) => {
                    var _a, _b, _c, _d, _e, _f;
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
                        scaffholdId: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.id,
                        SCAFFID: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.SCAFFID,
                        projectName: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.projectName,
                        address: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.address,
                        latitude: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.latitude,
                        longitude: scaffholdData === null || scaffholdData === void 0 ? void 0 : scaffholdData.longitude,
                        parentId: request.parentId,
                        createdByName: ((_b = (_a = request.createdBy) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) || null,
                        createdByImage: ((_f = (_e = (_d = (_c = request.createdBy) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.userMedias) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.url) || null,
                    };
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_MODIFICATIONS_FETCH_SUCCESS,
                    data: responseData,
                    totalCount,
                    totalPages,
                    currentPage: page,
                    limit,
                };
            }
            catch (error) {
                console.error("❌ Error in getModifiedRequestsByParentId:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError ? error :
                    new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_MODIFICATIONS_FETCH_FAILED, 500, error.message);
            }
        });
    }
    getTradesManScaffHoldDetailsById(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
            try {
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 401, "Unauthorized");
                }
                // ✅ Get Scaffhold details
                const scaffhold = yield prismaClient_1.default.scaffhold.findFirst({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
                }
                const craftName = ((_e = (_d = (_c = (_b = (_a = userData === null || userData === void 0 ? void 0 : userData.tradesman) === null || _a === void 0 ? void 0 : _a.jobCraftsJoined) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.jobCraft) === null || _d === void 0 ? void 0 : _d.craft) === null || _e === void 0 ? void 0 : _e.name) ||
                    ((_f = userData === null || userData === void 0 ? void 0 : userData.tradesman) === null || _f === void 0 ? void 0 : _f.craft) ||
                    null;
                const craftId = ((_k = (_j = (_h = (_g = userData === null || userData === void 0 ? void 0 : userData.tradesman) === null || _g === void 0 ? void 0 : _g.jobCraftsJoined) === null || _h === void 0 ? void 0 : _h[0]) === null || _j === void 0 ? void 0 : _j.jobCraft) === null || _k === void 0 ? void 0 : _k.id) || null;
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
                    CMPId: ((_l = scaffhold.company) === null || _l === void 0 ? void 0 : _l.CMPId) || null,
                    companyName: ((_m = scaffhold.company) === null || _m === void 0 ? void 0 : _m.name) || null,
                    clientName: ((_o = scaffhold.project) === null || _o === void 0 ? void 0 : _o.clientName) || null,
                    clientMobile: ((_p = scaffhold.project) === null || _p === void 0 ? void 0 : _p.clientMobile) || null,
                    craftName: craftName,
                    craftId: craftId,
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_BY_ID_SUCCESS,
                    data: formattedResponse,
                };
            }
            catch (error) {
                console.error("❌ Get scaffhold by id error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getSearchFilterData(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const scaffholdWhere = { isDeleted: false };
                const { priority, tags, status, sort } = data; // ✅ FIXED: use `tags` instead of `tag`
                if (priority) {
                    if (Array.isArray(priority)) {
                        scaffholdWhere.priority = { in: priority.map((p) => p.toUpperCase()) };
                    }
                    else {
                        scaffholdWhere.priority = priority.toUpperCase();
                    }
                }
                if (tags) {
                    if (Array.isArray(tags)) {
                        scaffholdWhere.tag = { in: tags.map((t) => t.toUpperCase()) };
                    }
                    else {
                        scaffholdWhere.tag = tags.toUpperCase();
                    }
                }
                if (status) {
                    if (Array.isArray(status)) {
                        scaffholdWhere.status = { in: status.map((s) => s.toUpperCase()) };
                    }
                    else {
                        scaffholdWhere.status = status.toUpperCase();
                    }
                }
                const totalCount = yield prismaClient_1.default.scaffhold.count({
                    where: scaffholdWhere,
                });
                const totalPages = Math.ceil(totalCount / limit);
                const scaffholds = yield prismaClient_1.default.scaffhold.findMany({
                    where: scaffholdWhere,
                    orderBy: {
                        createdAt: (sort === null || sort === void 0 ? void 0 : sort.toLowerCase()) === "asc" ? "asc" : "desc",
                    },
                    skip,
                    take: limit,
                    include: {
                        project: { select: { projectName: true, clientName: true } },
                        company: { select: { name: true } },
                    },
                });
                const formattedData = scaffholds.map((item) => {
                    var _a, _b, _c;
                    return ({
                        uuid: item.uuid,
                        projectName: ((_a = item.project) === null || _a === void 0 ? void 0 : _a.projectName) || null,
                        clientName: ((_b = item.project) === null || _b === void 0 ? void 0 : _b.clientName) || null,
                        companyName: ((_c = item.company) === null || _c === void 0 ? void 0 : _c.name) || null,
                        priority: item.priority,
                        tag: item.tag,
                        status: item.status,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        createdAt: item.createdAt,
                    });
                });
                return {
                    success: true,
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
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
                console.error("❌ Error in getSearchFilterData:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getFilteredScaffHolds(id_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (id, data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const whereCondition = { isDeleted: false };
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { id: id },
                    select: { user_type: true }
                });
                if (!user) {
                    throw new customError_1.CustomError("User not found", 404);
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
                }
                else if (userType === "TRADESMAN") {
                }
                const { search, priority, tags, status, sort } = data || {};
                const searchTerm = search === null || search === void 0 ? void 0 : search.trim();
                if (searchTerm && searchTerm !== "") {
                    if (!isNaN(Number(searchTerm))) {
                        whereCondition.id = Number(searchTerm);
                    }
                    else {
                        whereCondition.OR = [
                            { SCAFFID: { contains: searchTerm } },
                            { address: { contains: searchTerm } },
                        ];
                    }
                }
                if (priority) {
                    if (Array.isArray(priority)) {
                        whereCondition.priority = { in: priority.map((p) => p.toUpperCase()) };
                    }
                    else if (typeof priority === "string") {
                        whereCondition.priority = priority.toUpperCase();
                    }
                }
                if (tags) {
                    if (Array.isArray(tags)) {
                        whereCondition.tag = { in: tags.map((t) => t.toUpperCase()) };
                    }
                    else if (typeof tags === "string") {
                        whereCondition.tag = tags.toUpperCase();
                    }
                }
                if (status) {
                    if (Array.isArray(status)) {
                        whereCondition.status = { in: status.map((s) => s.toUpperCase()) };
                    }
                    else if (typeof status === "string") {
                        whereCondition.status = status.toUpperCase();
                    }
                }
                const totalCount = yield prismaClient_1.default.scaffhold.count({ where: whereCondition });
                const totalPages = Math.ceil(totalCount / limit);
                const scaffholds = yield prismaClient_1.default.scaffhold.findMany({
                    where: whereCondition,
                    skip,
                    take: limit,
                    orderBy: { createdAt: (sort === null || sort === void 0 ? void 0 : sort.toLowerCase()) === "asc" ? "asc" : "desc" },
                    include: {
                        company: { select: { CMPId: true, name: true } },
                        project: { select: { clientName: true, clientMobile: true, projectName: true } },
                    },
                });
                const formattedData = scaffholds.map((sc) => {
                    var _a, _b, _c, _d, _e;
                    return ({
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
                        projectName: ((_a = sc.project) === null || _a === void 0 ? void 0 : _a.projectName) || sc.projectName || null,
                        companyId: sc.companyId,
                        companyName: ((_b = sc.company) === null || _b === void 0 ? void 0 : _b.name) || null,
                        CMPId: ((_c = sc.company) === null || _c === void 0 ? void 0 : _c.CMPId) || null,
                        clientName: ((_d = sc.project) === null || _d === void 0 ? void 0 : _d.clientName) || null,
                        clientMobile: ((_e = sc.project) === null || _e === void 0 ? void 0 : _e.clientMobile) || null,
                        createdById: sc.createdById,
                        createdAt: sc.createdAt,
                        updatedAt: sc.updatedAt,
                    });
                });
                return {
                    success: true,
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
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
                console.error("❌ Error in getFilteredScaffHolds:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
}
exports.tradesManServices = tradesManServices;
