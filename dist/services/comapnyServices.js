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
exports.CompanyServices = void 0;
// src/services/comapnyServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const templates_1 = require("../helpers/templates");
class CompanyServices {
    registerCompany(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const existingCompany = yield prismaClient_1.default.company.findUnique({
                    where: {
                        email: data.email
                    }
                });
                if (existingCompany && existingCompany.email === data.email) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS, 409, "This emailis alreday use with the other Compnay.Please use differnet email");
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
                        isApproved: "PENDING",
                        latitude: data.latitude,
                        longitude: data.longitude,
                        CMPId: cmpId,
                        image: data.image || ""
                    },
                });
                const superAdmins = yield prismaClient_1.default.user.findMany({
                    where: { user_type: "SUPER_ADMIN" },
                    select: { id: true },
                });
                console.log("superAdmin-==================>>>>>", superAdmins);
                if (superAdmins) {
                    const superAdmin = superAdmins[0];
                    const superAdminDevice = yield prismaClient_1.default.device.findFirst({
                        where: {
                            //  userId:superAdmins.,
                            deviceToken: { not: null },
                        },
                        select: { deviceToken: true },
                    });
                    const notification = yield prismaClient_1.default.notification.create({
                        data: {
                            uuid: (0, uuid_1.v4)(),
                            title: "New Company Registered",
                            message: `A new company "${newCompany.name}" has been registered and is awaiting approval.`,
                            type: "NEW_COMPANY_REGISTERED",
                            role: "SUPER_ADMIN",
                            companyId: newCompany.id,
                            isRead: false,
                            receiverId: Number(superAdmin.id),
                            senderId: newCompany.id.toString(),
                            notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/companyReg.png"
                        },
                    });
                    if (superAdminDevice === null || superAdminDevice === void 0 ? void 0 : superAdminDevice.deviceToken) {
                        yield (0, utils_1.pushNotificationDelhi)(superAdminDevice.deviceToken, "New Company Registered", `A new ${data.name} has submitted a registration request ${newCompany.CMPId}. Please review`);
                    }
                }
                const companyData = {
                    id: newCompany.id,
                    name: newCompany.name,
                    email: newCompany.email,
                    address: newCompany.address,
                    image: data.image,
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
    updateCompanyDetails(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: {
                        id: data.id,
                        isDeleted: false,
                        status: "ACTIVE",
                        isApproved: "APPROVED",
                        isVerified: true,
                        user_type: "COMPANY"
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 404, "Not found");
                }
                // const emailExists = await prisma.company.findUnique({
                //     where: {
                //         email: data.email,
                //     },
                // });
                // if (emailExists) {
                //     throw new CustomError(RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS, 409, "Conflict");
                // }
                const updatedComapny = yield prismaClient_1.default.company.update({
                    where: {
                        id: companyData.id,
                    },
                    data: {
                        name: data.name,
                        email: data.email,
                        address: data.address,
                        mobileNumber: data.mobileNumber,
                        countryCode: data.countryCode,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        image: data.image
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.UPDATE_SUCCESS,
                    data: updatedComapny,
                };
            }
            catch (error) {
                console.log("error===================>>>", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.UPDATE_FAILED, 500, error.message);
            }
        });
    }
    updateCompanyProfile(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyData = yield prismaClient_1.default.company.findUnique({
                    where: {
                        id: data.id,
                        isDeleted: false,
                        status: "ACTIVE",
                        isApproved: "APPROVED",
                        isVerified: true,
                        user_type: "COMPANY"
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 404, "Not found");
                }
                const updatedComapny = yield prismaClient_1.default.company.update({
                    where: {
                        id: companyData.id,
                    },
                    data: {
                        address: data.address,
                        mobileNumber: data.mobileNumber,
                        countryCode: data.countryCode,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.UPDATE_SUCCESS,
                    data: updatedComapny,
                };
            }
            catch (error) {
                console.log("error===================>>>", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.UPDATE_FAILED, 500, error.message);
            }
        });
    }
    getCompanyallDetails(page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (page - 1) * limit;
                const [companyData, totalCount] = yield Promise.all([
                    prismaClient_1.default.company.findMany({
                        where: {
                            isDeleted: false,
                            status: "ACTIVE",
                            isApproved: "APPROVED",
                            isVerified: true,
                            user_type: "COMPANY"
                        },
                        skip,
                        take: limit,
                        orderBy: {
                            createdAt: "desc",
                        },
                        include: {
                            _count: {
                                select: {
                                    projects: true
                                }
                            }
                        }
                    }),
                    prismaClient_1.default.company.count({
                        where: {
                            isDeleted: false,
                            status: "ACTIVE",
                            isApproved: "APPROVED",
                            isVerified: true,
                            user_type: "COMPANY"
                        },
                    })
                ]);
                const companyWithProjectsCount = yield Promise.all(companyData.map((_a) => __awaiter(this, void 0, void 0, function* () {
                    var { _count } = _a, company = __rest(_a, ["_count"]);
                    return (Object.assign(Object.assign({}, company), { totalProjects: _count.projects, image: company.image }));
                })));
                const totalPages = Math.ceil(totalCount / limit);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.FETCH_ALL_SUCCESS,
                    data: companyWithProjectsCount,
                    totalCount,
                    totalPages,
                    currentPage: page
                };
            }
            catch (error) {
                console.log("error===================>>>", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getCompanyById(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // 🔥 OLD: scaffhold ❌ → NEW: request-based system ✅
                const companyRequests = yield prismaClient_1.default.projectScaffholdRequest.findMany({
                    where: {
                        project: {
                            createdById: data.id,
                            isDeleted: false,
                        },
                        status: {
                            in: ["PENDING", "APPROVED", "REJECTED"],
                        },
                    },
                });
                console.log("companyRequests==================>>>>>", companyRequests);
                // 🔥 PROJECTS (same as before)
                const companyProjects = yield prismaClient_1.default.project.findMany({
                    where: {
                        createdById: data.id,
                        isDeleted: false,
                    },
                });
                console.log("companyProjects==================>>>>>", companyProjects);
                const companyDataRaw = yield prismaClient_1.default.company.findUnique({
                    where: { id: data.id },
                    include: {
                        competentPersons: {
                            where: {
                                user: {
                                    isDeleted: false,
                                    status: "ACTIVE",
                                    isVerified: true,
                                },
                            },
                            include: {
                                user: true,
                            },
                        },
                        projectManagers: {
                            where: {
                                user: {
                                    isDeleted: false,
                                    status: "ACTIVE",
                                    isVerified: true,
                                },
                            },
                            include: {
                                user: true,
                            },
                        },
                    },
                });
                console.log("companyDataRaw==================>>>>>", companyDataRaw);
                if (!companyDataRaw) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not Found");
                }
                const companyData = Object.assign(Object.assign({}, companyDataRaw), { image: companyDataRaw.image, competentPersons: companyDataRaw.competentPersons.map(cp => ({
                        id: cp.user.id,
                        name: cp.user.name,
                        email: cp.user.email,
                    })), projectManagers: companyDataRaw.projectManagers.map(pm => ({
                        id: pm.user.id,
                        name: pm.user.name,
                        email: pm.user.email,
                    })) });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.FETCH_BY_ID_SUCCESS,
                    data: {
                        companyData,
                        totalCompetentPersons: companyData.competentPersons.length,
                        totalProjectManagers: companyData.projectManagers.length,
                        // 🔥 UPDATED METRICS
                        totalRequests: companyRequests.length,
                        totalProjects: companyProjects.length,
                        activeProjects: companyProjects.filter(p => p.status === "ONGOING").length,
                        // optional (if needed)
                        pendingRequests: companyRequests.filter(r => r.status === "PENDING").length,
                        approvedRequests: companyRequests.filter(r => r.status === "APPROVED").length,
                        rejectedRequests: companyRequests.filter(r => r.status === "REJECTED").length,
                    },
                };
            }
            catch (error) {
                console.error("getCompanyById error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
            }
        });
    }
    requestListApproval(page, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const skip = (Number(page) - 1) * Number(limit);
                const take = Number(limit);
                const companies = yield prismaClient_1.default.company.findMany({
                    where: {
                        isApproved: "PENDING",
                        isDeleted: false,
                        status: "ACTIVE",
                    },
                    skip,
                    take,
                    orderBy: {
                        createdAt: "desc"
                    }
                });
                const totalCompanies = yield prismaClient_1.default.company.count({
                    where: {
                        isApproved: "PENDING",
                        isDeleted: false,
                        status: "ACTIVE",
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.REQUEST_LIST_SUCCESS,
                    total: totalCompanies,
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalCompanies / Number(limit)),
                    data: companies
                };
            }
            catch (error) {
                console.error("requestListApproval error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.REQUEST_LIST_FAILED, 500, error.message);
            }
        });
    }
    searchCompany(data_1) {
        return __awaiter(this, arguments, void 0, function* (data, page = 1, limit = 10) {
            try {
                const skip = (Number(page) - 1) * Number(limit);
                const take = Number(limit);
                let whereCondition = {
                    isApproved: { in: ["APPROVED", "REJECTED"] },
                    status: {
                        in: ["ACTIVE", "SUSPENDED"], // include both statuses
                    },
                    isDeleted: false,
                };
                if (data && typeof data === "string" && data.trim() !== "") {
                    const conditions = [
                        {
                            email: data,
                        },
                        {
                            name: {
                                contains: data.toLowerCase(),
                            },
                        },
                    ];
                    if (!isNaN(Number(data))) {
                        conditions.unshift({
                            id: BigInt(data),
                        });
                    }
                    whereCondition = Object.assign(Object.assign({}, whereCondition), { OR: conditions });
                }
                const companies = yield prismaClient_1.default.company.findMany({
                    where: whereCondition,
                    skip,
                    take,
                });
                const totalCompanies = yield prismaClient_1.default.company.count({
                    where: whereCondition,
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.SEARCH_SUCCESS,
                    total: totalCompanies,
                    currentPage: Number(page),
                    totalPages: Math.ceil(totalCompanies / Number(limit)),
                    data: companies,
                };
            }
            catch (error) {
                console.error("searchCompany error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.SEARCH_FAILED, 500, error.message);
            }
        });
    }
    changePasswordService(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.company.findFirst({
                    where: { id: userId, isDeleted: false, status: "ACTIVE", }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Not found with this user");
                }
                const isOldPasswordValid = yield bcryptjs_1.default.compare(data.oldPassword, user.password);
                if (!isOldPasswordValid) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.OLD_PASSWORD_MISSMATCH, 401, "Invalid old password");
                }
                const hashedPassword = yield bcryptjs_1.default.hash(data.newPassword, 10);
                yield prismaClient_1.default.company.update({
                    where: { id: user.id },
                    data: { password: hashedPassword }
                });
                return {
                    message: "Password changed successfully"
                };
            }
            catch (error) {
                console.error("❌ Change password error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.PASSWORD_MISMATCH, 500, "Change password failed due to server error");
            }
        });
    }
    forgotPasswordServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.company.findUnique({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
                }
                const emailOTP = (0, utils_1.generateOTP)();
                const otp = yield prismaClient_1.default.company.update({
                    where: { id: user.id },
                    data: {
                        otp: emailOTP.otp.toString(),
                        otpExpireTime: emailOTP.expiresAt,
                        isVerified: false
                    }
                });
                const html = (0, templates_1.otpTemplate)(user.name, emailOTP.otp.toString());
                yield (0, utils_1.sendMail)(user.email, "Scaff Snap - OTP Verification", html);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.FORGOT_PASSWORD_SUCCESS,
                    data: otp
                };
            }
            catch (error) {
                console.error("❌ Forgot password error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.FORGOT_PASSWORD_FAILED, 500, "Forgot password failed due to server error");
            }
        });
    }
    verifyOTPService(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.company.findUnique({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
                }
                if (user.otp !== data.otp || !user.otpExpireTime || user.otpExpireTime < new Date()) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.INVALID_OTP, 500, "Invalid or expired OTP");
                }
                const updatedData = yield prismaClient_1.default.company.update({
                    where: { id: user.id },
                    data: {
                        isVerified: true,
                        otp: null,
                        otpExpireTime: null
                    }
                });
                const jwtPayload = {
                    id: user.id.toString(),
                    uuid: user.uuid,
                    login_id: user.email,
                    user_type: user.user_type,
                };
                const token = (0, utils_1.generateToken)(jwtPayload);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.VERIFY_OTP_SUCCESS,
                    token,
                    data: updatedData
                };
            }
            catch (error) {
                console.error("❌ Verify OTP error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.VERIFY_OTP_FAILED, 500, "Verify OTP failed due to server error");
            }
        });
    }
    resetPasswordService(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.company.findFirst({
                    where: { id: userId, isDeleted: false, status: "ACTIVE", }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 401, "Not found with this user");
                }
                if (user.password === data.newPassword) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.SAME_AS_OLD_PASSWORD, 400, "New password cannot be same as old password");
                }
                const hashedPassword = yield bcryptjs_1.default.hash(data.newPassword, 10);
                yield prismaClient_1.default.company.update({
                    where: { id: user.id },
                    data: { password: hashedPassword }
                });
                return {
                    message: "Password changed successfully"
                };
            }
            catch (error) {
                console.error("❌ Change password error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.PASSWORD_MISMATCH, 500, "Change password failed due to server error");
            }
        });
    }
    resendOTPServices(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.company.findUnique({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
                }
                const emailOTP = (0, utils_1.generateOTP)();
                const otp = yield prismaClient_1.default.company.update({
                    where: { id: user.id },
                    data: {
                        otp: emailOTP.otp.toString(),
                        otpExpireTime: emailOTP.expiresAt,
                    }
                });
                const html = (0, templates_1.otpTemplate)(user.name, emailOTP.otp.toString());
                yield (0, utils_1.sendMail)(user.email, "Scaff Snap - OTP Verification", html);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.USER.FORGOT_PASSWORD_SUCCESS,
                    data: otp
                };
            }
            catch (error) {
                console.error("❌ Forgot password error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.FORGOT_PASSWORD_FAILED, 500, "Forgot password failed due to server error");
            }
        });
    }
    updateProfileImage(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userExists = yield prismaClient_1.default.company.findFirst({
                    where: { id: userId, isApproved: "APPROVED", status: "ACTIVE", isDeleted: false, isVerified: true, user_type: "COMPANY" },
                });
                if (!userExists) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "NOT found ");
                }
                const updatedImage = yield prismaClient_1.default.company.update({
                    where: { id: userExists.id },
                    data: { image: data.profileImage },
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
exports.CompanyServices = CompanyServices;
