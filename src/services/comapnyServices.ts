// src/services/comapnyServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { generateCompanyId, pushNotificationDelhi, sendMail, generateOTP, generateToken, generateReadUrl } from "../helpers/utils";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { otpTemplate, } from "../helpers/templates";
import { ChangePasswordDTO, CompanyIdDTO, RegisterCompanyDTO, UpdateCompanyDTO, UpdateCompanyProfileDTO, ForgotPasswordDTO, verifyOTPDTO, ResetPasswordDTO, UpdateProfileImageDTO } from "../schemas/companySchema";
import { uploadImageDTO } from "../schemas/uploadImageSChema";
export class CompanyServices {
    async registerCompany(data: RegisterCompanyDTO,) {
        try {
            const existingCompany = await prisma.company.findUnique({
                where: {
                    email: data.email
                }
            });

            if (existingCompany && existingCompany.email === data.email) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS, 409, "This emailis alreday use with the other Compnay.Please use differnet email");
            }


            const hasPassword = bcrypt.hashSync(data.password ?? "", 10);
            const cmpId = generateCompanyId()

            const newCompany = await prisma.company.create({
                data: {
                    uuid: uuidv4(),
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
            const superAdmins = await prisma.user.findMany({
                where: { user_type: "SUPER_ADMIN" },
                select: { id: true },
            });
            console.log("superAdmin-==================>>>>>", superAdmins)
            if (superAdmins) {
                const superAdmin = superAdmins[0];
                const superAdminDevice = await prisma.device.findFirst({
                    where: {
                        //  userId:superAdmins.,
                        deviceToken: { not: null },
                    },
                    select: { deviceToken: true },
                });
                const notification = await prisma.notification.create({
                    data: {
                        uuid: uuidv4(),
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
                if (superAdminDevice?.deviceToken) {

                    await pushNotificationDelhi(
                        superAdminDevice.deviceToken,
                        "New Company Registered",
                        `A new ${data.name} has submitted a registration request ${newCompany.CMPId}. Please review`

                    );
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
            }
            return {
                message: RESPONSE_MESSAGES.COMPANY.REGISTER_SUCCESS,
                data:
                    companyData,
            };
        } catch (error: any) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.REGISTER_FAILED, 500, error.message);
        }
    }

    async updateCompanyDetails(data: UpdateCompanyDTO) {
        try {
            const companyData = await prisma.company.findUnique({
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
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 404, "Company Not found");
            }
            // const emailExists = await prisma.company.findUnique({
            //     where: {
            //         email: data.email,
            //     },
            // });
            // if (emailExists) {
            //     throw new CustomError(RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS, 409, "Conflict");
            // }

            const updatedComapny = await prisma.company.update({
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
                message: RESPONSE_MESSAGES.COMPANY.UPDATE_SUCCESS,
                data:
                    updatedComapny,
            };
        } catch (error: any) {
            console.log("error===================>>>", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.UPDATE_FAILED, 500, error.message);
        }
    }

    async updateCompanyProfile(data: UpdateCompanyProfileDTO) {
        try {
            const companyData = await prisma.company.findUnique({
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
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 404, "Company Not found");
            }

            const updatedComapny = await prisma.company.update({
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
                message: RESPONSE_MESSAGES.COMPANY.UPDATE_SUCCESS,
                data:
                    updatedComapny,


            };
        } catch (error: any) {
            console.log("error===================>>>", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.UPDATE_FAILED, 500, error.message);
        }
    }

async getCompanyallDetails(page: number, limit: number) {
    try {
        const skip = (page - 1) * limit;

        const [companyData, totalCount] = await Promise.all([
            prisma.company.findMany({
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
                    projects: {
                        include: {
                            _count: {
                                select: {
                                    TradesManRequests: {
                                        where: {
                                            status: {
                                                notIn: ["PENDING", "SUSPENDED", "REJECTED"]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            projects: true
                        }
                    }
                }
            }),

            prisma.company.count({
                where: {
                    isDeleted: false,
                    status: "ACTIVE",
                    isApproved: "APPROVED",
                    isVerified: true,
                    user_type: "COMPANY"
                },
            })
        ]);

        const companyWithProjectsCount = await Promise.all(
            companyData.map(async ({ _count, projects, ...company }) => {

                const totalScaffoldRequests = projects.reduce((sum, project) => {
                    return sum + (project._count?.TradesManRequests || 0);
                }, 0);

                return {
                    ...company,
                    totalProjects: _count.projects,
                    totalScaffoldRequests,
                    image: company.image
                };
            })
        );

        const totalPages = Math.ceil(totalCount / limit);

        return {
            message: RESPONSE_MESSAGES.COMPANY.FETCH_ALL_SUCCESS,
            data: companyWithProjectsCount,
            totalCount,
            totalPages,
            currentPage: page
        };

    } catch (error: any) {
        console.log("error===================>>>", error);

        if (error instanceof CustomError) {
            throw error;
        }

        throw new CustomError(
            RESPONSE_MESSAGES.COMPANY.FETCH_FAILED,
            500,
            error.message
        );
    }
}

    async getCompanyById(data: CompanyIdDTO) {
        try {

            // 🔥 OLD: scaffhold ❌ → NEW: request-based system ✅
            const companyRequests = await prisma.projectScaffholdRequest.findMany({
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
            const companyProjects = await prisma.project.findMany({
                where: {
                    createdById: data.id,
                    isDeleted: false,
                },
            });

            console.log("companyProjects==================>>>>>", companyProjects);

            const companyDataRaw = await prisma.company.findUnique({
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
                throw new CustomError(
                    RESPONSE_MESSAGES.COMPANY.NOT_FOUND,
                    500,
                    "Company Not Found"
                );
            }

            const companyData = {
                ...companyDataRaw,
                image: companyDataRaw.image,

                competentPersons: companyDataRaw.competentPersons.map(cp => ({
                    id: cp.user.id,
                    name: cp.user.name,
                    email: cp.user.email,
                })),

                projectManagers: companyDataRaw.projectManagers.map(pm => ({
                    id: pm.user.id,
                    name: pm.user.name,
                    email: pm.user.email,
                })),
            };

            return {
                message: RESPONSE_MESSAGES.COMPANY.FETCH_BY_ID_SUCCESS,
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

        } catch (error: any) {
            console.error("getCompanyById error:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.COMPANY.FETCH_FAILED,
                500,
                error.message
            );
        }
    }

    async requestListApproval(page: number, limit: number,) {
        try {


            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);
            const companies = await prisma.company.findMany({
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

            const totalCompanies = await prisma.company.count({
                where: {
                    isApproved: "PENDING",
                    isDeleted: false,
                    status: "ACTIVE",
                },
            });

            return {
                message: RESPONSE_MESSAGES.COMPANY.REQUEST_LIST_SUCCESS,
                total: totalCompanies,
                currentPage: Number(page),
                totalPages: Math.ceil(totalCompanies / Number(limit)),
                data:
                    companies

            };
        } catch (error: any) {
            console.error("requestListApproval error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.COMPANY.REQUEST_LIST_FAILED,
                    500,
                    error.message
                );
        }
    }

    async searchCompany(data: any, page = 1, limit = 10) {
        try {


            const skip = (Number(page) - 1) * Number(limit);
            const take = Number(limit);

            let whereCondition: any = {
                isApproved: { in: ["APPROVED", "REJECTED"] },
                status: {
                    in: ["ACTIVE", "SUSPENDED"], // include both statuses
                },
                isDeleted: false,
            };

            if (data && typeof data === "string" && data.trim() !== "") {
                const conditions: any[] = [
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

                whereCondition = {
                    ...whereCondition,
                    OR: conditions,
                };
            }

            const companies = await prisma.company.findMany({
                where: whereCondition,
                skip,
                take,
            });

            const totalCompanies = await prisma.company.count({
                where: whereCondition,
            });

            return {
                message: RESPONSE_MESSAGES.COMPANY.SEARCH_SUCCESS,
                total: totalCompanies,
                currentPage: Number(page),
                totalPages: Math.ceil(totalCompanies / Number(limit)),
                data: companies,
            };
        } catch (error: any) {
            console.error("searchCompany error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.SEARCH_FAILED, 500, error.message);
        }
    }

    async changePasswordService(data: ChangePasswordDTO, userId: number) {
        try {
            const user = await prisma.company.findFirst({
                where: { id: userId, isDeleted: false, status: "ACTIVE", }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "Not found with this user");
            }
            const isOldPasswordValid = await bcrypt.compare(data.oldPassword, user.password);
            if (!isOldPasswordValid) {
                throw new CustomError(RESPONSE_MESSAGES.USER.OLD_PASSWORD_MISSMATCH, 401, "Invalid old password");
            }

            const hashedPassword = await bcrypt.hash(data.newPassword, 10);

            await prisma.company.update({
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
            const user = await prisma.company.findUnique({
                where: { email: data.email, isDeleted: false, status: "ACTIVE" }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
            }
            const emailOTP = generateOTP();
            const otp = await prisma.company.update({
                where: { id: user.id },
                data: {
                    otp: emailOTP.otp.toString(),
                    otpExpireTime: emailOTP.expiresAt,
                    isVerified: false
                }
            });
            const html = otpTemplate(user.name, emailOTP.otp.toString());
            console.log("html==================>>>>>", html)

           const sendmails = await sendMail(
                user.email,
                "Scaff Snap - OTP Verification",
                html
            );
            console.log("sendmails==================>>>>>", sendmails)



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
            const user = await prisma.company.findUnique({
                where: { email: data.email, isDeleted: false, status: "ACTIVE" }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
            }
            if (user.otp !== data.otp || !user.otpExpireTime || user.otpExpireTime < new Date()) {
                throw new CustomError(RESPONSE_MESSAGES.USER.INVALID_OTP, 500, "Invalid or expired OTP");
            }
            const updatedData = await prisma.company.update({
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
            const user = await prisma.company.findFirst({
                where: { id: userId, isDeleted: false, status: "ACTIVE", }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 401, "Not found with this user");
            }

            if (user.password === data.newPassword) {
                throw new CustomError(RESPONSE_MESSAGES.USER.SAME_AS_OLD_PASSWORD, 400, "New password cannot be same as old password")
            }

            const hashedPassword = await bcrypt.hash(data.newPassword, 10);

            await prisma.company.update({
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
            const user = await prisma.company.findUnique({
                where: { email: data.email, isDeleted: false, status: "ACTIVE" }
            });
            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "Not found with this email");
            }
            const emailOTP = generateOTP();
            const otp = await prisma.company.update({
                where: { id: user.id },
                data: {
                    otp: emailOTP.otp.toString(),
                    otpExpireTime: emailOTP.expiresAt,
                }
            });

            const html = otpTemplate(user.name, emailOTP.otp.toString());

            await sendMail(
                user.email,
                "Scaff Snap - OTP Verification",
                html
            );

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


    async updateProfileImage(userId: number, data: UpdateProfileImageDTO) {
        try {

            const userExists = await prisma.company.findFirst({
                where: { id: userId, isApproved: "APPROVED", status: "ACTIVE", isDeleted: false, isVerified: true, user_type: "COMPANY" },
            });
            if (!userExists) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 404, "Company Not found ")
            }

            const updatedImage = await prisma.company.update({
                where: { id: userExists.id },
                data: { image: data.profileImage },
            });

            return {
                message: RESPONSE_MESSAGES.IMAGE.UPADTE_IMAGE,
                data: updatedImage,
            };


        } catch (error: any) {
            console.error("Error fetching image data:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.IMAGE.FAIL_UPADTE_IMAGE,
                    500,
                    error.message
                );

        }

    }

}


