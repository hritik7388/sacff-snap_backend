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
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
class subAdminServices {
    loginSubAdminServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const subAdminData = yield prismaClient_1.default.company.findUnique({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" },
                });
                if (!subAdminData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.NOT_FOUND, 500, "The provided companyId and email do not match");
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            try {
                const existingTeamMember = yield prismaClient_1.default.user.findFirst({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" },
                });
                if (existingTeamMember) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBER_EXISTS, 500, "A team member with this email already exists under your company");
                }
                const companyData = yield prismaClient_1.default.company.findFirst({
                    where: { id: id, isDeleted: false, status: "ACTIVE" },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND, 500, "The company you are trying to add a team member to does not exist");
                }
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
                else if (data.user_type === "COMPETENT_PERSON") {
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
                const teamMember = {
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
                    cmpId: companyData.CMPId
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.ADD_TEAM_MEMBER_SUCCESS,
                    data: teamMember
                };
            }
            catch (error) {
                console.error("❌ Add Team Member error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.ADD_TEAM_MEMBER_FAILED, 500, error.message);
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
                            },
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
    getCompetentPersonListServices() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [competentPerson, totalCount] = yield Promise.all([
                    prismaClient_1.default.competentPerson.findMany({
                        skip,
                        take: limit,
                        orderBy: { id: "desc" },
                        where: {
                            user: {
                                user_type: "COMPETENT_PERSON",
                            },
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
                        where: { user: { user_type: "COMPETENT_PERSON" } },
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
                                user_type: "COMPETENT_PERSON",
                            },
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
                const projectManager = yield prismaClient_1.default.user.findFirst({
                    where: {
                        id: data.projectManagerId,
                        isDeleted: false,
                        status: "ACTIVE",
                        user_type: "PROJECT_MANAGER"
                    }
                });
                if (data.projectManagerId && !projectManager) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.PROJECT_MANAGER_NOT_FOUND, 500, "The provided project manager does not exist");
                }
                const existingProject = yield prismaClient_1.default.project.findFirst({
                    where: {
                        clientEmail: data.clientEmail,
                        projectName: data.projectName,
                        createdById: subAdminId,
                        isDeleted: false,
                    }
                });
                if (existingProject) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.ALREADY_EXISTS, 500, "A project with the same name and client email already exists under your company");
                }
                const newProject = yield prismaClient_1.default.project.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
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
                        projectManagerId: data.projectManagerId,
                        status: "CREATED",
                        isDeleted: false,
                    }
                });
                console.log("newProject==============================>>>", newProject);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECT.CREATE_SUCCESS,
                    data: newProject,
                };
            }
            catch (error) {
                console.error("❌ Create New Project error:=======================>>>>", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.CREATE_FAILED, 500, error.message);
            }
        });
    }
    updateProject(subAdminId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const projectManager = yield prismaClient_1.default.user.findFirst({
                    where: {
                        id: data.projectManagerId,
                        isDeleted: false,
                        status: "ACTIVE",
                        user_type: "PROJECT_MANAGER"
                    }
                });
                if (data.projectManagerId && !projectManager) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SUB_ADMIN.PROJECT_MANAGER_NOT_FOUND, 500, "The provided project manager does not exist");
                }
                const existingProject = yield prismaClient_1.default.project.findFirst({
                    where: {
                        clientEmail: data.clientEmail,
                        projectName: data.projectName,
                        createdById: subAdminId,
                        isDeleted: false,
                    }
                });
                if (existingProject) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.ALREADY_EXISTS, 500, "A project with the same name and client email already exists under your company");
                }
                const newProject = yield prismaClient_1.default.project.update({
                    where: {
                        id: data.id,
                        status: {
                            not: "CANCELLED"
                        }
                    },
                    data: {
                        uuid: (0, uuid_1.v4)(),
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
                        projectManagerId: data.projectManagerId,
                        status: "CREATED",
                        isDeleted: false,
                    }
                });
                console.log("newProject==============================>>>", newProject);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.PROJECT.UPDATE_SUCCESS,
                    data: newProject,
                };
            }
            catch (error) {
                console.error("❌ Create New Project error:=======================>>>>", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.PROJECT.UPDATE_FAILED, 500, error.message);
            }
        });
    }
    teamMemberDashboard(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalProjectManagers = yield prismaClient_1.default.user.count({
                    where: {
                        status: "ACTIVE",
                        user_type: "PROJECT_MANAGER",
                        projectManager: {
                            companyId: companyId,
                        },
                    },
                });
                const totalCompetentPersons = yield prismaClient_1.default.user.count({
                    where: {
                        status: "ACTIVE",
                        user_type: "COMPETENT_PERSON",
                        competentPerson: {
                            companyId: companyId,
                        },
                    },
                });
                const totalTradesMan = yield prismaClient_1.default.user.count({
                    where: {
                        status: "ACTIVE",
                        user_type: "TRADESMAN",
                        tradesman: {
                            scaffholds: {
                                some: {
                                    scaffhold: {
                                        companyId: companyId
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
                const [totalActiveScaffHold, totalDismentedScaffhold, totalActiveProjects, totalProjectManagers, totalCompetentPersons] = yield Promise.all([
                    prismaClient_1.default.scaffhold.count({ where: { status: "ACTIVE", companyId: companyId }, }),
                    prismaClient_1.default.scaffhold.count({ where: { status: "DISMANTLED", companyId: companyId } }),
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
                // Fetch counts
                const [totalProjects, ongoingProjects, completedProjects, projectsWithoutScaffhold] = yield Promise.all([
                    prismaClient_1.default.project.count({ where: { isDeleted: false } }),
                    prismaClient_1.default.project.count({ where: { status: "ONGOING", isDeleted: false, createdById: companyId } }),
                    prismaClient_1.default.project.count({ where: { status: "COMPLETED", isDeleted: false, createdById: companyId } }),
                    prismaClient_1.default.project.count({
                        where: {
                            isDeleted: false,
                            scaffholds: { none: {} },
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
                const [totalScaffholds, totalErected, totalDismantled, totalRedTag] = yield Promise.all([
                    prismaClient_1.default.scaffhold.count({ where: { isDeleted: false, companyId: companyId } }),
                    prismaClient_1.default.scaffhold.count({
                        where: { status: "ERECTED", isDeleted: false, companyId: companyId },
                    }),
                    prismaClient_1.default.scaffhold.count({
                        where: { status: "DISMANTLED", isDeleted: false, companyId: companyId },
                    }),
                    prismaClient_1.default.scaffhold.count({
                        where: { tag: "RED", isDeleted: false, companyId: companyId },
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
            var _a;
            try {
                const validTypes = ["PROJECT_MANAGER", "COMPETENT_PERSON", "TRADESMAN"];
                const userType = data.user_type.toUpperCase();
                if (!validTypes.includes(userType)) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.INVALID_TYPE, 400, "Invalid user type. Allowed: PROJECT_MANAGER, COMPETENT_PERSON, TRADESMAN");
                }
                // Fetch the scaffhold with related users and their media
                const scaffhold = yield prismaClient_1.default.scaffhold.findUnique({
                    where: { id: data.scaffHoldId },
                    include: {
                        competentPersons: {
                            include: {
                                competentPerson: {
                                    include: {
                                        user: {
                                            include: {
                                                userMedias: {
                                                    where: { mediaType: "PHOTO_IMAGE" },
                                                    take: 1, // Only fetch one image
                                                },
                                            },
                                        },
                                    },
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
                        createdBy: {
                            include: {
                                userMedias: {
                                    where: { mediaType: "PHOTO_IMAGE" },
                                    take: 1,
                                },
                            },
                        },
                    },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Scaffhold not found");
                }
                let users = [];
                if (userType === "PROJECT_MANAGER") {
                    const pm = scaffhold.createdBy;
                    if (pm) {
                        users.push({
                            name: pm.name,
                            email: pm.email,
                            mobileNumber: pm.mobileNumber,
                            image: ((_a = pm.userMedias[0]) === null || _a === void 0 ? void 0 : _a.url) || null,
                        });
                    }
                }
                if (userType === "COMPETENT_PERSON") {
                    users = scaffhold.competentPersons.map((cp) => {
                        var _a;
                        const user = cp.competentPerson.user;
                        return {
                            name: user.name,
                            email: user.email,
                            mobileNumber: user.mobileNumber,
                            image: ((_a = user.userMedias[0]) === null || _a === void 0 ? void 0 : _a.url) || null,
                        };
                    });
                }
                if (userType === "TRADESMAN") {
                    users = scaffhold.tradesMen.map((tm) => {
                        var _a;
                        const user = tm.tradesMan.user;
                        return {
                            name: user.name,
                            email: user.email,
                            mobileNumber: user.mobileNumber,
                            image: ((_a = user.userMedias[0]) === null || _a === void 0 ? void 0 : _a.url) || null,
                        };
                    });
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
                console.error("❌ Search Team Member by Scaffhold error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.SEARCH_FAILED, 500, error.message);
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
                    scaffholdId: data.scaffHoldId,
                };
                if (searchTerm !== "") {
                    whereCondition.createdBy = {
                        user: {
                            name: {
                                contains: searchTerm,
                            },
                        },
                    };
                }
                const totalCount = yield prismaClient_1.default.scaffholdRequest.count({
                    where: { scaffholdId: data.scaffHoldId },
                });
                const requests = yield prismaClient_1.default.scaffholdRequest.findMany({
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
                        sacffHoldId: r.scaffholdId,
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
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.REQUEST.FETCH_FAILED, 500, error.message || "Failed to fetch requests");
            }
        });
    }
    getTimelineImagesByStatus(data, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const scaffExists = yield prismaClient_1.default.scaffholdTimeline.findFirst({
                    where: { scaffholdId: data.scaffHoldId },
                });
                if (!scaffExists) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
                }
                const whereCondition = {
                    timeline: { scaffholdId: data.scaffHoldId },
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
                    prismaClient_1.default.timelineImage.count({ where: whereCondition }),
                ]);
                const formattedImages = images.map((img) => {
                    var _a, _b;
                    return ({
                        status: img.status,
                        createdBy: ((_a = img.timeline.createdBy) === null || _a === void 0 ? void 0 : _a.name) || "Unknown",
                        createdById: ((_b = img.timeline.createdBy) === null || _b === void 0 ? void 0 : _b.id) || null,
                        createdAt: img.timeline.createdAt,
                        images: [
                            { url: img.url, id: img.id }
                        ]
                    });
                });
                return {
                    message: `Timeline images fetched successfully for scaffhold ID ${data.scaffHoldId}${data.status ? ` with status: ${data.status}` : ""}`,
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
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.TIMELINE.FAILED_FETCH_IMAGES, 500, error.message || "Unexpected error");
            }
        });
    }
    getProjectListServices(companyId_1) {
        return __awaiter(this, arguments, void 0, function* (companyId, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: {
                        id: companyId
                    }
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
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
    getAllScaffHolds(companyId, page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const [scaffholds, totalCount] = yield Promise.all([
                    prismaClient_1.default.scaffhold.findMany({
                        skip,
                        take: limit,
                        where: {
                            isDeleted: false,
                            companyId: companyId,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    }),
                    prismaClient_1.default.scaffhold.count({
                        where: {
                            isDeleted: false,
                            companyId: companyId,
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
    getUserDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // ✅ Fetch user with relations
                const user = yield prismaClient_1.default.company.findUnique({
                    where: { id },
                    select: {
                        id: true,
                        uuid: true,
                        name: true,
                        email: true,
                        mobileNumber: true,
                        countryCode: true,
                        user_type: true,
                        status: true,
                        createdAt: true,
                        lastLogin: true,
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
                    createdAt: user.createdAt,
                    lastLogin: user.lastLogin
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
}
exports.subAdminServices = subAdminServices;
