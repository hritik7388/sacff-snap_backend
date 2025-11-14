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
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
class CompetentPersonServices {
    dashboard(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const assignedCount = yield prismaClient_1.default.scaffhold.count({
                    where: {
                        competentPersons: {
                            some: {
                                competentPerson: {
                                    userId: userId,
                                },
                            },
                        },
                        isDeleted: false,
                    },
                });
                const untaggedCount = yield prismaClient_1.default.scaffhold.count({
                    where: {
                        tag: 'UNTAGED',
                        isDeleted: false, competentPersons: {
                            some: {
                                competentPerson: {
                                    userId: userId,
                                },
                            },
                        },
                    },
                });
                const activeCount = yield prismaClient_1.default.scaffhold.count({
                    where: {
                        status: 'ACTIVE',
                        isDeleted: false, competentPersons: {
                            some: {
                                competentPerson: {
                                    userId: userId,
                                },
                            },
                        },
                    },
                });
                const dismantledCount = yield prismaClient_1.default.scaffhold.count({
                    where: {
                        status: 'DISMANTLED',
                        isDeleted: false, competentPersons: {
                            some: {
                                competentPerson: {
                                    userId: userId,
                                },
                            },
                        },
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.DASHBOARD_SUCCESS,
                    data: {
                        assignedScaffolds: assignedCount,
                        untaggedScaffolds: untaggedCount,
                        activeScaffolds: activeCount,
                        dismantledScaffolds: dismantledCount,
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
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.DASHBOARD_FAILED, 500, error.message);
            }
        });
    }
    createInspection(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const inspection = yield prismaClient_1.default.competentPersonInspection.create({
                    data: {
                        scaffholdId: data.scaffholdId,
                        Date: data.Date,
                        shift: data.shift,
                        note: data.notes,
                        createdById: userId,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_INSPECTION_CREATION,
                    data: inspection,
                };
            }
            catch (error) {
                console.error("❗ Error in createInspection:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_INSPECTION_CREATION, 500, error.message);
            }
        });
    }
    getInspectionsByScaffholdId(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [inspections, totalCount] = yield Promise.all([
                    prismaClient_1.default.competentPersonInspection.findMany({
                        where: { scaffholdId: data.scaffholdId },
                        skip,
                        take: limit,
                        orderBy: { createdAt: "desc" },
                        select: {
                            id: true,
                            scaffholdId: true,
                            createdById: true,
                            shift: true,
                            note: true,
                            Date: true,
                            createdAt: true,
                            updatedAt: true,
                            createdBy: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    }),
                    prismaClient_1.default.competentPersonInspection.count({
                        where: { scaffholdId: data.scaffholdId },
                    }),
                ]);
                const newResponse = inspections.map((inspection) => ({
                    id: inspection.id,
                    scaffholdId: inspection.scaffholdId,
                    createdById: inspection.createdById,
                    shift: inspection.shift,
                    note: inspection.note,
                    Date: inspection.Date,
                    createdAt: inspection.createdAt,
                    updatedAt: inspection.updatedAt,
                    createdByName: inspection.createdBy.name,
                    createdByEmail: inspection.createdBy.email,
                }));
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
            try {
                const user = yield prismaClient_1.default.user.findFirst({
                    where: { id: userId, status: "ACTIVE" }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
                }
                const scaffholdData = yield prismaClient_1.default.scaffhold.findFirst({
                    where: { id: data.scaffholdId, isDeleted: false },
                });
                if (!scaffholdData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404);
                }
                if (data.timeLineStatus) {
                    const existingTimeline = yield prismaClient_1.default.scaffholdTimeline.findFirst({
                        where: {
                            scaffholdId: data.scaffholdId,
                            timeLineStatus: data.timeLineStatus
                        }
                    });
                    if (existingTimeline) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.DUPLICATE_TIMELINE_STATUS, 400);
                    }
                }
                const timeline = yield prismaClient_1.default.scaffholdTimeline.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        scaffholdId: data.scaffholdId,
                        timeLineStatus: data.timeLineStatus,
                        note: data.notes,
                        createdById: userId,
                        address: data.address,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        image: data.images && data.images.length > 0
                            ? {
                                create: data.images.map((url) => ({
                                    url,
                                    status: data.timeLineStatus
                                }))
                            }
                            : undefined
                    },
                    include: {
                        image: true
                    }
                });
                yield prismaClient_1.default.scaffhold.update({
                    where: { id: data.scaffholdId },
                    data: {
                        status: data.timeLineStatus
                    }
                });
                const formattedResponse = {
                    id: timeline.id,
                    uuid: timeline.uuid,
                    scaffholdId: timeline.scaffholdId,
                    date: scaffholdData.startDate,
                    timeLineStatus: timeline.timeLineStatus,
                    note: timeline.note,
                    createdById: timeline.createdById,
                    createdAt: timeline.createdAt,
                    updatedAt: timeline.updatedAt,
                    images: timeline.image.map(img => img.url),
                    address: timeline.address,
                    latitude: timeline.latitude,
                    longitude: timeline.longitude,
                };
                const companyId = scaffholdData.companyId;
                const notificationMessage = `Scaffold ${scaffholdData.SCAFFID} for Project ${scaffholdData.projectId} | ${scaffholdData.projectName} has been ${data.timeLineStatus}. Action performed by ${user.name}.`;
                yield prismaClient_1.default.notification.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        title: `ScaffHold ${data.timeLineStatus}`,
                        message: notificationMessage,
                        type: "TIMELINE_UPDATE",
                        role: "COMPANY",
                        companyId: companyId,
                        receiverId: companyId,
                        senderId: userId.toString(),
                        isRead: false,
                    },
                });
                const companyUsers = yield prismaClient_1.default.projectManager.findMany({
                    where: { companyId },
                    select: { id: true }
                });
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: { in: companyUsers.map(u => u.id) },
                        deviceToken: { not: null }
                    },
                    select: { deviceToken: true }
                });
                for (const d of devices) {
                    if (!d.deviceToken)
                        continue;
                    yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, `ScaffHold ${data.timeLineStatus}`, notificationMessage);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_CREATE_TIMELINE,
                    data: formattedResponse
                };
            }
            catch (error) {
                console.error("❗ Error in competentPersonTimeline:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_CREATE_TIMELINE, 500, error.message);
            }
        });
    }
    Timelinetag(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Fetch user
                const user = yield prismaClient_1.default.user.findFirst({
                    where: { id: userId, status: "ACTIVE" }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
                }
                const scaffholdData = yield prismaClient_1.default.scaffhold.findFirst({
                    where: { id: data.scaffholdId, isDeleted: false }
                });
                if (!scaffholdData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404);
                }
                const timeline = yield prismaClient_1.default.scaffholdTimeline.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        scaffholdId: data.scaffholdId,
                        timeLineStatus: scaffholdData.status,
                        tag: data.tag,
                        note: data.notes,
                        createdById: userId,
                    }
                });
                yield prismaClient_1.default.scaffhold.update({
                    where: { id: data.scaffholdId },
                    data: {
                        tag: data.tag
                    }
                });
                const formattedResponse = {
                    id: timeline.id,
                    uuid: timeline.uuid,
                    scaffholdId: timeline.scaffholdId,
                    tag: timeline.tag,
                    note: timeline.note,
                    createdById: timeline.createdById,
                    createdAt: timeline.createdAt,
                    updatedAt: timeline.updatedAt,
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_CREATE_TIMELINE,
                    data: formattedResponse
                };
            }
            catch (error) {
                console.error("❗ Error in competentPersonTimeline:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_CREATE_TIMELINE, 500, error.message);
            }
        });
    }
    getScaffholdTimeline(scaffholdId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffhold = yield prismaClient_1.default.scaffhold.findFirst({
                    where: { id: scaffholdId.scaffholdId, isDeleted: false },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404);
                }
                const timelines = yield prismaClient_1.default.scaffholdTimeline.findMany({
                    where: { scaffholdId: scaffholdId.scaffholdId },
                    include: { image: true, createdBy: true },
                    orderBy: { createdAt: 'asc' }
                });
                const formattedTimeline = timelines.map(t => ({
                    id: t.id,
                    uuid: t.uuid,
                    scaffHoldId: t.scaffholdId,
                    timeLineStatus: t.timeLineStatus,
                    note: t.note,
                    tag: t.tag,
                    images: t.image.map(img => img.url),
                    createdByid: t.createdById,
                    createdByName: t.createdBy.name,
                    createdByEmail: t.createdBy.email,
                    createdAt: t.createdAt,
                    updatedAt: t.updatedAt,
                    date: t.createdAt
                }));
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.SUCCESS_GET_TIMELINE,
                    data: formattedTimeline
                };
            }
            catch (error) {
                console.error("❗ Error in getScaffholdTimeline:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPETENTPERSON.FAILED_GET_TIMELINE, 500, error.message);
            }
        });
    }
    getAllTimelineImages(scaffholdId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffhold = yield prismaClient_1.default.scaffhold.findFirst({
                    where: { id: scaffholdId.scaffholdId, isDeleted: false },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404);
                }
                const timelines = yield prismaClient_1.default.scaffholdTimeline.findMany({
                    where: { scaffholdId: scaffholdId.scaffholdId },
                    select: { id: true }
                });
                if (!timelines.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE.NO_TIMELINE_FOUND, 404);
                }
                const timelineIds = timelines.map((t) => t.id);
                const images = yield prismaClient_1.default.timelineImage.findMany({
                    where: { timelineId: { in: timelineIds } },
                    select: { url: true, status: true },
                    orderBy: { id: "desc" },
                });
                if (!images.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE.NO_IMAGES_FOUND, 404);
                }
                const imageUrls = images.map((img) => ({
                    url: img.url,
                    status: img.status
                }));
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.TIMELINE.SUCCESS_FETCH_IMAGES,
                    data: images
                };
            }
            catch (error) {
                console.error("❗ Error in getAllTimelineImages:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE.FAILED_FETCH_IMAGES, 500, error.message);
            }
        });
    }
    getScaffHoldListForCompetentPerson(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            try {
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { id: userId },
                    select: { user_type: true },
                });
                if (!user) {
                    throw new customError_1.CustomError("User not found", 404);
                }
                let scaffholdWhere = {
                    isDeleted: false,
                };
                if (user.user_type === "COMPETENT_PERSON") {
                    const competentPerson = yield prismaClient_1.default.competentPerson.findFirst({
                        where: { userId },
                    });
                    if (!competentPerson) {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Competent Person not found");
                    }
                    scaffholdWhere.competentPersons = {
                        some: { competentPersonId: competentPerson.id }
                    };
                }
                if (user.user_type === "PROJECT_MANAGER") {
                    scaffholdWhere.project = {
                        projectManagerId: userId
                    };
                }
                const [scaffHoldList, total] = yield Promise.all([
                    prismaClient_1.default.scaffhold.findMany({
                        where: scaffholdWhere,
                        include: {
                            project: {
                                select: {
                                    clientName: true,
                                    clientEmail: true,
                                    clientMobile: true,
                                    clientCountryCode: true,
                                    clientAddress: true,
                                    projectManagerId: true,
                                },
                            },
                            company: {
                                select: {
                                    CMPId: true,
                                    name: true,
                                }
                            }
                        },
                        orderBy: { createdAt: "desc" },
                        skip: (page - 1) * limit,
                        take: limit,
                    }),
                    prismaClient_1.default.scaffhold.count({ where: scaffholdWhere })
                ]);
                const formattedList = scaffHoldList.map((s) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                    return ({
                        id: ((_a = s.id) === null || _a === void 0 ? void 0 : _a.toString()) || null,
                        uuid: s.uuid || null,
                        SCAFFID: s.SCAFFID || null,
                        address: s.address || null,
                        latitude: s.latitude || null,
                        longitude: s.longitude || null,
                        descreption: s.descreption || null,
                        startDate: s.startDate || null,
                        endDate: s.endDate || null,
                        priority: s.priority || null,
                        tag: s.tag || null,
                        status: s.status || null,
                        isDeleted: s.isDeleted || false,
                        isJobLinkCreated: s.isJobLinkCreated || false,
                        projectId: ((_b = s.projectId) === null || _b === void 0 ? void 0 : _b.toString()) || null,
                        projectName: s.projectName || null,
                        companyId: ((_c = s.companyId) === null || _c === void 0 ? void 0 : _c.toString()) || null,
                        companyName: ((_d = s.company) === null || _d === void 0 ? void 0 : _d.name) || null,
                        cmpid: ((_e = s.companyId) === null || _e === void 0 ? void 0 : _e.toString()) || null,
                        clientName: ((_f = s.project) === null || _f === void 0 ? void 0 : _f.clientName) || null,
                        clientMobile: ((_g = s.project) === null || _g === void 0 ? void 0 : _g.clientMobile) || null,
                        createdById: ((_h = s.createdById) === null || _h === void 0 ? void 0 : _h.toString()) || null,
                        createdAt: ((_j = s.createdAt) === null || _j === void 0 ? void 0 : _j.toISOString()) || null,
                        updatedAt: ((_k = s.updatedAt) === null || _k === void 0 ? void 0 : _k.toISOString()) || null,
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
                console.error("❌ Fetch ScaffHold list for competent person error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, "Failed to fetch scaffhold list");
            }
        });
    }
}
exports.CompetentPersonServices = CompetentPersonServices;
