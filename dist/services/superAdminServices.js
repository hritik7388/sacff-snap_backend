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
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
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
                    where: { email: data.email },
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
                //   const mail = await sendMailApproval(updatedCompany.email, updatedCompany.password);
                // console.log("mail====================>>>>", mail);
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
                    where: { id: data.id, isDeleted: false, isApproved: "PENDING" },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
                }
                const updatedCompany = yield prismaClient_1.default.company.update({
                    where: { id: companyData.id },
                    data: {
                        isApproved: "REJECTED",
                        status: "SUSPENDED"
                    },
                });
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
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
                }
                const updateCompany = yield prismaClient_1.default.company.update({
                    where: { id: companyData.id },
                    data: {
                        status: "ACTIVE",
                        isApproved: "PENDING"
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
    getSuperAdminNotifications() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const notifications = yield prismaClient_1.default.notification.findMany({
                    where: {
                        role: "SUPER_ADMIN"
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                const unreadCount = yield prismaClient_1.default.notification.count({
                    where: {
                        role: "SUPER_ADMIN",
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
}
exports.superAdminServices = superAdminServices;
// (async () => {
//     const superadminEmail = "dushyant.kumar@gamil.com";
//     const superadminPassword = "Agicent@1";
//     try {
//         const existingSuperAdmin = await prisma.user.findFirst({
//             where: { user_type: "SUPER_ADMIN" },
//         });
//         if (existingSuperAdmin) {
//             console.log("✅ Default superadmin already created.");
//         } else {
//             const hashedPassword = await bcrypt.hash(superadminPassword, 10);
//             await prisma.user.create({
//                 data: {
//                     uuid: uuidv4(),
//                     email: superadminEmail,
//                     password: hashedPassword,
//                     user_type: "SUPER_ADMIN",
//                     name: "Super Admin",
//                     mobileNumber: "7388503329",
//                     countryCode: "+91",
//                 },
//             });
//             console.log("✅ Default superadmin created successfully.");
//         }
//     } catch (error) {
//         console.error("❌ Error while checking or creating superadmin:", error);
//     }
// })();
