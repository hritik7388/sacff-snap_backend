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
exports.ScaffHoldsServices = void 0;
// src/services/scaffHoldServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
const uuid_1 = require("uuid");
const client_1 = require("@prisma/client");
class ScaffHoldsServices {
    getAllScaffHolds(page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const [requests, totalCount] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.findMany({
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
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: {
                            project: {
                                isDeleted: false,
                            },
                        },
                    }),
                ]);
                const totalPages = Math.ceil(totalCount / limit);
                // 🔥 optional clean response mapping
                const data = requests.map((r) => {
                    var _a, _b, _c, _d, _e;
                    return ({
                        id: r.id,
                        uuid: r.uuid,
                        status: r.status,
                        tag: r.tag,
                        address: r.address,
                        latitude: r.latitude,
                        longitude: r.longitude,
                        priority: r.priority,
                        projectId: r.projectId,
                        projectName: ((_a = r.project) === null || _a === void 0 ? void 0 : _a.projectName) || null,
                        tradesmanName: ((_c = (_b = r.createdBy) === null || _b === void 0 ? void 0 : _b.user) === null || _c === void 0 ? void 0 : _c.name) || null,
                        tradesmanEmail: ((_e = (_d = r.createdBy) === null || _d === void 0 ? void 0 : _d.user) === null || _e === void 0 ? void 0 : _e.email) || null,
                        createdAt: r.createdAt,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                    data,
                    totalCount,
                    totalPages,
                    currentPage: page,
                };
            }
            catch (error) {
                console.error("❌ Get all scaffhold requests error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getScaffHoldById(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            try {
                // 🔥 NEW SOURCE: ProjectScaffholdRequest
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Request not found");
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
                    tradesmanName: ((_b = (_a = request.createdBy) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) || null,
                    tradesmanEmail: ((_d = (_c = request.createdBy) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.email) || null,
                    tradesmanMobile: ((_f = (_e = request.createdBy) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.mobileNumber) || null,
                    // 🔥 PROJECT INFO
                    projectName: ((_g = request.project) === null || _g === void 0 ? void 0 : _g.projectName) || null,
                    clientName: ((_h = request.project) === null || _h === void 0 ? void 0 : _h.clientName) || null,
                    clientMobile: ((_j = request.project) === null || _j === void 0 ? void 0 : _j.clientMobile) || null,
                    clientEmail: ((_k = request.project) === null || _k === void 0 ? void 0 : _k.clientEmail) || null,
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_BY_ID_SUCCESS,
                    data: formattedResponse,
                };
            }
            catch (error) {
                console.error("❌ Get scaffhold request by id error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getProjectScaffHold(data, page, limit, projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const { search, priority, status, tags, sort } = data;
                const BLOCKED_STATUSES = [
                    client_1.RequestStatus.PENDING,
                    client_1.RequestStatus.REJECTED,
                    client_1.RequestStatus.SUSPENDED,
                ];
                const whereCondition = {
                    projectId,
                    status: {
                        notIn: BLOCKED_STATUSES,
                    },
                };
                // 🔍 SEARCH
                if (search === null || search === void 0 ? void 0 : search.trim()) {
                    const searchTerm = search.trim();
                    if (!isNaN(Number(searchTerm))) {
                        whereCondition.id = Number(searchTerm);
                    }
                    else {
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
                const totalCount = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: whereCondition,
                });
                const totalPages = Math.ceil(totalCount / limit);
                // 📦 PROJECT
                const projectData = yield prismaClient_1.default.project.findUnique({
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
                    throw new customError_1.CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
                }
                // 🔥 SORT LOGIC (NEW FIX)
                const orderBy = sort === "ASC"
                    ? { createdAt: "asc" }
                    : { createdAt: "desc" };
                // 📦 LIST
                const scaffholdList = yield prismaClient_1.default.projectScaffholdRequest.findMany({
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
                const _a = projectData, { createdBy } = _a, projectWithoutCreatedBy = __rest(_a, ["createdBy"]);
                const company = projectData.createdBy;
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_BY_ID_SUCCESS,
                    data: Object.assign(Object.assign({}, projectWithoutCreatedBy), { companyId: company === null || company === void 0 ? void 0 : company.id, companyName: company === null || company === void 0 ? void 0 : company.name, companyCMPId: company === null || company === void 0 ? void 0 : company.CMPId, scaffholdList: scaffholdList.map((item) => {
                            var _a;
                            return ({
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
                                expectedEndDate: item.expectedEndDate,
                                createdByCraft: (_a = item.createdBy) === null || _a === void 0 ? void 0 : _a.craft,
                                createdAt: item.createdAt,
                                updatedAt: item.updatedAt,
                            });
                        }) }),
                    pagination: {
                        total: totalCount,
                        totalPages,
                        currentPage: page,
                        limit,
                    },
                };
            }
            catch (error) {
                console.error("❌ Get Project ScaffHold error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_FAILED, 500, error.message);
            }
        });
    }
    projectCompetentPersons(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const searchTerm = ((_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                const whereCondition = {
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
                const competentPersons = yield prismaClient_1.default.competentPersonOnProject.findMany({
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
                const formatted = competentPersons.map(cp => {
                    var _a, _b, _c;
                    return ({
                        id: cp.competentPersonId,
                        name: (_a = cp.competentPerson.user) === null || _a === void 0 ? void 0 : _a.name,
                        image: ((_c = (_b = cp.competentPerson.user) === null || _b === void 0 ? void 0 : _b.userMedias[0]) === null || _c === void 0 ? void 0 : _c.url) || null,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_ALL_SUCCESS,
                    data: formatted,
                };
            }
            catch (error) {
                console.error("❌ Get project CP error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_FAILED, 500, error.message);
            }
        });
    }
    addCompetentPersonToProject(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Adding competent person to project with data:", data);
                // =========================
                // ✅ VALIDATE PROJECT MANAGER
                // =========================
                const userData = yield prismaClient_1.default.projectManager.findFirst({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found");
                }
                // =========================
                // ✅ VALIDATE PROJECT
                // =========================
                const projectData = yield prismaClient_1.default.project.findUnique({
                    where: {
                        id: BigInt(data.projectId),
                        isDeleted: false,
                    },
                });
                console.log("Project Data:", projectData);
                if (!projectData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.NOT_FOUND, 404, "Project not found");
                }
                // =========================
                // ✅ VALIDATE CPs
                // =========================
                const competentPersonsData = yield prismaClient_1.default.competentPerson.findMany({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 400, "Some competent persons not found");
                }
                // =========================
                // 🔄 EXISTING RELATION
                // =========================
                const existing = yield prismaClient_1.default.competentPersonOnProject.findMany({
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
                    yield prismaClient_1.default.competentPersonOnProject.createMany({
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
                    yield prismaClient_1.default.competentPersonOnProject.deleteMany({
                        where: {
                            projectid: BigInt(data.projectId),
                            competentPersonId: { in: idsToRemove.map(BigInt) },
                        },
                    });
                }
                // =========================
                // 🔄 UPDATED PROJECT
                // =========================
                const updatedProject = yield prismaClient_1.default.project.findUnique({
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
                const formattedCP = updatedProject.competentPersons.map(cp => {
                    var _a;
                    return ({
                        id: cp.competentPerson.id,
                        userId: cp.competentPerson.user.id,
                        name: cp.competentPerson.user.name,
                        email: cp.competentPerson.user.email,
                        url: ((_a = cp.competentPerson.user.userMedias[0]) === null || _a === void 0 ? void 0 : _a.url) || null,
                    });
                });
                // =========================
                // 📩 CP NOTIFICATION (ALWAYS)
                // =========================
                if (newIdsToAdd.length > 0) {
                    const newCPUsers = formattedCP.filter(cp => newIdsToAdd.includes(Number(cp.id)));
                    yield prismaClient_1.default.notification.createMany({
                        data: newCPUsers.map(cp => ({
                            uuid: (0, uuid_1.v4)(),
                            title: "PROJECT ASSIGNED",
                            message: `You have been assigned to Project ${projectData.projectName}.`,
                            type: "PROJECT_ASSIGNED",
                            role: "COMPETENT_PERSON",
                            isRead: false,
                            projectId: BigInt(projectData.id),
                            receiverId: BigInt(cp.userId),
                            senderId: userId.toString(),
                            notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/assigned.png"
                        })),
                    });
                    console.log("✅ CP notifications created for users:", newCPUsers.map(cp => cp.userId));
                    // PUSH NOTIFICATION FOR CP
                    const cpUserIds = newCPUsers.map(cp => Number(cp.userId));
                    const cpDevices = yield prismaClient_1.default.device.findMany({
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
                        yield (0, utils_1.pushNotificationDelhi)(device.deviceToken, "PROJECT ASSIGNED", `You have been assigned to Project ${projectData.projectName}.`);
                    }
                }
                // =========================
                // 🏢 SUPER ADMIN + COMPANY OWNER ONLY
                // =========================
                const superAdmins = yield prismaClient_1.default.user.findMany({
                    where: {
                        user_type: "SUPER_ADMIN",
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                    },
                    select: { id: true, email: true }
                });
                const companyOwner = yield prismaClient_1.default.company.findUnique({
                    where: { id: projectData.createdById },
                    select: { id: true }
                });
                const receiverIds = [
                    ...superAdmins.map(s => Number(s.id)),
                    Number((companyOwner === null || companyOwner === void 0 ? void 0 : companyOwner.id) || 0)
                ].filter(Boolean);
                const settings = yield prismaClient_1.default.notificationSetting.findMany({
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
                yield prismaClient_1.default.notification.createMany({
                    data: allowedUsers.map(id => ({
                        uuid: (0, uuid_1.v4)(),
                        title: "Team Member Updated",
                        message,
                        type: newIdsToAdd.length > 0
                            ? "TRADESMAN_JOINED_PROJECT"
                            : "TRADESMAN_REMOVED",
                        role: id === Number(companyOwner === null || companyOwner === void 0 ? void 0 : companyOwner.id)
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
                const emailUsers = yield prismaClient_1.default.user.findMany({
                    where: {
                        id: {
                            in: settings.filter(s => s.emailEnabled).map(s => Number(s.userId))
                        }
                    },
                    select: { email: true, id: true }
                });
                for (const user of emailUsers) {
                    yield (0, utils_1.sendMail)(user.email, "Team Member Update", message);
                }
                // =========================
                // 📱 PUSH NOTIFICATION (POPUP FIXED)
                // =========================
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: { in: allowedUsers },
                        deviceToken: { not: null }
                    },
                    select: { deviceToken: true }
                });
                for (const device of devices) {
                    yield (0, utils_1.pushNotificationDelhi)(device.deviceToken, "Team Member Updated", message);
                }
                // =========================
                // RESPONSE
                // =========================
                return {
                    message: "Competent persons updated successfully",
                    data: Object.assign(Object.assign({}, updatedProject), { competentPersons: formattedCP }),
                };
            }
            catch (error) {
                console.error("❌ Add CP error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_FAILED, 500, error.message);
            }
        });
    }
    removeCompetentPersonFromProject(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // =========================
                // ✅ VALIDATE PROJECT
                // =========================
                const projectData = yield prismaClient_1.default.project.findUnique({
                    where: {
                        id: BigInt(data.projectId),
                        isDeleted: false,
                    },
                });
                if (!projectData) {
                    throw new customError_1.CustomError("Project not found", 404);
                }
                // =========================
                // ✅ VALIDATE CP
                // =========================
                const cpData = yield prismaClient_1.default.competentPerson.findUnique({
                    where: { id: BigInt(data.competentPersonId) },
                    include: { user: true }
                });
                if (!cpData) {
                    throw new customError_1.CustomError("Competent person not found", 404);
                }
                // =========================
                // ❌ REMOVE RELATION
                // =========================
                yield prismaClient_1.default.competentPersonOnProject.delete({
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
                yield prismaClient_1.default.notification.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
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
                const superAdmins = yield prismaClient_1.default.user.findMany({
                    where: {
                        user_type: "SUPER_ADMIN",
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                    },
                    select: { id: true, email: true }
                });
                const companyOwner = yield prismaClient_1.default.company.findUnique({
                    where: { id: projectData.createdById },
                    select: { id: true }
                });
                const receiverIds = [
                    ...superAdmins.map(s => Number(s.id)),
                    Number((companyOwner === null || companyOwner === void 0 ? void 0 : companyOwner.id) || 0)
                ].filter(Boolean);
                const settings = yield prismaClient_1.default.notificationSetting.findMany({
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
                yield prismaClient_1.default.notification.createMany({
                    data: allowedUsers.map(id => ({
                        uuid: (0, uuid_1.v4)(),
                        title: "Team Member Removed",
                        message,
                        type: "TRADESMAN_REMOVED",
                        role: id === Number(companyOwner === null || companyOwner === void 0 ? void 0 : companyOwner.id)
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
                const emailUsers = yield prismaClient_1.default.user.findMany({
                    where: {
                        id: { in: emailSettings.map(s => Number(s.userId)) }
                    },
                    select: { email: true }
                });
                for (const user of emailUsers) {
                    yield (0, utils_1.sendMail)(user.email, "Team Member Removed", message);
                }
                // =========================
                // 📱 PUSH NOTIFICATION (POPUP FIXED)
                // =========================
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: { in: allowedUsers },
                        deviceToken: { not: null }
                    },
                    select: { deviceToken: true }
                });
                for (const device of devices) {
                    yield (0, utils_1.pushNotificationDelhi)(device.deviceToken, "Team Member Removed", message);
                }
                // =========================
                // RESPONSE
                // =========================
                return {
                    message: "Competent person removed successfully",
                };
            }
            catch (error) {
                console.error("❌ Remove CP error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to remove competent person", 500, error.message);
            }
        });
    }
    projectAndCompetentPersons(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
            try {
                // =========================
                // 🔥 FETCH REQUEST (MAIN)
                // =========================
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.NOT_FOUND, 404, "Request not found");
                }
                const projectId = request.projectId;
                // =========================
                // 👷 COMPETENT PERSONS
                // =========================
                const competentPersons = yield prismaClient_1.default.competentPersonOnProject.findMany({
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
                const formattedCP = competentPersons.map((cp) => {
                    var _a, _b, _c, _d;
                    return ({
                        id: cp.competentPersonId,
                        name: (_a = cp.competentPerson.user) === null || _a === void 0 ? void 0 : _a.name,
                        image: ((_d = (_c = (_b = cp.competentPerson.user) === null || _b === void 0 ? void 0 : _b.userMedias) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.url) || null,
                    });
                });
                // =========================
                // 🔥 FINAL CLEAN RESPONSE
                // =========================
                return {
                    message: "Request details fetched successfully",
                    data: {
                        // ======================
                        // REQUEST
                        // ======================
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
                        isConvertedToScaffold: request.isConvertedToScaffold,
                        parentId: request.parentId,
                        createdAt: request.createdAt,
                        updatedAt: request.updatedAt,
                        // ======================
                        // PROJECT
                        // ======================
                        projectId: ((_a = request.project) === null || _a === void 0 ? void 0 : _a.id) || null,
                        projectUuid: ((_b = request.project) === null || _b === void 0 ? void 0 : _b.uuid) || null,
                        PJT: ((_c = request.project) === null || _c === void 0 ? void 0 : _c.PJT) || null,
                        projectName: ((_d = request.project) === null || _d === void 0 ? void 0 : _d.projectName) || null,
                        projectStatus: ((_e = request.project) === null || _e === void 0 ? void 0 : _e.status) || null,
                        clientName: ((_f = request.project) === null || _f === void 0 ? void 0 : _f.clientName) || null,
                        clientEmail: ((_g = request.project) === null || _g === void 0 ? void 0 : _g.clientEmail) || null,
                        clientMobile: ((_h = request.project) === null || _h === void 0 ? void 0 : _h.clientMobile) || null,
                        clientAddress: ((_j = request.project) === null || _j === void 0 ? void 0 : _j.clientAddress) || null,
                        // ======================
                        // CREATED BY
                        // ======================
                        createdById: ((_k = request.createdBy) === null || _k === void 0 ? void 0 : _k.id) || null,
                        createdByName: ((_m = (_l = request.createdBy) === null || _l === void 0 ? void 0 : _l.user) === null || _m === void 0 ? void 0 : _m.name) || null,
                        createdByMobile: ((_p = (_o = request.createdBy) === null || _o === void 0 ? void 0 : _o.user) === null || _p === void 0 ? void 0 : _p.mobileNumber) || null,
                        createdByCraft: ((_q = request.createdBy) === null || _q === void 0 ? void 0 : _q.craft) || null,
                        createdByExperience: ((_r = request.createdBy) === null || _r === void 0 ? void 0 : _r.experience) || null,
                        createdByImage: ((_v = (_u = (_t = (_s = request.createdBy) === null || _s === void 0 ? void 0 : _s.user) === null || _t === void 0 ? void 0 : _t.userMedias) === null || _u === void 0 ? void 0 : _u[0]) === null || _v === void 0 ? void 0 : _v.url) ||
                            null,
                        rentalCycleId: ((_x = (_w = request.rentalCycles) === null || _w === void 0 ? void 0 : _w[0]) === null || _x === void 0 ? void 0 : _x.id) || null,
                        rentalCycleUuid: ((_z = (_y = request.rentalCycles) === null || _y === void 0 ? void 0 : _y[0]) === null || _z === void 0 ? void 0 : _z.uuid) || null,
                        rentalCycleErectedAt: ((_1 = (_0 = request.rentalCycles) === null || _0 === void 0 ? void 0 : _0[0]) === null || _1 === void 0 ? void 0 : _1.erectedAt) || null,
                        rentalCycleTaggedAt: ((_3 = (_2 = request.rentalCycles) === null || _2 === void 0 ? void 0 : _2[0]) === null || _3 === void 0 ? void 0 : _3.taggedAt) || null,
                        rentalCycleTotalDays: ((_5 = (_4 = request.rentalCycles) === null || _4 === void 0 ? void 0 : _4[0]) === null || _5 === void 0 ? void 0 : _5.totalDays) || 0,
                        rentalCycleCount: ((_7 = (_6 = request.rentalCycles) === null || _6 === void 0 ? void 0 : _6[0]) === null || _7 === void 0 ? void 0 : _7.cycleCount) || 0,
                        rentalCycleDays: ((_9 = (_8 = request.rentalCycles) === null || _8 === void 0 ? void 0 : _8[0]) === null || _9 === void 0 ? void 0 : _9.rentalDays) || 0,
                    },
                };
            }
            catch (error) {
                console.error("❌ Request detail error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_FAILED, 500, error.message);
            }
        });
    }
    changePriorityAndTags(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const dutyCount = [
                    data.lightDuty,
                    data.mediumDuty,
                    data.heavyDuty,
                ].filter(Boolean).length;
                if (dutyCount > 1) {
                    throw new customError_1.CustomError("Only one duty type can be selected", 400);
                }
                // 1. FIND REQUEST (safe + correct)
                const scaffhold = yield prismaClient_1.default.projectScaffholdRequest.findUnique({
                    where: {
                        id: data.scaffHoldId,
                    },
                    include: {
                        project: true,
                    },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError("Scaffold request not found", 404);
                }
                // OPTIONAL SAFETY CHECK
                if (scaffhold.status === "REJECTED") {
                    throw new customError_1.CustomError("Cannot update rejected scaffold", 400);
                }
                // 2. UPDATE
                const updatedScaffhold = yield prismaClient_1.default.projectScaffholdRequest.update({
                    where: {
                        id: data.scaffHoldId,
                    },
                    data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({ priority: data.priority, tag: data.tag }, (data.lightDuty !== undefined && {
                        lightDuty: data.lightDuty,
                    })), (data.mediumDuty !== undefined && {
                        mediumDuty: data.mediumDuty,
                    })), (data.heavyDuty !== undefined && {
                        heavyDuty: data.heavyDuty,
                    })), (data.fallProtection !== undefined && {
                        fallProtection: data.fallProtection,
                    })), (data.ladder !== undefined && {
                        ladder: data.ladder,
                    })), (data.handRail !== undefined && {
                        handRail: data.handRail,
                    })), (data.midRail !== undefined && {
                        midRail: data.midRail,
                    })), (data.toeBoard !== undefined && {
                        toeBoard: data.toeBoard,
                    })), (data.platform !== undefined && {
                        platform: data.platform,
                    })), (data.note !== undefined && {
                        note: data.note,
                    })), (data.other !== undefined && {
                        other: data.other,
                    })),
                });
                // 3. GET PROJECT OWNER
                const project = yield prismaClient_1.default.project.findUnique({
                    where: { id: scaffhold.projectId },
                    select: {
                        createdById: true,
                    },
                });
                // 4. NOTIFICATION MESSAGE
                const notificationMessage = `Scaffold ${scaffhold.SCAFFID} updated to ${data.tag}`;
                // 5. CREATE NOTIFICATION
                yield prismaClient_1.default.notification.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        title: "Scaffold Updated",
                        message: notificationMessage,
                        type: "SCAFFOLD_STATUS_UPDATE",
                        role: "COMPANY",
                        companyId: (_a = project === null || project === void 0 ? void 0 : project.createdById) !== null && _a !== void 0 ? _a : null,
                        receiverId: (_b = project === null || project === void 0 ? void 0 : project.createdById) !== null && _b !== void 0 ? _b : null,
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
            }
            catch (error) {
                console.error("❌ Change priority and tags error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(error.message || "Update failed", error.statusCode || 500);
            }
        });
    }
    getCompanyNotifications(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield prismaClient_1.default.notification.findMany({
                    where: {
                        companyId: userId,
                        role: "COMPANY"
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                const unreadCount = yield prismaClient_1.default.notification.count({
                    where: {
                        companyId: userId,
                        role: "COMPANY",
                        isRead: false
                    }
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.NOTIFICATION.SUCCESS_GET,
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
            }
            catch (error) {
                console.error("❗ Error in getSuperAdminNotifications:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Failed to fetch notifications", 500, error.message);
            }
        });
    }
    getScaffholdRequestHistory(requestId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
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
                    throw new customError_1.CustomError("Request not found", 404, "NOT_FOUND");
                }
                const tradesman = request.createdBy;
                const createdUser = tradesman === null || tradesman === void 0 ? void 0 : tradesman.user;
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
                            tradesmanId: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.id) || null,
                            tradesmanName: ((_a = tradesman === null || tradesman === void 0 ? void 0 : tradesman.user) === null || _a === void 0 ? void 0 : _a.name) || null,
                            craftName: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.craft) || null,
                            // =======================
                            // CREATED USER INFO (FIXED)
                            // =======================
                            createdByUser: {
                                name: (createdUser === null || createdUser === void 0 ? void 0 : createdUser.name) || null,
                                image: ((_c = (_b = createdUser === null || createdUser === void 0 ? void 0 : createdUser.userMedias) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.url) || null, // ✅ FIXED
                                craftName: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.craft) || null
                            },
                            company: ((_e = (_d = request.project) === null || _d === void 0 ? void 0 : _d.createdBy) === null || _e === void 0 ? void 0 : _e.name) || null,
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
                        history: request.updatesRequest.map((item) => {
                            var _a, _b, _c, _d, _e;
                            return ({
                                id: item.id,
                                requestId: item.requestId,
                                projectId: item.projectId,
                                company: ((_b = (_a = request.project) === null || _a === void 0 ? void 0 : _a.createdBy) === null || _b === void 0 ? void 0 : _b.name) || null,
                                createdBy: request.createdById,
                                tradesmanId: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.id) || null,
                                tradesmanName: ((_c = tradesman === null || tradesman === void 0 ? void 0 : tradesman.user) === null || _c === void 0 ? void 0 : _c.name) || null,
                                craftName: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.craft) || null,
                                createdByUser: {
                                    name: (createdUser === null || createdUser === void 0 ? void 0 : createdUser.name) || null,
                                    image: ((_e = (_d = createdUser === null || createdUser === void 0 ? void 0 : createdUser.userMedias) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.url) || null, // ✅ FIXED
                                    craftName: (tradesman === null || tradesman === void 0 ? void 0 : tradesman.craft) || null
                                },
                                length: item.length,
                                width: item.width,
                                height: item.height,
                                priority: item.priority,
                                expectedEndDate: item.expectedEndDate,
                                notes: item.notes,
                                createdAt: item.createdAt
                            });
                        })
                    }
                };
            }
            catch (error) {
                console.error("Error in getScaffholdRequestHistory:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Failed to fetch scaffold request history", 500, error.message);
            }
        });
    }
}
exports.ScaffHoldsServices = ScaffHoldsServices;
