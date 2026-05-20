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
exports.PasswordServices = void 0;
// src/services/passwordServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
const templates_1 = require("../helpers/templates");
const utils_2 = require("../helpers/utils");
class PasswordServices {
    changePasswordService(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.user.findFirst({
                    where: { id: userId, isDeleted: false, status: "ACTIVE", }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Not found with this user");
                }
                const isOldPasswordValid = yield bcryptjs_1.default.compare(data.oldPassword, user.password);
                if (!isOldPasswordValid) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.OLD_PASSWORD_MISSMATCH, 400, "Invalid old password");
                }
                const hashedPassword = yield bcryptjs_1.default.hash(data.newPassword, 10);
                yield prismaClient_1.default.user.update({
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
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Not found with this email");
                }
                const emailOTP = (0, utils_1.generateOTP)();
                const otp = yield prismaClient_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        otp: emailOTP.otp.toString(),
                        otpExpireTime: emailOTP.expiresAt,
                        isVerified: false
                    }
                });
                const html = (0, templates_1.otpTemplate)(user.name, emailOTP.otp.toString());
                yield (0, utils_2.sendMail)(user.email, "Scaff Snap - OTP Verification", html);
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
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Not found with this email");
                }
                if (user.otp !== data.otp || !user.otpExpireTime || user.otpExpireTime < new Date()) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.INVALID_OTP, 400, "Invalid or expired OTP");
                }
                const updatedData = yield prismaClient_1.default.user.update({
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
    resetPasswordService(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.user.findFirst({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE", }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 401, "Not found with this user");
                }
                if (user.password === data.newPassword) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.SAME_AS_OLD_PASSWORD, 400, "New password cannot be same as old password");
                }
                const hashedPassword = yield bcryptjs_1.default.hash(data.newPassword, 10);
                yield prismaClient_1.default.user.update({
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
                const user = yield prismaClient_1.default.user.findUnique({
                    where: { email: data.email, isDeleted: false, status: "ACTIVE" }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Not found with this email");
                }
                const emailOTP = (0, utils_1.generateOTP)();
                const otp = yield prismaClient_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        otp: emailOTP.otp.toString(),
                        otpExpireTime: emailOTP.expiresAt,
                    }
                });
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
    upsertNotificationSetting(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            try {
                const userBigIntId = BigInt(userId);
                const setting = yield prismaClient_1.default.notificationSetting.upsert({
                    where: {
                        userId: userBigIntId,
                    },
                    update: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (data.unusualActivity !== undefined && {
                        unusualActivity: data.unusualActivity,
                    })), (data.newDeviceLogin !== undefined && {
                        newDeviceLogin: data.newDeviceLogin,
                    })), (data.projectCreated !== undefined && {
                        projectCreated: data.projectCreated,
                    })), (data.teamMemberChanged !== undefined && {
                        teamMemberChanged: data.teamMemberChanged,
                    })), (data.scaffoldUpdates !== undefined && {
                        scaffoldUpdates: data.scaffoldUpdates,
                    })), (data.emailEnabled !== undefined && {
                        emailEnabled: data.emailEnabled,
                    })),
                    create: {
                        userId: userBigIntId,
                        unusualActivity: (_a = data.unusualActivity) !== null && _a !== void 0 ? _a : true,
                        newDeviceLogin: (_b = data.newDeviceLogin) !== null && _b !== void 0 ? _b : true,
                        projectCreated: (_c = data.projectCreated) !== null && _c !== void 0 ? _c : true,
                        teamMemberChanged: (_d = data.teamMemberChanged) !== null && _d !== void 0 ? _d : true,
                        scaffoldUpdates: (_e = data.scaffoldUpdates) !== null && _e !== void 0 ? _e : true,
                        emailEnabled: (_f = data.emailEnabled) !== null && _f !== void 0 ? _f : true,
                    },
                });
                return {
                    message: "Notification settings saved successfully",
                    data: setting,
                };
            }
            catch (error) {
                console.error("❌ Notification setting error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new Error(error.message);
            }
        });
    }
    getNotificationSetting(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userBigIntId = BigInt(userId);
                let setting = yield prismaClient_1.default.notificationSetting.findUnique({
                    where: {
                        userId: userBigIntId,
                    },
                });
                // If not found, return default structure (important for UX)
                if (!setting) {
                    setting = {
                        id: BigInt(0),
                        userId: userBigIntId,
                        unusualActivity: true,
                        newDeviceLogin: true,
                        projectCreated: true,
                        teamMemberChanged: true,
                        scaffoldUpdates: true,
                        emailEnabled: true,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                }
                return {
                    message: "Notification settings fetched successfully",
                    data: setting,
                };
            }
            catch (error) {
                console.error("❌ Get notification setting error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new Error(error.message);
            }
        });
    }
}
exports.PasswordServices = PasswordServices;
