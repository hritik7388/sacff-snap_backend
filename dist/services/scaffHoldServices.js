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
exports.ScaffHoldsServices = void 0;
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
const uuid_1 = require("uuid");
class ScaffHoldsServices {
    createScaffHold(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userData = yield prismaClient_1.default.projectManager.findFirst({
                    where: { userId },
                    include: {
                        user: true,
                        company: true
                    }
                });
                if (!userData)
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found");
                const projectData = yield prismaClient_1.default.project.findFirst({
                    where: { id: data.projectId, isDeleted: false },
                });
                if (!projectData)
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.NOT_FOUND, 404, "Project not found");
                if (data.latitude && data.longitude) {
                    const existingScaffHold = yield prismaClient_1.default.scaffhold.findFirst({
                        where: { latitude: data.latitude, longitude: data.longitude, status: "ACTIVE" },
                    });
                    if (existingScaffHold)
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.ALREADY_EXISTS, 409, "ScaffHold with this location already exists");
                }
                const competentPersonsData = yield prismaClient_1.default.competentPerson.findMany({
                    where: { id: { in: data.competentPersonIds } },
                    include: {
                        user: { include: { userMedias: true } },
                    },
                });
                if (competentPersonsData.length !== data.competentPersonIds.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 400, "Some competent persons not found");
                }
                const scaffHold = yield prismaClient_1.default.scaffhold.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        startDate: data.startDate,
                        endDate: data.endDate,
                        address: data.address,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        priority: data.priority,
                        SCAFFID: (0, utils_1.scaffHoldIdGenerator)(),
                        projectName: projectData.projectName,
                        projectId: data.projectId,
                        companyId: userData.companyId,
                        createdById: userData.userId,
                        descreption: data.descreption || "",
                    },
                });
                yield prismaClient_1.default.competentPersonOnScaffhold.createMany({
                    data: competentPersonsData.map(cp => ({
                        scaffholdId: scaffHold.id,
                        competentPersonId: cp.id,
                    })),
                });
                yield prismaClient_1.default.project.update({
                    where: { id: data.projectId },
                    data: { status: "ONGOING" },
                });
                const scaffHoldWithCPs = yield prismaClient_1.default.scaffhold.findUnique({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "ScaffHold not found after creation");
                }
                const formattedCompetentPersons = scaffHoldWithCPs.competentPersons.map(cp => {
                    var _a;
                    return ({
                        id: cp.competentPerson.id,
                        userId: cp.competentPerson.user.id,
                        name: cp.competentPerson.user.name,
                        url: ((_a = cp.competentPerson.user.userMedias[0]) === null || _a === void 0 ? void 0 : _a.url) || null,
                    });
                });
                const companyId = userData.companyId;
                const notificationMessage = `A new scaffold ${scaffHold.SCAFFID} has been created by Project Manager ${userData.user.name}` +
                    ` for Project ${projectData.id} | ${projectData.projectName} | ${(_a = userData.company) === null || _a === void 0 ? void 0 : _a.name}.`;
                const companyUsers = yield prismaClient_1.default.projectManager.findMany({
                    where: { companyId: projectData.createdById },
                    select: { id: true },
                });
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: { in: companyUsers.map(u => u.id) },
                        deviceToken: { not: null }
                    },
                    select: { deviceToken: true }
                });
                yield prismaClient_1.default.notification.createMany({
                    data: {
                        uuid: (0, uuid_1.v4)(),
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
                    if (!d.deviceToken)
                        continue;
                    yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, "New ScaffHold Created", notificationMessage);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.CREATE_SUCCESS,
                    data: Object.assign(Object.assign({}, scaffHoldWithCPs), { competentPersons: formattedCompetentPersons }),
                };
            }
            catch (error) {
                console.error("❌ Create scaffhold error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.CREATE_FAILED, 500, "Create scaffhold failed due to server error");
            }
        });
    }
    getAllScaffHolds(page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const [scaffholds, totalCount] = yield Promise.all([
                    prismaClient_1.default.scaffhold.findMany({
                        skip,
                        take: limit,
                        where: {
                            isDeleted: false,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    }),
                    prismaClient_1.default.scaffhold.count({
                        where: {
                            isDeleted: false,
                        },
                    }),
                ]);
                const totalPages = Math.ceil(totalCount / limit);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                    data: scaffholds,
                    totalCount,
                    totalPages,
                    currentPage: page,
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
    getScaffHoldById(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
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
                    },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 401, "ScaffHold not found");
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
                    CMPId: ((_a = scaffhold.company) === null || _a === void 0 ? void 0 : _a.CMPId) || null,
                    companyName: ((_b = scaffhold.company) === null || _b === void 0 ? void 0 : _b.name) || null,
                    clientName: ((_c = scaffhold.project) === null || _c === void 0 ? void 0 : _c.clientName) || null,
                    clientMobile: ((_d = scaffhold.project) === null || _d === void 0 ? void 0 : _d.clientMobile) || null,
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
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getProjectScaffHold(data, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const totalCount = yield prismaClient_1.default.scaffhold.count({
                    where: {
                        projectId: data.id,
                        isDeleted: false,
                    },
                });
                const projectData = yield prismaClient_1.default.project.findUnique({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.NOT_FOUND, 404, "Project not found");
                }
                const totalPages = Math.ceil(totalCount / limit);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_BY_ID_SUCCESS,
                    data: projectData,
                    totalCount,
                    totalPages,
                    currentPage: page,
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
    scaffHoldCompetentPersons(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const searchTerm = ((_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                const whereCondition = {
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
                const competentPersons = yield prismaClient_1.default.competentPersonOnScaffhold.findMany({
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
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                    data: formatted,
                };
            }
            catch (error) {
                console.error("❌ Get competent persons error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    addCompetentPersonToScaffHold(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffData = yield prismaClient_1.default.scaffhold.findUnique({
                    where: {
                        id: data.scaffHoldId,
                        status: {
                            in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                        },
                        isDeleted: false
                    }
                });
                if (!scaffData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 401, "ScaffHold not found");
                }
                const competentPersonsData = yield prismaClient_1.default.competentPerson.findMany({
                    where: { id: { in: data.competentPersonIds.map(BigInt) } },
                });
                if (competentPersonsData.length !== data.competentPersonIds.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 400, "Some competent persons not found");
                }
                const existingAssociations = yield prismaClient_1.default.competentPersonOnScaffhold.findMany({
                    where: { scaffholdId: BigInt(data.scaffHoldId) },
                    select: { competentPersonId: true },
                });
                const existingCompetentPersonIds = existingAssociations.map(a => Number(a.competentPersonId));
                const newIdsToAdd = data.competentPersonIds.filter(id => !existingCompetentPersonIds.includes(Number(id)));
                const idsToRemove = existingCompetentPersonIds.filter(id => !data.competentPersonIds.includes(Number(id)));
                if (newIdsToAdd.length > 0) {
                    yield prismaClient_1.default.competentPersonOnScaffhold.createMany({
                        data: newIdsToAdd.map(id => ({
                            scaffholdId: BigInt(scaffData.id),
                            competentPersonId: BigInt(id),
                        })),
                        skipDuplicates: true,
                    });
                }
                if (idsToRemove.length > 0) {
                    yield prismaClient_1.default.competentPersonOnScaffhold.deleteMany({
                        where: {
                            scaffholdId: BigInt(scaffData.id),
                            competentPersonId: { in: idsToRemove.map(BigInt) },
                        },
                    });
                }
                const updatedScaffHold = yield prismaClient_1.default.scaffhold.findUnique({
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
                const formattedCompetentPersons = updatedScaffHold.competentPersons.map(cp => {
                    var _a;
                    return ({
                        id: cp.competentPerson.id,
                        userId: cp.competentPerson.user.id,
                        name: cp.competentPerson.user.name,
                        url: ((_a = cp.competentPerson.user.userMedias[0]) === null || _a === void 0 ? void 0 : _a.url) || null,
                    });
                });
                return {
                    message: "Competent persons updated successfully",
                    data: Object.assign(Object.assign({}, updatedScaffHold), { competentPersons: formattedCompetentPersons }),
                };
            }
            catch (error) {
                console.error("❌ Add competent person error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    removeCompetentPersonFromScaffHold(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffData = yield prismaClient_1.default.scaffhold.findUnique({
                    where: { id: data.scaffHoldId },
                    select: { id: true, status: true, isDeleted: true },
                });
                if (!scaffData || scaffData.status !== "ACTIVE" || scaffData.isDeleted) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 401, "ScaffHold not found");
                }
                const competentPersonData = yield prismaClient_1.default.competentPerson.findUnique({
                    where: { id: data.competentPersonIds },
                });
                if (!competentPersonData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 401, "Competent person not found");
                }
                const mapping = yield prismaClient_1.default.competentPersonOnScaffhold.findUnique({
                    where: {
                        scaffholdId_competentPersonId: {
                            scaffholdId: data.scaffHoldId,
                            competentPersonId: data.competentPersonIds,
                        },
                    },
                });
                if (!mapping) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 400, "This competent person is not associated with the given ScaffHold");
                }
                yield prismaClient_1.default.competentPersonOnScaffhold.delete({
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
            }
            catch (error) {
                console.error("❌ Remove competent person error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    scaffAndCompetentPersons(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffData = yield prismaClient_1.default.scaffhold.findUnique({
                    where: {
                        id: data.id,
                        status: {
                            in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"], // ✅ allowed statuses
                        },
                    }
                });
                if (!scaffData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 401, "ScaffHold not found");
                }
                const competentPersons = yield prismaClient_1.default.competentPersonOnScaffhold.findMany({
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
                const formatted = competentPersons.map(cp => {
                    var _a, _b, _c;
                    return ({
                        id: cp.competentPersonId,
                        name: (_a = cp.competentPerson.user) === null || _a === void 0 ? void 0 : _a.name,
                        image: ((_c = (_b = cp.competentPerson.user) === null || _b === void 0 ? void 0 : _b.userMedias[0]) === null || _c === void 0 ? void 0 : _c.url) || null,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                    data: { scaffData, formatted, }
                };
            }
            catch (error) {
                console.error("❌ Get competent persons error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    changePriorityAndTags(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const scaffhold = yield prismaClient_1.default.scaffhold.findUnique({
                    where: {
                        id: data.scaffholdId, status: {
                            in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"],
                        },
                    }
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "ScaffHold not found");
                }
                const updatedScaffhold = yield prismaClient_1.default.scaffhold.update({
                    where: { id: data.scaffholdId },
                    data: {
                        priority: data.priority,
                        tag: data.tag
                    },
                });
                const userData = yield prismaClient_1.default.projectManager.findUnique({
                    where: { userId: (_a = scaffhold === null || scaffhold === void 0 ? void 0 : scaffhold.createdById) !== null && _a !== void 0 ? _a : undefined }
                });
                const notificationMessage = `ScaffHold ${scaffhold.SCAFFID} has been marked as Tagged – Safe to Use.`;
                yield prismaClient_1.default.notification.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        title: "ScaffHold Tagged – Safe to Use",
                        message: notificationMessage,
                        type: "SCAFFOLD_STATUS_UPDATE",
                        role: "COMPANY",
                        companyId: scaffhold.companyId,
                        receiverId: scaffhold.companyId,
                        senderId: (_c = (_b = scaffhold === null || scaffhold === void 0 ? void 0 : scaffhold.createdById) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : null,
                        isRead: false,
                    },
                });
                const companyUsers = yield prismaClient_1.default.projectManager.findMany({
                    where: { companyId: scaffhold.companyId },
                    select: { id: true },
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
                    yield (0, utils_1.pushNotificationDelhi)(d.deviceToken, "ScaffHold Tagged – Safe to Use", notificationMessage);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.UPDATE_SUCCESS,
                    data: updatedScaffhold
                };
            }
            catch (error) {
                console.error("❌ Change priority and tags error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.UPDATE_FAILED, 500, error.message);
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
                            scaffoldId: n.scaffoldId,
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
}
exports.ScaffHoldsServices = ScaffHoldsServices;
