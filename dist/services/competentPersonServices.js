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
exports.CompetentPersonServices = void 0;
// src/services/competentPersonServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
class CompetentPersonServices {
    dashboard(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 🔥 GET ALL REQUESTS ASSIGNED TO COMPETENT PERSON
                const assignedRequests = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: {
                        project: {
                            competentPersons: {
                                some: {
                                    competentPerson: {
                                        userId: userId,
                                    },
                                },
                            },
                        },
                    },
                });
                // 🔥 UNTAGED (default state)
                const untaggedCount = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: {
                        tag: "UNTAGED",
                        project: {
                            competentPersons: {
                                some: {
                                    competentPerson: {
                                        userId: userId,
                                    },
                                },
                            },
                        },
                    },
                });
                // 🔥 ACTIVE
                const activeCount = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: {
                        status: "APPROVED", // or ACTIVE equivalent in request flow
                        project: {
                            competentPersons: {
                                some: {
                                    competentPerson: {
                                        userId: userId,
                                    },
                                },
                            },
                        },
                    },
                });
                // 🔥 DISMANTLED (if mapped via status in request system)
                const dismantledCount = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: {
                        status: "REJECTED", // adjust if you use different lifecycle
                        project: {
                            competentPersons: {
                                some: {
                                    competentPerson: {
                                        userId: userId,
                                    },
                                },
                            },
                        },
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.DASHBOARD_SUCCESS,
                    data: {
                        assignedRequests: assignedRequests,
                        untaggedRequests: untaggedCount,
                        activeRequests: activeCount,
                        dismantledRequests: dismantledCount,
                    },
                };
            }
            catch (error) {
                console.error("❗ Error in dashboard:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.DASHBOARD_FAILED, 500, error.message);
            }
        });
    }
    getCompetentProjectListServices(id_1) {
        return __awaiter(this, arguments, void 0, function* (id, page = 1, limit = 10, status, search) {
            console.log("=================>>>>", status);
            try {
                const skip = (page - 1) * limit;
                // ✅ BASE CONDITION
                const whereCondition = {
                    isDeleted: false,
                    competentPersons: {
                        some: {
                            competentPerson: {
                                userId: id,
                            },
                        },
                    },
                };
                // ✅ STATUS FILTER (FINAL FIX)
                if (status && status.trim() !== "") {
                    whereCondition.status = status.trim().toUpperCase();
                }
                if (search && search.trim() !== "") {
                    whereCondition.projectName = {
                        contains: search.trim(),
                    };
                }
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
                            TradesManRequests: {
                                where: {
                                    status: {
                                        notIn: [
                                            "PENDING",
                                            "REJECTED",
                                            "SUSPENDED"
                                        ]
                                    }
                                },
                                select: {
                                    id: true
                                }
                            },
                            _count: {
                                select: {
                                    projectTimelines: true,
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
                    totalRequests: p.TradesManRequests.length,
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
    createInspection(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // =========================
                // 👷 CHECK COMPETENT PERSON
                // =========================
                const competentPerson = yield prismaClient_1.default.competentPerson.findFirst({
                    where: {
                        userId: userId,
                    },
                    select: {
                        user: {
                            select: {
                                status: true,
                                isDeleted: true,
                            },
                        },
                    },
                });
                if (!competentPerson || ((_a = competentPerson.user) === null || _a === void 0 ? void 0 : _a.status) !== "ACTIVE") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Competent person not found");
                }
                if ((_b = competentPerson.user) === null || _b === void 0 ? void 0 : _b.isDeleted) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.DELETED, 400, "Competent person is deleted");
                }
                // =========================
                // 🔥 GET REQUEST
                // =========================
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
                    where: {
                        id: BigInt(data.scaffHoldId),
                    },
                });
                console.log("request===========>>>>", request);
                if (!request) {
                    throw new customError_1.CustomError("Scaffold request not found", 404, "REQUEST_NOT_FOUND");
                }
                // =========================
                // 🔥 CREATE INSPECTION
                // =========================
                const inspection = yield prismaClient_1.default.competentPersonProjectInspection.create({
                    data: {
                        scaffoldRequestId: request.id,
                        projectId: request.projectId, // ✅ CORRECT FIX
                        Date: data.Date,
                        shift: data.shift,
                        note: data.notes,
                        createdById: BigInt(userId),
                    },
                });
                console.log("inspection========================>>>", inspection);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON
                        .SUCCESS_INSPECTION_CREATION,
                    data: inspection,
                };
            }
            catch (error) {
                console.error("❗ Error in createInspection:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON
                    .FAILED_INSPECTION_CREATION, 500, error.message);
            }
        });
    }
    getInspectionsByScaffholdId(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                // =========================
                // 🔥 STEP 1: GET REQUEST
                // =========================
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
                    where: {
                        id: BigInt(data.scaffHoldId),
                    },
                });
                if (!request) {
                    throw new customError_1.CustomError("Request not found", 404, "REQUEST_NOT_FOUND");
                }
                const scaffHoldRequest = request.id;
                // =========================
                // 🔥 STEP 2: INSPECTIONS
                // =========================
                const [inspections, totalCount] = yield Promise.all([
                    prismaClient_1.default.competentPersonProjectInspection.findMany({
                        where: {
                            scaffoldRequestId: scaffHoldRequest, // ✅ FIXED
                        },
                        skip,
                        take: limit,
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            projectId: true,
                            createdById: true,
                            shift: true,
                            note: true,
                            Date: true,
                            createdAt: true,
                            updatedAt: true,
                            createdBy: {
                                select: {
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    }),
                    prismaClient_1.default.competentPersonProjectInspection.count({
                        where: {
                            scaffoldRequestId: scaffHoldRequest,
                        },
                    }),
                ]);
                // =========================
                // 🔥 FLAT RESPONSE
                // =========================
                const newResponse = inspections.map((i) => {
                    var _a, _b;
                    return ({
                        id: i.id,
                        projectId: i.projectId,
                        shift: i.shift,
                        note: i.note,
                        Date: i.Date,
                        createdAt: i.createdAt,
                        updatedAt: i.updatedAt,
                        createdByName: ((_a = i.createdBy) === null || _a === void 0 ? void 0 : _a.name) || null,
                        createdByEmail: ((_b = i.createdBy) === null || _b === void 0 ? void 0 : _b.email) || null,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_GET_INSPECTIONS,
                    data: newResponse,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❗ Error in getInspectionsByScaffholdId:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_GET_INSPECTIONS, 500, error.message);
            }
        });
    }
    competentPersonTimeline(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                // 🔥 USER VALIDATION (same)
                const user = yield prismaClient_1.default.user.findFirst({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true,
                    },
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Competent person not found");
                }
                if (user.isDeleted === true) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.DELETED, 400, "Competent person is deleted");
                }
                // 🔥 REPLACE scaffhold → ProjectScaffholdRequest
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
                    where: {
                        id: data.scaffHoldId,
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffold request not found");
                }
                // 🔥 duplicate timeline check
                if (data.timeLineStatus) {
                    const existingTimeline = yield prismaClient_1.default.projectScaffholdTimeline.findFirst({
                        where: {
                            // ✅ FIXED
                            scaffoldRequestId: request.id,
                            timeLineStatus: data.timeLineStatus,
                        },
                    });
                    if (existingTimeline) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON
                            .DUPLICATE_TIMELINE_STATUS, 400);
                    }
                }
                // 🔥 CREATE TIMELINE
                const timeline = yield prismaClient_1.default.projectScaffholdTimeline.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        // ✅ PROJECT
                        projectId: request.projectId,
                        // ✅ REQUEST
                        scaffoldRequestId: request.id,
                        timeLineStatus: data.timeLineStatus,
                        note: data.notes,
                        createdById: userId,
                        address: data.address,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        image: data.images &&
                            data.images.length > 0
                            ? {
                                create: data.images.map((url) => ({
                                    url,
                                    status: data.timeLineStatus,
                                })),
                            }
                            : undefined,
                    },
                    include: {
                        image: true,
                    },
                });
                // =======================================
                // START RENTAL CYCLE
                // =======================================
                if (data.timeLineStatus === "ERECTED") {
                    // 🔥 Close previous cycle
                    const lastCycle = yield prismaClient_1.default.rentalCycle.findFirst({
                        where: {
                            scaffoldRequestId: request.id,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    });
                    if (lastCycle) {
                        const diffMs = new Date().getTime() -
                            lastCycle.erectedAt.getTime();
                        const totalDays = Math.max(1, Math.ceil(diffMs /
                            (1000 * 60 * 60 * 24)));
                        yield prismaClient_1.default.rentalCycle.update({
                            where: {
                                id: lastCycle.id,
                            },
                            data: {
                                totalDays,
                            },
                        });
                    }
                    // 🔥 CREATE NEW CYCLE
                    yield prismaClient_1.default.rentalCycle.create({
                        data: {
                            uuid: (0, uuid_1.v4)(),
                            projectId: request.projectId,
                            scaffoldRequestId: request.id,
                            erectedAt: new Date(),
                            totalDays: 0,
                            cycleCount: 0,
                            rentalDays: 0,
                        },
                    });
                }
                // 🔥 UPDATE REQUEST STATUS
                yield prismaClient_1.default.projectScaffholdRequest.update({
                    where: {
                        id: request.id,
                    },
                    data: {
                        status: data.timeLineStatus,
                    },
                });
                // 🔥 RESPONSE FORMAT
                const formattedResponse = {
                    id: timeline.id,
                    uuid: timeline.uuid,
                    projectId: timeline.projectId,
                    scaffoldRequestId: timeline.scaffoldRequestId,
                    date: request.startDate,
                    timeLineStatus: timeline.timeLineStatus,
                    note: timeline.note,
                    createdById: timeline.createdById,
                    createdAt: timeline.createdAt,
                    updatedAt: timeline.updatedAt,
                    images: timeline.image.map((img) => img.url),
                    address: timeline.address,
                    latitude: timeline.latitude,
                    longitude: timeline.longitude,
                };
                // 🔥 FULL PROJECT DATA
                const projectFullData = yield prismaClient_1.default.project.findUnique({
                    where: {
                        id: request.projectId,
                    },
                    select: {
                        createdById: true,
                        tradesMen: {
                            select: {
                                tradesMan: {
                                    select: {
                                        userId: true,
                                    },
                                },
                            },
                        },
                        competentPersons: {
                            select: {
                                competentPerson: {
                                    select: {
                                        userId: true,
                                    },
                                },
                            },
                        },
                    },
                });
                // 🔥 NOTIFICATION MESSAGE
                const notificationMessage = `Project ${request.projectId} | ${(_a = request.project) === null || _a === void 0 ? void 0 : _a.projectName} has been ${data.timeLineStatus}. Action performed by ${user.name}.`;
                // 🔥 COMPANY NOTIFICATION
                if (projectFullData) {
                    yield prismaClient_1.default.notification.create({
                        data: {
                            uuid: (0, uuid_1.v4)(),
                            title: `Project ${data.timeLineStatus}`,
                            message: notificationMessage,
                            type: "SCAFFOLD_STATUS_UPDATE",
                            role: "COMPANY",
                            companyId: projectFullData.createdById,
                            receiverId: projectFullData.createdById,
                            senderId: userId.toString(),
                            scaffoldRequestId: request.id.toString(),
                            isRead: false,
                            notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/scaffDismented.png",
                        },
                    });
                    // 🔥 DEVICE PUSH (COMPANY)
                    const companyDevice = yield prismaClient_1.default.device.findMany({
                        where: {
                            userId: Number(projectFullData.createdById),
                            user_type: "COMPANY",
                            deviceToken: { not: null },
                        },
                        select: {
                            deviceToken: true,
                        },
                    });
                    for (const d of companyDevice) {
                        if (!d.deviceToken)
                            continue;
                        yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, `Project ${data.timeLineStatus}`, notificationMessage);
                    }
                }
                // 🔥 PROJECT MANAGERS
                const projectWithPMs = yield prismaClient_1.default.project.findUnique({
                    where: {
                        id: request.projectId,
                    },
                    include: {
                        projectManagers: {
                            select: {
                                id: true,
                            },
                        },
                    },
                });
                const projectManagerIds = (projectWithPMs === null || projectWithPMs === void 0 ? void 0 : projectWithPMs.projectManagers.map((pm) => pm.id)) || [];
                for (const pmId of projectManagerIds) {
                    yield prismaClient_1.default.notification.create({
                        data: {
                            uuid: (0, uuid_1.v4)(),
                            title: `Project ${data.timeLineStatus}`,
                            message: notificationMessage,
                            type: "SCAFFOLD_STATUS_UPDATE",
                            role: "PROJECT_MANAGER",
                            companyId: (_b = projectFullData === null || projectFullData === void 0 ? void 0 : projectFullData.createdById) !== null && _b !== void 0 ? _b : undefined,
                            receiverId: pmId,
                            senderId: userId.toString(),
                            scaffoldRequestId: request.id.toString(),
                            isRead: false,
                            notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/status.png",
                        },
                    });
                    const pmDevices = yield prismaClient_1.default.device.findMany({
                        where: {
                            userId: pmId,
                            user_type: "PROJECT_MANAGER",
                            deviceToken: { not: null },
                        },
                        select: {
                            deviceToken: true,
                        },
                    });
                    for (const d of pmDevices) {
                        if (!d.deviceToken)
                            continue;
                        yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, `Project ${data.timeLineStatus}`, notificationMessage);
                    }
                }
                // 🔥 TRADESMEN
                const tradesmenData = yield prismaClient_1.default.project.findFirst({
                    where: {
                        id: request.projectId,
                    },
                    select: {
                        tradesMen: {
                            select: {
                                tradesMan: {
                                    select: {
                                        userId: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if ((_c = tradesmenData === null || tradesmenData === void 0 ? void 0 : tradesmenData.tradesMen) === null || _c === void 0 ? void 0 : _c.length) {
                    for (const tm of tradesmenData.tradesMen) {
                        const receiverId = (_d = tm.tradesMan) === null || _d === void 0 ? void 0 : _d.userId;
                        if (!receiverId)
                            continue;
                        yield prismaClient_1.default.notification.create({
                            data: {
                                uuid: (0, uuid_1.v4)(),
                                title: `Project ${data.timeLineStatus}`,
                                message: notificationMessage,
                                type: "SCAFFOLD_STATUS_UPDATE",
                                role: "TRADESMAN",
                                companyId: (_e = projectFullData === null || projectFullData === void 0 ? void 0 : projectFullData.createdById) !== null && _e !== void 0 ? _e : undefined,
                                scaffoldRequestId: request.id.toString(),
                                receiverId,
                                senderId: userId.toString(),
                                isRead: false,
                                notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/status.png",
                            },
                        });
                        const tmDevices = yield prismaClient_1.default.device.findMany({
                            where: {
                                userId: receiverId,
                                user_type: "TRADESMAN",
                                deviceToken: { not: null },
                            },
                            select: {
                                deviceToken: true,
                            },
                        });
                        for (const d of tmDevices) {
                            if (!d.deviceToken)
                                continue;
                            yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, `Project ${data.timeLineStatus}`, notificationMessage);
                        }
                    }
                }
                // 🔥 COMPETENT PERSONS
                const competentPersonsData = ((_f = projectFullData === null || projectFullData === void 0 ? void 0 : projectFullData.competentPersons) === null || _f === void 0 ? void 0 : _f.map((cp) => ({
                    userId: cp.competentPerson.userId,
                }))) || [];
                if (competentPersonsData.length > 0) {
                    const userIds = competentPersonsData.map((cp) => cp.userId);
                    const cpDevices = yield prismaClient_1.default.device.findMany({
                        where: {
                            userId: { in: userIds },
                            deviceToken: { not: null },
                        },
                        select: {
                            userId: true,
                            deviceToken: true,
                        },
                    });
                    yield prismaClient_1.default.notification.createMany({
                        data: competentPersonsData.map((cp) => ({
                            uuid: (0, uuid_1.v4)(),
                            title: `Project ${data.timeLineStatus}`,
                            message: notificationMessage,
                            type: "SCAFFOLD_STATUS_UPDATE",
                            role: "COMPETENT_PERSON",
                            isRead: false,
                            companyId: (projectFullData === null || projectFullData === void 0 ? void 0 : projectFullData.createdById)
                                ? BigInt(projectFullData.createdById)
                                : null,
                            receiverId: BigInt(cp.userId),
                            senderId: userId.toString(),
                            scaffoldRequestId: request.id.toString(),
                            notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/status.png",
                        })),
                    });
                    for (const d of cpDevices) {
                        if (!d.deviceToken)
                            continue;
                        yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, "Project Update", notificationMessage);
                    }
                }
                // 🔥 FINAL RETURN
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES
                        .COMPETENTPERSON
                        .SUCCESS_CREATE_TIMELINE,
                    data: formattedResponse,
                };
            }
            catch (error) {
                console.error("❗ Error in competentPersonTimeline:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES
                    .COMPETENTPERSON
                    .FAILED_CREATE_TIMELINE, 500, error.message);
            }
        });
    }
    Timelinetag(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const dutyCount = [
                    data.lightDuty,
                    data.mediumDuty,
                    data.heavyDuty,
                ].filter(Boolean).length;
                if (dutyCount > 1) {
                    throw new customError_1.CustomError("Only one duty type can be selected", 400);
                }
                // =======================================
                // USER VALIDATION
                // =======================================
                const user = yield prismaClient_1.default.user.findFirst({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                    },
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Competent person not found");
                }
                // =======================================
                // GET REQUEST
                // =======================================
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
                    where: {
                        id: data.scaffHoldId,
                    },
                    include: {
                        project: {
                            select: {
                                id: true,
                                PJT: true,
                                createdById: true,
                                competentPersons: {
                                    include: {
                                        competentPerson: true,
                                    },
                                },
                                tradesMen: {
                                    select: {
                                        tradesMan: {
                                            select: {
                                                userId: true,
                                            },
                                        },
                                        tradesManId: true,
                                    },
                                },
                            },
                        },
                    },
                });
                if (!request) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffold request not found");
                }
                const project = request.project;
                // =======================================
                // GET LAST TIMELINE STATUS
                // =======================================
                const lastTimeline = yield prismaClient_1.default.projectScaffholdTimeline.findFirst({
                    where: {
                        scaffoldRequestId: request.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });
                if (!lastTimeline) {
                    throw new customError_1.CustomError("No timeline found for this scaffold request", 400);
                }
                // =======================================
                // DUPLICATE TAG CHECK
                // =======================================
                const existingTagTimeline = yield prismaClient_1.default.projectScaffholdTimeline.findFirst({
                    where: {
                        scaffoldRequestId: request.id,
                        tag: data.tag,
                    },
                });
                if (existingTagTimeline) {
                    throw new customError_1.CustomError("This tag has already been applied.", 400);
                }
                // =======================================
                // CREATE TIMELINE
                // =======================================
                const timeline = yield prismaClient_1.default.projectScaffholdTimeline.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        projectId: request.projectId,
                        scaffoldRequestId: request.id,
                        // ✅ FETCHED FROM LAST TIMELINE
                        timeLineStatus: lastTimeline.timeLineStatus,
                        tag: data.tag,
                        note: data.notes,
                        createdById: userId,
                    },
                });
                // =======================================
                // UPDATE RENTAL CYCLE
                // =======================================
                const activeCycle = yield prismaClient_1.default.rentalCycle.findFirst({
                    where: {
                        scaffoldRequestId: request.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                });
                if (activeCycle) {
                    const now = new Date();
                    const diffMs = now.getTime() -
                        activeCycle.erectedAt.getTime();
                    const totalDays = Math.max(1, Math.ceil(diffMs /
                        (1000 * 60 * 60 * 24)));
                    // ✅ NO 28 DAYS VALIDATION
                    yield prismaClient_1.default.rentalCycle.update({
                        where: {
                            id: activeCycle.id,
                        },
                        data: {
                            cycleCount: activeCycle.cycleCount + 1,
                            rentalDays: totalDays,
                            totalDays,
                        },
                    });
                }
                // =======================================
                // UPDATE REQUEST TAG
                // =======================================
                yield prismaClient_1.default.projectScaffholdRequest.update({
                    where: {
                        id: request.id,
                    },
                    data: Object.assign(Object.assign(Object.assign({ tag: data.tag }, (data.lightDuty !== undefined && {
                        lightDuty: data.lightDuty,
                    })), (data.mediumDuty !== undefined && {
                        mediumDuty: data.mediumDuty,
                    })), (data.heavyDuty !== undefined && {
                        heavyDuty: data.heavyDuty,
                    })),
                });
                // =======================================
                // RESPONSE FORMAT
                // =======================================
                const formattedResponse = {
                    id: timeline.id,
                    uuid: timeline.uuid,
                    projectId: timeline.projectId,
                    scaffoldRequestId: timeline.scaffoldRequestId,
                    timeLineStatus: timeline.timeLineStatus,
                    tag: timeline.tag,
                    note: timeline.note,
                    createdById: timeline.createdById,
                    createdAt: timeline.createdAt,
                    updatedAt: timeline.updatedAt,
                };
                const companyId = project === null || project === void 0 ? void 0 : project.createdById;
                const notificationMessage = `Project ${project === null || project === void 0 ? void 0 : project.PJT} has been marked as ${data.tag}. Action performed by ${user.name}.`;
                // =======================================
                // COMPANY NOTIFICATION
                // =======================================
                yield prismaClient_1.default.notification.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        title: `Project ${data.tag}`,
                        message: notificationMessage,
                        type: "SCAFFOLD_STATUS_UPDATE",
                        role: "COMPANY",
                        scaffoldRequestId: request.id.toString(),
                        companyId,
                        receiverId: companyId,
                        senderId: userId.toString(),
                        isRead: false,
                        notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/tag.png",
                    },
                });
                // =======================================
                // COMPANY PUSH
                // =======================================
                const companyDevices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: Number(companyId),
                        deviceToken: {
                            not: null,
                        },
                    },
                    select: {
                        deviceToken: true,
                    },
                });
                for (const d of companyDevices) {
                    if (!d.deviceToken)
                        continue;
                    yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, `Project ${data.tag}`, notificationMessage);
                }
                // =======================================
                // PROJECT MANAGER
                // =======================================
                if (companyId) {
                    yield prismaClient_1.default.notification.create({
                        data: {
                            uuid: (0, uuid_1.v4)(),
                            title: `Project ${data.tag}`,
                            message: notificationMessage,
                            type: "SCAFFOLD_STATUS_UPDATE",
                            role: "PROJECT_MANAGER",
                            scaffoldRequestId: request.id.toString(),
                            companyId,
                            receiverId: companyId,
                            senderId: userId.toString(),
                            isRead: false,
                            notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/tag.png",
                        },
                    });
                    const creatorDevices = yield prismaClient_1.default.device.findMany({
                        where: {
                            userId: Number(companyId),
                            deviceToken: {
                                not: null,
                            },
                        },
                        select: {
                            deviceToken: true,
                        },
                    });
                    for (const d of creatorDevices) {
                        if (!d.deviceToken)
                            continue;
                        yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, `Project ${data.tag}`, notificationMessage);
                    }
                }
                // =======================================
                // TRADESMEN
                // =======================================
                if ((_a = project === null || project === void 0 ? void 0 : project.tradesMen) === null || _a === void 0 ? void 0 : _a.length) {
                    for (const tm of project.tradesMen) {
                        yield prismaClient_1.default.notification.create({
                            data: {
                                uuid: (0, uuid_1.v4)(),
                                title: `Project ${data.tag}`,
                                message: notificationMessage,
                                type: "SCAFFOLD_STATUS_UPDATE",
                                companyId,
                                scaffoldRequestId: request.id.toString(),
                                role: "TRADESMAN",
                                receiverId: (_b = tm.tradesMan) === null || _b === void 0 ? void 0 : _b.userId,
                                senderId: userId.toString(),
                                isRead: false,
                                notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/tag.png",
                            },
                        });
                        const tmDevices = yield prismaClient_1.default.device.findMany({
                            where: {
                                userId: tm.tradesManId,
                                deviceToken: {
                                    not: null,
                                },
                            },
                            select: {
                                deviceToken: true,
                            },
                        });
                        for (const d of tmDevices) {
                            if (!d.deviceToken)
                                continue;
                            yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, `Project ${data.tag}`, notificationMessage);
                        }
                    }
                }
                // =======================================
                // COMPETENT PERSONS
                // =======================================
                const competentPersonsData = ((_c = project === null || project === void 0 ? void 0 : project.competentPersons) === null || _c === void 0 ? void 0 : _c.map((cp) => {
                    var _a;
                    return (_a = cp.competentPerson) === null || _a === void 0 ? void 0 : _a.userId;
                }).filter((id) => id !== undefined).map((id) => Number(id))) || [];
                if (competentPersonsData.length > 0) {
                    const cpNotificationMessage = `Project ${project === null || project === void 0 ? void 0 : project.PJT} has been ${data.tag}. Action by ${user.name}.`;
                    yield prismaClient_1.default.notification.createMany({
                        data: competentPersonsData.map((cp) => ({
                            uuid: (0, uuid_1.v4)(),
                            title: `Project ${data.tag}`,
                            message: cpNotificationMessage,
                            type: "SCAFFOLD_STATUS_UPDATE",
                            role: "COMPETENT_PERSON",
                            isRead: false,
                            companyId: (project === null || project === void 0 ? void 0 : project.createdById)
                                ? BigInt(project.createdById)
                                : null,
                            scaffoldRequestId: request.id.toString(),
                            receiverId: BigInt(cp),
                            senderId: userId.toString(),
                            notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/tag.png",
                        })),
                    });
                    const competentPersonDevices = yield prismaClient_1.default.device.findMany({
                        where: {
                            userId: {
                                in: competentPersonsData,
                            },
                            deviceToken: {
                                not: null,
                            },
                        },
                    });
                    for (const d of competentPersonDevices) {
                        if (!d.deviceToken)
                            continue;
                        yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, `Project ${data.tag}`, cpNotificationMessage);
                    }
                }
                // =======================================
                // FINAL RESPONSE
                // =======================================
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES
                        .COMPETENTPERSON
                        .SUCCESS_CREATE_TIMELINE,
                    data: formattedResponse,
                };
            }
            catch (error) {
                console.error("❗ Error in Timelinetag:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES
                    .COMPETENTPERSON
                    .FAILED_CREATE_TIMELINE, 500, error.message);
            }
        });
    }
    getRentalCycle(scaffHoldId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cycle = yield prismaClient_1.default.rentalCycle.findFirst({
                where: {
                    scaffoldRequestId: scaffHoldId
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
            if (!cycle) {
                return {
                    message: "No rental cycle found",
                    data: {
                        totalDays: 0,
                        cycleCount: 0,
                        rentalDays: 0,
                        canClear: false
                    }
                };
            }
            // 🔥 calculate total days till now
            const diffMs = new Date().getTime() -
                cycle.erectedAt.getTime();
            const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            // 🔥 current running cycle days
            const rentalDays = totalDays - (cycle.cycleCount * 28);
            return {
                message: "Rental cycle fetched successfully",
                data: {
                    scaffoldRequestId: cycle.scaffoldRequestId,
                    projectId: cycle.projectId,
                    totalDays, // never resets
                    cycleCount: cycle.cycleCount, // manual count
                    rentalDays, // current cycle progress
                    progress: Number(((rentalDays / 28) * 100).toFixed(1)),
                    canClear: rentalDays >= 28,
                    erectedAt: cycle.erectedAt
                }
            };
        });
    }
    clearRentalCycle(scaffHoldId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cycle = yield prismaClient_1.default.rentalCycle.findFirst({
                where: {
                    scaffoldRequestId: scaffHoldId
                },
                orderBy: {
                    createdAt: "desc"
                }
            });
            if (!cycle) {
                throw new customError_1.CustomError("Rental cycle not found", 404);
            }
            // 🔥 calculate current total days
            const diffMs = new Date().getTime() -
                cycle.erectedAt.getTime();
            const totalDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            // 🔥 current cycle usage
            // 🔥 UPDATE CYCLE
            const updated = yield prismaClient_1.default.rentalCycle.update({
                where: {
                    id: cycle.id
                },
                data: {
                    // ✔ increase cycle
                    cycleCount: cycle.cycleCount + 1,
                    // ✔ reset current cycle
                    rentalDays: 0,
                    // ✔ keep total updated
                    totalDays
                }
            });
            return {
                message: "Cycle cleared successfully",
                data: {
                    scaffoldRequestId: updated.scaffoldRequestId,
                    cycleCount: updated.cycleCount,
                    rentalDays: updated.rentalDays,
                    totalDays
                }
            };
        });
    }
    getScaffholdTimeline(scaffholdId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 🔥 REQUEST CHECK
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
                    where: {
                        id: BigInt(scaffholdId.scaffHoldId),
                    },
                });
                if (!request) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffold request not found");
                }
                // 🔥 FETCH TIMELINES BY REQUEST ID
                const timelines = yield prismaClient_1.default.projectScaffholdTimeline.findMany({
                    where: {
                        scaffoldRequestId: BigInt(scaffholdId.scaffHoldId),
                    },
                    include: {
                        image: true,
                        createdBy: true,
                    },
                    orderBy: {
                        createdAt: "asc",
                    },
                });
                if (!timelines.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE.NO_TIMELINE_FOUND, 404);
                }
                const formattedTimeline = timelines.map((t) => {
                    var _a, _b;
                    return ({
                        id: t.id,
                        uuid: t.uuid,
                        projectId: t.projectId,
                        scaffoldRequestId: t.scaffoldRequestId,
                        timeLineStatus: t.timeLineStatus,
                        note: t.note,
                        tag: t.tag,
                        address: t.address,
                        latitude: t.latitude,
                        longitude: t.longitude,
                        images: t.image.map((img) => img.url),
                        createdById: t.createdById,
                        createdByName: (_a = t.createdBy) === null || _a === void 0 ? void 0 : _a.name,
                        createdByEmail: (_b = t.createdBy) === null || _b === void 0 ? void 0 : _b.email,
                        createdAt: t.createdAt,
                        updatedAt: t.updatedAt,
                        date: t.createdAt,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_GET_TIMELINE,
                    data: formattedTimeline,
                };
            }
            catch (error) {
                console.error("❗ Error in getScaffholdTimeline:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON
                    .FAILED_GET_TIMELINE, 500, error.message);
            }
        });
    }
    getAllTimelineImages(scaffholdId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 🔥 REQUEST CHECK
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
                    where: {
                        id: BigInt(scaffholdId.scaffHoldId),
                    },
                });
                if (!request) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffold request not found");
                }
                // 🔥 FETCH TIMELINES USING REQUEST ID
                const timelines = yield prismaClient_1.default.projectScaffholdTimeline.findMany({
                    where: {
                        scaffoldRequestId: BigInt(scaffholdId.scaffHoldId),
                    },
                    select: {
                        id: true,
                    },
                });
                if (!timelines.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE.NO_TIMELINE_FOUND, 404);
                }
                const timelineIds = timelines.map((t) => t.id);
                // 🔥 FETCH IMAGES
                const images = yield prismaClient_1.default.timelineImage.findMany({
                    where: {
                        timelineId: {
                            in: timelineIds,
                        },
                    },
                    select: {
                        id: true,
                        url: true,
                        status: true,
                        timelineId: true,
                    },
                    orderBy: {
                        id: "desc",
                    },
                });
                if (!images.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE.NO_IMAGES_FOUND, 404);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.TIMELINE
                        .SUCCESS_FETCH_IMAGES,
                    data: images,
                };
            }
            catch (error) {
                console.error("❗ Error in getAllTimelineImages:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE
                    .FAILED_FETCH_IMAGES, 500, error.message);
            }
        });
    }
    getScaffHoldListForCompetentPerson(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            try {
                // 🔥 USER VALIDATION
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { id: userId },
                    select: { user_type: true },
                });
                if (!user) {
                    throw new customError_1.CustomError("User not found", 404);
                }
                let projectWhere = {
                    isDeleted: false,
                };
                // 🔥 COMPETENT PERSON FILTER
                if (user.user_type === "COMPETENT_PERSON") {
                    const competentPerson = yield prismaClient_1.default.competentPerson.findFirst({
                        where: { userId },
                    });
                    if (!competentPerson) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Competent Person not found");
                    }
                    projectWhere.competentPersons = {
                        some: {
                            competentPersonId: competentPerson.id,
                        },
                    };
                }
                // 🔥 PROJECT MANAGER FILTER
                if (user.user_type === "PROJECT_MANAGER") {
                    projectWhere.projectManagers = {
                        some: {
                            id: userId,
                        },
                    };
                }
                // 🔥 FETCH PROJECTS (REPLACED SCAFFHOLD)
                const [projectList, total] = yield Promise.all([
                    prismaClient_1.default.project.findMany({
                        where: projectWhere,
                        include: {
                            createdBy: true,
                        },
                        orderBy: { createdAt: "desc" },
                        skip: (page - 1) * limit,
                        take: limit,
                    }),
                    prismaClient_1.default.project.count({
                        where: projectWhere,
                    }),
                ]);
                // 🔥 FORMAT RESPONSE
                const formattedList = projectList.map((p) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        id: ((_a = p.id) === null || _a === void 0 ? void 0 : _a.toString()) || null,
                        uuid: p.uuid || null,
                        projectName: p.projectName || null,
                        PJT: p.PJT || null,
                        clientName: p.clientName || null,
                        clientMobile: p.clientMobile || null,
                        address: p.clientAddress || null,
                        latitude: p.latitude || null,
                        longitude: p.longitude || null,
                        startDate: p.startDate || null,
                        endDate: p.endDate || null,
                        status: p.status || null,
                        companyId: ((_b = p.createdById) === null || _b === void 0 ? void 0 : _b.toString()) || null,
                        companyName: ((_c = p.createdBy) === null || _c === void 0 ? void 0 : _c.name) || null,
                        createdAt: ((_d = p.createdAt) === null || _d === void 0 ? void 0 : _d.toISOString()) || null,
                        updatedAt: ((_e = p.updatedAt) === null || _e === void 0 ? void 0 : _e.toISOString()) || null,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                    data: formattedList,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ Fetch Project list for competent person error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, "Failed to fetch project list");
            }
        });
    }
}
exports.CompetentPersonServices = CompetentPersonServices;
