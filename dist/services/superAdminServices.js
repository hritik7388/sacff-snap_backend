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
exports.superAdminServices = void 0;
// src/services/superAdminServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const templates_1 = require("../helpers/templates");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
class superAdminServices {
    loginSuperAdminServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield prismaClient_1.default.user.findUnique({
                    where: { email: data.email, status: "ACTIVE", isDeleted: false, isVerified: true },
                });
                if (!userData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "User not found");
                }
                const isPasswordValid = userData.password ? yield bcryptjs_1.default.compare(data.password, userData.password) : false;
                if (!isPasswordValid) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.PASSWORD_MISMATCH, 500, "Invalid password");
                }
                if (userData.user_type !== "SUPER_ADMIN") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 500, "Unauthorized");
                }
                const jwtPayload = {
                    login_id: userData.email,
                    id: userData.id.toString(),
                    uuid: userData.uuid,
                    user_type: userData.user_type,
                };
                const token = (0, utils_1.generateToken)(jwtPayload);
                yield prismaClient_1.default.user.update({
                    where: { id: userData.id },
                    data: { lastLogin: new Date() },
                });
                const { password: _password } = userData, safeUserData = __rest(userData, ["password"]);
                return {
                    status: 200,
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.LOGIN_SUCCESS,
                    token,
                    user: userData,
                };
            }
            catch (error) {
                console.error("❌ Login error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.LOGIN_FAILED, 500, error.message);
            }
        });
    }
    adminDashboard() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalCompanies = yield prismaClient_1.default.company.count({
                    where: {
                        status: { not: "DELETED" },
                    },
                });
                const approvedCount = yield prismaClient_1.default.company.count({
                    where: {
                        isApproved: "APPROVED",
                        status: { not: "DELETED" },
                    },
                });
                const activeCount = yield prismaClient_1.default.company.count({
                    where: {
                        status: "ACTIVE",
                    },
                });
                const totalProjects = yield prismaClient_1.default.project.count({
                    where: {
                        isDeleted: false,
                    }
                });
                const blockCount = yield prismaClient_1.default.company.count({
                    where: {
                        status: "SUSPENDED",
                    },
                });
                const deletedCount = yield prismaClient_1.default.company.count({
                    where: {
                        status: "DELETED",
                    },
                });
                const pendingCount = yield prismaClient_1.default.company.count({
                    where: {
                        isApproved: "PENDING",
                        status: { not: "DELETED" },
                    },
                });
                const rejectedCount = yield prismaClient_1.default.company.count({
                    where: {
                        isApproved: "REJECTED",
                        status: { not: "DELETED" },
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_SUCCESS,
                    totalCompanies,
                    approvedCompanies: approvedCount,
                    activeCompanies: activeCount,
                    blockedCompanies: blockCount,
                    totalProjects: totalProjects,
                    deletedCompanies: deletedCount,
                    pendingCompanies: pendingCount,
                    rejectedCompanies: rejectedCount,
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
    approveCompanyRequest(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: { id: data.id, isDeleted: false, isApproved: "PENDING" },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
                }
                const updatedCompany = yield prismaClient_1.default.company.update({
                    where: { id: data.id },
                    data: {
                        isApproved: "APPROVED",
                        status: "ACTIVE"
                    },
                });
                const html = (0, templates_1.companyStatusTemplate)(updatedCompany.name, updatedCompany.CMPId || "", updatedCompany.isApproved);
                yield (0, utils_1.sendMail)(updatedCompany.email, "Company Approved Mail", html);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.APPROVE_SUCCESS,
                    company: updatedCompany,
                };
            }
            catch (error) {
                console.log("error===================>>>", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.APPROVE_FAILED, 500, error.message);
            }
        });
    }
    rejectCompanyRequest(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: { id: data.id, isDeleted: false, isApproved: "PENDING", isVerified: true },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
                }
                const updatedCompany = yield prismaClient_1.default.company.delete({
                    where: { id: companyData.id },
                });
                const html = (0, templates_1.companyStatusTemplate)(updatedCompany.name, updatedCompany.CMPId || "", "REJECTED");
                const mail = yield (0, utils_1.sendMail)(updatedCompany.email, "Company REJECTED Mail", html);
                console.log("mail====================>>>>", mail);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.REJECT_SUCCESS,
                    data: updatedCompany,
                };
            }
            catch (error) {
                console.log("error===================>>>", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.REJECT_FAILED, 500, error.message);
            }
        });
    }
    addNewCompanyBySuperAdmin(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const existingCompany = yield prismaClient_1.default.company.findUnique({
                    where: {
                        email: data.email,
                        name: data.name,
                        mobileNumber: data.mobileNumber,
                    },
                });
                if (existingCompany) {
                    if (existingCompany.isApproved === "PENDING") {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.PENDING_APPROVAL, 500, "Your company registration is still pending approval");
                    }
                    else {
                        throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS, 500, "Company already exists");
                    }
                }
                const hasPassword = bcryptjs_1.default.hashSync((_a = data.password) !== null && _a !== void 0 ? _a : "", 10);
                const cmpId = (0, utils_1.generateCompanyId)();
                const newCompany = yield prismaClient_1.default.company.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        name: data.name,
                        email: data.email,
                        address: data.address,
                        password: hasPassword,
                        mobileNumber: data.mobileNumber,
                        countryCode: data.countryCode,
                        isApproved: "APPROVED",
                        user_type: "COMPANY",
                        latitude: data.latitude,
                        longitude: data.longitude,
                        CMPId: cmpId,
                        image: data.image
                    },
                });
                const html = (0, templates_1.companyAddTemplate)(newCompany.name, newCompany.user_type, newCompany.email, data.password);
                const mail = yield (0, utils_1.sendMail)(newCompany.email, "Welcome to ScaffSnapp Team!", html);
                console.log("mail====================>>>", mail);
                const companyData = {
                    id: newCompany.id,
                    name: newCompany.name,
                    email: newCompany.email,
                    address: newCompany.address,
                    image: newCompany.image,
                    mobileNumber: newCompany.mobileNumber,
                    countryCode: newCompany.countryCode,
                    isApproved: newCompany.isApproved,
                    user_type: newCompany.user_type,
                    latitude: newCompany.latitude,
                    longitude: newCompany.longitude,
                    CMPId: newCompany.CMPId
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.REGISTER_SUCCESS,
                    data: companyData,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.REGISTER_FAILED, 500, error.message);
            }
        });
    }
    blockCompany(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: {
                        id: data.id,
                        isDeleted: false,
                        status: "ACTIVE",
                        isVerified: true
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
                }
                const updateCompany = yield prismaClient_1.default.company.update({
                    where: { id: companyData.id },
                    data: {
                        status: "SUSPENDED",
                        isApproved: "REJECTED"
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.BLOCK_SUCCESS,
                    data: updateCompany,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.BLOCK_FAILED, 500, error.message);
            }
        });
    }
    unblockCompany(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: {
                        id: data.id,
                        isDeleted: false,
                        status: "SUSPENDED",
                        isVerified: true
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
                }
                const updateCompany = yield prismaClient_1.default.company.update({
                    where: { id: companyData.id },
                    data: {
                        status: "ACTIVE",
                        isApproved: "APPROVED",
                        isDeleted: false,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.UNBLOCK_SUCCESS,
                    data: updateCompany,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.UNBLOCK_FAILED, 500, error.message);
            }
        });
    }
    getAllActiveCompanies() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [companies, totalCount] = yield Promise.all([
                    prismaClient_1.default.company.findMany({
                        where: {
                            isApproved: "APPROVED",
                            status: "ACTIVE",
                            isDeleted: false,
                        },
                        skip,
                        take: limit,
                        orderBy: { createdAt: "desc" },
                    }),
                    prismaClient_1.default.company.count({
                        where: {
                            status: "ACTIVE",
                            isDeleted: false,
                        },
                    }),
                ]);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.ACTIVE_COMPANIES,
                    data: companies,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getAllBlockedCompanies() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [companies, totalCount] = yield Promise.all([
                    prismaClient_1.default.company.findMany({
                        where: {
                            status: "SUSPENDED",
                            isDeleted: false,
                        },
                        skip,
                        take: limit,
                        orderBy: { createdAt: "desc" },
                    }),
                    prismaClient_1.default.company.count({
                        where: {
                            status: "SUSPENDED",
                            isDeleted: false,
                        },
                    }),
                ]);
                console.log("companies=================>>>", companies);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.BLOCKED_COMPANIES,
                    data: companies,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
            }
        });
    }
    deleteCompany(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: {
                        id: data.id,
                        isDeleted: false,
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
                }
                const updateCompany = yield prismaClient_1.default.company.update({
                    where: { id: companyData.id },
                    data: {
                        status: "DELETED",
                        isDeleted: true,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.DELETE_SUCCESS,
                    data: updateCompany,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.DELETE_FAILED, 500, error.message);
            }
        });
    }
    getSuperAdminNotifications(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            try {
                let role;
                // 1️⃣ check user table
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { id: BigInt(userId) },
                    select: { user_type: true }
                });
                if (user) {
                    role = user.user_type;
                }
                else {
                    // 2️⃣ check company table
                    const company = yield prismaClient_1.default.company.findUnique({
                        where: { id: BigInt(userId) },
                        select: { user_type: true }
                    });
                    if (!company) {
                        throw new customError_1.CustomError("User or Company not found", 404);
                    }
                    role = company.user_type;
                }
                const skip = (page - 1) * limit;
                const notifications = yield prismaClient_1.default.notification.findMany({
                    where: {
                        receiverId: userId,
                        role: role
                    },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit
                });
                const mappedNotifications = notifications.map(n => {
                    var _a, _b, _c;
                    return ({
                        id: n.id.toString(),
                        uuid: n.uuid,
                        title: n.title,
                        message: n.message,
                        type: n.type,
                        role: n.role,
                        companyId: ((_a = n.companyId) === null || _a === void 0 ? void 0 : _a.toString()) || "", // null -> ""
                        projectId: ((_b = n.projectId) === null || _b === void 0 ? void 0 : _b.toString()) || "", // null -> ""
                        scaffoldRequestId: n.scaffoldRequestId || "", // null -> ""
                        receiverId: ((_c = n.receiverId) === null || _c === void 0 ? void 0 : _c.toString()) || "", // BigInt -> string
                        senderId: n.senderId || "", // string or "" if null
                        isRead: n.isRead,
                        notificationImage: n.notificationImage || "",
                        createdAt: n.createdAt,
                        updatedAt: n.updatedAt,
                        tradesmanCraft: n.tradesmanCraft || ""
                    });
                });
                const unreadCount = yield prismaClient_1.default.notification.count({
                    where: { receiverId: userId, isRead: false }
                });
                const totalCount = yield prismaClient_1.default.notification.count({
                    where: { receiverId: userId }
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.NOTIFICATION.SUCCESS_GET,
                    data: {
                        unreadCount: unreadCount,
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                        notifications: mappedNotifications
                    }
                };
            }
            catch (error) {
                console.error("❌ Error in getSuperAdminNotifications:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to fetch notifications", 500, error.message);
            }
        });
    }
    markNotificationAsRead(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notification = yield prismaClient_1.default.notification.findUnique({
                    where: { id: data.id },
                });
                if (!notification) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.NOTIFICATION.NOT_FOUND, 404);
                }
                const updatedNotification = yield prismaClient_1.default.notification.update({
                    where: { id: data.id },
                    data: { isRead: true },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.NOTIFICATION.SUCCESS_MARK_AS_READ,
                    data: updatedNotification,
                };
            }
            catch (error) {
                console.error("❗ Error in markNotificationAsRead:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.NOTIFICATION.FAILED_MARK_AS_READ, 500, error.message);
            }
        });
    }
    getUserDetails(id) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const user = yield prismaClient_1.default.user.findUnique({
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
                        userMedias: {
                            where: {
                                mediaType: "PHOTO_IMAGE",
                            },
                            select: {
                                url: true,
                                mediaType: true,
                            },
                            take: 1, // ✅ only one profile image
                            orderBy: {
                                createdAt: "desc", // latest image first
                            },
                        },
                    },
                });
                if (!user) {
                    throw new customError_1.CustomError("USER_NOT_FOUND", 404, "User not found");
                }
                const profileImage = (_a = user.userMedias[0]) !== null && _a !== void 0 ? _a : null;
                return {
                    message: "User details fetched successfully",
                    data: {
                        id: user.id,
                        uuid: user.uuid,
                        name: user.name,
                        email: user.email,
                        countryCode: user.countryCode,
                        mobileNumber: user.mobileNumber,
                        user_type: user.user_type,
                        status: user.status,
                        createdAt: user.createdAt,
                        lastLogin: user.lastLogin,
                        image: profileImage ? profileImage.url : null,
                    },
                };
            }
            catch (error) {
                console.error("❌ Get user details error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError("FETCH_FAILED", 500, error.message);
            }
        });
    }
    blogCreationBySuperAdmin(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true
                    }
                });
                if (!userData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_SUPER_ADMIN, 404, "User not found");
                }
                const newBlog = yield prismaClient_1.default.blog.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        blogTitle: data.blogTitle,
                        category: data.category,
                        publishDate: data.publishDate,
                        image: data.image,
                        blogBody: data.blogBody,
                        createdById: userData.id,
                        status: data.status
                    }
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_CREATION_SUCCESS,
                    data: newBlog
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError("BLOG_CREATION_FAILED", 500, error.message);
            }
        });
    }
    publishBlog(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true
                    }
                });
                if (!userData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_SUPER_ADMIN, 404, "User not found");
                }
                const blogData = yield prismaClient_1.default.blog.findUnique({
                    where: {
                        id: data.id,
                    }
                });
                if (!blogData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_NOT_FOUND, 404, "Provided blog id not in the databse");
                }
                const imageKey = data.image
                    ? (0, utils_1.extractS3Key)(data.image)
                    : blogData.image;
                const newBlog = yield prismaClient_1.default.blog.update({
                    where: {
                        id: data.id
                    },
                    data: {
                        uuid: blogData.uuid,
                        blogTitle: data.blogTitle,
                        category: data.category,
                        publishDate: data.publishDate,
                        status: data.status,
                        image: imageKey,
                        blogBody: data.blogBody,
                        createdById: userData.id
                    }
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_PUBLISH_SUCCESS,
                    data: newBlog
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError("BLOG_CREATION_FAILED", 500, error.message);
            }
        });
    }
    delteBlog(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true
                    }
                });
                if (!userData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_SUPER_ADMIN, 404, "User not found");
                }
                const blogData = yield prismaClient_1.default.blog.findUnique({
                    where: {
                        id: data.id,
                    }
                });
                if (!blogData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_NOT_FOUND, 404, "Provided blog id not in the databse");
                }
                if (blogData.status === "DELETED") {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.BLOG.ALREADY_DELETED, 400, "This blog has already been deleted");
                }
                const newBlog = yield prismaClient_1.default.blog.update({
                    where: {
                        id: data.id
                    },
                    data: {
                        status: "DELETED",
                    }
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_DELETE_SUCCESS,
                    data: newBlog
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_DELETE_FAILED, 500, error.message);
            }
        });
    }
    getpublishBlog(status_1, search_1) {
        return __awaiter(this, arguments, void 0, function* (status, search, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);
                const whereClause = Object.assign(Object.assign(Object.assign({ status: { not: "DELETED" } }, (status && { status })), { publishDate: {
                        lte: endOfToday
                    } }), (search && {
                    OR: [
                        { blogTitle: { contains: search } },
                        { blogBody: { contains: search } },
                        { category: { contains: search } }
                    ]
                }));
                const [blogs, total] = yield Promise.all([
                    prismaClient_1.default.blog.findMany({
                        where: whereClause,
                        select: {
                            id: true,
                            blogTitle: true,
                            category: true,
                            publishDate: true,
                            image: true,
                            blogBody: true,
                            status: true,
                            createdById: true,
                            createdAt: true,
                            updatedAt: true,
                        },
                        skip,
                        take: limit,
                        orderBy: { publishDate: "desc" }
                    }),
                    prismaClient_1.default.blog.count({ where: whereClause })
                ]);
                const formattedBlogs = yield Promise.all(blogs.map((blog) => __awaiter(this, void 0, void 0, function* () {
                    return ({
                        id: blog.id,
                        blogTitle: blog.blogTitle,
                        category: blog.category,
                        publishDate: blog.publishDate,
                        image: blog.image ? yield (0, utils_1.generateReadUrl)(blog.image) : null,
                        blogBody: blog.blogBody,
                        status: blog.status,
                        createdById: blog.createdById,
                        createdAt: blog.createdAt,
                        updatedAt: blog.updatedAt,
                    });
                })));
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_FETCH_SUCCESS,
                    data: formattedBlogs,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                };
            }
            catch (error) {
                console.error("Error fetching blogs:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error;
            }
        });
    }
    contactInfo(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const submission = yield prismaClient_1.default.contactSubmission.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        name: data.name,
                        email: data.email,
                        mobileNumber: data.mobileNumber,
                        countryCode: data.countryCode,
                        message: data.message,
                        submittedAt: data.submittedAt,
                    }
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.CONTACT.SUBMIT_SUCCESS, // ✅ Using RESPONSE_MESSAGES
                    data: submission
                };
            }
            catch (error) {
                console.error("Error creating contact submission:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CONTACT.SUBMIT_FAILED, 500, error.message);
            }
        });
    }
    getContactInfo(search_1) {
        return __awaiter(this, arguments, void 0, function* (search, page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const whereClause = Object.assign({}, (search && {
                    OR: [
                        { name: { contains: search } },
                        { email: { contains: search } },
                        { mobileNumber: { contains: search } },
                        { message: { contains: search } }
                    ]
                }));
                const [contacts, total] = yield Promise.all([
                    prismaClient_1.default.contactSubmission.findMany({
                        where: whereClause,
                        skip,
                        take: limit,
                        orderBy: { createdAt: "desc" }
                    }),
                    prismaClient_1.default.contactSubmission.count({ where: whereClause })
                ]);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.CONTACT.GET_SUCCESS,
                    data: contacts,
                    pagination: {
                        total,
                        page,
                        limit,
                        totalPages: Math.ceil(total / limit)
                    }
                };
            }
            catch (error) {
                console.error("Error fetching contact submissions:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CONTACT.GET_FAIL, 500, error.message);
            }
        });
    }
    delteContact(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true
                    }
                });
                if (!userData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_SUPER_ADMIN, 404, "User not found");
                }
                const blogData = yield prismaClient_1.default.contactSubmission.findUnique({
                    where: {
                        id: data.id,
                    }
                });
                if (!blogData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CONTACT.NOT_FOUND, 404, "Provided contact id not in the databse");
                }
                const newBlog = yield prismaClient_1.default.contactSubmission.delete({
                    where: {
                        id: data.id
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.CONTACT.CONTACT_DELETE_SUCCESS,
                    data: newBlog
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CONTACT.CONTACT_DELETE_FAILED, 500, error.message);
            }
        });
    }
    getContactById(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const contact = yield prismaClient_1.default.contactSubmission.findUnique({
                    where: {
                        id: data.id,
                    }
                });
                if (!contact) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CONTACT.NOT_FOUND, 404);
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.CONTACT.GET_SUCCESS,
                    data: contact
                };
            }
            catch (error) {
                console.error("Error fetching contact by ID:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CONTACT.GET_FAIL, 500, error.message);
            }
        });
    }
    getBlogbyId(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const blog = yield prismaClient_1.default.blog.findUnique({
                    where: { id: data.id }
                });
                if (!blog) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_NOT_FOUND, 404);
                }
                const formattedBlog = {
                    id: blog.id,
                    blogTitle: blog.blogTitle,
                    category: blog.category,
                    publishDate: blog.publishDate,
                    image: blog.image ? yield (0, utils_1.generateReadUrl)(blog.image) : null,
                    blogBody: blog.blogBody,
                    status: blog.status,
                    createdById: blog.createdById,
                    createdAt: blog.createdAt,
                    updatedAt: blog.updatedAt,
                };
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_FETCH_SUCCESS,
                    data: formattedBlog
                };
            }
            catch (error) {
                console.error("Error fetching blog by ID:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.BLOG.BLOG_FETCH_FAILED, 500, error.message);
            }
        });
    }
    updateUserProfileImage(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userExists = yield prismaClient_1.default.user.findFirst({
                    where: {
                        id: userId,
                        user_type: "SUPER_ADMIN",
                        isDeleted: false,
                        isVerified: true,
                        status: "ACTIVE"
                    },
                });
                if (!userExists) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "NOT FOUND");
                }
                // Check if media already exists
                const existingMedia = yield prismaClient_1.default.userMedia.findFirst({
                    where: {
                        userId: BigInt(userId),
                        mediaType: "PHOTO_IMAGE",
                    },
                });
                let updatedImage;
                if (existingMedia) {
                    // Update existing profile image
                    updatedImage = yield prismaClient_1.default.userMedia.update({
                        where: { id: existingMedia.id },
                        data: {
                            url: data.profileImage,
                        },
                        select: {
                            url: true,
                            mediaType: true,
                        },
                    });
                }
                else {
                    // Create new profile image if not exists
                    updatedImage = yield prismaClient_1.default.userMedia.create({
                        data: {
                            userId: BigInt(userId),
                            url: data.profileImage,
                            mediaType: "PHOTO_IMAGE",
                        },
                        select: {
                            url: true,
                            mediaType: true,
                        },
                    });
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.IMAGE.UPADTE_IMAGE,
                    data: updatedImage,
                };
            }
            catch (error) {
                console.error("Error updating image:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.IMAGE.FAIL_UPADTE_IMAGE, 500, error.message);
            }
        });
    }
    logoutUser(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.user.findFirst({
                    where: {
                        id: id,
                        status: "ACTIVE",
                        isDeleted: false,
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
}
exports.superAdminServices = superAdminServices;
(() => __awaiter(void 0, void 0, void 0, function* () {
    const superadminEmail = "dushyant.kumar@mailinator.com";
    const superadminPassword = "Agicent@1";
    try {
        const existingSuperAdmin = yield prismaClient_1.default.user.findFirst({
            where: { user_type: "SUPER_ADMIN" },
        });
        if (existingSuperAdmin) {
            console.log("✅ Default superadmin already created.");
        }
        else {
            const hashedPassword = yield bcryptjs_1.default.hash(superadminPassword, 10);
            yield prismaClient_1.default.user.create({
                data: {
                    uuid: (0, uuid_1.v4)(),
                    email: superadminEmail,
                    password: hashedPassword,
                    isVerified: true,
                    user_type: "SUPER_ADMIN",
                    name: "Super Admin",
                    mobileNumber: "7388503329",
                    countryCode: "+91",
                },
            });
            console.log("✅ Default superadmin created successfully.");
        }
    }
    catch (error) {
        console.error("❌ Error while checking or creating superadmin:", error);
    }
}))();
