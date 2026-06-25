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
// src/services/projectManagerServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
const client_1 = require("@prisma/client");
class ProjectManagerServices {
    getDashboardStats(projectManagerId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const [totalRequests, totalProjects, pendingRequests, activeRequests] = yield Promise.all([
                    // 🔥 TOTAL REQUESTS under projects managed by PM
                    prismaClient_1.default.projectScaffholdRequest.count({
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
                    prismaClient_1.default.project.count({
                        where: {
                            projectManagers: {
                                some: {
                                    id: projectManagerId,
                                },
                            },
                        },
                    }),
                    // 🔥 PENDING REQUESTS
                    prismaClient_1.default.projectScaffholdRequest.count({
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
                    prismaClient_1.default.projectScaffholdRequest.count({
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
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.DASHBOARD_FETCH_SUCCESS,
                    data: dashboardData,
                };
            }
            catch (error) {
                console.error("Error fetching dashboard stats:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.DASHBOARD_FETCH_FAILED, 500, error.message);
            }
        });
    }
    commonLoginServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingProjectManager = yield prismaClient_1.default.user.findUnique({
                    where: { email: data.email, status: "ACTIVE", user_type: { in: ["PROJECT_MANAGER", "COMPETENT_PERSON"] }, isVerified: true }
                });
                if (!existingProjectManager) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Not found with this email");
                }
                if (existingProjectManager.isDeleted) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.DELETED, 403, "User DELETED by Subadmin");
                }
                const isPasswordValid = yield bcryptjs_1.default.compare(data.password, existingProjectManager.password);
                if (!isPasswordValid) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.INVALID_PASSWORD, 500, "Invalid password");
                }
                if (data.user_type !== existingProjectManager.user_type) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 400, "User type mismatch");
                }
                if (!data.companyId) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 400, "Company ID is required");
                }
                const company = yield prismaClient_1.default.company.findFirst({
                    where: {
                        CMPId: data.companyId,
                        isDeleted: false,
                        status: "ACTIVE",
                        isApproved: "APPROVED",
                        isVerified: true
                    }
                });
                if (!company) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Company not active or not approved or Deleted or not verified with this ID");
                }
                if (data.user_type === "PROJECT_MANAGER") {
                    const projectManager = yield prismaClient_1.default.projectManager.findFirst({
                        where: {
                            cmpId: data.companyId,
                            userId: existingProjectManager.id
                        }
                    });
                    if (!projectManager) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "No user found for this company");
                    }
                }
                else if (data.user_type === "COMPETENT_PERSON") {
                    const competentPerson = yield prismaClient_1.default.competentPerson.findFirst({
                        where: {
                            cmpId: data.companyId
                        }
                    });
                    if (!competentPerson) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "No competent person found for this company");
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
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.USER_SUCCESS,
                    token,
                    data: user
                };
            }
            catch (error) {
                console.error("❌ Register error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.LOGIN_FAILE, 500, "Login failed due to server error");
            }
        });
    }
    getProjectListServices(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, page = 1, limit = 10, status, search) {
            console.log("=================>>>>", status);
            try {
                const skip = (page - 1) * limit;
                // ✅ BASE CONDITION
                const whereCondition = {
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
                const [projects, totalCount] = yield Promise.all([
                    prismaClient_1.default.project.findMany({
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
                    projectManager: p.projectManagers,
                    status: p.status,
                    isDeleted: p.isDeleted,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                    totalRequests: p._count.TradesManRequests,
                    totalTimelines: p._count.projectTimelines,
                }));
                console.log("formattedProjects==============>>>>", formattedProjects);
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
                const [requests, totalCount] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.findMany({
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
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: {
                            projectId: data.scaffHoldId, // 🔥 FIXED
                            status: "PENDING",
                        },
                    }),
                ]);
                const formattedData = requests.map((req) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h;
                    return ({
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
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                // ✅ 1. FETCH REQUEST (NEW MODEL)
                const requestData = yield prismaClient_1.default.projectScaffholdRequest.findUnique({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.REQUEST_NOT_FOUND, 404, "No pending request found");
                }
                // ✅ 2. UPDATE REQUEST
                const updatedRequest = yield prismaClient_1.default.projectScaffholdRequest.update({
                    where: { id: data.requestId },
                    data: {
                        status: data.status,
                        reajectionReason: data.status === "REJECTED"
                            ? (_a = data.reajectionReason) !== null && _a !== void 0 ? _a : null
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
                let notificationTitle;
                let notificationType;
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
                        `Your modification request for Project ${requestData.project.projectName} has been ${data.status}.`;
                    notificationImage =
                        data.status === "APPROVED"
                            ? "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/accept.png"
                            : "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/reject.png";
                }
                else {
                    notificationTitle =
                        data.status === "APPROVED"
                            ? "Scaffold Request Approved"
                            : "Scaffold Request Declined";
                    notificationType =
                        data.status === "APPROVED"
                            ? client_1.NotificationType.REQUEST_ACCEPTED
                            : client_1.NotificationType.REQUEST_REJECTED;
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
                    const validTradesman = yield prismaClient_1.default.user.findFirst({
                        where: {
                            id: tradesmanId,
                            isDeleted: false,
                            status: "ACTIVE",
                            isVerified: true,
                            user_type: "TRADESMAN"
                        }
                    });
                    if (validTradesman) {
                        yield prismaClient_1.default.notification.create({
                            data: {
                                uuid: (0, uuid_1.v4)(),
                                title: notificationTitle,
                                message: notificationMessage,
                                type: notificationType,
                                role: "TRADESMAN",
                                receiverId: BigInt(tradesmanId),
                                senderId: (_d = (_c = (_b = requestData.createdBy) === null || _b === void 0 ? void 0 : _b.id) === null || _c === void 0 ? void 0 : _c.toString()) !== null && _d !== void 0 ? _d : "0",
                                isRead: false,
                                notificationImage,
                                tradesmanCraft: requestData.createdBy.craft || null,
                                scaffoldRequestId: updatedRequest.id.toString(),
                            }
                        });
                        const devices = yield prismaClient_1.default.device.findMany({
                            where: {
                                userId: tradesmanId,
                                user_type: "TRADESMAN",
                                deviceToken: { not: null }
                            }
                        });
                        yield Promise.all(devices.map(d => d.deviceToken
                            ? (0, utils_1.pushNotificationDelhi)(d.deviceToken, notificationTitle, notificationMessage)
                            : Promise.resolve()));
                    }
                }
                // ===============================
                // 🔥 COMPETENT PERSON NOTIFICATION
                // ===============================
                const competentUserIds = requestData.project.competentPersons.map(cp => cp.competentPerson.userId);
                const validCompetentUsers = yield prismaClient_1.default.user.findMany({
                    where: {
                        id: { in: competentUserIds },
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                        user_type: "COMPETENT_PERSON"
                    }
                });
                for (const cpUser of validCompetentUsers) {
                    yield prismaClient_1.default.notification.create({
                        data: {
                            uuid: (0, uuid_1.v4)(),
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
                            senderId: (_g = (_f = (_e = requestData.createdBy) === null || _e === void 0 ? void 0 : _e.id) === null || _f === void 0 ? void 0 : _f.toString()) !== null && _g !== void 0 ? _g : "0",
                            notificationImage,
                            tradesmanCraft: requestData.createdBy.craft || null,
                        }
                    });
                }
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: { in: validCompetentUsers.map(u => u.id) },
                        user_type: "COMPETENT_PERSON",
                        deviceToken: { not: null }
                    }
                });
                yield Promise.all(devices.map(d => d.deviceToken
                    ? (0, utils_1.pushNotificationDelhi)(d.deviceToken, notificationTitle, notificationMessage)
                    : Promise.resolve()));
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.UPDATE_SUCCESS,
                    data: updatedRequest,
                };
            }
            catch (error) {
                console.error("❌ Approve/Reject Request error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getAllPendingModifiedRequestsByParentId(userId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (userId, data, page = 1, limit = 10, projectId) {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const pm = yield prismaClient_1.default.projectManager.findUnique({
                    where: {
                        userId: BigInt(userId),
                    },
                    select: {
                        userId: true,
                    },
                });
                if (!pm) {
                    throw new customError_1.CustomError("Project Manager not found", 404, "Project Manager not found");
                }
                const whereCondition = {
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
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm) {
                    const term = searchTerm;
                    if (!isNaN(Number(term))) {
                        whereCondition.OR = [
                            { id: Number(term) },
                            { REQID: { contains: term } },
                        ];
                    }
                    else {
                        whereCondition.OR = [
                            { REQID: { contains: term } },
                            { project: { projectName: { contains: term } } },
                            { project: { clientAddress: { contains: term } } },
                            { createdBy: { user: { name: { contains: term } } } },
                        ];
                    }
                }
                const [requests, totalCount] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.findMany({
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
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: whereCondition,
                    }),
                ]);
                const totalPages = Math.ceil(totalCount / limit);
                const responseData = requests.map((request) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                    return ({
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
                        projectId: (_a = request.project) === null || _a === void 0 ? void 0 : _a.id,
                        projectName: (_b = request.project) === null || _b === void 0 ? void 0 : _b.projectName,
                        address: (_c = request.project) === null || _c === void 0 ? void 0 : _c.clientAddress,
                        latitude: request.latitude,
                        longitude: request.longitude,
                        parentId: (_d = request.parentId) !== null && _d !== void 0 ? _d : null,
                        createdByName: ((_f = (_e = request.createdBy) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.name) || null,
                        createdByImage: ((_k = (_j = (_h = (_g = request.createdBy) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.userMedias) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.url) || null,
                    });
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
                console.error("❌ Error in modified requests:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.REQUEST_MODIFICATIONS_FETCH_FAILED, 500, error.message);
            }
        });
    }
    getTrademanPendingRequestListServices(userId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (userId, data, page = 1, limit = 10, projectId) {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const pm = yield prismaClient_1.default.projectManager.findUnique({
                    where: {
                        userId: BigInt(userId), // token wali PM id
                    },
                    select: {
                        userId: true,
                    },
                });
                if (!pm) {
                    throw new customError_1.CustomError("Project Manager not found", 404, "Project Manager not found");
                }
                const whereCondition = {
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
                const searchTerm = (_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim();
                if (searchTerm) {
                    const term = searchTerm;
                    if (!isNaN(Number(term))) {
                        whereCondition.id = Number(term);
                    }
                    else {
                        whereCondition.OR = [
                            { REQID: { contains: term } },
                            { project: { projectName: { contains: term } } },
                            { project: { clientAddress: { contains: term } } },
                            { createdBy: { user: { name: { contains: term } } } },
                        ];
                    }
                }
                const [requests, totalCount] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.findMany({
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
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: whereCondition,
                    }),
                ]);
                console.log("Fetched requests:", requests, "Total count:", totalCount);
                const formattedData = requests.map((req) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                    return ({
                        id: req.id,
                        uuid: req.uuid,
                        REQID: req.REQID,
                        status: req.status,
                        SCAFFID: req.SCAFFID,
                        craftId: ((_a = req.createdBy) === null || _a === void 0 ? void 0 : _a.craftId) || null,
                        craft: ((_b = req.createdBy) === null || _b === void 0 ? void 0 : _b.craft) || null,
                        length: req.length,
                        width: req.width,
                        height: req.height,
                        priority: req.priority,
                        expectedEndDate: req.expectedEndDate,
                        notes: req.notes,
                        createdAt: req.createdAt,
                        updatedAt: req.updatedAt,
                        // project info
                        projectId: ((_c = req.project) === null || _c === void 0 ? void 0 : _c.id) || null,
                        projectName: ((_d = req.project) === null || _d === void 0 ? void 0 : _d.projectName) || null,
                        address: ((_e = req.project) === null || _e === void 0 ? void 0 : _e.clientAddress) || null,
                        latitude: req.latitude,
                        longitude: req.longitude,
                        createdById: req.createdById,
                        createdByName: ((_g = (_f = req.createdBy) === null || _f === void 0 ? void 0 : _f.user) === null || _g === void 0 ? void 0 : _g.name) || null,
                        createdByImage: ((_l = (_k = (_j = (_h = req.createdBy) === null || _h === void 0 ? void 0 : _h.user) === null || _j === void 0 ? void 0 : _j.userMedias) === null || _k === void 0 ? void 0 : _k[0]) === null || _l === void 0 ? void 0 : _l.url) || null,
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
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getScaffHoldJobAndCraftDetails(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 🔥 NEW: direct jobCraft table (no scaffhold dependency)
                const jobCrafts = yield prismaClient_1.default.projectJobCraft.findMany({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.NOT_FOUND, 404, "No job crafts found");
                }
                // 🔥 FORMAT RESPONSE
                const formattedJobCrafts = jobCrafts.map((jc) => {
                    var _a, _b;
                    return ({
                        id: jc.id,
                        craftId: jc.craftId,
                        counts: jc.counts,
                        joinedCount: jc.joinedCount,
                        name: ((_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name) || null,
                        craftImage: ((_b = jc.craft) === null || _b === void 0 ? void 0 : _b.craftImage) || null,
                        createdAt: jc.createdAt,
                        updatedAt: jc.updatedAt,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.FETCH_SUCCESS,
                    data: {
                        jobCrafts: formattedJobCrafts,
                    },
                };
            }
            catch (error) {
                console.error("❗ Error in getJobAndCraftDetails:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getScaffholdRequestsByCreator(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [updates, totalCount] = yield Promise.all([
                    prismaClient_1.default.updateProjectScaffHoldRequest.findMany({
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
                    prismaClient_1.default.updateProjectScaffHoldRequest.count({
                        where: { requestId: data.requestId },
                    }),
                ]);
                const formattedData = updates.map((u) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        updateId: u.id,
                        requestId: u.requestId,
                        size: `${u.length || "N/A"} ft x ${u.width || "N/A"} ft x ${u.height || "N/A"} ft`,
                        priority: u.priority || "N/A",
                        expectedEndDate: u.expectedEndDate || "Not specified",
                        notes: u.notes || "No notes available",
                        createdAt: u.createdAt,
                        // 🔥 FIXED: proper creator mapping
                        createdBy: ((_a = u.scaffholdRequest) === null || _a === void 0 ? void 0 : _a.createdById) || null,
                        // 🔥 OPTIONAL: project info (useful in UI)
                        projectName: ((_c = (_b = u.scaffholdRequest) === null || _b === void 0 ? void 0 : _b.project) === null || _c === void 0 ? void 0 : _c.projectName) || null,
                        projectAddress: ((_e = (_d = u.scaffholdRequest) === null || _d === void 0 ? void 0 : _d.project) === null || _e === void 0 ? void 0 : _e.clientAddress) || null,
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
                console.error("Error fetching scaffhold requests:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLDREQUEST.FETCH_FAILED, 500, error.message);
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
    updateUserProfileImage(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userExists = yield prismaClient_1.default.userMedia.findFirst({
                    where: {
                        userId: userId,
                        mediaType: client_1.MediaType.PHOTO_IMAGE,
                    },
                });
                if (!userExists) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "NOT found ");
                }
                const updatedImage = yield prismaClient_1.default.userMedia.update({
                    where: { id: userExists.id },
                    data: { url: data.profileImage },
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
    generateProjectJobLink(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("PJT==================>>>", projectId);
                console.log("projectId:", projectId);
                // ✅ FIND PROJECT
                const project = yield prismaClient_1.default.project.findFirst({
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
                    throw new customError_1.CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
                }
                // ✅ GENERATE JOB LINK
                const jobLink = `https://api.scaffsnapp.com/api/v1/projectManager/job/${project.PJT}`;
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
            }
            catch (error) {
                console.error("❌ Service error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(error.message ||
                    "Failed to generate project job link", error.statusCode || 500, error.details ||
                    "INTERNAL_ERROR");
            }
        });
    }
}
exports.ProjectManagerServices = ProjectManagerServices;
