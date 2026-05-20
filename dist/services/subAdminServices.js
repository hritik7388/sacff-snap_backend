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
exports.subAdminServices = void 0;
// src/services/subAdminServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
const templates_1 = require("../helpers/templates");
const client_1 = require("@prisma/client");
class subAdminServices {
    loginSubAdminServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const subAdminData = yield prismaClient_1.default.company.findUnique({
                    where: {
                        email: data.email, isDeleted: false, isVerified: true,
                        user_type: "COMPANY"
                    },
                });
                if (!subAdminData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.NOT_FOUND, 500, "The provided  email do not match");
                }
                if (subAdminData.status === "SUSPENDED") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.SUSPENDED, 500, "Your account has been suspended. Please contact support for assistance.");
                }
                if (subAdminData.isApproved !== "APPROVED") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.NOT_APPROVED, 500, "Your company is not approved yet");
                }
                const isPasswordValid = subAdminData.password && (yield bcryptjs_1.default.compare(data.password, subAdminData.password));
                if (!isPasswordValid) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.INVALID_PASSWORD, 500, "Invalid password");
                }
                if (subAdminData.user_type !== "COMPANY") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 500, "Unauthorized");
                }
                if (!subAdminData.isApproved) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.NOT_APPROVED, 500, "Your company is not approved yet");
                }
                const jwtPayload = {
                    login_id: subAdminData.email,
                    id: subAdminData.id.toString(),
                    uuid: subAdminData.uuid,
                    user_type: subAdminData.user_type,
                };
                const token = (0, utils_1.generateToken)(jwtPayload);
                const user = {
                    id: subAdminData.id.toString(),
                    uuid: subAdminData.uuid,
                    name: subAdminData.name,
                    email: subAdminData.email,
                    user_type: subAdminData.user_type,
                    companyId: (_b = (_a = subAdminData.id) === null || _a === void 0 ? void 0 : _a.toString()) !== null && _b !== void 0 ? _b : null,
                };
                yield prismaClient_1.default.company.update({
                    where: { id: subAdminData.id },
                    data: { lastLogin: new Date() },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.LOGIN_SUCCESS,
                    token,
                    user,
                };
            }
            catch (error) {
                console.error("❌ Login error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError ? error : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.LOGIN_FAILED, 500, error.message);
            }
        });
    }
    addTeamMemberServices(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                // ==========================
                // ✅ VALIDATE COMPANY
                // ==========================
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: {
                        id,
                        isDeleted: false,
                        status: "ACTIVE",
                        isApproved: "APPROVED",
                        isVerified: true,
                        user_type: "COMPANY"
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError("Company not found", 404, "Company not found");
                }
                // ==========================
                // ❌ CHECK DUPLICATE USER
                // ==========================
                const existingTeamMember = yield prismaClient_1.default.user.findFirst({
                    where: {
                        email: data.email,
                        isDeleted: false,
                    },
                });
                if (existingTeamMember) {
                    throw new customError_1.CustomError("User already exists", 400, "Duplicate user");
                }
                // ==========================
                // 🔐 CREATE USER
                // ==========================
                const hashedPassword = yield bcryptjs_1.default.hash(data.password, 10);
                const teamMemberData = yield prismaClient_1.default.user.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        name: data.name,
                        user_type: data.user_type,
                        email: data.email,
                        mobileNumber: data.mobileNumber,
                        countryCode: data.countryCode,
                        password: hashedPassword,
                        status: "ACTIVE",
                        isDeleted: false,
                    }
                });
                // ==========================
                // 🔗 ROLE CREATION
                // ==========================
                let roleDetails = null;
                if (data.user_type === "PROJECT_MANAGER") {
                    roleDetails = yield prismaClient_1.default.projectManager.create({
                        data: {
                            userId: teamMemberData.id,
                            uuid: teamMemberData.uuid,
                            address: data.address,
                            latitude: (_a = data.latitude) !== null && _a !== void 0 ? _a : null,
                            longitude: (_b = data.longitude) !== null && _b !== void 0 ? _b : null,
                            companyId: companyData.id,
                            cmpId: companyData.CMPId
                        },
                    });
                }
                if (data.user_type === "COMPETENT_PERSON") {
                    roleDetails = yield prismaClient_1.default.competentPerson.create({
                        data: {
                            userId: teamMemberData.id,
                            uuid: teamMemberData.uuid,
                            address: data.address,
                            latitude: (_c = data.latitude) !== null && _c !== void 0 ? _c : null,
                            longitude: (_d = data.longitude) !== null && _d !== void 0 ? _d : null,
                            companyId: companyData.id,
                            cmpId: companyData.CMPId
                        },
                    });
                }
                // ==========================
                // 📁 USER MEDIA
                // ==========================
                if (data.idProofImage) {
                    yield prismaClient_1.default.userMedia.create({
                        data: {
                            userId: teamMemberData.id,
                            mediaType: "ID_PROOF_IMAGE",
                            url: data.idProofImage,
                        },
                    });
                }
                if (data.photoImage) {
                    yield prismaClient_1.default.userMedia.create({
                        data: {
                            userId: teamMemberData.id,
                            mediaType: "PHOTO_IMAGE",
                            url: data.photoImage,
                        },
                    });
                }
                // ==========================
                // 📧 EMAIL (ONLY PM & CP)
                // ==========================
                if (data.user_type === "PROJECT_MANAGER" || data.user_type === "COMPETENT_PERSON") {
                    yield (0, utils_1.sendMail)(teamMemberData.email, "Your ScaffSnap Account Details", (0, templates_1.teamMemberAddTemplate)(teamMemberData.name, teamMemberData.user_type, teamMemberData.email, data.password, companyData.CMPId || ""));
                }
                // ==========================
                // 🔔 DB NOTIFICATION DATA
                // ==========================
                const title = "TEAM MEMBER ADDED";
                const message = `New team member ${teamMemberData.name} added in ${companyData.name}`;
                // ==========================
                // 👑 SUPER ADMIN + COMPANY ADMINS (DB NOTIFICATION)
                // ==========================
                const superAdmins = yield prismaClient_1.default.user.findMany({
                    where: {
                        user_type: "SUPER_ADMIN",
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                    }
                });
                const companyAdmins = yield prismaClient_1.default.company.findMany({
                    where: {
                        id: companyData.id,
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                    }
                });
                yield prismaClient_1.default.notification.createMany({
                    data: [
                        ...superAdmins.map(a => ({
                            uuid: (0, uuid_1.v4)(),
                            title,
                            message,
                            type: client_1.NotificationType.PROJECT_MODIFIED,
                            role: client_1.NotificationRole.SUPER_ADMIN,
                            receiverId: a.id,
                            isRead: false,
                        })),
                        ...companyAdmins.map(a => ({
                            uuid: (0, uuid_1.v4)(),
                            title,
                            message,
                            type: client_1.NotificationType.PROJECT_MODIFIED,
                            role: client_1.NotificationRole.COMPANY,
                            receiverId: a.id,
                            isRead: false,
                        }))
                    ]
                });
                // ==========================
                // 📱 PUSH NOTIFICATIONS (POPUP FIX)
                // ==========================
                const superAdminDevices = yield prismaClient_1.default.device.findMany({
                    where: {
                        user_type: "SUPER_ADMIN",
                        deviceToken: { not: null }
                    },
                    select: {
                        deviceToken: true
                    }
                });
                const companyDevices = yield prismaClient_1.default.device.findMany({
                    where: {
                        user_type: { in: ["PROJECT_MANAGER", "COMPETENT_PERSON"] },
                        deviceToken: { not: null }
                    },
                    select: { deviceToken: true }
                });
                // 🔥 SUPER ADMIN PUSH
                for (const device of superAdminDevices) {
                    if (device.deviceToken) {
                        yield (0, utils_1.pushNotificationDelhi)(device.deviceToken, title, message);
                    }
                }
                // 🔥 COMPANY PUSH
                for (const device of companyDevices) {
                    if (device.deviceToken) {
                        yield (0, utils_1.pushNotificationDelhi)(device.deviceToken, title, message);
                    }
                }
                // ==========================
                // ✅ RESPONSE
                // ==========================
                return {
                    message: "Team member added successfully",
                    data: teamMemberData
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("Failed to add team member", 500, error.message);
            }
        });
    }
    editTeamMemberServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            try {
                const teamMemberToUpdate = yield prismaClient_1.default.user.findFirst({
                    where: { id: data.id, isDeleted: false, status: "ACTIVE" },
                });
                if (!teamMemberToUpdate) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBER_NOT_FOUND, 500, "The team member you are trying to update does not exist");
                }
                const existingTeamMember = yield prismaClient_1.default.user.findFirst({
                    where: {
                        email: data.email,
                        id: { not: data.id },
                        isDeleted: false,
                        status: "ACTIVE",
                    },
                });
                if (existingTeamMember) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBER_EXISTS, 500, "A team member with this email already exists under your company");
                }
                const teamMemberData = yield prismaClient_1.default.user.update({
                    where: { id: data.id },
                    data: {
                        name: data.name,
                        user_type: data.user_type,
                        email: data.email,
                        mobileNumber: data.mobileNumber,
                        countryCode: data.countryCode,
                        status: "ACTIVE",
                        isDeleted: false,
                    },
                });
                let roleDetails = null;
                if (data.user_type === "PROJECT_MANAGER") {
                    roleDetails = yield prismaClient_1.default.projectManager.update({
                        where: { userId: teamMemberData.id },
                        data: {
                            address: data.address,
                            latitude: (_a = data.latitude) !== null && _a !== void 0 ? _a : null,
                            longitude: (_b = data.longitude) !== null && _b !== void 0 ? _b : null,
                        },
                    });
                }
                else if (data.user_type === "COMPETENT_PERSON") {
                    roleDetails = yield prismaClient_1.default.competentPerson.update({
                        where: { userId: teamMemberData.id },
                        data: {
                            address: data.address,
                            latitude: (_c = data.latitude) !== null && _c !== void 0 ? _c : null,
                            longitude: (_d = data.longitude) !== null && _d !== void 0 ? _d : null,
                        },
                    });
                }
                if (data.idProofImage) {
                    const idProofMedia = yield prismaClient_1.default.userMedia.findFirst({
                        where: { userId: teamMemberData.id, mediaType: "ID_PROOF_IMAGE" },
                    });
                    if (idProofMedia) {
                        yield prismaClient_1.default.userMedia.update({
                            where: { id: idProofMedia.id },
                            data: { url: data.idProofImage },
                        });
                    }
                }
                if (data.photoImage) {
                    const photoMedia = yield prismaClient_1.default.userMedia.findFirst({
                        where: { userId: teamMemberData.id, mediaType: "PHOTO_IMAGE" },
                    });
                    if (photoMedia) {
                        yield prismaClient_1.default.userMedia.update({
                            where: { id: photoMedia.id },
                            data: { url: data.photoImage },
                        });
                    }
                }
                const teamMember = {
                    id: teamMemberData.id,
                    uuid: teamMemberData.uuid,
                    name: teamMemberData.name,
                    user_type: teamMemberData.user_type,
                    email: teamMemberData.email,
                    mobileNumber: teamMemberData.mobileNumber,
                    countryCode: teamMemberData.countryCode,
                    status: teamMemberData.status,
                    isDeleted: teamMemberData.isDeleted,
                    address: (_e = roleDetails === null || roleDetails === void 0 ? void 0 : roleDetails.address) !== null && _e !== void 0 ? _e : null,
                    idProofImage: (_f = roleDetails === null || roleDetails === void 0 ? void 0 : roleDetails.idProofImage) !== null && _f !== void 0 ? _f : null,
                    photoImage: (_g = roleDetails === null || roleDetails === void 0 ? void 0 : roleDetails.photoImage) !== null && _g !== void 0 ? _g : null,
                    latitude: (_h = roleDetails === null || roleDetails === void 0 ? void 0 : roleDetails.latitude) !== null && _h !== void 0 ? _h : null,
                    longitude: (_j = roleDetails === null || roleDetails === void 0 ? void 0 : roleDetails.longitude) !== null && _j !== void 0 ? _j : null,
                    cmpId: (_k = roleDetails === null || roleDetails === void 0 ? void 0 : roleDetails.cmpId) !== null && _k !== void 0 ? _k : null,
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.UPDATE_TEAM_MEMBER_SUCCESS,
                    data: teamMember,
                };
            }
            catch (error) {
                console.error("❌ Edit Team Member error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.UPDATE_TEAM_MEMBER_FAILED, 500, error.message);
            }
        });
    }
    getProjectManagersListServices(companyId_1) {
        return __awaiter(this, arguments, void 0, function* (companyId, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [projectManagers, totalCount] = yield Promise.all([
                    prismaClient_1.default.projectManager.findMany({
                        skip,
                        take: limit,
                        orderBy: { id: "desc" },
                        where: {
                            companyId: companyId,
                            user: {
                                user_type: "PROJECT_MANAGER",
                                isDeleted: false,
                            },
                            company: {
                                isDeleted: false,
                                status: "ACTIVE",
                                isApproved: "APPROVED",
                                isVerified: true,
                                user_type: "COMPANY"
                            }
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    uuid: true,
                                    name: true,
                                    email: true,
                                    mobileNumber: true,
                                    user_type: true,
                                    countryCode: true,
                                    userMedias: {
                                        select: { mediaType: true, url: true },
                                        where: {
                                            mediaType: { in: ["PHOTO_IMAGE", "ID_PROOF_IMAGE"] },
                                        },
                                    },
                                },
                            },
                            company: { select: { CMPId: true } },
                        },
                    }),
                    prismaClient_1.default.projectManager.count({
                        where: { companyId: companyId, user: { user_type: "PROJECT_MANAGER" } },
                    }),
                ]);
                const mappedPMs = projectManagers.map((pm) => {
                    var _a;
                    const photoImage = pm.user.userMedias.find((media) => media.mediaType === "PHOTO_IMAGE");
                    const idProofImage = pm.user.userMedias.find((media) => media.mediaType === "ID_PROOF_IMAGE");
                    return {
                        id: pm.id,
                        userId: pm.user.id,
                        uuid: pm.user.uuid,
                        name: pm.user.name,
                        email: pm.user.email,
                        mobileNumber: pm.user.mobileNumber,
                        user_type: pm.user.user_type,
                        countryCode: pm.user.countryCode,
                        CMPId: ((_a = pm.company) === null || _a === void 0 ? void 0 : _a.CMPId) || null,
                        address: pm.address || null,
                        latitude: pm.latitude || null,
                        longitude: pm.longitude || null,
                        image: (photoImage === null || photoImage === void 0 ? void 0 : photoImage.url) || null,
                        id_Proof: (idProofImage === null || idProofImage === void 0 ? void 0 : idProofImage.url) || null, // ✅ Fixed property access
                    };
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_SUCCESS,
                    data: mappedPMs,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ Get Project Manager List error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_FAILED, 500, error.message);
            }
        });
    }
    getCompetentPersonListServices(userId_1, data_1) {
        return __awaiter(this, arguments, void 0, function* (userId, data, page = 1, limit = 10) {
            var _a, _b;
            try {
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        user_type: true,
                        projectManager: {
                            select: { companyId: true }
                        }
                    }
                });
                if (!user) {
                    throw new customError_1.CustomError("User not found", 404);
                }
                const skip = (page - 1) * limit;
                const whereCondition = {
                    companyId: (_a = user.projectManager) === null || _a === void 0 ? void 0 : _a.companyId,
                    user: {
                        user_type: "COMPETENT_PERSON",
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true,
                    },
                };
                const searchTerm = (_b = data === null || data === void 0 ? void 0 : data.search) === null || _b === void 0 ? void 0 : _b.trim();
                if (searchTerm && searchTerm !== "") {
                    const term = searchTerm;
                    if (!isNaN(Number(term))) {
                        whereCondition.id = Number(term);
                    }
                    else {
                        whereCondition.OR = [
                            {
                                user: {
                                    name: {
                                        contains: searchTerm,
                                    },
                                },
                            },
                            {
                                user: {
                                    email: {
                                        contains: searchTerm,
                                    },
                                },
                            },
                            {
                                user: {
                                    mobileNumber: {
                                        contains: searchTerm,
                                    },
                                },
                            },
                        ];
                    }
                }
                const [competentPerson, totalCount] = yield Promise.all([
                    prismaClient_1.default.competentPerson.findMany({
                        skip,
                        take: limit,
                        orderBy: { id: "desc" },
                        where: whereCondition,
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    uuid: true,
                                    name: true,
                                    email: true,
                                    mobileNumber: true,
                                    user_type: true,
                                    countryCode: true,
                                    userMedias: {
                                        select: { mediaType: true, url: true },
                                        where: {
                                            mediaType: { in: ["PHOTO_IMAGE", "ID_PROOF_IMAGE"] },
                                        },
                                    },
                                },
                            },
                            company: { select: { CMPId: true } },
                        },
                    }),
                    prismaClient_1.default.competentPerson.count({
                        where: { user: { user_type: "COMPETENT_PERSON", isDeleted: false, isVerified: true } },
                    }),
                ]);
                const mappedPMs = competentPerson.map((pm) => {
                    var _a;
                    const photoImage = pm.user.userMedias.find((media) => media.mediaType === "PHOTO_IMAGE");
                    const idProofImage = pm.user.userMedias.find((media) => media.mediaType === "ID_PROOF_IMAGE");
                    return {
                        id: pm.id,
                        userId: pm.user.id,
                        uuid: pm.user.uuid,
                        name: pm.user.name,
                        email: pm.user.email,
                        mobileNumber: pm.user.mobileNumber,
                        user_type: pm.user.user_type,
                        countryCode: pm.user.countryCode,
                        address: pm.address || null,
                        latitude: pm.latitude || null,
                        longitude: pm.longitude || null,
                        CMPId: ((_a = pm.company) === null || _a === void 0 ? void 0 : _a.CMPId) || null,
                        image: (photoImage === null || photoImage === void 0 ? void 0 : photoImage.url) || null,
                        id_Proof: (idProofImage === null || idProofImage === void 0 ? void 0 : idProofImage.url) || null,
                    };
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_SUCCESS,
                    data: mappedPMs,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ Get Project Manager List error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_FAILED, 500, error.message);
            }
        });
    }
    getCompanyCompetentPersonList(companyId_1) {
        return __awaiter(this, arguments, void 0, function* (companyId, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [competentPerson, totalCount] = yield Promise.all([
                    prismaClient_1.default.competentPerson.findMany({
                        skip,
                        take: limit,
                        orderBy: { id: "desc" },
                        where: {
                            companyId: companyId,
                            user: {
                                isDeleted: false,
                                status: "ACTIVE",
                                isVerified: true,
                                user_type: "COMPETENT_PERSON",
                            },
                            company: {
                                isDeleted: false,
                                isApproved: "APPROVED",
                                status: "ACTIVE",
                                isVerified: true,
                                user_type: "COMPANY"
                            }
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    uuid: true,
                                    name: true,
                                    email: true,
                                    mobileNumber: true,
                                    user_type: true,
                                    countryCode: true,
                                    userMedias: {
                                        select: { mediaType: true, url: true },
                                        where: {
                                            mediaType: { in: ["PHOTO_IMAGE", "ID_PROOF_IMAGE"] },
                                        },
                                    },
                                },
                            },
                            company: { select: { CMPId: true } },
                        },
                    }),
                    prismaClient_1.default.competentPerson.count({
                        where: { companyId: companyId, user: { user_type: "COMPETENT_PERSON" } },
                    }),
                ]);
                const mappedPMs = competentPerson.map((pm) => {
                    var _a;
                    const photoImage = pm.user.userMedias.find((media) => media.mediaType === "PHOTO_IMAGE");
                    const idProofImage = pm.user.userMedias.find((media) => media.mediaType === "ID_PROOF_IMAGE");
                    return {
                        id: pm.id,
                        userId: pm.user.id,
                        uuid: pm.user.uuid,
                        name: pm.user.name,
                        email: pm.user.email,
                        mobileNumber: pm.user.mobileNumber,
                        user_type: pm.user.user_type,
                        countryCode: pm.user.countryCode,
                        address: pm.address || null,
                        latitude: pm.latitude || null,
                        longitude: pm.longitude || null,
                        CMPId: ((_a = pm.company) === null || _a === void 0 ? void 0 : _a.CMPId) || null,
                        image: (photoImage === null || photoImage === void 0 ? void 0 : photoImage.url) || null,
                        id_Proof: (idProofImage === null || idProofImage === void 0 ? void 0 : idProofImage.url) || null,
                    };
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_SUCCESS,
                    data: mappedPMs,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ Get Project Manager List error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_FAILED, 500, error.message);
            }
        });
    }
    getTradesManListServices() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [tradesMan, totalCount] = yield Promise.all([
                    prismaClient_1.default.user.findMany({
                        where: {
                            user_type: "TRADESMAN",
                            isDeleted: false,
                            status: "ACTIVE",
                        }, select: {
                            id: true,
                            uuid: true,
                            name: true,
                            email: true,
                            mobileNumber: true,
                            user_type: true,
                            countryCode: true,
                        },
                        skip,
                        take: limit,
                        orderBy: { createdAt: "desc" },
                    }),
                    prismaClient_1.default.user.count({
                        where: {
                            user_type: "TRADESMAN",
                            isDeleted: false,
                            status: "ACTIVE",
                        },
                    }),
                ]);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_SUCCESS,
                    data: tradesMan,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ Get Project Manager List error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_FAILED, 500, error.message);
            }
        });
    }
    createNewProject(subAdminId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // =========================
                // ✅ Validate Company (OWNER)
                // =========================
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: {
                        id: subAdminId,
                        isDeleted: false,
                        status: "ACTIVE",
                        isApproved: "APPROVED",
                        isVerified: true,
                        user_type: "COMPANY",
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND, 500, "Company not found");
                }
                // =========================
                // ✅ Validate Project Managers
                // =========================
                const projectManagersData = yield prismaClient_1.default.projectManager.findMany({
                    where: { userId: { in: data.projectManagerId } },
                });
                if (projectManagersData.length !== data.projectManagerId.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECTMANAGER.NOT_FOUND, 404, "Some project managers were not found");
                }
                // =========================
                // ❌ Duplicate Check
                // =========================
                const existingProject = yield prismaClient_1.default.project.findFirst({
                    where: {
                        clientEmail: data.clientEmail,
                        projectName: data.projectName,
                        createdById: subAdminId,
                        isDeleted: false
                    }
                });
                if (existingProject) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.ALREADY_EXISTS, 409, "Project already exists");
                }
                // =========================
                // ✅ Create Project
                // =========================
                const project = yield prismaClient_1.default.project.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        projectName: data.projectName,
                        PJT: (0, utils_1.generateProjectId)(),
                        clientName: data.clientName,
                        clientEmail: data.clientEmail,
                        clientMobile: data.clientMobile,
                        clientCountryCode: data.clientCountryCode,
                        clientAddress: data.clientAddress,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        status: "CREATED",
                        createdById: subAdminId,
                        isDeleted: false
                    }
                });
                // =========================
                // 🔗 Assign PMs
                // =========================
                yield prismaClient_1.default.project.update({
                    where: { id: project.id },
                    data: {
                        projectManagers: {
                            connect: data.projectManagerId.map(id => ({ id }))
                        }
                    }
                });
                // =========================
                // 👑 SUPER ADMIN + COMPANY OWNER ONLY
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
                const receiverIds = [
                    subAdminId,
                    ...superAdmins.map(sa => Number(sa.id))
                ];
                // =========================
                // 🔔 GET SETTINGS
                // =========================
                const settings = yield prismaClient_1.default.notificationSetting.findMany({
                    where: {
                        userId: { in: receiverIds }
                    }
                });
                // =========================
                // ✅ APPLY TOGGLE
                // =========================
                const allowedUserIds = receiverIds.filter(id => {
                    const setting = settings.find(s => Number(s.userId) === id);
                    if (!setting)
                        return true;
                    return setting.projectCreated === true;
                });
                const message = `Project "${project.projectName}" has been created successfully.`;
                // =========================
                // 📩 DB NOTIFICATIONS
                // =========================
                yield prismaClient_1.default.notification.createMany({
                    data: allowedUserIds.map(id => ({
                        uuid: (0, uuid_1.v4)(),
                        title: "PROJECT CREATED",
                        message,
                        type: "PROJECT_ASSIGNED",
                        role: id === subAdminId ? "COMPANY" : "SUPER_ADMIN",
                        isRead: false,
                        companyId: subAdminId,
                        projectId: BigInt(project.id),
                        receiverId: BigInt(id),
                        senderId: subAdminId.toString(),
                        notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/Frame+2087325149.png"
                    }))
                });
                // =========================
                // 📧 EMAIL (ONLY IF ENABLED)
                // =========================
                const emailUsers = yield prismaClient_1.default.user.findMany({
                    where: {
                        id: {
                            in: settings
                                .filter(s => s.emailEnabled)
                                .map(s => Number(s.userId))
                        }
                    },
                    select: { email: true }
                });
                for (const user of emailUsers) {
                    yield (0, utils_1.sendMail)(user.email, "Project Created", message);
                }
                // =========================
                // 📱 PUSH NOTIFICATION (POPUP)
                // =========================
                const devices = yield prismaClient_1.default.device.findMany({
                    where: {
                        userId: { in: allowedUserIds },
                        deviceToken: { not: null }
                    },
                    select: { deviceToken: true }
                });
                for (const device of devices) {
                    yield (0, utils_1.pushNotificationDelhi)(device.deviceToken, "PROJECT CREATED", message);
                }
                // =========================
                // RESPONSE
                // =========================
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECT.CREATE_SUCCESS,
                    data: project
                };
            }
            catch (error) {
                console.error("❌ Create project error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.CREATE_FAILED, 500, error.message);
            }
        });
    }
    updateProject(subAdminId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: { id: subAdminId, isDeleted: false, status: "ACTIVE" },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND, 500, "The company you are trying to create a project for does not exist");
                }
                // 1️⃣ Validate project exists
                const oldProject = yield prismaClient_1.default.project.findFirst({
                    where: { id: data.id, isDeleted: false },
                    include: {
                        projectManagers: {
                            select: { id: true }
                        }
                    }
                });
                if (!oldProject) {
                    throw new customError_1.CustomError("Project not found", 404, "Project not found");
                }
                // 👉 Extract existing PM IDs
                const existingPMIds = oldProject.projectManagers.map(pm => pm.id);
                // 2️⃣ Validate all project managers exist
                const projectManagersData = yield prismaClient_1.default.projectManager.findMany({
                    where: { userId: { in: data.projectManagerId } },
                    include: { user: true, company: true }
                });
                if (projectManagersData.length !== data.projectManagerId.length) {
                    throw new customError_1.CustomError("Some project managers not found", 400, "Some project managers are invalid");
                }
                const validPMUsers = yield prismaClient_1.default.user.findMany({
                    where: {
                        id: { in: data.projectManagerId },
                        isDeleted: false,
                        status: "ACTIVE",
                        user_type: "PROJECT_MANAGER",
                        isVerified: true,
                    }
                });
                if (validPMUsers.length !== data.projectManagerId.length) {
                    throw new customError_1.CustomError("Some project manager accounts are not valid", 400, "Some PMs are inactive or deleted");
                }
                // 3️⃣ Check duplicate project (excluding current)
                const duplicateProject = yield prismaClient_1.default.project.findFirst({
                    where: {
                        clientEmail: data.clientEmail,
                        projectName: data.projectName,
                        createdById: subAdminId,
                        isDeleted: false,
                        NOT: { id: data.id }
                    }
                });
                if (duplicateProject) {
                    throw new customError_1.CustomError("Duplicate project", 409, "Project with same name/email exists");
                }
                // 4️⃣ Find newly added PMs
                const newlyAddedPMIds = data.projectManagerId.filter(id => !existingPMIds.includes(BigInt(id)));
                // 5️⃣ Update project
                const updatedProject = yield prismaClient_1.default.project.update({
                    where: { id: data.id },
                    data: {
                        projectName: data.projectName,
                        clientName: data.clientName,
                        clientEmail: data.clientEmail,
                        clientMobile: data.clientMobile,
                        clientCountryCode: data.clientCountryCode,
                        clientAddress: data.clientAddress,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        createdById: subAdminId,
                        status: "CREATED",
                        isDeleted: false,
                        projectManagers: {
                            set: data.projectManagerId.map(id => ({ id }))
                        }
                    }
                });
                yield prismaClient_1.default.projectScaffholdRequest.updateMany({
                    where: {
                        projectId: data.id,
                    },
                    data: {
                        projectId: data.id // or remove if not needed
                    }
                });
                if (newlyAddedPMIds.length > 0) {
                    const deviceTokens = yield prismaClient_1.default.device.findMany({
                        where: {
                            userId: { in: newlyAddedPMIds },
                            deviceToken: { not: null }
                        },
                        select: { userId: true, deviceToken: true }
                    });
                    const notificationMessage = `You have been assigned as Project Manager for project "${updatedProject.projectName}".`;
                    yield prismaClient_1.default.notification.createMany({
                        data: newlyAddedPMIds.map(pmId => {
                            var _a, _b;
                            return ({
                                uuid: (0, uuid_1.v4)(),
                                title: "Project Modified",
                                message: notificationMessage,
                                type: "PROJECT_MODIFIED",
                                role: "PROJECT_MANAGER",
                                scaffoldRequestId: "",
                                isRead: false,
                                companyId: (_b = (_a = projectManagersData[0].company) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : undefined,
                                projectId: BigInt(updatedProject.id),
                                receiverId: BigInt(pmId),
                                senderId: subAdminId.toString(),
                                notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/Frame+2087325149.png"
                            });
                        })
                    });
                    for (const dev of deviceTokens) {
                        if (!dev.deviceToken)
                            continue;
                        yield (0, utils_1.pushNotificationDelhi)(dev.deviceToken, "PROJECT_ASSIGNED", notificationMessage);
                    }
                }
                const projectWithPMs = yield prismaClient_1.default.project.findUnique({
                    where: { id: updatedProject.id },
                    include: {
                        projectManagers: {
                            include: { userMedias: true }
                        }
                    }
                });
                const formattedPMs = projectWithPMs === null || projectWithPMs === void 0 ? void 0 : projectWithPMs.projectManagers.map(pm => {
                    var _a;
                    return ({
                        id: pm.id,
                        name: pm.name,
                        email: pm.email,
                        url: ((_a = pm.userMedias[0]) === null || _a === void 0 ? void 0 : _a.url) || null
                    });
                });
                return {
                    message: "Project updated successfully",
                    data: Object.assign(Object.assign({}, projectWithPMs), { projectManagers: formattedPMs })
                };
            }
            catch (error) {
                console.error("❌ Update Project Error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Project update failed", 500, error.message);
            }
        });
    }
    teamMemberDashboard(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: {
                        id: companyId, isDeleted: false, status: "ACTIVE",
                        isVerified: true,
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND, 500, "The company you are trying to fetch does not exist");
                }
                const totalProjectManagers = yield prismaClient_1.default.user.count({
                    where: {
                        status: "ACTIVE",
                        user_type: "PROJECT_MANAGER",
                        isVerified: true,
                        isDeleted: false,
                        projectManager: {
                            companyId: companyId,
                        },
                    },
                });
                const totalCompetentPersons = yield prismaClient_1.default.user.count({
                    where: {
                        status: "ACTIVE",
                        user_type: "COMPETENT_PERSON",
                        isVerified: true,
                        isDeleted: false,
                        competentPerson: {
                            companyId: companyId,
                        },
                    },
                });
                const totalTradesMan = yield prismaClient_1.default.user.count({
                    where: {
                        status: "ACTIVE",
                        user_type: "TRADESMAN",
                        isVerified: true,
                        isDeleted: false,
                        tradesman: {
                            createdProjectScaffRequests: {
                                some: {
                                    project: {
                                        createdById: companyId
                                    }
                                }
                            }
                        }
                    }
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_SUCCESS,
                    totalCompetentPersons,
                    totalProjectManagers,
                    totalTradesMan
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_FAILED, 500, error.message);
            }
        });
    }
    scaffholdDashboard(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: { id: companyId, isDeleted: false, status: "ACTIVE" },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND, 500, "The company you are trying to fetch  does not exist");
                }
                const [totalActiveScaffHold, totalDismentedScaffhold, totalActiveProjects, totalProjectManagers, totalCompetentPersons] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: {
                            status: "ACTIVE",
                            project: {
                                createdById: companyId
                            }
                        }
                    }),
                    prismaClient_1.default.projectScaffholdRequest.count({ where: { status: "DISMANTLED", createdById: companyId } }),
                    prismaClient_1.default.project.count({ where: { status: "ONGOING", createdById: companyId } }),
                    prismaClient_1.default.user.count({
                        where: {
                            status: "ACTIVE", user_type: "PROJECT_MANAGER", projectManager: {
                                companyId: companyId
                            }
                        }
                    }),
                    prismaClient_1.default.user.count({
                        where: {
                            status: "ACTIVE", user_type: "COMPETENT_PERSON", competentPerson: {
                                companyId: companyId
                            }
                        }
                    }),
                ]);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_SUCCESS,
                    totalActiveProjects,
                    totalDismentedScaffhold,
                    totalActiveScaffHold,
                    totalTeamMembers: totalCompetentPersons + totalProjectManagers, // use colon, not equals
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_FAILED, 500, error.message);
            }
        });
    }
    projectDashboard(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: { id: companyId, isDeleted: false, status: "ACTIVE" },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND, 500, "The company you are trying to create a project for does not exist");
                }
                // Fetch counts
                const [totalProjects, ongoingProjects, completedProjects, projectsWithoutScaffhold] = yield Promise.all([
                    prismaClient_1.default.project.count({ where: { isDeleted: false, createdById: companyId } }),
                    prismaClient_1.default.project.count({ where: { status: "ONGOING", isDeleted: false, createdById: companyId } }),
                    prismaClient_1.default.project.count({ where: { status: "COMPLETED", isDeleted: false, createdById: companyId } }),
                    prismaClient_1.default.project.count({
                        where: {
                            isDeleted: false,
                            createdById: companyId
                        },
                    }),
                ]);
                return {
                    totalProjects,
                    ongoingProjects,
                    completedProjects,
                    projectsWithoutScaffhold,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_FAILED, 500, error.message);
            }
        });
    }
    scaffholdStatusDashboard(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: { id: companyId, isDeleted: false, status: "ACTIVE" },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND, 500, "The company you are trying to create a project for does not exist");
                }
                const [totalScaffholds, totalErected, totalDismantled, totalRedTag] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: {
                            project: {
                                isDeleted: false,
                                createdById: companyId,
                            },
                        },
                    }),
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: {
                            status: "APPROVED", // or your "ERECTED" equivalent
                            project: {
                                isDeleted: false,
                                createdById: companyId,
                            },
                        },
                    }),
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: {
                            status: "REJECTED", // or map to DISMANTLED if you use that logic
                            project: {
                                isDeleted: false,
                                createdById: companyId,
                            },
                        },
                    }),
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: {
                            tag: "RED",
                            project: {
                                isDeleted: false,
                                createdById: companyId,
                            },
                        },
                    }),
                ]);
                return {
                    totalScaffholds,
                    totalErected,
                    totalDismantled,
                    totalRedTag,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_FAILED, 500, error.message);
            }
        });
    }
    searchTeamMember(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validTypes = ["PROJECT_MANAGER", "COMPETENT_PERSON"];
                const userType = data.user_type;
                if (!validTypes.includes(userType)) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.INVALID_TYPE, 400, "Invalid user type. Allowed: PROJECT_MANAGER, COMPETENT_PERSON");
                }
                const whereCondition = {
                    user_type: userType,
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                };
                if (data.search) {
                    const search = data.search.trim();
                    if (!isNaN(Number(search))) {
                        whereCondition.id = Number(search);
                    }
                    else {
                        whereCondition.OR = [
                            { email: { contains: search, } },
                            { name: { contains: search, } },
                        ];
                    }
                }
                let users = [];
                if (userType === "PROJECT_MANAGER") {
                    const projectManagers = yield prismaClient_1.default.user.findMany({
                        where: whereCondition,
                        include: {
                            projectManager: true,
                        },
                    });
                    users = projectManagers.map((u) => {
                        var _a, _b, _c;
                        return ({
                            userId: u.id,
                            uuid: u.uuid,
                            name: u.name,
                            email: u.email,
                            mobileNumber: u.mobileNumber,
                            countryCode: u.countryCode,
                            userType: u.user_type,
                            status: u.status,
                            address: ((_a = u.projectManager) === null || _a === void 0 ? void 0 : _a.address) || null,
                            latitude: ((_b = u.projectManager) === null || _b === void 0 ? void 0 : _b.latitude) || null,
                            longitude: ((_c = u.projectManager) === null || _c === void 0 ? void 0 : _c.longitude) || null,
                        });
                    });
                }
                if (userType === "COMPETENT_PERSON") {
                    const competentPersons = yield prismaClient_1.default.user.findMany({
                        where: whereCondition,
                        include: {
                            competentPerson: true,
                        },
                    });
                    users = competentPersons.map((u) => {
                        var _a, _b, _c;
                        return ({
                            userId: u.id,
                            uuid: u.uuid,
                            name: u.name,
                            email: u.email,
                            mobileNumber: u.mobileNumber,
                            countryCode: u.countryCode,
                            userType: u.user_type,
                            status: u.status,
                            address: ((_a = u.competentPerson) === null || _a === void 0 ? void 0 : _a.address) || null,
                            latitude: ((_b = u.competentPerson) === null || _b === void 0 ? void 0 : _b.latitude) || null,
                            longitude: ((_c = u.competentPerson) === null || _c === void 0 ? void 0 : _c.longitude) || null,
                        });
                    });
                }
                if (!users.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, `No ${userType.toLowerCase().replace("_", " ")} found matching your search`);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.SEARCH_SUCCESS,
                    data: users,
                };
            }
            catch (error) {
                console.error("❌ Search Team Member error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.SEARCH_FAILED, 500, error.message);
            }
        });
    }
    searchTeamMemberByScaffhold(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const validTypes = ["PROJECT_MANAGER", "COMPETENT_PERSON", "TRADESMAN"];
                const userType = data.user_type.toUpperCase();
                if (!validTypes.includes(userType)) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.INVALID_TYPE, 400, "Invalid user type. Allowed: PROJECT_MANAGER, COMPETENT_PERSON, TRADESMAN");
                }
                // ✅ FIX: correct model used
                const scaffhold = yield prismaClient_1.default.projectScaffholdRequest.findUnique({
                    where: { id: data.scaffHoldId },
                    include: {
                        project: {
                            include: {
                                projectManagers: {
                                    where: {
                                        isDeleted: false,
                                        isVerified: true,
                                        status: "ACTIVE",
                                    },
                                    include: {
                                        userMedias: {
                                            where: { mediaType: "PHOTO_IMAGE" },
                                            take: 1,
                                        },
                                    },
                                },
                                tradesMen: {
                                    include: {
                                        tradesMan: {
                                            include: {
                                                user: {
                                                    include: {
                                                        userMedias: {
                                                            where: { mediaType: "PHOTO_IMAGE" },
                                                            take: 1,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                competentPersons: {
                                    include: {
                                        competentPerson: {
                                            include: {
                                                user: {
                                                    include: {
                                                        userMedias: {
                                                            where: { mediaType: "PHOTO_IMAGE" },
                                                            take: 1,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        createdBy: {
                            include: {
                                user: {
                                    include: {
                                        userMedias: {
                                            where: { mediaType: "PHOTO_IMAGE" },
                                            take: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Scaffhold request not found");
                }
                let users = [];
                // 👷 PROJECT MANAGER
                if (userType === "PROJECT_MANAGER") {
                    users =
                        ((_a = scaffhold.project) === null || _a === void 0 ? void 0 : _a.projectManagers.map((pm) => {
                            var _a, _b;
                            return ({
                                name: pm.name,
                                email: pm.email,
                                mobileNumber: pm.mobileNumber,
                                image: ((_b = (_a = pm.userMedias) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || null,
                            });
                        })) || [];
                }
                // 🧑‍🔧 COMPETENT PERSON
                if (userType === "COMPETENT_PERSON") {
                    users =
                        ((_b = scaffhold.project) === null || _b === void 0 ? void 0 : _b.competentPersons.map((cp) => {
                            var _a, _b;
                            return ({
                                name: cp.competentPerson.user.name,
                                email: cp.competentPerson.user.email,
                                mobileNumber: cp.competentPerson.user.mobileNumber,
                                image: ((_b = (_a = cp.competentPerson.user.userMedias) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || null,
                            });
                        })) || [];
                }
                // 🧱 TRADESMAN
                if (userType === "TRADESMAN") {
                    users =
                        ((_c = scaffhold.project) === null || _c === void 0 ? void 0 : _c.tradesMen.map((tm) => {
                            var _a, _b;
                            return ({
                                name: tm.tradesMan.user.name,
                                email: tm.tradesMan.user.email,
                                mobileNumber: tm.tradesMan.user.mobileNumber,
                                image: ((_b = (_a = tm.tradesMan.user.userMedias) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || null,
                            });
                        })) || [];
                }
                if (!users.length) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, `No ${userType.toLowerCase().replace("_", " ")} found for this scaffhold`);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.SEARCH_SUCCESS,
                    data: users,
                };
            }
            catch (error) {
                console.error("❌ Search Team Member error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.SEARCH_FAILED, 500, error.message);
            }
        });
    }
    getRequestByScaffHoldId(data, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const skip = (page - 1) * limit;
                const searchTerm = ((_a = data === null || data === void 0 ? void 0 : data.search) === null || _a === void 0 ? void 0 : _a.trim()) || "";
                const whereCondition = {
                    projectId: data.scaffHoldId, // ✅ FIX: scaffholdId -> projectId
                };
                // 🔍 SEARCH FIX (correct relation path)
                if (searchTerm !== "") {
                    whereCondition.createdBy = {
                        user: {
                            name: {
                                contains: searchTerm,
                            },
                        },
                    };
                }
                // 📊 TOTAL COUNT
                const totalCount = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: whereCondition,
                });
                // 📦 DATA FETCH
                const requests = yield prismaClient_1.default.projectScaffholdRequest.findMany({
                    where: whereCondition,
                    include: {
                        createdBy: {
                            include: {
                                user: {
                                    include: {
                                        userMedias: {
                                            where: { mediaType: "PHOTO_IMAGE" },
                                            take: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    skip,
                    take: limit,
                });
                if (!requests.length) {
                    return {
                        message: responseMessages_1.RESPONSE_MESSAGES.REQUEST.NOT_FOUND,
                        data: [],
                        totalCount: 0,
                        totalPages: 0,
                        currentPage: page,
                    };
                }
                const response = requests.map((r) => {
                    var _a, _b, _c, _d, _e, _f;
                    return ({
                        id: r.id,
                        tradesmanName: ((_b = (_a = r.createdBy) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.name) || null,
                        image: ((_f = (_e = (_d = (_c = r.createdBy) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.userMedias) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.url) || null,
                        expectedEndDate: r.expectedEndDate,
                        note: r.notes,
                        craft: r.craft,
                        scaffHoldId: r.projectId, // ✅ FIX
                        createdAt: r.createdAt,
                        length: r.length,
                        width: r.width,
                        height: r.height,
                        createdById: r.createdById,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.REQUEST.FETCH_SUCCESS,
                    data: response,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ getRequestByScaffHoldId error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.REQUEST.FETCH_FAILED, 500, error.message || "Failed to fetch requests");
            }
        });
    }
    getTimelineImagesByStatus(data, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                // ✅ FIX: correct validation using scaffoldRequestId (NOT projectId)
                const timelineExists = yield prismaClient_1.default.projectScaffholdTimeline.findFirst({
                    where: {
                        scaffoldRequestId: data.scaffHoldId,
                    },
                });
                if (!timelineExists) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold timeline not found");
                }
                // ✅ FIX: correct filtering path
                const whereCondition = {
                    timeline: {
                        scaffoldRequestId: data.scaffHoldId,
                    },
                };
                if (data.status) {
                    whereCondition.status = data.status;
                }
                const [images, totalCount] = yield Promise.all([
                    prismaClient_1.default.timelineImage.findMany({
                        where: whereCondition,
                        select: {
                            id: true,
                            url: true,
                            status: true,
                            timeline: {
                                select: {
                                    createdAt: true,
                                    createdBy: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { id: "desc" },
                        skip,
                        take: limit,
                    }),
                    prismaClient_1.default.timelineImage.count({
                        where: whereCondition,
                    }),
                ]);
                const formattedImages = images.map((img) => {
                    var _a, _b;
                    return ({
                        status: img.status,
                        createdBy: ((_a = img.timeline.createdBy) === null || _a === void 0 ? void 0 : _a.name) || "Unknown",
                        createdById: ((_b = img.timeline.createdBy) === null || _b === void 0 ? void 0 : _b.id) || null,
                        createdAt: img.timeline.createdAt,
                        images: [
                            {
                                url: img.url,
                                id: img.id,
                            },
                        ],
                    });
                });
                return {
                    message: `Timeline images fetched successfully${data.status ? ` with status: ${data.status}` : ""}`,
                    data: formattedImages,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                console.error("❌ getTimelineImagesByStatus error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE.FAILED_FETCH_IMAGES, 500, error.message || "Unexpected error");
            }
        });
    }
    getProjectListServices(companyId_1) {
        return __awaiter(this, arguments, void 0, function* (companyId, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: {
                        id: companyId,
                        isDeleted: false,
                        status: "ACTIVE",
                        isApproved: "APPROVED",
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 404, "Company not found");
                }
                const whereCondition = {
                    isDeleted: false,
                    createdById: companyId,
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
                            status: true,
                            isDeleted: true,
                            createdAt: true,
                            updatedAt: true,
                            // ✅ FIX: proper relation select
                            projectManagers: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    mobileNumber: true,
                                },
                            },
                            _count: {
                                select: {
                                    TradesManRequests: true,
                                    tradesMen: true,
                                    competentPersons: true,
                                    jobCrafts: true,
                                },
                            },
                        },
                        skip,
                        take: limit,
                        orderBy: {
                            createdAt: "desc",
                        },
                    }),
                    prismaClient_1.default.project.count({
                        where: whereCondition,
                    }),
                ]);
                const formattedProjects = projects.map((p) => ({
                    id: p.id,
                    uuid: p.uuid,
                    projectName: p.projectName,
                    PJT: p.PJT,
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
                    projectManagers: p.projectManagers,
                    status: p.status,
                    isDeleted: p.isDeleted,
                    createdAt: p.createdAt,
                    updatedAt: p.updatedAt,
                    totalTradesmanRequests: p._count.TradesManRequests,
                    totalTradesmen: p._count.tradesMen,
                    totalCompetentPersons: p._count.competentPersons,
                    totalJobCrafts: p._count.jobCrafts,
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
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getAllScaffHolds(companyId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: {
                        id: companyId,
                        isDeleted: false,
                        status: "ACTIVE",
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 404, "Company not found");
                }
                const skip = (page - 1) * limit;
                const whereCondition = {
                    project: {
                        createdById: companyId, // 👈 company filter via project
                    },
                };
                const [scaffholds, totalCount] = yield Promise.all([
                    prismaClient_1.default.projectScaffholdRequest.findMany({
                        where: whereCondition,
                        skip,
                        take: limit,
                        orderBy: {
                            createdAt: "desc",
                        },
                        include: {
                            project: {
                                select: {
                                    id: true,
                                    projectName: true,
                                    PJT: true,
                                },
                            },
                            createdBy: {
                                select: {
                                    id: true,
                                    experience: true,
                                    user: {
                                        select: {
                                            id: true,
                                            name: true,
                                            email: true,
                                            mobileNumber: true,
                                        },
                                    },
                                },
                            },
                        },
                    }),
                    prismaClient_1.default.projectScaffholdRequest.count({
                        where: whereCondition,
                    }),
                ]);
                const formattedScaffholds = scaffholds.map((item) => {
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
                    return ({
                        id: item.id,
                        uuid: item.uuid,
                        projectId: item.projectId,
                        // 🔧 Scaffold fields
                        craft: item.craft,
                        length: item.length,
                        width: item.width,
                        height: item.height,
                        priority: item.priority,
                        expectedEndDate: item.expectedEndDate,
                        REQID: item.REQID,
                        notes: item.notes,
                        status: item.status,
                        SCAFFID: item.SCAFFID,
                        tag: item.tag,
                        startDate: item.startDate,
                        endDate: item.endDate,
                        latitude: item.latitude,
                        longitude: item.longitude,
                        createdAt: item.createdAt,
                        // 🔧 Flatten Project
                        projectName: (_a = item.project) === null || _a === void 0 ? void 0 : _a.projectName,
                        PJT: (_b = item.project) === null || _b === void 0 ? void 0 : _b.PJT,
                        // 🔧 Flatten User (Tradesman)
                        createdById: (_d = (_c = item.createdBy) === null || _c === void 0 ? void 0 : _c.user) === null || _d === void 0 ? void 0 : _d.id,
                        name: (_f = (_e = item.createdBy) === null || _e === void 0 ? void 0 : _e.user) === null || _f === void 0 ? void 0 : _f.name,
                        email: (_h = (_g = item.createdBy) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.email,
                        mobileNumber: (_k = (_j = item.createdBy) === null || _j === void 0 ? void 0 : _j.user) === null || _k === void 0 ? void 0 : _k.mobileNumber,
                        experience: (_l = item.createdBy) === null || _l === void 0 ? void 0 : _l.experience,
                    });
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                    data: formattedScaffholds, // ✅ use formatted data
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                    currentPage: page,
                };
            }
            catch (error) {
                console.error("❌ Get all scaffholds error:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getUserDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // ✅ Fetch user with relations
                const user = yield prismaClient_1.default.company.findUnique({
                    where: { id, isApproved: "APPROVED", status: "ACTIVE", isDeleted: false, isVerified: true },
                    select: {
                        id: true,
                        uuid: true,
                        name: true,
                        email: true,
                        mobileNumber: true,
                        countryCode: true,
                        user_type: true,
                        status: true,
                        address: true,
                        createdAt: true,
                        lastLogin: true,
                        image: true,
                    },
                });
                if (!user) {
                    throw new customError_1.CustomError("USER_NOT_FOUND", 404, "User not found");
                }
                const responseData = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    countryCode: user.countryCode,
                    mobileNumber: user.mobileNumber,
                    user_type: user.user_type,
                    status: user.status,
                    address: user.address,
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin,
                    image: user.image,
                };
                return {
                    message: "User details fetched successfully",
                    data: responseData,
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
    deleteUserBySubAdminServices(subAdminId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 1️⃣ Validate SubAdmin
                const subAdminUser = yield prismaClient_1.default.company.findFirst({
                    where: {
                        id: subAdminId,
                        isDeleted: false,
                        status: "ACTIVE",
                        user_type: "COMPANY",
                        isApproved: "APPROVED",
                        isVerified: true,
                    }
                });
                if (!subAdminUser) {
                    throw new customError_1.CustomError("Unauthorized", 403);
                }
                // 2️⃣ Check user exists
                const user = yield prismaClient_1.default.user.findFirst({
                    where: {
                        id: userId,
                        isDeleted: false
                    }
                });
                if (!user) {
                    throw new customError_1.CustomError("User not found", 404);
                }
                // 3️⃣ Prevent deleting ADMIN / SUB_ADMIN
                if (["ADMIN", "SUB_ADMIN"].includes(user.user_type)) {
                    throw new customError_1.CustomError("You cannot delete this user", 403);
                }
                // 4️⃣ Soft delete
                yield prismaClient_1.default.user.update({
                    where: { id: userId },
                    data: {
                        isDeleted: true,
                    }
                });
                return {
                    message: "User deleted successfully"
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Delete failed", 500, error.message);
            }
        });
    }
    logoutCompany(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.company.findFirst({
                    where: {
                        id: id,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true,
                        isApproved: "APPROVED"
                    },
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
                }
                // ✅ Delete ONLY current device
                yield prismaClient_1.default.device.deleteMany({
                    where: {
                        userId: user.id,
                        deviceToken: data.deviceToken,
                    },
                });
                return {
                    status: 200,
                    message: responseMessages_1.RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.LOGOUT_FAIL, 500, error.message);
            }
        });
    }
    getProjectScaffHold(page, limit, projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                console.log("projectId:", projectId);
                // ✅ 1. Get project (single source of truth)
                const project = yield prismaClient_1.default.project.findUnique({
                    where: { id: projectId },
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
                if (!project) {
                    throw new customError_1.CustomError("Project not found", 404, "PROJECT_NOT_FOUND");
                }
                // ✅ 2. Get scaffhold count
                const totalCount = yield prismaClient_1.default.projectScaffholdRequest.count({
                    where: { projectId },
                });
                const totalPages = Math.ceil(totalCount / limit);
                // ✅ 3. Get scaffhold list
                const scaffholdList = yield prismaClient_1.default.projectScaffholdRequest.findMany({
                    where: { projectId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        uuid: true,
                        REQID: true,
                        SCAFFID: true,
                        projectId: true,
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
                        expectedEndDate: true,
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
                // ✅ RESPONSE
                return {
                    success: true,
                    message: "Project scaffhold fetched successfully",
                    data: Object.assign(Object.assign({}, project), { scaffholdList: scaffholdList.map((item) => { var _a, _b; return ({ id: item.id.toString(), uuid: item.uuid, REQID: item.REQID, SCAFFID: item.SCAFFID, projectId: item.projectId.toString(), craft: item.craft, length: item.length, width: item.width, height: item.height, priority: item.priority, status: item.status, tag: item.tag, notes: item.notes, address: item.address, latitude: item.latitude, longitude: item.longitude, expectedEndDate: item.expectedEndDate, createdByCraft: (_a = item.createdBy) === null || _a === void 0 ? void 0 : _a.craft, createdBy: (_b = item.createdBy) === null || _b === void 0 ? void 0 : _b.user, createdAt: item.createdAt, updatedAt: item.updatedAt, }); }) }),
                    pagination: {
                        total: totalCount,
                        totalPages,
                        currentPage: page,
                        limit,
                    },
                };
            }
            catch (error) {
                console.error("❌ Service error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(error.message || "Failed to fetch project scaffhold", error.statusCode || 500, error.details || "INTERNAL_ERROR");
            }
        });
    }
}
exports.subAdminServices = subAdminServices;
