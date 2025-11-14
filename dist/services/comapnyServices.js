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
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
class CompanyServices {
    registerCompany(data) {
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
                        isApproved: "PENDING",
                        latitude: data.latitude,
                        longitude: data.longitude,
                        CMPId: cmpId,
                        image: data.image
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
                            role: "SUPER_ADMIN", // Custom enum value from NotificationRole
                            companyId: newCompany.id,
                            isRead: false,
                            receiverId: Number(superAdmin.id),
                            senderId: newCompany.id.toString(),
                        },
                    });
                    if (superAdminDevice === null || superAdminDevice === void 0 ? void 0 : superAdminDevice.deviceToken) {
                        yield (0, utils_1.pushNotificationDelhi)(superAdminDevice.deviceToken, "New Company Registered", `${data.name} has registered and is awaiting approval.`);
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
                    },
                });
                if (!companyData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not found");
                }
                const emailExists = yield prismaClient_1.default.company.findUnique({
                    where: {
                        email: data.email,
                    },
                });
                if (emailExists) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.ALREADY_EXISTS, 500, "Conflict");
                }
                const updatedComapny = yield prismaClient_1.default.company.update({
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
                    prismaClient_1.default.company.count()
                ]);
                const companyWithProjectsCount = companyData.map((_a) => {
                    var { _count } = _a, company = __rest(_a, ["_count"]);
                    return (Object.assign(Object.assign({}, company), { totalProjects: _count.projects }));
                });
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
                const companySCaffholds = yield prismaClient_1.default.scaffhold.findMany({
                    where: {
                        companyId: data.id,
                        isDeleted: false,
                        status: "ACTIVE",
                    },
                });
                const companyProjects = yield prismaClient_1.default.project.findMany({
                    where: {
                        createdById: data.id,
                        isDeleted: false,
                        status: "ONGOING",
                    },
                });
                const companyData = yield prismaClient_1.default.company.findUnique({
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
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.NOT_FOUND, 500, "Not Found");
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.COMPANY.FETCH_BY_ID_SUCCESS,
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
            }
            catch (error) {
                console.error("getCompanyById error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.COMPANY.FETCH_FAILED, 500, error.message);
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
                let whereCondition = {};
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
                    whereCondition = {
                        OR: conditions,
                    };
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
}
exports.CompanyServices = CompanyServices;
