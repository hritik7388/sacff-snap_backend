// src/services/subAdminServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { generateProjectId, generateToken, pushNotificationDelhi, sendMail } from "../helpers/utils";
import { AddNewProjectDTO, AddTeamMemberDTO, LoginSubAdminDTO, ScaffHoldRequestDTO, SearchTeamMemberDTO, TeamMemberDTO, TimelineImageFilterDTO, updateProjectDTO, UpdateTeamMemberDTO, } from "../schemas/subAdminSchema";
import { teamMemberAddTemplate } from "../helpers/templates";
import { SearchScaffHoldDTO } from "../schemas/tradesManSchema";
import { LogoutDTO } from "../schemas/superAdminSchema";
import { NotificationType, NotificationRole } from "@prisma/client";

export class subAdminServices {
    async loginSubAdminServices(data: LoginSubAdminDTO) {
        try {

            const subAdminData = await prisma.company.findUnique({
                where: {
                    email: data.email, isDeleted: false, isVerified: true,
                    user_type: "COMPANY"
                },
            });

            if (!subAdminData) {
                throw new CustomError(RESPONSE_MESSAGES.SUB_ADMIN.NOT_FOUND, 500, "The provided  email do not match");
            }


            if (subAdminData.status === "SUSPENDED") {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.SUSPENDED,
                    500,
                    "Your account has been suspended. Please contact support for assistance."
                );
            }
            if (subAdminData.isApproved !== "APPROVED") {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.NOT_APPROVED,
                    500,
                    "Your company is not approved yet"
                );
            }

            const isPasswordValid = subAdminData.password && (await bcrypt.compare(data.password, subAdminData.password));
            if (!isPasswordValid) {
                throw new CustomError(RESPONSE_MESSAGES.SUB_ADMIN.INVALID_PASSWORD, 500, "Invalid password");
            }

            if (subAdminData.user_type !== "COMPANY") {
                throw new CustomError(RESPONSE_MESSAGES.AUTH.UNAUTHORIZED, 500, "Unauthorized");
            }
            if (!subAdminData.isApproved) {
                throw new CustomError(RESPONSE_MESSAGES.SUB_ADMIN.NOT_APPROVED, 500, "Your company is not approved yet");
            }


            const jwtPayload = {
                login_id: subAdminData.email,
                id: subAdminData.id.toString(),
                uuid: subAdminData.uuid,
                user_type: subAdminData.user_type,
            };

            const token = generateToken(jwtPayload);

            const user = {
                id: subAdminData.id.toString(),
                uuid: subAdminData.uuid,
                name: subAdminData.name,
                email: subAdminData.email,
                user_type: subAdminData.user_type,
                companyId: subAdminData.id?.toString() ?? null,
            };
            await prisma.company.update({
                where: { id: subAdminData.id },
                data: { lastLogin: new Date() },
            });

            return {
                message: RESPONSE_MESSAGES.SUB_ADMIN.LOGIN_SUCCESS,
                token,
                user,
            };
        } catch (error: any) {
            console.error("❌ Login error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError ? error : new CustomError(RESPONSE_MESSAGES.SUB_ADMIN.LOGIN_FAILED, 500, error.message);
        }
    }

    async addTeamMemberServices(id: number, data: AddTeamMemberDTO) {
        try {

            // ==========================
            // ✅ VALIDATE COMPANY
            // ==========================
            const companyData = await prisma.company.findFirst({
                where: {
                    id,
                    isDeleted: false,
                    status: "ACTIVE",
                    isApproved: "APPROVED",
                    isVerified: true,
                    user_type: "COMPANY"
                },
            });

            if (!companyData) {
                throw new CustomError("Company not found", 404, "Company not found");
            }

            // ==========================
            // ❌ CHECK DUPLICATE USER
            // ==========================
            const existingTeamMember = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    isDeleted: false,
                },
            });

            if (existingTeamMember) {
                throw new CustomError("User already exists", 400, "Duplicate user");
            }

            // ==========================
            // 🔐 CREATE USER
            // ==========================
            const hashedPassword = await bcrypt.hash(data.password, 10);

            const teamMemberData = await prisma.user.create({
                data: {
                    uuid: uuidv4(),
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

            // ==========================
            // 🔗 ROLE CREATION
            // ==========================
            let roleDetails: any = null;

            if (data.user_type === "PROJECT_MANAGER") {
                roleDetails = await prisma.projectManager.create({
                    data: {
                        userId: teamMemberData.id,
                        uuid: teamMemberData.uuid,
                        address: data.address,
                        latitude: data.latitude ?? null,
                        longitude: data.longitude ?? null,
                        companyId: companyData.id,
                        cmpId: companyData.CMPId
                    },
                });
            }

            if (data.user_type === "COMPETENT_PERSON") {
                roleDetails = await prisma.competentPerson.create({
                    data: {
                        userId: teamMemberData.id,
                        uuid: teamMemberData.uuid,
                        address: data.address,
                        latitude: data.latitude ?? null,
                        longitude: data.longitude ?? null,
                        companyId: companyData.id,
                        cmpId: companyData.CMPId
                    },
                });
            }

            // ==========================
            // 📁 USER MEDIA
            // ==========================
            if (data.idProofImage) {
                await prisma.userMedia.create({
                    data: {
                        userId: teamMemberData.id,
                        mediaType: "ID_PROOF_IMAGE",
                        url: data.idProofImage,
                    },
                });
            }

            if (data.photoImage) {
                await prisma.userMedia.create({
                    data: {
                        userId: teamMemberData.id,
                        mediaType: "PHOTO_IMAGE",
                        url: data.photoImage,
                    },
                });
            }

            // ==========================
            // 📧 EMAIL (ONLY PM & CP)
            // ==========================
            if (data.user_type === "PROJECT_MANAGER" || data.user_type === "COMPETENT_PERSON") {
                await sendMail(
                    teamMemberData.email,
                    "Your ScaffSnap Account Details",
                    teamMemberAddTemplate(
                        teamMemberData.name,
                        teamMemberData.user_type,
                        teamMemberData.email,
                        data.password,
                        companyData.CMPId || ""
                    )
                );
            }

            // ==========================
            // 🔔 DB NOTIFICATION DATA
            // ==========================
            const title = "TEAM MEMBER ADDED";
            const message = `New team member ${teamMemberData.name} added in ${companyData.name}`;

            // ==========================
            // 👑 SUPER ADMIN + COMPANY ADMINS (DB NOTIFICATION)
            // ==========================
            const superAdmins = await prisma.user.findMany({
                where: {
                    user_type: "SUPER_ADMIN",
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                }
            });

            const companyAdmins = await prisma.company.findMany({
                where: {
                    id: companyData.id,
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                }
            });

            await prisma.notification.createMany({
                data: [
                    ...superAdmins.map(a => ({
                        uuid: uuidv4(),
                        title,
                        message,
                        type: NotificationType. NEW_TEAM_MEMBER_CREATED,
                        role: NotificationRole.SUPER_ADMIN,
                        receiverId: a.id,
                        isRead: false,
                    })),
                    ...companyAdmins.map(a => ({
                        uuid: uuidv4(),
                        title,
                        message,
                        type: NotificationType. NEW_TEAM_MEMBER_CREATED,
                        role: NotificationRole.COMPANY,
                        receiverId: a.id,
                        isRead: false,
                    }))
                ]
            });

            // ==========================
            // 📱 PUSH NOTIFICATIONS (POPUP FIX)
            // ==========================
 
            // ==========================
            // ✅ RESPONSE
            // ==========================
            return {
                message: "Team member added successfully",
                data: teamMemberData
            };

        } catch (error: any) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError("Failed to add team member", 500, error.message);
        }
    }

    async editTeamMemberServices(data: UpdateTeamMemberDTO) {
        try {

            const teamMemberToUpdate = await prisma.user.findFirst({
                where: { id: data.id, isDeleted: false, status: "ACTIVE" },
            });

            if (!teamMemberToUpdate) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBER_NOT_FOUND,
                    500,
                    "The team member you are trying to update does not exist"
                );
            }
            const existingTeamMember = await prisma.user.findFirst({
                where: {
                    email: data.email,
                    id: { not: data.id },
                    isDeleted: false,
                    status: "ACTIVE",
                },
            });

            if (existingTeamMember) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBER_EXISTS,
                    500,
                    "A team member with this email already exists under your company"
                );
            }

            const teamMemberData = await prisma.user.update({
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
            let roleDetails: any = null;
            if (data.user_type === "PROJECT_MANAGER") {
                roleDetails = await prisma.projectManager.update({
                    where: { userId: teamMemberData.id },
                    data: {
                        address: data.address,
                        latitude: data.latitude ?? null,
                        longitude: data.longitude ?? null,
                    },
                });
            } else if (data.user_type === "COMPETENT_PERSON") {
                roleDetails = await prisma.competentPerson.update({
                    where: { userId: teamMemberData.id },
                    data: {
                        address: data.address,
                        latitude: data.latitude ?? null,
                        longitude: data.longitude ?? null,
                    },
                });
            }
            if (data.idProofImage) {
                const idProofMedia = await prisma.userMedia.findFirst({
                    where: { userId: teamMemberData.id, mediaType: "ID_PROOF_IMAGE" },
                });
                if (idProofMedia) {
                    await prisma.userMedia.update({
                        where: { id: idProofMedia.id },
                        data: { url: data.idProofImage },
                    });
                }
            }

            if (data.photoImage) {
                const photoMedia = await prisma.userMedia.findFirst({
                    where: { userId: teamMemberData.id, mediaType: "PHOTO_IMAGE" },
                });
                if (photoMedia) {
                    await prisma.userMedia.update({
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
                address: roleDetails?.address ?? null,
                idProofImage: roleDetails?.idProofImage ?? null,
                photoImage: roleDetails?.photoImage ?? null,
                latitude: roleDetails?.latitude ?? null,
                longitude: roleDetails?.longitude ?? null,
                cmpId: roleDetails?.cmpId ?? null,
            };

            return {
                message: RESPONSE_MESSAGES.SUB_ADMIN.UPDATE_TEAM_MEMBER_SUCCESS,
                data: teamMember,
            };
        } catch (error: any) {
            console.error("❌ Edit Team Member error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.SUB_ADMIN.UPDATE_TEAM_MEMBER_FAILED, 500, error.message);
        }
    }

    async getProjectManagersListServices(search: string="", companyId: number, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
                  const whereCondition: any = {
            companyId,
            user: {
                user_type: "PROJECT_MANAGER",
                isDeleted: false,
                ...(search?.trim()
                    ? {
                        OR: [
                            {
                                name: {
                                    contains: search,
                                },
                            },
                            {
                                email: {
                                    contains: search,
                                },
                            },
                            {
                                mobileNumber: {
                                    contains: search,
                                },
                            },
                        ],
                    }
                    : {}),
            },
            company: {
                isDeleted: false,
                status: "ACTIVE",
                isApproved: "APPROVED",
                isVerified: true,
                user_type: "COMPANY",
            },
        };

            const [projectManagers, totalCount] = await Promise.all([
                prisma.projectManager.findMany({
                    skip,
                    take: limit,
                    orderBy: { id: "desc" },
                    where: whereCondition,
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
                prisma.projectManager.count({
                    where:whereCondition,
                }),
            ]);
            const mappedPMs = projectManagers.map((pm) => {
                const photoImage = pm.user.userMedias.find(
                    (media) => media.mediaType === "PHOTO_IMAGE"
                );
                const idProofImage = pm.user.userMedias.find(
                    (media) => media.mediaType === "ID_PROOF_IMAGE"
                );

                return {
                    id: pm.id,
                    userId: pm.user.id,
                    uuid: pm.user.uuid,
                    name: pm.user.name,
                    email: pm.user.email,
                    mobileNumber: pm.user.mobileNumber,
                    user_type: pm.user.user_type,
                    countryCode: pm.user.countryCode,
                    CMPId: pm.company?.CMPId || null,
                    address: pm.address || null,
                    latitude: pm.latitude || null,
                    longitude: pm.longitude || null,

                    image: photoImage?.url || null,
                    id_Proof: idProofImage?.url || null, // ✅ Fixed property access
                };
            });

            return {
                message: RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_SUCCESS,
                data: mappedPMs,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❌ Get Project Manager List error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async getCompetentPersonListServices(userId: number, data: SearchScaffHoldDTO, page: number = 1, limit: number = 10) {
        try {

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    user_type: true,
                    projectManager: {
                        select: { companyId: true }
                    }
                }
            });

            if (!user) {
                throw new CustomError("User not found", 404);
            }
            const skip = (page - 1) * limit;
            const whereCondition: any = {
                companyId: user.projectManager?.companyId,
                user: {
                    user_type: "COMPETENT_PERSON",
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,

                },
            };
            const searchTerm = data?.search?.trim();

            if (searchTerm && searchTerm !== "") {
                const term = searchTerm;

                if (!isNaN(Number(term))) {
                    whereCondition.id = Number(term);
                } else {
                    whereCondition.OR = [
                        {
                            user: {
                                name: {
                                    contains: searchTerm,
                                },
                            },
                        },
                        {
                            user: {
                                email: {
                                    contains: searchTerm,
                                },
                            },
                        },
                        {
                            user: {
                                mobileNumber: {
                                    contains: searchTerm,
                                },
                            },
                        },
                    ];
                }
            }


            const [competentPerson, totalCount] = await Promise.all([
                prisma.competentPerson.findMany({
                    skip,
                    take: limit,
                    orderBy: { id: "desc" },
                    where: whereCondition,

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
                prisma.competentPerson.count({
                    where: { user: { user_type: "COMPETENT_PERSON", isDeleted: false, isVerified: true } },
                }),
            ]);

            const mappedPMs = competentPerson.map((pm) => {
                const photoImage = pm.user.userMedias.find(
                    (media) => media.mediaType === "PHOTO_IMAGE"
                );
                const idProofImage = pm.user.userMedias.find(
                    (media) => media.mediaType === "ID_PROOF_IMAGE"
                );

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

                    CMPId: pm.company?.CMPId || null,
                    image: photoImage?.url || null,
                    id_Proof: idProofImage?.url || null,
                };
            });
            return {
                message: RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_SUCCESS,
                data: mappedPMs,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❌ Get Project Manager List error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async getCompanyCompetentPersonList(search: string="", companyId: number, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;
            const whereCondition: any = {
    companyId,
    user: {
        isDeleted: false,
        status: "ACTIVE",
        isVerified: true,
        user_type: "COMPETENT_PERSON",

        ...(search?.trim()
            ? {
                OR: [
                    {
                        name: {
                            contains: search, 
                        },
                    },
                    {
                        email: {
                            contains: search, 
                        },
                    },
                    {
                        mobileNumber: {
                            contains: search,
                        },
                    },
                ],
            }
            : {}),
    },
    company: {
        isDeleted: false,
        isApproved: "APPROVED",
        status: "ACTIVE",
        isVerified: true,
        user_type: "COMPANY",
    },
};

            const [competentPerson, totalCount] = await Promise.all([
                prisma.competentPerson.findMany({
                    skip,
                    take: limit,
                    orderBy: { id: "desc" },
                    where:  whereCondition,
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
                prisma.competentPerson.count({
                    where:whereCondition,
                }),
            ]);

            const mappedPMs = competentPerson.map((pm) => {
                const photoImage = pm.user.userMedias.find(
                    (media) => media.mediaType === "PHOTO_IMAGE"
                );
                const idProofImage = pm.user.userMedias.find(
                    (media) => media.mediaType === "ID_PROOF_IMAGE"
                );

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

                    CMPId: pm.company?.CMPId || null,
                    image: photoImage?.url || null,
                    id_Proof: idProofImage?.url || null,
                };
            });
            return {
                message: RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_SUCCESS,
                data: mappedPMs,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❌ Get Project Manager List error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async getTradesManListServices(page: number = 1, limit: number = 10) {
        try {

            const skip = (page - 1) * limit;

            const [tradesMan, totalCount] = await Promise.all([
                prisma.user.findMany({
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
                prisma.user.count({
                    where: {
                        user_type: "TRADESMAN",
                        isDeleted: false,
                        status: "ACTIVE",

                    },
                }),
            ]);

            return {
                message: RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_SUCCESS,
                data: tradesMan,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❌ Get Project Manager List error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.TEAM_MEMBERS_FETCH_FAILED,
                    500,
                    error.message
                );
        }
    }

    async createNewProject(subAdminId: number, data: AddNewProjectDTO) {
        try {

            // =========================
            // ✅ Validate Company (OWNER)
            // =========================
            const companyData = await prisma.company.findFirst({
                where: {
                    id: subAdminId,
                    isDeleted: false,
                    status: "ACTIVE",
                    isApproved: "APPROVED",
                    isVerified: true,
                    user_type: "COMPANY",
                },
            });

            if (!companyData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND,
                    500,
                    "Company not found"
                );
            }

            // =========================
            // ✅ Validate Project Managers
            // =========================
            const projectManagersData = await prisma.projectManager.findMany({
                where: { userId: { in: data.projectManagerId } },
            });

            if (projectManagersData.length !== data.projectManagerId.length) {
                throw new CustomError(
                    RESPONSE_MESSAGES.PROJECTMANAGER.NOT_FOUND,
                    404,
                    "Some project managers were not found"
                );
            }

            // =========================
            // ❌ Duplicate Check
            // =========================
            const existingProject = await prisma.project.findFirst({
                where: {
                    clientEmail: data.clientEmail,
                    projectName: data.projectName,
                    createdById: subAdminId,
                    isDeleted: false
                }
            });

            if (existingProject) {
                throw new CustomError(
                    RESPONSE_MESSAGES.PROJECT.ALREADY_EXISTS,
                    409,
                    "Project already exists"
                );
            }

            // =========================
            // ✅ Create Project
            // =========================
            const project = await prisma.project.create({
                data: {
                    uuid: uuidv4(),
                    projectName: data.projectName,
                    PJT: generateProjectId(),
                    clientName: data.clientName,
                    clientEmail: data.clientEmail,
                    clientMobile: data.clientMobile ?? "",
                    clientCountryCode: data.clientCountryCode,
                    clientAddress: data.clientAddress,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    status: "CREATED",
                    createdById: subAdminId,
                    isDeleted: false
                }
            });

            // =========================
            // 🔗 Assign PMs
            // =========================
            await prisma.project.update({
                where: { id: project.id },
                data: {
                    projectManagers: {
                        connect: data.projectManagerId.map(id => ({ id }))
                    }
                }
            });

            // =========================
            // 👑 SUPER ADMIN + COMPANY OWNER ONLY
            // =========================
            const superAdmins = await prisma.user.findMany({
                where: {
                    user_type: "SUPER_ADMIN",
                    isDeleted: false,
                    status: "ACTIVE",
                    isVerified: true,
                },
                select: { id: true, email: true }
            });

            const receiverIds = [
                subAdminId,
                ...superAdmins.map(sa => Number(sa.id))
            ];

            // =========================
            // 🔔 GET SETTINGS
            // =========================
            const settings = await prisma.notificationSetting.findMany({
                where: {
                    userId: { in: receiverIds }
                }
            });

            // =========================
            // ✅ APPLY TOGGLE
            // =========================
            const allowedUserIds = receiverIds.filter(id => {
                const setting = settings.find(s => Number(s.userId) === id);

                if (!setting) return true;

                return setting.projectCreated === true;
            });

            const message = `Project "${project.projectName}" has been created successfully.`;

            // =========================
            // 📩 DB NOTIFICATIONS
            // =========================
            await prisma.notification.createMany({
                data: allowedUserIds.map(id => ({
                    uuid: uuidv4(),
                    title: "PROJECT CREATED",
                    message,
                    type: "PROJECT_ASSIGNED",
                    role: id === subAdminId ? "COMPANY" : "SUPER_ADMIN",
                    isRead: false,
                    companyId: subAdminId,
                    projectId: BigInt(project.id),
                    receiverId: BigInt(id),
                    senderId: subAdminId.toString(),
                    notificationImage:
                        "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/Frame+2087325149.png"
                }))
            });

            // =========================
            // 📧 EMAIL (ONLY IF ENABLED)
            // =========================
            const emailUsers = await prisma.user.findMany({
                where: {
                    id: {
                        in: settings
                            .filter(s => s.emailEnabled)
                            .map(s => Number(s.userId))
                    }
                },
                select: { email: true }
            });

            for (const user of emailUsers) {
                await sendMail(
                    user.email,
                    "Project Created",
                    message
                );
            }

            // =========================
            // 📱 PUSH NOTIFICATION (POPUP)
            // =========================
            const devices = await prisma.device.findMany({
                where: {
                    userId: { in: allowedUserIds },
                    deviceToken: { not: null }
                },
                select: { deviceToken: true }
            });

            for (const device of devices) {
                await pushNotificationDelhi(
                    device.deviceToken!,
                    "PROJECT CREATED",
                    message
                );
            }

            // =========================
            // RESPONSE
            // =========================
            return {
                message: RESPONSE_MESSAGES.PROJECT.CREATE_SUCCESS,
                data: project
            };

        } catch (error: any) {
            console.error("❌ Create project error:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.PROJECT.CREATE_FAILED,
                500,
                error.message
            );
        }
    }

    async updateProject(subAdminId: number, data: updateProjectDTO) {
        try {

            const companyData = await prisma.company.findFirst({
                where: { id: subAdminId, isDeleted: false, status: "ACTIVE" },
            });

            if (!companyData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND,
                    500,
                    "The company you are trying to create a project for does not exist"
                );
            }
            // 1️⃣ Validate project exists
            const oldProject = await prisma.project.findFirst({
                where: { id: data.id, isDeleted: false },
                include: {
                    projectManagers: {
                        select: { id: true }
                    }
                }
            });

            if (!oldProject) {
                throw new CustomError("Project not found", 404, "Project not found");
            }

            // 👉 Extract existing PM IDs
            const existingPMIds = oldProject.projectManagers.map(pm => pm.id);

            // 2️⃣ Validate all project managers exist
            const projectManagersData = await prisma.projectManager.findMany({
                where: { userId: { in: data.projectManagerId } },
                include: { user: true, company: true }
            });

            if (projectManagersData.length !== data.projectManagerId.length) {
                throw new CustomError("Some project managers not found", 400, "Some project managers are invalid");
            }

            const validPMUsers = await prisma.user.findMany({
                where: {
                    id: { in: data.projectManagerId },
                    isDeleted: false,
                    status: "ACTIVE",
                    user_type: "PROJECT_MANAGER",
                    isVerified: true,

                }
            });

            if (validPMUsers.length !== data.projectManagerId.length) {
                throw new CustomError("Some project manager accounts are not valid", 400, "Some PMs are inactive or deleted");
            }

            // 3️⃣ Check duplicate project (excluding current)
            const duplicateProject = await prisma.project.findFirst({
                where: {
                    clientEmail: data.clientEmail,
                    projectName: data.projectName,
                    createdById: subAdminId,
                    isDeleted: false,
                    NOT: { id: data.id }
                }
            });

            if (duplicateProject) {
                throw new CustomError("Duplicate project", 409, "Project with same name/email exists");
            }

            // 4️⃣ Find newly added PMs
            const newlyAddedPMIds = data.projectManagerId.filter(
                id => !existingPMIds.includes(BigInt(id))
            );

            // 5️⃣ Update project
            const updatedProject = await prisma.project.update({
                where: { id: data.id },
                data: {
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
                    status: "CREATED",
                    isDeleted: false,
                    projectManagers: {
                        set: data.projectManagerId.map(id => ({ id }))
                    }
                }
            });

            await prisma.projectScaffholdRequest.updateMany({
                where: {
                    projectId: data.id,
                },
                data: {
                    projectId: data.id // or remove if not needed
                }
            });
            if (newlyAddedPMIds.length > 0) {

                const deviceTokens = await prisma.device.findMany({
                    where: {
                        userId: { in: newlyAddedPMIds },
                        deviceToken: { not: null }
                    },
                    select: { userId: true, deviceToken: true }
                });

                const notificationMessage = `You have been assigned as Project Manager for project "${updatedProject.projectName}".`;

                await prisma.notification.createMany({
                    data: newlyAddedPMIds.map(pmId => ({
                        uuid: uuidv4(),
                        title: "Project Modified",
                        message: notificationMessage,
                        type: "PROJECT_MODIFIED",
                        role: "PROJECT_MANAGER",
                        scaffoldRequestId: "",
                        isRead: false,
                        companyId: projectManagersData[0].company?.id ?? undefined,
                        projectId: BigInt(updatedProject.id),
                        receiverId: BigInt(pmId),
                        senderId: subAdminId.toString(),
                        notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/Frame+2087325149.png"
                    }))
                });

                for (const dev of deviceTokens) {
                    if (!dev.deviceToken) continue;
                    await pushNotificationDelhi(
                        dev.deviceToken,
                        "PROJECT_ASSIGNED",
                        notificationMessage
                    );
                }
            }
            const projectWithPMs = await prisma.project.findUnique({
                where: { id: updatedProject.id },
                include: {
                    projectManagers: {
                        include: { userMedias: true }
                    }
                }
            });

            const formattedPMs = projectWithPMs?.projectManagers.map(pm => ({
                id: pm.id,
                name: pm.name,
                email: pm.email,
                url: pm.userMedias[0]?.url || null
            }));

            return {
                message: "Project updated successfully",
                data: {
                    ...projectWithPMs,
                    projectManagers: formattedPMs
                }
            };

        } catch (error: any) {
            console.error("❌ Update Project Error:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                "Project update failed",
                500,
                error.message
            );
        }
    }


    async teamMemberDashboard(companyId: number) {
        try {

            const companyData = await prisma.company.findFirst({
                where: {
                    id: companyId, isDeleted: false, status: "ACTIVE",
                    isVerified: true,
                },
            });

            if (!companyData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND,
                    500,
                    "The company you are trying to fetch does not exist"
                );
            }
            const totalProjectManagers = await prisma.user.count({
                where: {
                    status: "ACTIVE",
                    user_type: "PROJECT_MANAGER",
                    isVerified: true,
                    isDeleted: false,
                    projectManager: {
                        companyId: companyId,
                    },
                },
            });

            const totalCompetentPersons = await prisma.user.count({
                where: {
                    status: "ACTIVE",
                    user_type: "COMPETENT_PERSON",
                    isVerified: true,
                    isDeleted: false,
                    competentPerson: {
                        companyId: companyId,
                    },
                },
            });

            const totalTradesMan = await prisma.user.count({
                where: {
                    status: "ACTIVE",
                    user_type: "TRADESMAN",
                    isVerified: true,
                    isDeleted: false,

                    tradesman: {
                        createdProjectScaffRequests: {
                            some: {
                                project: {
                                    createdById: companyId,
                                    isDeleted:false,
                                }
                            },
                        }
                    }
                }
            });
            return {
                message: RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_SUCCESS,
                totalCompetentPersons,
                totalProjectManagers,
                totalTradesMan
            }

        } catch (error: any) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_FAILED, 500, error.message);
        }
    }

    async scaffholdDashboard(companyId: number) {
        try {

            const companyData = await prisma.company.findFirst({
                where: { id: companyId, isDeleted: false, status: "ACTIVE" },
            });

            if (!companyData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND,
                    500,
                    "The company you are trying to fetch  does not exist"
                );
            }

            const [totalActiveScaffHold, totalDismentedScaffhold, totalActiveProjects, totalProjectManagers, totalCompetentPersons] = await Promise.all([
                prisma.projectScaffholdRequest.count({
                    where: {
                         status: {
        notIn: ["PENDING", "REJECTED", "SUSPENDED","DISMANTLED"]
    },
                        project: {
                            createdById: companyId
                        }
                    }
                }),
                prisma.projectScaffholdRequest.count({ where: { status: "DISMANTLED",   project: {
            createdById: companyId,
        }, } }),
                prisma.project.count({ where: { status: "ONGOING", createdById: companyId } }),
                prisma.user.count({
                    where: {
                        status: "ACTIVE", user_type: "PROJECT_MANAGER", projectManager: {
                            companyId: companyId
                        }
                    }
                }),
                prisma.user.count({
                    where: {
                        status: "ACTIVE", user_type: "COMPETENT_PERSON", competentPerson: {
                            companyId: companyId
                        }
                    }
                }),
            ]);

            return {
                message: RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_SUCCESS,
                totalActiveProjects,
                totalDismentedScaffhold,
                totalActiveScaffHold,
                totalTeamMembers: totalCompetentPersons + totalProjectManagers, // use colon, not equals
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

    async projectDashboard(companyId: number) {
        try {
            const companyData = await prisma.company.findFirst({
                where: { id: companyId, isDeleted: false, status: "ACTIVE" },
            });

            if (!companyData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND,
                    500,
                    "The company you are trying to create a project for does not exist"
                );
            }
            // Fetch counts
            const [totalProjects, ongoingProjects, completedProjects, projectsWithoutScaffhold] = await Promise.all([
                prisma.project.count({ where: { isDeleted: false, createdById: companyId } }),
                prisma.project.count({ where: { status: "ONGOING", isDeleted: false, createdById: companyId } }),
                prisma.project.count({ where: { status: "COMPLETED", isDeleted: false, createdById: companyId } }),
                prisma.project.count({
                    where: {
                        isDeleted: false,
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
        } catch (error: any) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_FAILED, 500, error.message);
        }
    }


    async scaffholdStatusDashboard(companyId: number) {
        try {

            const companyData = await prisma.company.findFirst({
                where: { id: companyId, isDeleted: false, status: "ACTIVE" },
            });

            if (!companyData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SUB_ADMIN.COMPANY_NOT_FOUND,
                    500,
                    "The company you are trying to create a project for does not exist"
                );
            }
            const [totalScaffholds, totalErected, totalDismantled, totalRedTag] =
                await Promise.all([
                    prisma.projectScaffholdRequest.count({
                        where: {
                            project: {
                                isDeleted: false,
                                createdById: companyId,
                            },
                        },
                    }),

                    prisma.projectScaffholdRequest.count({
                        where: {
                            status: "ERECTED", // or your "ERECTED" equivalent
                            project: {
                                isDeleted: false,
                                createdById: companyId,
                            },
                        },
                    }),

                    prisma.projectScaffholdRequest.count({
                        where: {
                            status: "DISMANTLED", // or map to DISMANTLED if you use that logic
                            project: {
                                isDeleted: false,
                                createdById: companyId,
                            },
                        },
                    }),

                    prisma.projectScaffholdRequest.count({
                        where: {
                            tag: "RED",
                            project: {
                                isDeleted: false,
                                createdById: companyId,
                            },
                        },
                    }),
                ]);


            return {
                totalScaffholds,
                totalErected,
                totalDismantled,
                totalRedTag,
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


    async searchTeamMember(data: SearchTeamMemberDTO) {
        try {
            const validTypes = ["PROJECT_MANAGER", "COMPETENT_PERSON"];
            const userType = data.user_type;

            if (!validTypes.includes(userType)) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.INVALID_TYPE,
                    400,
                    "Invalid user type. Allowed: PROJECT_MANAGER, COMPETENT_PERSON"
                );
            }

            const whereCondition: any = {
                user_type: userType,
                isDeleted: false,
                status: "ACTIVE",
                isVerified: true,
            };
            if (data.search) {
                const search = data.search.trim();

                if (!isNaN(Number(search))) {
                    whereCondition.id = Number(search);
                } else {
                    whereCondition.OR = [
                        { email: { contains: search, } },
                        { name: { contains: search, } },
                    ];
                }
            }

            let users: any[] = [];

            if (userType === "PROJECT_MANAGER") {
                const projectManagers = await prisma.user.findMany({
                    where: whereCondition,
                    include: {
                        projectManager: true,
                    },
                });

                users = projectManagers.map((u) => ({
                    userId: u.id,
                    uuid: u.uuid,
                    name: u.name,
                    email: u.email,
                    mobileNumber: u.mobileNumber,
                    countryCode: u.countryCode,
                    userType: u.user_type,
                    status: u.status,
                    address: u.projectManager?.address || null,
                    latitude: u.projectManager?.latitude || null,
                    longitude: u.projectManager?.longitude || null,
                }));
            }

            if (userType === "COMPETENT_PERSON") {
                const competentPersons = await prisma.user.findMany({
                    where: whereCondition,
                    include: {
                        competentPerson: true,
                    },
                });

                users = competentPersons.map((u) => ({
                    userId: u.id,
                    uuid: u.uuid,
                    name: u.name,
                    email: u.email,
                    mobileNumber: u.mobileNumber,
                    countryCode: u.countryCode,
                    userType: u.user_type,
                    status: u.status,
                    address: u.competentPerson?.address || null,
                    latitude: u.competentPerson?.latitude || null,
                    longitude: u.competentPerson?.longitude || null,
                }));
            }

            if (!users.length) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.NOT_FOUND,
                    404,
                    `No ${userType.toLowerCase().replace("_", " ")} found matching your search`
                );
            }

            return {
                message: RESPONSE_MESSAGES.USER.SEARCH_SUCCESS,
                data: users,
            };
        } catch (error: any) {
            console.error("❌ Search Team Member error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError(
                    RESPONSE_MESSAGES.USER.SEARCH_FAILED,
                    500,
                    error.message
                );
        }
    }


    async searchTeamMemberByScaffhold(data: TeamMemberDTO) {
        try {
            const validTypes = ["PROJECT_MANAGER", "COMPETENT_PERSON", "TRADESMAN"];
            const userType = data.user_type.toUpperCase();

            if (!validTypes.includes(userType)) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.INVALID_TYPE,
                    400,
                    "Invalid user type. Allowed: PROJECT_MANAGER, COMPETENT_PERSON, TRADESMAN"
                );
            }

            // ✅ FIX: correct model used
            const scaffhold = await prisma.projectScaffholdRequest.findUnique({
                where: { id: data.scaffHoldId },
                include: {
                    project: {
                        include: {
                            projectManagers: {
                                where: {
                                    isDeleted: false,
                                    isVerified: true,
                                    status: "ACTIVE",
                                },
                                include: {
                                    userMedias: {
                                        where: { mediaType: "PHOTO_IMAGE" },
                                        take: 1,
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

                            competentPersons: {
                                include: {
                                    competentPerson: {
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
                        },
                    },

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
            });

            if (!scaffhold) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.NOT_FOUND,
                    404,
                    "Scaffhold request not found"
                );
            }

            let users: any[] = [];

            // 👷 PROJECT MANAGER
            if (userType === "PROJECT_MANAGER") {
                users =
                    scaffhold.project?.projectManagers.map((pm: any) => ({
                        name: pm.name,
                        email: pm.email,
                        mobileNumber: pm.mobileNumber,
                        image: pm.userMedias?.[0]?.url || null,
                    })) || [];
            }

            // 🧑‍🔧 COMPETENT PERSON
            if (userType === "COMPETENT_PERSON") {
                users =
                    scaffhold.project?.competentPersons.map((cp: any) => ({
                        name: cp.competentPerson.user.name,
                        email: cp.competentPerson.user.email,
                        mobileNumber: cp.competentPerson.user.mobileNumber,
                        image: cp.competentPerson.user.userMedias?.[0]?.url || null,
                    })) || [];
            }

            // 🧱 TRADESMAN
            if (userType === "TRADESMAN") {
                users =
                    scaffhold.project?.tradesMen.map((tm: any) => ({
                        name: tm.tradesMan.user.name,
                        email: tm.tradesMan.user.email,
                        mobileNumber: tm.tradesMan.user.mobileNumber,
                        image: tm.tradesMan.user.userMedias?.[0]?.url || null,
                    })) || [];
            }

            if (!users.length) {
                throw new CustomError(
                    RESPONSE_MESSAGES.USER.NOT_FOUND,
                    404,
                    `No ${userType.toLowerCase().replace("_", " ")} found for this scaffhold`
                );
            }

            return {
                message: RESPONSE_MESSAGES.USER.SEARCH_SUCCESS,
                data: users,
            };
        } catch (error: any) {
            console.error("❌ Search Team Member error:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.USER.SEARCH_FAILED,
                500,
                error.message
            );
        }
    }


    async getRequestByScaffHoldId(
        data: ScaffHoldRequestDTO,
        page: number,
        limit: number
    ) {
        try {
            const skip = (page - 1) * limit;
            const searchTerm = data?.search?.trim() || "";

            const whereCondition: any = {
                projectId: data.scaffHoldId, // ✅ FIX: scaffholdId -> projectId
            };

            // 🔍 SEARCH FIX (correct relation path)
            if (searchTerm !== "") {
                whereCondition.createdBy = {
                    user: {
                        name: {
                            contains: searchTerm,
                        },
                    },
                };
            }

            // 📊 TOTAL COUNT
            const totalCount = await prisma.projectScaffholdRequest.count({
                where: whereCondition,
            });

            // 📦 DATA FETCH
            const requests = await prisma.projectScaffholdRequest.findMany({
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
                    message: RESPONSE_MESSAGES.REQUEST.NOT_FOUND,
                    data: [],
                    totalCount: 0,
                    totalPages: 0,
                    currentPage: page,
                };
            }

            const response = requests.map((r) => ({
                id: r.id,
                tradesmanName: r.createdBy?.user?.name || null,
                image: r.createdBy?.user?.userMedias?.[0]?.url || null,
                expectedEndDate: r.expectedEndDate,
                note: r.notes,
                craft: r.craft,
                scaffHoldId: r.projectId, // ✅ FIX
                createdAt: r.createdAt,
                length: r.length,
                width: r.width,
                height: r.height,
                createdById: r.createdById,
            }));

            return {
                message: RESPONSE_MESSAGES.REQUEST.FETCH_SUCCESS,
                data: response,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❌ getRequestByScaffHoldId error:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.REQUEST.FETCH_FAILED,
                500,
                error.message || "Failed to fetch requests"
            );
        }
    }

    async getTimelineImagesByStatus(
        data: TimelineImageFilterDTO,
        page: number,
        limit: number
    ) {
        try {

            const skip = (page - 1) * limit;

            // ✅ FIX: correct validation using scaffoldRequestId (NOT projectId)
            const timelineExists =
                await prisma.projectScaffholdTimeline.findFirst({
                    where: {
                        scaffoldRequestId: data.scaffHoldId,
                    },
                });

            if (!timelineExists) {
                throw new CustomError(
                    RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND,
                    404,
                    "Scaffhold timeline not found"
                );
            }

            // ✅ FIX: correct filtering path
            const whereCondition: any = {
                timeline: {
                    scaffoldRequestId: data.scaffHoldId,
                },
            };

            if (data.status) {
                whereCondition.status = data.status;
            }

            const [images, totalCount] = await Promise.all([
                prisma.timelineImage.findMany({
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

                prisma.timelineImage.count({
                    where: whereCondition,
                }),
            ]);

            const formattedImages = images.map((img) => ({
                status: img.status,
                createdBy: img.timeline.createdBy?.name || "Unknown",
                createdById: img.timeline.createdBy?.id || null,
                createdAt: img.timeline.createdAt,
                images: [
                    {
                        url: img.url,
                        id: img.id,
                    },
                ],
            }));

            return {
                message: `Timeline images fetched successfully${data.status ? ` with status: ${data.status}` : ""
                    }`,
                data: formattedImages,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };

        } catch (error: any) {

            console.error("❌ getTimelineImagesByStatus error:", error);

            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                RESPONSE_MESSAGES.TIMELINE.FAILED_FETCH_IMAGES,
                500,
                error.message || "Unexpected error"
            );
        }
    }
    async getProjectListServices(companyId: number, page: number = 1, limit: number = 10,search: string ,status?: string,) {
        try {
            const skip = (page - 1) * limit;
               const searchTerm = search?.trim() || "";

            const companyData = await prisma.company.findUnique({
                where: {
                    id: companyId,
                    isDeleted: false,
                    status: "ACTIVE",
                    isApproved: "APPROVED",
                },
            });

            if (!companyData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.COMPANY.NOT_FOUND,
                    404,
                    "Company not found"
                );
            }

          const whereCondition: any = {
            isDeleted: false,
            createdById: companyId,
        };

        if (status && status.trim() !== "") {
                whereCondition.status = status.trim().toUpperCase();
            }

        // ✅ SEARCH FILTER
       if (searchTerm) {
    whereCondition.OR = [
        {
            projectName: {
                contains: searchTerm,
            },
        },
        {
            PJT: {
                contains: searchTerm,
            },
        },
    ];
}

            const [projects, totalCount] = await Promise.all([
                prisma.project.findMany({
                    where: whereCondition,
                    select: {
                        id: true,
                        uuid: true,
                        projectName: true,
                        PJT: true,
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
                        status: true,
                        isDeleted: true,
                        createdAt: true,
                        updatedAt: true,

                        // ✅ FIX: proper relation select
                        projectManagers: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                mobileNumber: true,
                            },
                        },

                        _count: {
                            select: {
                                TradesManRequests: true,
                                tradesMen: true,
                                competentPersons: true,
                                jobCrafts: true,
                            },
                        },
                    },
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: "desc",
                    },
                }),

                prisma.project.count({
                    where: whereCondition,
                }),
            ]);

            const formattedProjects = projects.map((p) => ({
                id: p.id,
                uuid: p.uuid,
                projectName: p.projectName,
                PJT: p.PJT,
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
                projectManagers: p.projectManagers,
                status: p.status,
                isDeleted: p.isDeleted,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,

                totalTradesmanRequests: p._count.TradesManRequests,
                totalTradesmen: p._count.tradesMen,
                totalCompetentPersons: p._count.competentPersons,
                totalJobCrafts: p._count.jobCrafts,
            }));

            return {
                message: RESPONSE_MESSAGES.PROJECT.FETCH_ALL_SUCCESS,
                data: formattedProjects,
                pagination: {
                    total: totalCount,
                    page,
                    limit,
                    totalPages: Math.ceil(totalCount / limit),
                },
            };
        } catch (error: any) {
            console.error("❌ Get Project List error:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.PROJECT.FETCH_FAILED,
                500,
                error.message
            );
        }
    }


    async getAllScaffHolds(companyId: number, page: number, limit: number) {
        try {
            const companyData = await prisma.company.findFirst({
                where: {
                    id: companyId,
                    isDeleted: false,
                    status: "ACTIVE",
                },
            });

            if (!companyData) {
                throw new CustomError(
                    RESPONSE_MESSAGES.COMPANY.NOT_FOUND,
                    404,
                    "Company not found"
                );
            }

            const skip = (page - 1) * limit;

            const whereCondition = {
                project: {
                    createdById: companyId, // 👈 company filter via project
                },
            };

            const [scaffholds, totalCount] = await Promise.all([
                prisma.projectScaffholdRequest.findMany({
                    where: whereCondition,
                    skip,
                    take: limit,
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: {
                        project: {
                            select: {
                                id: true,
                                projectName: true,
                                PJT: true,
                            },
                        },
                        createdBy: {
                            select: {
                                id: true,
                                experience: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        mobileNumber: true,
                                    },
                                },
                            },
                        },
                    },
                }),

                prisma.projectScaffholdRequest.count({
                    where: whereCondition,
                }),
            ]);

            const formattedScaffholds = scaffholds.map((item) => ({
                id: item.id,
                uuid: item.uuid,
                projectId: item.projectId,

                // 🔧 Scaffold fields
                craft: item.craft,
                length: item.length,
                width: item.width,
                height: item.height,
                priority: item.priority,
                expectedEndDate: item.expectedEndDate,
                REQID: item.REQID,
                notes: item.notes,
                status: item.status,
                SCAFFID: item.SCAFFID,
                tag: item.tag,
                startDate: item.startDate,
                endDate: item.endDate,
                latitude: item.latitude,
                longitude: item.longitude,
                createdAt: item.createdAt,

                // 🔧 Flatten Project
                projectName: item.project?.projectName,
                PJT: item.project?.PJT,

                // 🔧 Flatten User (Tradesman)
                createdById: item.createdBy?.user?.id,
                name: item.createdBy?.user?.name,
                email: item.createdBy?.user?.email,
                mobileNumber: item.createdBy?.user?.mobileNumber,
                experience: item.createdBy?.experience,
            }));

            return {
                message: RESPONSE_MESSAGES.SCAFFHOLD.FETCH_ALL_SUCCESS,
                data: formattedScaffholds, // ✅ use formatted data
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
            };
        } catch (error: any) {
            console.error("❌ Get all scaffholds error:", error);

            if (error instanceof CustomError) throw error;

            throw new CustomError(
                RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED,
                500,
                error.message
            );
        }
    }


    async getUserDetails(id: number) {
        try {
            // ✅ Fetch user with relations
            const user = await prisma.company.findUnique({
                where: { id, isApproved: "APPROVED", status: "ACTIVE", isDeleted: false, isVerified: true },
                select: {
                    id: true,
                    uuid: true,
                    name: true,
                    email: true,
                    mobileNumber: true,
                    countryCode: true,
                    user_type: true,
                    status: true,
                    address: true,
                    createdAt: true,
                    lastLogin: true,
                    image: true,

                },
            });

            if (!user) {
                throw new CustomError("USER_NOT_FOUND", 404, "User not found");
            }

            const responseData = {
                id: user.id,
                name: user.name,
                email: user.email,
                countryCode: user.countryCode,
                mobileNumber: user.mobileNumber,
                user_type: user.user_type,
                status: user.status,
                address: user.address,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,

                image: user.image,

            }
            return {
                message: "User details fetched successfully",
                data: responseData,
            };
        } catch (error: any) {
            console.error("❌ Get user details error:", error);
            if (error instanceof CustomError) {
                throw error;
            }
            throw error instanceof CustomError
                ? error
                : new CustomError("FETCH_FAILED", 500, error.message);
        }
    }

    async deleteUserBySubAdminServices(subAdminId: number, userId: number) {
        try {
            // 1️⃣ Validate SubAdmin
            const subAdminUser = await prisma.company.findFirst({
                where: {
                    id: subAdminId,
                    isDeleted: false,
                    status: "ACTIVE",
                    user_type: "COMPANY",
                    isApproved: "APPROVED",
                    isVerified: true,
                }
            });

            if (!subAdminUser) {
                throw new CustomError("Unauthorized", 403);
            }

            // 2️⃣ Check user exists
            const user = await prisma.user.findFirst({
                where: {
                    id: userId,
                    isDeleted: false
                }
            });

            if (!user) {
                throw new CustomError("User not found", 404);
            }

            // 3️⃣ Prevent deleting ADMIN / SUB_ADMIN
            if (["ADMIN", "SUB_ADMIN"].includes(user.user_type)) {
                throw new CustomError("You cannot delete this user", 403);
            }

            // 4️⃣ Soft delete
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isDeleted: true,
                }
            });

            return {
                message: "User deleted successfully"
            };

        } catch (error: any) {
            if (error instanceof CustomError) throw error;

            throw new CustomError("Delete failed", 500, error.message);
        }
    }

    async logoutCompany(id: number, data: LogoutDTO) {
        try {
            const user = await prisma.company.findFirst({
                where: {
                    id: id,
                    status: "ACTIVE",
                    isDeleted: false,
                    isVerified: true,
                    isApproved: "APPROVED"

                },
            });

            if (!user) {
                throw new CustomError(RESPONSE_MESSAGES.USER.NOT_FOUND, 404);
            }

            // ✅ Delete ONLY current device
            await prisma.device.deleteMany({
                where: {
                    userId: user.id,
                    deviceToken: data.deviceToken,
                },
            });

            return {
                status: 200,
                message: RESPONSE_MESSAGES.AUTH.LOGOUT_SUCCESS,
            };

        } catch (error: any) {
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError(
                RESPONSE_MESSAGES.AUTH.LOGOUT_FAIL,
                500,
                error.message
            );
        }
    }

    async getProjectScaffHold(
        page: number,
        limit: number,
        projectId: number
    ) {
        try {

            const skip = (page - 1) * limit;

            console.log("projectId:", projectId);

            // ✅ 1. Get project (single source of truth)
            const project = await prisma.project.findUnique({
                where: { id: projectId },
                select: {
                    id: true,
                    uuid: true,
                    projectName: true,
                    PJT: true,
                    clientName: true,
                    clientEmail: true,
                    clientMobile: true,
                    clientCountryCode: true,
                    clientAddress: true,
                    startDate: true,
                    endDate: true,
                    latitude: true,
                    longitude: true,
                    status: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            if (!project) {
                throw new CustomError(
                    "Project not found",
                    404,
                    "PROJECT_NOT_FOUND"
                );
            }

            // ✅ 2. Get scaffhold count
            const totalCount =
                await prisma.projectScaffholdRequest.count({
                    where: { projectId },
                });

            const totalPages = Math.ceil(totalCount / limit);

            // ✅ 3. Get scaffhold list
            const scaffholdList =
                await prisma.projectScaffholdRequest.findMany({
                    where: { projectId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        uuid: true,
                        REQID: true,
                        SCAFFID: true,
                        projectId: true,
                        craft: true,
                        length: true,
                        width: true,
                        height: true,
                        priority: true,
                        status: true,
                        tag: true,
                        notes: true,
                        address: true,
                        latitude: true,
                        longitude: true,
                        createdAt: true,
                        updatedAt: true,
                        expectedEndDate: true,

                        createdBy: {
                            select: {
                                id: true,
                                craft: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                });

            // ✅ RESPONSE
            return {
                success: true,
                message: "Project scaffhold fetched successfully",

                data: {
                    ...project,

                    scaffholdList: scaffholdList.map((item) => ({ id: item.id.toString(), uuid: item.uuid, REQID: item.REQID, SCAFFID: item.SCAFFID, projectId: item.projectId.toString(), craft: item.craft, length: item.length, width: item.width, height: item.height, priority: item.priority, status: item.status, tag: item.tag, notes: item.notes, address: item.address, latitude: item.latitude, longitude: item.longitude, expectedEndDate: item.expectedEndDate, createdByCraft: item.createdBy?.craft, createdBy: item.createdBy?.user, createdAt: item.createdAt, updatedAt: item.updatedAt, })),
                },

                pagination: {
                    total: totalCount,
                    totalPages,
                    currentPage: page,
                    limit,
                },
            };

        } catch (error: any) {
            console.error("❌ Service error:", error);
            if (error instanceof CustomError) {
                throw error;
            }

            throw new CustomError(
                error.message || "Failed to fetch project scaffhold",
                error.statusCode || 500,
                error.details || "INTERNAL_ERROR"
            );
        }
    }


}



