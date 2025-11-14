import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { generateOTP, generateToken } from "../helpers/utils";
import { ChangePasswordDTO, ForgotPasswordDTO, ResetPasswordDTO, verifyOTPDTO } from "../schemas/passwordSchema";

export class PasswordServices {
    async changePasswordService(data: ChangePasswordDTO, userId: number) {
        try {
            const user = await prisma.user.findFirst({
                where: { id: userId, isDeleted: false, status: "ACTIVE", }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this user");
            }
            const isOldPasswordValid = await bcrypt.compare(data.oldPassword, user.password);
            if (!isOldPasswordValid) {
                throw new CustomError(RESPONSE_MESSAGES.USER.OLD_PASSWORD_MISSMATCH, 500, "Invalid old password");
            }

            const hashedPassword = await bcrypt.hash(data.newPassword, 10);

            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });

            return {
                message: "Password changed successfully"
            };
        } catch (error) {
            console.error("❌ Change password error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.USER.PASSWORD_MISMATCH, 500, "Change password failed due to server error");
        }
    }

    async forgotPasswordServices(data: ForgotPasswordDTO) {
        try {
            const user = await prisma.user.findUnique({
                where: { email: data.email, isDeleted: false, status: "ACTIVE" }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
            }
            const emailOTP = generateOTP();
            const otp = await prisma.user.update({
                where: { id: user.id },
                data: {
                    otp: emailOTP.otp.toString(),
                    otpExpireTime: emailOTP.expiresAt,
                    isVerified: false
                }
            });


            return {
                message: RESPONSE_MESSAGES.USER.FORGOT_PASSWORD_SUCCESS,
                data: otp

            }

        } catch (error) {
            console.error("❌ Forgot password error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.USER.FORGOT_PASSWORD_FAILED, 500, "Forgot password failed due to server error");
        }
    }

    async verifyOTPService(data: verifyOTPDTO) {
        try {
            const user = await prisma.user.findUnique({
                where: { email: data.email, isDeleted: false, status: "ACTIVE" }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
            }
            if (user.otp !== data.otp || !user.otpExpireTime || user.otpExpireTime < new Date()) {
                throw new CustomError(RESPONSE_MESSAGES.USER.INVALID_OTP, 500, "Invalid or expired OTP");
            }
            const updatedData = await prisma.user.update({
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
            const token = generateToken(jwtPayload);

            return {
                message: RESPONSE_MESSAGES.USER.VERIFY_OTP_SUCCESS,
                token,
                data: updatedData



            }

        } catch (error) {
            console.error("❌ Verify OTP error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.USER.VERIFY_OTP_FAILED, 500, "Verify OTP failed due to server error");
        }
    }

    async resetPasswordService(data: ResetPasswordDTO, userId: number) {
        try {
            const user = await prisma.user.findFirst({
                where: { id: userId, isDeleted: false, status: "ACTIVE", }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 401, "Not found with this user");
            }

            if (user.password === data.newPassword) {
                throw new CustomError(RESPONSE_MESSAGES.USER.SAME_AS_OLD_PASSWORD, 400, "New password cannot be same as old password")
            }

            const hashedPassword = await bcrypt.hash(data.newPassword, 10);

            await prisma.user.update({
                where: { id: user.id },
                data: { password: hashedPassword }
            });

            return {
                message: "Password changed successfully"
            };
        } catch (error) {
            console.error("❌ Change password error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.USER.PASSWORD_MISMATCH, 500, "Change password failed due to server error");
        }
    }

    async resendOTPServices(data: ForgotPasswordDTO) {
        try {
            const user = await prisma.user.findUnique({
                where: { email: data.email, isDeleted: false, status: "ACTIVE" }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
            }
            const emailOTP = generateOTP();
            const otp = await prisma.user.update({
                where: { id: user.id },
                data: {
                    otp: emailOTP.otp.toString(),
                    otpExpireTime: emailOTP.expiresAt,
                }
            });
            return {
                message: RESPONSE_MESSAGES.USER.FORGOT_PASSWORD_SUCCESS,
                data: otp
            }
        } catch (error) {
            console.error("❌ Forgot password error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(RESPONSE_MESSAGES.USER.FORGOT_PASSWORD_FAILED, 500, "Forgot password failed due to server error");
        }
    }


}


