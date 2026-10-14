// src/services/superAdminServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import {
  companyStatusTemplate,
  companyAddTemplate,
} from "../helpers/templates";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import {
  extractS3Key,
  generateCompanyId,
  generateReadUrl,
  generateToken,
  pushNotificationDelhi,
  sendMail,
} from "../helpers/utils";
import dotenv from "dotenv";
import {
  AddNewCompanyDTO,
  ApproveCompanyRequestDTO,
  blogByIdDTO,
  blogDTO,
  CompanyStatusDTO,
  ContactinfochemaDTO,
  contactSchemaDTO,
  CreateQuestionnaireDTO,
  deleteblogSchemaDTO,
  deleteContactSchemaDTO,
  LogoutDTO,
  notifictaionDTO,
  publishblogSchemaDTO,
  RejectCompanyRequestDTO,
  SearchQuestionnaireDTO,
  SuperAdminDTO,
  UpdateProfileImageDTO,
  UpdateQuestionnaireDTO,
} from "../schemas/superAdminSchema";
import { now } from "moment";
import { NotificationRole, Prisma, QuestionnaireStatus } from "@prisma/client";

dotenv.config();

export class superAdminServices {
  async createQuestionnaireServices(
    data: CreateQuestionnaireDTO,
    superAdminId: bigint,
  ) {
    try {
      const superAdmin = await prisma.user.findFirst({
        where: {
          id: superAdminId,
          user_type: "SUPER_ADMIN",
          status: "ACTIVE",
          isDeleted: false,
          isVerified: true,
        },
        select: { id: true },
      });

      if (!superAdmin) {
        throw new CustomError(
          "Unauthorized SuperAdmin",
          403,
          "SuperAdmin access required",
        );
      }

      const questionnaire = await prisma.questionnaire.create({
        data: {
          uuid: uuidv4(),
          testName: data.testName,
          description: data.description,
          status: data.status as QuestionnaireStatus,
          videoUrl: data.videoUrl,
          certificateTemplateUrl: data.certificateTemplateUrl,
          createdById: superAdmin.id,

          questions: {
            create: data.questions.map((question, index) => ({
              questionText: question.questionText,
              sortOrder: index,
              timeLimitSeconds: 60,

              options: {
                create: question.options.map((option) => ({
                  optionText: option.optionText,
                  isCorrect: option.isCorrect,
                })),
              },
            })),
          },
        },
        include: {
          questions: {
            orderBy: { sortOrder: "asc" },
            include: {
              options: {
                select: {
                  id: true,
                  optionText: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      });

      return {
        status: 201,
        message: "Questionnaire created successfully",
        data: questionnaire,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Failed to create questionnaire",
        500,
        error.message,
      );
    }
  }

  async getQuestionnaireDashboardServices() {
    try {
      const [totalQuizzes, active, inactive, suspended] = await Promise.all([
        prisma.questionnaire.count(),
        prisma.questionnaire.count({
          where: { status: "ACTIVE" },
        }),
        prisma.questionnaire.count({
          where: { status: "INACTIVE" },
        }),
        prisma.questionnaire.count({
          where: { status: "SUSPENDED" },
        }),
      ]);

      return {
        status: 200,
        message: "Questionnaire dashboard fetched successfully",
        data: {
          totalQuizzes,
          active,
          inactive,
          suspended,
        },
      };
    } catch (error: any) {
      throw new CustomError(
        "Failed to fetch questionnaire dashboard",
        500,
        error.message,
      );
    }
  }

  async getAllQuestionnairesServices(
    data: SearchQuestionnaireDTO,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      // Pagination validation
      page = Number(page);
      limit = Number(limit);

      if (
        !Number.isInteger(page) ||
        !Number.isInteger(limit) ||
        page < 1 ||
        limit < 1 ||
        limit > 100
      ) {
        throw new CustomError(
          "Invalid pagination values",
          400,
          "Page must be >= 1 and limit must be between 1 and 100",
        );
      }

      const skip = (page - 1) * limit;

      const whereCondition: Prisma.QuestionnaireWhereInput = {};

      // Search by quiz title or description
      const searchTerm = data?.search?.trim();

      if (searchTerm) {
        whereCondition.OR = [
          {
            testName: {
              contains: searchTerm,
            },
          },
          {
            description: {
              contains: searchTerm,
            },
          },
        ];
      }

      // Optional status filter
      if (data?.status) {
        whereCondition.status = data.status;
      }

      // Optional date filter
      if (data?.startDate || data?.endDate) {
        const createdAt: Prisma.DateTimeFilter = {};

        if (data.startDate) {
          const startDate = new Date(data.startDate);

          if (Number.isNaN(startDate.getTime())) {
            throw new CustomError(
              "Invalid start date",
              400,
              "Please provide a valid startDate",
            );
          }

          createdAt.gte = startDate;
        }

        if (data.endDate) {
          const endDate = new Date(data.endDate);

          if (Number.isNaN(endDate.getTime())) {
            throw new CustomError(
              "Invalid end date",
              400,
              "Please provide a valid endDate",
            );
          }

          // Include the complete end date when YYYY-MM-DD is provided
          if (/^\d{4}-\d{2}-\d{2}$/.test(data.endDate)) {
            endDate.setDate(endDate.getDate() + 1);
            createdAt.lt = endDate;
          } else {
            createdAt.lte = endDate;
          }
        }

        if (createdAt.gte && createdAt.lt && createdAt.gte >= createdAt.lt) {
          throw new CustomError(
            "Invalid date range",
            400,
            "startDate must be before or equal to endDate",
          );
        }

        whereCondition.createdAt = createdAt;
      }

      const [questionnaires, totalCount] = await Promise.all([
        prisma.questionnaire.findMany({
          where: whereCondition,
          select: {
            id: true,
            uuid: true,
            testName: true,
            description: true,
            videoUrl: true,
            certificateTemplateUrl: true,
            status: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
        }),

        prisma.questionnaire.count({
          where: whereCondition,
        }),
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      const responseData = questionnaires.map((quiz) => ({
        id: quiz.id.toString(),
        uuid: quiz.uuid,
        testName: quiz.testName,
        description: quiz.description,
        videoUrl: quiz.videoUrl,
        certificateTemplateUrl: quiz.certificateTemplateUrl,
        status: quiz.status,
        createdById: quiz.createdById.toString(),
        totalQuestions: quiz._count.questions,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      }));

      return {
        message: "Questionnaires fetched successfully",
        data: responseData,
        totalCount,
        totalPages,
        currentPage: page,
        limit,
      };
    } catch (error: any) {
      console.error("Error fetching questionnaires:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        "Failed to fetch questionnaires",
        500,
        error.message,
      );
    }
  }

  async getQuestionnaireByIdServices(id: string) {
    try {
      if (!/^\d+$/.test(id) || BigInt(id) <= BigInt(0)) {
        throw new CustomError("Invalid questionnaire ID", 400, "Invalid ID");
      }

      const quiz = await prisma.questionnaire.findUnique({
        where: { id: BigInt(id) },
        include: {
          questions: {
            orderBy: { sortOrder: "asc" },
            include: {
              options: {
                select: {
                  id: true,
                  questionId: true,
                  optionText: true,
                  isCorrect: true,
                },
              },
            },
          },
        },
      });

      if (!quiz) {
        throw new CustomError("Questionnaire not found", 404, "Not found");
      }

      return {
        message: "Questionnaire fetched successfully",
        data: {
          ...quiz,
          id: quiz.id.toString(),
          createdById: quiz.createdById.toString(),
          questions: quiz.questions.map((question) => ({
            ...question,
            id: question.id.toString(),
            questionnaireId: question.questionnaireId.toString(),
            options: question.options.map((option) => ({
              ...option,
              id: option.id.toString(),
              questionId: option.questionId.toString(),
            })),
          })),
        },
      };
    } catch (error: any) {
      if (error instanceof CustomError) throw error;

      throw new CustomError(
        "Failed to fetch questionnaire",
        500,
        error.message,
      );
    }
  }
async updateQuestionnaireServices(
  id: string,
  data: UpdateQuestionnaireDTO,
) {
  try {
   

    const questionnaireId = BigInt(id);

    const existing = await prisma.questionnaire.findUnique({
      where: { id: questionnaireId },
      select: { id: true },
    });

    if (!existing) {
      throw new CustomError(
        "Questionnaire not found",
        404,
        "Not found",
      );
    }

    const updated = await prisma.$transaction(
      async (tx) => {
        // Update quiz details
        await tx.questionnaire.update({
          where: { id: questionnaireId },
          data: {
            ...(data.testName !== undefined && {
              testName: data.testName,
            }),
            ...(data.description !== undefined && {
              description: data.description,
            }),
            ...(data.videoUrl !== undefined && {
              videoUrl: data.videoUrl,
            }),
            ...(data.certificateTemplateUrl !== undefined && {
              certificateTemplateUrl:
                data.certificateTemplateUrl,
            }),
            ...(data.status !== undefined && {
              status: data.status,
            }),
          },
        });

        // Replace questions and options only when provided
        if (data.questions !== undefined) {
          await tx.question.deleteMany({
            where: { questionnaireId },
          });

          for (const [index, question] of data.questions.entries()) {
            await tx.question.create({
              data: {
                questionnaireId,
                questionText: question.questionText,
                sortOrder: index,
                timeLimitSeconds: 60,
                options: {
                  create: question.options.map((option) => ({
                    optionText: option.optionText,
                    isCorrect: option.isCorrect,
                  })),
                },
              },
            });
          }
        }

        return tx.questionnaire.findUniqueOrThrow({
          where: { id: questionnaireId },
          include: {
            questions: {
              orderBy: { sortOrder: "asc" },
              include: {
                options: true,
              },
            },
          },
        });
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );

    return {
      message: "Questionnaire updated successfully",
      data: {
        ...updated,
        id: updated.id.toString(),
        createdById: updated.createdById.toString(),
        questions: updated.questions.map((question) => ({
          ...question,
          id: question.id.toString(),
          questionnaireId: question.questionnaireId.toString(),
          options: question.options.map((option) => ({
            ...option,
            id: option.id.toString(),
            questionId: option.questionId.toString(),
          })),
        })),
      },
    };
  } catch (error: any) {
    if (error instanceof CustomError) {
      throw error;
    }

    if (error.code === "P2025") {
      throw new CustomError(
        "Questionnaire not found",
        404,
        "Not found",
      );
    }

    throw new CustomError(
      "Failed to update questionnaire",
      500,
      error.message,
    );
  }
}

  async changeQuestionnaireStatusServices(
  id: string,
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED",
) {
  try {
    

    const updated = await prisma.questionnaire.update({
      where: { id: BigInt(id) },
      data: { status },
      select: {
        id: true,
        uuid: true,
        testName: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      message: "Questionnaire status updated successfully",
      data: {
        ...updated,
        id: updated.id.toString(),
      },
    };
  } catch (error: any) {
    if (error instanceof CustomError) throw error;

    if (error.code === "P2025") {
      throw new CustomError(
        "Questionnaire not found",
        404,
        "Not found",
      );
    }

    throw new CustomError(
      "Failed to update questionnaire status",
      500,
      error.message,
    );
  }
}

  async loginSuperAdminServices(data: SuperAdminDTO) {
    try {
      const userData = await prisma.user.findUnique({
        where: {
          email: data.email,
          status: "ACTIVE",
          isDeleted: false,
          isVerified: true,
        },
      });

      if (!userData) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_FOUND,
          500,
          "User not found",
        );
      }

      const isPasswordValid = userData.password
        ? await bcrypt.compare(data.password, userData.password)
        : false;

      if (!isPasswordValid) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.PASSWORD_MISMATCH,
          500,
          "Invalid password",
        );
      }
      if (userData.user_type !== "SUPER_ADMIN") {
        throw new CustomError(
          RESPONSE_MESSAGES.AUTH.UNAUTHORIZED,
          500,
          "Unauthorized",
        );
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
        : new CustomError(
            RESPONSE_MESSAGES.USER.LOGIN_FAILED,
            500,
            error.message,
          );
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
        },
      });

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
        : new CustomError(
            RESPONSE_MESSAGES.USER.DASHBOARD_FETCH_FAILED,
            500,
            error.message,
          );
    }
  }

  async approveCompanyRequest(data: ApproveCompanyRequestDTO) {
    try {
      const companyData = await prisma.company.findUnique({
        where: { id: data.id, isDeleted: false, isApproved: "PENDING" },
      });
      if (!companyData) {
        throw new CustomError(
          RESPONSE_MESSAGES.COMPANY.NOT_FOUND,
          500,
          "Company Not found",
        );
      }

      const updatedCompany = await prisma.company.update({
        where: { id: data.id },
        data: {
          isApproved: "APPROVED",
          status: "ACTIVE",
        },
      });
      const html = companyStatusTemplate(
        updatedCompany.name,
        updatedCompany.CMPId || "",
        updatedCompany.isApproved as "APPROVED" | "REJECTED",
      );
      await sendMail(updatedCompany.email, "Company Approved Mail", html);
      return {
        message: RESPONSE_MESSAGES.COMPANY.APPROVE_SUCCESS,
        company: updatedCompany,
      };
    } catch (error: any) {
      console.log("error===================>>>", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError(
            RESPONSE_MESSAGES.COMPANY.APPROVE_FAILED,
            500,
            error.message,
          );
    }
  }

  async rejectCompanyRequest(data: RejectCompanyRequestDTO) {
    try {
      const companyData = await prisma.company.findUnique({
        where: {
          id: data.id,
          isDeleted: false,
          isApproved: "PENDING",
          isVerified: true,
        },
      });
      if (!companyData) {
        throw new CustomError(
          RESPONSE_MESSAGES.COMPANY.NOT_FOUND,
          500,
          "Company Not found",
        );
      }

      const updatedCompany = await prisma.company.delete({
        where: { id: companyData.id },
      });
      const html = companyStatusTemplate(
        updatedCompany.name,
        updatedCompany.CMPId || "",
        "REJECTED",
      );
      const mail = await sendMail(
        updatedCompany.email,
        "Company REJECTED Mail",
        html,
      );
      console.log("mail====================>>>>", mail);
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
        : new CustomError(
            RESPONSE_MESSAGES.COMPANY.REJECT_FAILED,
            500,
            error.message,
          );
    }
  }

  async addNewCompanyBySuperAdmin(data: AddNewCompanyDTO) {
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
          throw new CustomError(
            RESPONSE_MESSAGES.COMPANY.PENDING_APPROVAL,
            500,
            "Your company registration is still pending approval",
          );
        } else {
          throw new CustomError(
            RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS,
            500,
            "Company already exists",
          );
        }
      }

      const hasPassword = bcrypt.hashSync(data.password ?? "", 10);
      const cmpId = generateCompanyId();

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
          image: data.image,
        },
      });

      const html = companyAddTemplate(
        newCompany.name,
        newCompany.user_type,
        newCompany.email,
        data.password,
      );

      const mail = await sendMail(
        newCompany.email,
        "Welcome to ScaffSnapp Team!",
        html,
      );
      console.log("mail====================>>>", mail);

      const superAdmins = await prisma.user.findMany({
        where: { user_type: "SUPER_ADMIN" },
        select: { id: true },
      });
      console.log("superAdmin-==================>>>>>", superAdmins);
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
            notificationImage:
              "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/newCompreg.png",
          },
        });
      }

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
        CMPId: newCompany.CMPId,
      };

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
        : new CustomError(
            RESPONSE_MESSAGES.COMPANY.REGISTER_FAILED,
            500,
            error.message,
          );
    }
  }

  async blockCompany(data: CompanyStatusDTO) {
    try {
      const companyData = await prisma.company.findUnique({
        where: {
          id: data.id,
          isDeleted: false,
          status: "ACTIVE",
          isVerified: true,
        },
      });
      if (!companyData) {
        throw new CustomError(
          RESPONSE_MESSAGES.COMPANY.NOT_FOUND,
          500,
          "Company Not found",
        );
      }

      const updateCompany = await prisma.company.update({
        where: { id: companyData.id },
        data: {
          status: "SUSPENDED",
          isApproved: "REJECTED",
        },
      });

      return {
        message: RESPONSE_MESSAGES.COMPANY.BLOCK_SUCCESS,
        data: updateCompany,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError(
            RESPONSE_MESSAGES.COMPANY.BLOCK_FAILED,
            500,
            error.message,
          );
    }
  }

  async unblockCompany(data: CompanyStatusDTO) {
    try {
      const companyData = await prisma.company.findUnique({
        where: {
          id: data.id,
          isDeleted: false,
          status: "SUSPENDED",
          isVerified: true,
        },
      });
      if (!companyData) {
        throw new CustomError(
          RESPONSE_MESSAGES.COMPANY.NOT_FOUND,
          500,
          "Company Not found",
        );
      }

      const updateCompany = await prisma.company.update({
        where: { id: companyData.id },
        data: {
          status: "ACTIVE",
          isApproved: "APPROVED",
          isDeleted: false,
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
        : new CustomError(
            RESPONSE_MESSAGES.COMPANY.UNBLOCK_FAILED,
            500,
            error.message,
          );
    }
  }

  async getAllActiveCompanies(page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const [companies, totalCount] = await Promise.all([
        prisma.company.findMany({
          where: {
            isApproved: "APPROVED",
            status: "ACTIVE",
            isDeleted: false,
          },
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            projects: {
              include: {
                _count: {
                  select: {
                    TradesManRequests: {
                      where: {
                        status: {
                          notIn: ["PENDING", "SUSPENDED", "REJECTED"],
                        },
                      },
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                projects: true,
              },
            },
          },
        }),

        prisma.company.count({
          where: {
            status: "ACTIVE",
            isDeleted: false,
            isApproved: "APPROVED",
          },
        }),
      ]);

      const formattedCompanies = companies.map(
        ({ projects, _count, ...company }) => {
          const totalScaffoldRequests = projects.reduce(
            (sum, project) => sum + (project._count?.TradesManRequests || 0),
            0,
          );

          return {
            ...company,
            totalProjects: _count.projects,
            totalScaffoldRequests,
            image: company.image,
          };
        },
      );

      return {
        message: RESPONSE_MESSAGES.COMPANY.ACTIVE_COMPANIES,
        data: formattedCompanies,
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

      throw new CustomError(
        RESPONSE_MESSAGES.COMPANY.FETCH_FAILED,
        500,
        error.message,
      );
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
      throw new CustomError(
        RESPONSE_MESSAGES.COMPANY.FETCH_FAILED,
        500,
        error.message,
      );
    }
  }

  async deleteCompany(data: CompanyStatusDTO) {
    try {
      const companyData = await prisma.company.findUnique({
        where: {
          id: data.id,
          isDeleted: false,
        },
      });
      if (!companyData) {
        throw new CustomError(
          RESPONSE_MESSAGES.COMPANY.NOT_FOUND,
          500,
          "Company Not found",
        );
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
        : new CustomError(
            RESPONSE_MESSAGES.COMPANY.DELETE_FAILED,
            500,
            error.message,
          );
    }
  }

  async getSuperAdminNotifications(userId: number, page = 1, limit = 10) {
    try {
      let role: NotificationRole;

      // 1️⃣ check user table
      const user = await prisma.user.findUnique({
        where: { id: BigInt(userId) },
        select: { user_type: true },
      });

      if (user) {
        role = user.user_type as NotificationRole;
      } else {
        // 2️⃣ check company table
        const company = await prisma.company.findUnique({
          where: { id: BigInt(userId) },
          select: { user_type: true },
        });

        if (!company) {
          throw new CustomError("User or Company not found", 404);
        }

        role = company.user_type as NotificationRole;
      }
      const skip = (page - 1) * limit;
      const notifications = await prisma.notification.findMany({
        where: {
          receiverId: userId,
          role: role,
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });

      const mappedNotifications = notifications.map((n) => ({
        id: n.id.toString(),
        uuid: n.uuid,
        title: n.title,
        message: n.message,
        type: n.type,
        role: n.role,
        companyId: n.companyId?.toString() || "", // null -> ""
        projectId: n.projectId?.toString() || "", // null -> ""

        scaffoldRequestId: n.scaffoldRequestId || "", // null -> ""
        receiverId: n.receiverId?.toString() || "", // BigInt -> string
        senderId: n.senderId || "", // string or "" if null
        isRead: n.isRead,
        notificationImage: n.notificationImage || "",
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        tradesmanCraft: n.tradesmanCraft || "",
      }));
      const unreadCount = await prisma.notification.count({
        where: { receiverId: userId, isRead: false },
      });
      const totalCount = await prisma.notification.count({
        where: { receiverId: userId },
      });
      return {
        message: RESPONSE_MESSAGES.NOTIFICATION.SUCCESS_GET,
        data: {
          unreadCount: unreadCount,
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
          notifications: mappedNotifications,
        },
      };
    } catch (error: any) {
      console.error("❌ Error in getSuperAdminNotifications:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(
        "Failed to fetch notifications",
        500,
        error.message,
      );
    }
  }

  async markNotificationAsRead(data: notifictaionDTO) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: data.id },
      });

      if (!notification) {
        throw new CustomError(
          RESPONSE_MESSAGES.NOTIFICATION.NOT_FOUND,
          404,
          "Notification not found",
        );
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
        error.message,
      );
    }
  }

  async getUserDetails(id: number) {
    try {
      const user = await prisma.user.findUnique({
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
        throw new CustomError("USER_NOT_FOUND", 404, "User not found");
      }

      const profileImage = user.userMedias[0] ?? null;

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
    } catch (error: any) {
      console.error("❌ Get user details error:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError("FETCH_FAILED", 500, error.message);
    }
  }
  async blogCreationBySuperAdmin(userId: number, data: blogDTO) {
    try {
      const userData = await prisma.user.findUnique({
        where: {
          id: userId,
          status: "ACTIVE",
          isDeleted: false,
          isVerified: true,
        },
      });
      if (!userData) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_SUPER_ADMIN,
          404,
          "User not found",
        );
      }
      const newBlog = await prisma.blog.create({
        data: {
          uuid: uuidv4(),
          blogTitle: data.blogTitle,
          category: data.category,
          publishDate: data.publishDate,
          image: data.image,
          blogBody: data.blogBody,
          createdById: userData.id,
          status: data.status,
        },
      });

      return {
        message: RESPONSE_MESSAGES.BLOG.BLOG_CREATION_SUCCESS,
        data: newBlog,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError("BLOG_CREATION_FAILED", 500, error.message);
    }
  }

  async publishBlog(userId: number, data: publishblogSchemaDTO) {
    try {
      const userData = await prisma.user.findUnique({
        where: {
          id: userId,
          status: "ACTIVE",
          isDeleted: false,
          isVerified: true,
        },
      });
      if (!userData) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_SUPER_ADMIN,
          404,
          "User not found",
        );
      }
      const blogData = await prisma.blog.findUnique({
        where: {
          id: data.id,
        },
      });
      if (!blogData) {
        throw new CustomError(
          RESPONSE_MESSAGES.BLOG.BLOG_NOT_FOUND,
          404,
          "Provided blog id not in the databse",
        );
      }
      const imageKey = data.image ? extractS3Key(data.image) : blogData.image;
      const newBlog = await prisma.blog.update({
        where: {
          id: data.id,
        },
        data: {
          uuid: blogData.uuid,
          blogTitle: data.blogTitle,
          category: data.category,
          publishDate: data.publishDate,
          status: data.status,
          image: imageKey,
          blogBody: data.blogBody,
          createdById: userData.id,
        },
      });
      return {
        message: RESPONSE_MESSAGES.BLOG.BLOG_PUBLISH_SUCCESS,
        data: newBlog,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError("BLOG_CREATION_FAILED", 500, error.message);
    }
  }

  async delteBlog(userId: number, data: deleteblogSchemaDTO) {
    try {
      const userData = await prisma.user.findUnique({
        where: {
          id: userId,
          status: "ACTIVE",
          isDeleted: false,
          isVerified: true,
        },
      });
      if (!userData) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_SUPER_ADMIN,
          404,
          "User not found",
        );
      }
      const blogData = await prisma.blog.findUnique({
        where: {
          id: data.id,
        },
      });
      if (!blogData) {
        throw new CustomError(
          RESPONSE_MESSAGES.BLOG.BLOG_NOT_FOUND,
          404,
          "Provided blog id not in the databse",
        );
      }
      if (blogData.status === "DELETED") {
        throw new CustomError(
          RESPONSE_MESSAGES.BLOG.ALREADY_DELETED,
          400,
          "This blog has already been deleted",
        );
      }
      const newBlog = await prisma.blog.update({
        where: {
          id: data.id,
        },
        data: {
          status: "DELETED",
        },
      });
      return {
        message: RESPONSE_MESSAGES.BLOG.BLOG_DELETE_SUCCESS,
        data: newBlog,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError(
            RESPONSE_MESSAGES.BLOG.BLOG_DELETE_FAILED,
            500,
            error.message,
          );
    }
  }

  async getpublishBlogs(
    status?: string,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const whereClause: any = {
        status: { not: "DELETED" },
        ...(status && { status }),

        ...(search && {
          OR: [
            { blogTitle: { contains: search } },
            { blogBody: { contains: search } },
            { category: { contains: search } },
          ],
        }),
      };

      const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
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
          orderBy: { publishDate: "desc" },
        }),
        prisma.blog.count({ where: whereClause }),
      ]);
      const formattedBlogs = await Promise.all(
        blogs.map(async (blog) => ({
          id: blog.id,
          blogTitle: blog.blogTitle,
          category: blog.category,
          publishDate: blog.publishDate,
          image: blog.image ? await generateReadUrl(blog.image) : null,
          blogBody: blog.blogBody,
          status: blog.status,
          createdById: blog.createdById,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        })),
      );

      return {
        message: RESPONSE_MESSAGES.BLOG.BLOG_FETCH_SUCCESS,
        data: formattedBlogs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching blogs:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw error;
    }
  }

  async getpublishBlog(
    status?: string,
    search?: string,
    page: number = 1,
    limit: number = 10,
  ) {
    try {
      const skip = (page - 1) * limit;
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const whereClause: any = {
        status: { not: "DELETED" },
        ...(status && { status }),
        publishDate: {
          lte: endOfToday,
        },

        ...(search && {
          OR: [
            { blogTitle: { contains: search } },
            { blogBody: { contains: search } },
            { category: { contains: search } },
          ],
        }),
      };

      const [blogs, total] = await Promise.all([
        prisma.blog.findMany({
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
          orderBy: { publishDate: "desc" },
        }),
        prisma.blog.count({ where: whereClause }),
      ]);
      const formattedBlogs = await Promise.all(
        blogs.map(async (blog) => ({
          id: blog.id,
          blogTitle: blog.blogTitle,
          category: blog.category,
          publishDate: blog.publishDate,
          image: blog.image ? await generateReadUrl(blog.image) : null,
          blogBody: blog.blogBody,
          status: blog.status,
          createdById: blog.createdById,
          createdAt: blog.createdAt,
          updatedAt: blog.updatedAt,
        })),
      );

      return {
        message: RESPONSE_MESSAGES.BLOG.BLOG_FETCH_SUCCESS,
        data: formattedBlogs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("Error fetching blogs:", error);
      if (error instanceof CustomError) {
        throw error;
      }
      throw error;
    }
  }

  async contactInfo(data: contactSchemaDTO) {
    try {
      const submission = await prisma.contactSubmission.create({
        data: {
          uuid: uuidv4(),
          name: data.name,
          email: data.email,
          mobileNumber: data.mobileNumber,
          countryCode: data.countryCode,
          message: data.message,
          submittedAt: data.submittedAt,
        },
      });

      return {
        message: RESPONSE_MESSAGES.CONTACT.SUBMIT_SUCCESS, // ✅ Using RESPONSE_MESSAGES
        data: submission,
      };
    } catch (error: any) {
      console.error("Error creating contact submission:", error);

      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        RESPONSE_MESSAGES.CONTACT.SUBMIT_FAILED,
        500,
        error.message,
      );
    }
  }

  async getContactInfo(search?: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      const whereClause = {
        ...(search && {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { mobileNumber: { contains: search } },
            { message: { contains: search } },
          ],
        }),
      };

      const [contacts, total] = await Promise.all([
        prisma.contactSubmission.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.contactSubmission.count({ where: whereClause }),
      ]);

      return {
        message: RESPONSE_MESSAGES.CONTACT.GET_SUCCESS,
        data: contacts,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      console.error("Error fetching contact submissions:", error);
      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        RESPONSE_MESSAGES.CONTACT.GET_FAIL,
        500,
        error.message,
      );
    }
  }

  async delteContact(userId: number, data: deleteContactSchemaDTO) {
    try {
      const userData = await prisma.user.findUnique({
        where: {
          id: userId,
          status: "ACTIVE",
          isDeleted: false,
          isVerified: true,
        },
      });
      if (!userData) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_SUPER_ADMIN,
          404,
          "User not found",
        );
      }
      const blogData = await prisma.contactSubmission.findUnique({
        where: {
          id: data.id,
        },
      });
      if (!blogData) {
        throw new CustomError(
          RESPONSE_MESSAGES.CONTACT.NOT_FOUND,
          404,
          "Provided contact id not in the databse",
        );
      }

      const newBlog = await prisma.contactSubmission.delete({
        where: {
          id: data.id,
        },
      });
      return {
        message: RESPONSE_MESSAGES.CONTACT.CONTACT_DELETE_SUCCESS,
        data: newBlog,
      };
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw error instanceof CustomError
        ? error
        : new CustomError(
            RESPONSE_MESSAGES.CONTACT.CONTACT_DELETE_FAILED,
            500,
            error.message,
          );
    }
  }

  async getContactById(data: ContactinfochemaDTO) {
    try {
      const contact = await prisma.contactSubmission.findUnique({
        where: {
          id: data.id,
        },
      });

      if (!contact) {
        throw new CustomError(
          RESPONSE_MESSAGES.CONTACT.NOT_FOUND,
          404,
          "Contact submission not found",
        );
      }

      return {
        message: RESPONSE_MESSAGES.CONTACT.GET_SUCCESS,
        data: contact,
      };
    } catch (error: any) {
      console.error("Error fetching contact by ID:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        RESPONSE_MESSAGES.CONTACT.GET_FAIL,
        500,
        error.message,
      );
    }
  }
  async getBlogbyId(data: blogByIdDTO) {
    try {
      const blog = await prisma.blog.findUnique({
        where: { id: data.id },
      });

      if (!blog) {
        throw new CustomError(
          RESPONSE_MESSAGES.BLOG.BLOG_NOT_FOUND,
          404,
          "Blog not found",
        );
      }

      const formattedBlog = {
        id: blog.id,
        blogTitle: blog.blogTitle,
        category: blog.category,
        publishDate: blog.publishDate,
        image: blog.image ? await generateReadUrl(blog.image) : null,
        blogBody: blog.blogBody,
        status: blog.status,
        createdById: blog.createdById,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      };

      return {
        message: RESPONSE_MESSAGES.BLOG.BLOG_FETCH_SUCCESS,
        data: formattedBlog,
      };
    } catch (error: any) {
      console.error("Error fetching blog by ID:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        RESPONSE_MESSAGES.BLOG.BLOG_FETCH_FAILED,
        500,
        error.message,
      );
    }
  }

  async updateUserProfileImage(userId: number, data: UpdateProfileImageDTO) {
    try {
      const userExists = await prisma.user.findFirst({
        where: {
          id: userId,
          user_type: "SUPER_ADMIN",
          isDeleted: false,
          isVerified: true,
          status: "ACTIVE",
        },
      });

      if (!userExists) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_FOUND,
          404,
          "User NOT FOUND",
        );
      }

      // Check if media already exists
      const existingMedia = await prisma.userMedia.findFirst({
        where: {
          userId: BigInt(userId),
          mediaType: "PHOTO_IMAGE",
        },
      });

      let updatedImage;

      if (existingMedia) {
        // Update existing profile image
        updatedImage = await prisma.userMedia.update({
          where: { id: existingMedia.id },
          data: {
            url: data.profileImage,
          },
          select: {
            url: true,
            mediaType: true,
          },
        });
      } else {
        // Create new profile image if not exists
        updatedImage = await prisma.userMedia.create({
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
        message: RESPONSE_MESSAGES.IMAGE.UPADTE_IMAGE,
        data: updatedImage,
      };
    } catch (error: any) {
      console.error("Error updating image:", error);

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(
        RESPONSE_MESSAGES.IMAGE.FAIL_UPADTE_IMAGE,
        500,
        error.message,
      );
    }
  }

  async logoutUser(id: number, data: LogoutDTO) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          id: id,
          status: "ACTIVE",
          isDeleted: false,
        },
      });

      if (!user) {
        throw new CustomError(
          RESPONSE_MESSAGES.USER.NOT_FOUND,
          404,
          "User not found",
        );
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
        error.message,
      );
    }
  }
}

(async () => {
  const superadminEmail = "Scaffsnapp@gmail.com";
  const superadminPassword = "scaffsnap@1";

  try {
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { user_type: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      console.log("✅ Default superadmin already created.");
    } else {
      const hashedPassword = await bcrypt.hash(superadminPassword, 10);

      await prisma.user.create({
        data: {
          uuid: uuidv4(),
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
  } catch (error) {
    console.error("❌ Error while checking or creating superadmin:", error);
  }
})();
