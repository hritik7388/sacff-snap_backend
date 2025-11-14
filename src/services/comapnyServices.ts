import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { generateCompanyId, generateToken, pushNotificationDelhi } from "../helpers/utils";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { CompanyIdDTO, RegisterCompanyDTO, UpdateCompanyDTO } from "../schemas/companySchema";
export class CompanyServices {
    async registerCompany(data: RegisterCompanyDTO,) {
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
                    isApproved: "PENDING",
                    latitude: data.latitude,
                    longitude: data.longitude,
                    CMPId: cmpId,
                    image: data.image
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
                        role: "SUPER_ADMIN", // Custom enum value from NotificationRole
                        companyId: newCompany.id,
                        isRead: false,
                        receiverId: Number(superAdmin.id),
                        senderId: newCompany.id.toString(),

                    },
                });
                if (superAdminDevice?.deviceToken) {

                    await pushNotificationDelhi(
                        superAdminDevice.deviceToken,
                        "New Company Registered",
                        `${data.name} has registered and is awaiting approval.`
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
                },
            });

            if (!companyData) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
            }
            const emailExists = await prisma.company.findUnique({
                where: {
                    email: data.email,
                },
            });
            if (emailExists) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS, 500, "Conflict");
            }


            const updatedComapny = await prisma.company.update({
                where: {
                    id: companyData.id,
                },
                data: {
                    name: data.name,
                    email: data.email,
                    address: data.address,
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

    async getCompanyallDetails(page: number, limit: number) {
        try {
            const skip = (page - 1) * limit;
            const [companyData, totalCount] = await Promise.all([
                prisma.company.findMany({
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
                prisma.company.count()
            ]);
            const companyWithProjectsCount = companyData.map(({ _count, ...company }) => ({
                ...company,
                totalProjects: _count.projects
            }));
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
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
        }
    }

    async getCompanyById(data: CompanyIdDTO) {
        try {
            const companySCaffholds = await prisma.scaffhold.findMany({
                where: {
                    companyId: data.id,
                    isDeleted: false,
                    status: "ACTIVE",
                },
            });

            const companyProjects = await prisma.project.findMany({
                where: {
                    createdById: data.id,
                    isDeleted: false,
                    status: "ONGOING",
                },
            });

            const companyData = await prisma.company.findUnique({
                where: { id: data.id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    address: true,
                    mobileNumber: true,
                    CMPId: true,
                    image: true,
                    countryCode: true,
                    latitude: true,
                    longitude: true,
                    status: true,
                    isApproved: true,
                    competentPersons: true,
                    projectManagers: true,
                },
            });

            if (!companyData) {
                throw new CustomError(RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not Found");
            }

            return {
                message: RESPONSE_MESSAGES.COMPANY.FETCH_BY_ID_SUCCESS,
                data: {
                    companyData,
                    totalCompetentPersons: companyData.competentPersons.length,
                    totalProjectManagers: companyData.projectManagers.length,
                    totalScaffholds: companySCaffholds.length,
                    totalProjects: companyProjects.length,
                    activeProjects: companyProjects.filter(p => p.status === "ONGOING").length,
                    activeScaffholds: companySCaffholds.filter(s => s.status === "ACTIVE").length,
                    dismentedScaffholds: companySCaffholds.filter(s => s.status === "DISMANTLED").length,
                },
            };

        } catch (error: any) {
            console.error("getCompanyById error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
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

            let whereCondition: any = {};

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






}
