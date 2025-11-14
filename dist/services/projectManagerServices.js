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
exports.ProjectManagerServices = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
class ProjectManagerServices {
    getDashboardStats(projectManagerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalScaffholds, totalProjects, pendingRequests, activeScaffholds] = yield Promise.all([
                    prismaClient_1.default.scaffhold.count({
                        where: {
                            createdById: projectManagerId
                        }
                    }),
                    prismaClient_1.default.project.count({
                        where: { projectManagerId },
                    }),
                    prismaClient_1.default.scaffholdRequest.count({
                        where: {
                            status: "PENDING",
                            scaffhold: {
                                createdById: projectManagerId
                            }
                        },
                    }),
                    prismaClient_1.default.scaffhold.count({
                        where: {
                            status: "ACTIVE", project: {
                                projectManagerId: projectManagerId
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
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.DASHBOARD_FETCH_SUCCESS,
                    data: dashboardData,
                };
            }
            catch (error) {
                console.error("Error fetching dashboard stats:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.DASHBOARD_FETCH_FAILED, 500, error.message);
            }
        });
    }
    commonLoginServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingProjectManager = yield prismaClient_1.default.user.findFirst({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE", user_type: { in: ["PROJECT_MANAGER", "COMPETENT_PERSON"] } }
                });
                if (!existingProjectManager) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.NOT_FOUND, 500, "Not found with this email");
                }
                const isPasswordValid = yield bcryptjs_1.default.compare(data.password, existingProjectManager.password);
                if (!isPasswordValid) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.INVALID_PASSWORD, 500, "Invalid password");
                }
                if (data.user_type !== existingProjectManager.user_type) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.NOT_FOUND, 500, "User type mismatch");
                }
                if (data.user_type === "PROJECT_MANAGER") {
                    const projectManager = yield prismaClient_1.default.projectManager.findFirst({
                        where: {
                            cmpId: data.companyId,
                            userId: existingProjectManager.id
                        }
                    });
                    if (!projectManager) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.NOT_FOUND, 500, "No project manager found for this company");
                    }
                }
                else if (data.user_type === "COMPETENT_PERSON") {
                    const competentPerson = yield prismaClient_1.default.competentPerson.findFirst({
                        where: {
                            cmpId: data.companyId
                        }
                    });
                    if (!competentPerson) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.NOT_FOUND, 500, "No competent person found for this company");
                    }
                }
                const jwtPayload = {
                    id: existingProjectManager.id.toString(),
                    uuid: existingProjectManager.uuid,
                    login_id: existingProjectManager.email,
                    user_type: existingProjectManager.user_type,
                };
                const token = (0, utils_1.generateToken)(jwtPayload);
                yield prismaClient_1.default.user.update({
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
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.LOGIN_SUCCESS,
                    token,
                    data: user
                };
            }
            catch (error) {
                console.error("❌ Register error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.LOGIN_FAILED, 500, "Login failed due to server error");
            }
        });
    }
    getProjectListServices(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, page = 1, limit = 10, status) {
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {
                    isDeleted: false,
                    projectManagerId: id
                };
                if (status && typeof status === "string" && status.trim() !== "") {
                    whereCondition.status = status.toUpperCase();
                }
                const [projects, totalCount] = yield Promise.all([
                    prismaClient_1.default.project.findMany({
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
                            projectManagerId: true,
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
                    prismaClient_1.default.project.count({ where: whereCondition }),
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
                    projectManagerId: p.projectManagerId,
                    status: p.status,
                    isDeleted: p.isDeleted,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                    totalScaffhold: p._count.scaffholds,
                }));
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_ALL_SUCCESS,
                    data: formattedProjects,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ Get Project List error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getUserDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const user = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: id,
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
                    throw new customError_1.CustomError("USER_NOT_FOUND", 404, "User not found");
                }
                const cmpId = ((_a = user.projectManager) === null || _a === void 0 ? void 0 : _a.cmpId) || ((_b = user.competentPerson) === null || _b === void 0 ? void 0 : _b.cmpId) || null;
                const { userMedias, projectManager, competentPerson } = user, rest = __rest(user, ["userMedias", "projectManager", "competentPerson"]);
                const idProofImage = ((_c = user.userMedias.find(media => media.mediaType === "ID_PROOF_IMAGE")) === null || _c === void 0 ? void 0 : _c.url) || null;
                const photoImage = ((_d = user.userMedias.find(media => media.mediaType === "PHOTO_IMAGE")) === null || _d === void 0 ? void 0 : _d.url) || null;
                return {
                    message: "User details fetched successfully",
                    data: Object.assign(Object.assign({}, rest), { cmpId, idProofImage: idProofImage, photoImage: photoImage })
                };
            }
            catch (error) {
                console.error("❌ Get user details error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError("FETCH_FAILED", 500, error.message);
            }
        });
    }
    getRequestedScaffolds(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [scaffolds, totalCount] = yield Promise.all([
                    prismaClient_1.default.scaffholdRequest.findMany({
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
                    prismaClient_1.default.scaffholdRequest.count({
                        where: { scaffholdId: data.scaffHoldId },
                    }),
                ]);
                const formattedData = scaffolds.map((req) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    return ({
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
                        createdById: ((_a = req.createdBy) === null || _a === void 0 ? void 0 : _a.id) || null,
                        createdByName: ((_c = (_b = req.createdBy) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.name) || null,
                        createdByCraft: ((_d = req.createdBy) === null || _d === void 0 ? void 0 : _d.craft) || null,
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
                console.error("❌ Get Requested Scaffolds error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED, 500, error.message);
            }
        });
    }
    approveOrRejectScaffHoldRequest(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const requestData = yield prismaClient_1.default.scaffholdRequest.findUnique({
                    where: {
                        id: data.requestId,
                        scaffholdId: data.scaffHoldId,
                        status: "PENDING"
                    }
                });
                if (!requestData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.NOT_FOUND, 404, "No pending request found with this ID and ScaffHold ID");
                }
                const updatedRequest = yield prismaClient_1.default.scaffholdRequest.update({
                    where: { id: data.requestId },
                    data: {
                        status: data.status,
                        reason: data.status === "REJECTED" ? (_a = data.reajectionReason) !== null && _a !== void 0 ? _a : null : null,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_SUCCESS,
                    data: updatedRequest,
                };
            }
            catch (error) {
                console.error("❌ Approve/Reject ScaffHold Request error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getAllPendingModifiedRequestsByParentId(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {
                    parentId: { not: null },
                    status: "PENDING"
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
                    limit
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
    getTrademanPendingRequestListServices(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const whereCondition = {
                    status: "PENDING"
                };
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm && searchTerm !== "") {
                    const term = searchTerm;
                    if (!isNaN(Number(term))) {
                        whereCondition.id = Number(term);
                    }
                    else {
                        whereCondition.OR = [
                            { REQID: { contains: term, } },
                            { scaffhold: { projectName: { contains: term, } } }, // ✅ project name
                            { scaffhold: { address: { contains: term, } } },
                            { createdBy: { user: { name: { contains: term, } } } }, // ✅ created by name
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
                        totalPages: Math.ceil(totalCount / limit),
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
    getScaffHoldJobAndCraftDetails(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffhold = yield prismaClient_1.default.scaffhold.findUnique({
                    where: { id: data.scaffHoldId, isDeleted: false },
                    include: {
                        jobCrafts: {
                            include: { craft: true },
                            orderBy: { id: 'desc' },
                        },
                    },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
                }
                const { jobCrafts } = scaffhold;
                const formattedJobCrafts = jobCrafts.map((jc) => {
                    var _a, _b, _c, _d;
                    return ({
                        id: jc.id,
                        craftId: jc.craftId,
                        counts: jc.counts,
                        joinedCount: jc.joinedCount,
                        name: ((_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name) || null,
                        craftImage: ((_b = jc.craft) === null || _b === void 0 ? void 0 : _b.craftImage) || null,
                        createdAt: ((_c = jc.craft) === null || _c === void 0 ? void 0 : _c.createdAt) || jc.createdAt,
                        updatedAt: ((_d = jc.craft) === null || _d === void 0 ? void 0 : _d.updatedAt) || jc.updatedAt,
                    });
                });
                const responseData = {
                    jobCrafts: formattedJobCrafts,
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.FETCH_SUCCESS,
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❗ Error in getJobAndCraftDetails:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getScaffholdRequestsByCreator(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [updates, totalCount] = yield Promise.all([
                    prismaClient_1.default.updateScaffHoldRequest.findMany({
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
                    prismaClient_1.default.updateScaffHoldRequest.count({
                        where: { requestId: data.requestId },
                    }),
                ]);
                const formattedData = updates.map((u) => ({
                    updateId: u.id,
                    requestId: u.requestId,
                    scaffholdId: u.scaffholdId,
                    size: `${u.length || "N/A"} x ${u.width || "N/A"} x ${u.height || "N/A"}`,
                    priority: u.priority || "N/A",
                    expectedEndDate: u.expectedEndDate || "Not specified",
                    notes: u.notes || "No notes available",
                    createdAt: u.createdAt,
                    createdBy: u.scaffholdRequest.createdById
                }));
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
                console.error("Error fetching scaffhold requests:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED, 500, error.message);
            }
        });
    }
    updateProfileImage(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userExists = yield prismaClient_1.default.userMedia.findFirst({
                    where: { userId: userId },
                });
                if (!userExists) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "NOT found ");
                }
                const updatedImage = yield prismaClient_1.default.userMedia.update({
                    where: { id: userExists.id },
                    data: { url: data.idProofImage },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.IMAGE.UPADTE_IMAGE,
                    data: updatedImage,
                };
            }
            catch (error) {
                console.error("Error fetching image data:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.IMAGE.FAIL_UPADTE_IMAGE, 500, error.message);
            }
        });
    }
}
exports.ProjectManagerServices = ProjectManagerServices;
