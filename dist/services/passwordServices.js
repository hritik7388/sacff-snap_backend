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
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
class PasswordServices {
    changePasswordService(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.user.findFirst({
                    where: { id: userId, isDeleted: false, status: "ACTIVE", }
                });
                if (!user) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this user");
                }
                const isOldPasswordValid = yield bcryptjs_1.default.compare(data.oldPassword, user.password);
                if (!isOldPasswordValid) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.OLD_PASSWORD_MISSMATCH, 500, "Invalid old password");
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
                }
                if (user.otp !== data.otp || !user.otpExpireTime || user.otpExpireTime < new Date()) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.INVALID_OTP, 500, "Invalid or expired OTP");
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
    resetPasswordService(data, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield prismaClient_1.default.user.findFirst({
                    where: { id: userId, isDeleted: false, status: "ACTIVE", }
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
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
}
exports.PasswordServices = PasswordServices;
