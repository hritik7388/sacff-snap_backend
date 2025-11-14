import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { generateCompanyId, generateToken } from "../helpers/utils";
import dotenv from "dotenv";
import { AddNewCompanyDTO, ApproveCompanyRequestDTO, CompanyStatusDTO, notifictaionDTO, RejectCompanyRequestDTO, SuperAdminDTO } from "../schemas/superAdminSchema";
dotenv.config();

export class superAdminServices {
    async loginSuperAdminServices(data: SuperAdminDTO,) {
        try {
            const userData = await prisma.user.findUnique({
                where: { email: data.email },
            });

            if (!userData) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 500, "User not found");
            }

            const isPasswordValid = userData.password ? await bcrypt.compare(data.password, userData.password) : false;

            if (!isPasswordValid) {
                throw new CustomError(RESPONSE_MESSAGES.USER.PASSWORD_MISMATCH, 500, "Invalid password");
            }
            if (userData.user_type !== "SUPER_ADMIN") {
                throw new CustomError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 500, "Unauthorized");
            }


            const jwtPayload = {
                login_id: userData.email,
                id: userData.id.toString(),
                uuid: userData.uuid,
                user_type: userData.user_type,
            };
            const token = generateToken(jwtPayload);
            await prisma.user.update({
                where: { id: userData.id },
                data: { lastLogin: new Date() },
            });

            const { password: _password, ...safeUserData } = userData;

            return {
                status: 200,
                message: RESPONSE_MESSAGES.USER.LOGIN_SUCCESS,
                token,
                user: userData,

            };
        } catch (error: any) {
            console.error("❌ Login error:", error);
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.USER.LOGIN_FAILED, 500, error.message);
        }
    }

    async adminDashboard() {
        try {

            const totalCompanies = await prisma.company.count({
                where: {
                    status: { not: "DELETED" },
                },
            });

            const approvedCount = await prisma.company.count({
                where: {
                    isApproved: "APPROVED",
                    status: { not: "DELETED" },
                },
            });

            const activeCount = await prisma.company.count({
                where: {
                    status: "ACTIVE",
                },
            });
            const totalProjects = await prisma.project.count({
                where: {
                    isDeleted: false,
                }
            })

            const blockCount = await prisma.company.count({
                where: {
                    status: "SUSPENDED",
                },
            });
            const deletedCount = await prisma.company.count({
                where: {
                    status: "DELETED",
                },
            });

            const pendingCount = await prisma.company.count({
                where: {
                    isApproved: "PENDING",
                    status: { not: "DELETED" },
                },
            });

            const rejectedCount = await prisma.company.count({
                where: {
                    isApproved: "REJECTED",
                    status: { not: "DELETED" },
                },
            });


            return {
                message: RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_SUCCESS,
                totalCompanies,
                approvedCompanies: approvedCount,
                activeCompanies: activeCount,
                blockedCompanies: blockCount,
                totalProjects: totalProjects,
                deletedCompanies: deletedCount,
                pendingCompanies: pendingCount,
                rejectedCompanies: rejectedCount,
            };
        } catch (error: any) {
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_FAILED, 500, error.message);
        }
    }

    async approveCompanyRequest(data: ApproveCompanyRequestDTO,) {
        try {

            const companyData = await prisma.company.findUnique({
                where: { id: data.id, isDeleted: false, isApproved: "PENDING" },
            });
            if (!companyData) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
            }

            const updatedCompany = await prisma.company.update({
                where: { id: data.id },
                data: {
                    isApproved: "APPROVED",
                    status: "ACTIVE"
                },
            });
            //   const mail = await sendMailApproval(updatedCompany.email, updatedCompany.password);
            // console.log("mail====================>>>>", mail);
            return {
                message: RESPONSE_MESSAGES.COMPANY.APPROVE_SUCCESS,
                company:
                    updatedCompany,

            };
        } catch (error: any) {
            console.log("error===================>>>", error);
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.APPROVE_FAILED, 500, error.message);
        }
    }

    async rejectCompanyRequest(data: RejectCompanyRequestDTO,) {
        try {

            const companyData = await prisma.company.findUnique({
                where: { id: data.id, isDeleted: false, isApproved: "PENDING" },
            });
            if (!companyData) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
            }


            const updatedCompany = await prisma.company.update({
                where: { id: companyData.id },
                data: {
                    isApproved: "REJECTED",
                    status: "SUSPENDED"
                },
            });
            return {
                message: RESPONSE_MESSAGES.COMPANY.REJECT_SUCCESS,
                data: updatedCompany,


            };
        } catch (error: any) {
            console.log("error===================>>>", error);
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.REJECT_FAILED, 500, error.message);
        }
    }

    async addNewCompanyBySuperAdmin(data: AddNewCompanyDTO,) {
        try {

            const existingCompany = await prisma.company.findUnique({
                where: {
                    email: data.email,
                    name: data.name,
                    mobileNumber: data.mobileNumber,
                },
            });

            if (existingCompany) {
                if (existingCompany.isApproved === "PENDING") {
                    throw new CustomError(RESPONSE_MESSAGES.COMPANY.PENDING_APPROVAL, 500, "Your company registration is still pending approval");
                } else {

                    throw new CustomError(RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS, 500, "Company already exists");
                }
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
            }


            return {
                message: RESPONSE_MESSAGES.COMPANY.REGISTER_SUCCESS,
                data: companyData,


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

    async blockCompany(data: CompanyStatusDTO,) {
        try {


            const companyData = await prisma.company.findUnique({
                where: {
                    id: data.id,
                    isDeleted: false,
                    status: "ACTIVE",
                },
            });
            if (!companyData) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
            }


            const updateCompany = await prisma.company.update({
                where: { id: companyData.id },
                data: {
                    status: "SUSPENDED",
                    isApproved: "REJECTED"
                },
            });

            return {
                message: RESPONSE_MESSAGES.COMPANY.BLOCK_SUCCESS,
                data:
                    updateCompany,

            };
        } catch (error: any) {
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.BLOCK_FAILED, 500, error.message);
        }
    }

    async unblockCompany(data: CompanyStatusDTO,) {
        try {


            const companyData = await prisma.company.findUnique({
                where: {
                    id: data.id,
                    isDeleted: false,
                    status: "SUSPENDED",
                },
            });
            if (!companyData) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
            }

            const updateCompany = await prisma.company.update({
                where: { id: companyData.id },
                data: {
                    status: "ACTIVE",
                    isApproved: "PENDING"
                },
            });
            return {
                message: RESPONSE_MESSAGES.COMPANY.UNBLOCK_SUCCESS,
                data: updateCompany,
            };
        } catch (error: any) {
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.UNBLOCK_FAILED, 500, error.message);
        }
    }

    async getAllActiveCompanies(page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;

            const [companies, totalCount] = await Promise.all([
                prisma.company.findMany({
                    where: {
                        status: "ACTIVE",
                        isDeleted: false,
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                }),
                prisma.company.count({
                    where: {
                        status: "ACTIVE",
                        isDeleted: false,
                    },
                }),
            ]);

            return {
                message: RESPONSE_MESSAGES.COMPANY.ACTIVE_COMPANIES,
                data: companies,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw new CustomError(RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
        }
    }

    async getAllBlockedCompanies(page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;

            const [companies, totalCount] = await Promise.all([
                prisma.company.findMany({
                    where: {
                        status: "SUSPENDED",
                        isDeleted: false,
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                }),
                prisma.company.count({
                    where: {
                        status: "SUSPENDED",
                        isDeleted: false,
                    },
                }),
            ]);
            console.log("companies=================>>>", companies);

            return {
                message: RESPONSE_MESSAGES.COMPANY.BLOCKED_COMPANIES,
                data: companies,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw new CustomError(RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
        }
    }


    async deleteCompany(data: CompanyStatusDTO,) {
        try {

            const companyData = await prisma.company.findUnique({
                where: {
                    id: data.id,
                    isDeleted: false,
                },
            });
            if (!companyData) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
            }

            const updateCompany = await prisma.company.update({
                where: { id: companyData.id },
                data: {
                    status: "DELETED",
                    isDeleted: true,
                },
            });

            return {
                message: RESPONSE_MESSAGES.COMPANY.DELETE_SUCCESS,
                data: updateCompany,
            };
        } catch (error: any) {
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.DELETE_FAILED, 500, error.message);
        }
    }


    async getSuperAdminNotifications() {
        try {
            const notifications = await prisma.notification.findMany({
                where: {
                    role: "SUPER_ADMIN"
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            const unreadCount = await prisma.notification.count({
                where: {
                    role: "SUPER_ADMIN",
                    isRead: false
                }
            });

            return {
                message: RESPONSE_MESSAGES.NOTIFICATION.SUCCESS_GET,
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
        } catch (error: any) {
            console.error("❗ Error in getSuperAdminNotifications:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to fetch notifications", 500, error.message);
        }
    }

    async markNotificationAsRead(data: notifictaionDTO) {
        try { 
            const notification = await prisma.notification.findUnique({
                where: { id: data.id },
            });

            if (!notification) {
                throw new CustomError(RESPONSE_MESSAGES.NOTIFICATION.NOT_FOUND, 404);
            } 
            const updatedNotification = await prisma.notification.update({
                where: { id: data.id },
                data: { isRead: true },
            });

            return {
                message: RESPONSE_MESSAGES.NOTIFICATION.SUCCESS_MARK_AS_READ,
                data: updatedNotification,
            };
        } catch (error: any) {
            console.error("❗ Error in markNotificationAsRead:", error);
             if (error instanceof CustomError) {
                                        throw error;
                                    }
            throw new CustomError(
                RESPONSE_MESSAGES.NOTIFICATION.FAILED_MARK_AS_READ,
                500,
                error.message
            );
        }
    }





}

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
