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
exports.JobServices = void 0;
// src/services/jobServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const responseMessages_1 = require("../constants/responseMessages");
class JobServices {
    updateJobDescreption(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userData = yield prismaClient_1.default.user.findUnique({
                    where: {
                        id: userId,
                        status: "ACTIVE",
                        isDeleted: false,
                        isVerified: true,
                    }
                });
                if (!userData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.USER.NOT_FOUND, 404, "User not found or inactive");
                }
                const scaffData = yield prismaClient_1.default.scaffhold.findUnique({
                    where: {
                        id: data.scaffHoldId,
                        isDeleted: false,
                    },
                    include: {
                        project: true,
                        company: true,
                        jobCrafts: true,
                    },
                });
                if (!scaffData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found or inactive");
                }
                const isJobLinkCreated = !!(data.descreption &&
                    scaffData.jobCrafts.length > 0);
                const newJob = yield prismaClient_1.default.scaffhold.update({
                    where: { id: data.scaffHoldId },
                    data: {
                        descreption: data.descreption,
                        isJobLinkCreated,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.JOB.CREATE_JOB_DESCREPTION,
                };
            }
            catch (error) {
                console.error("❗ Error in createJobDescreption:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.FETCH_JOBS_FAILED, 500, error.message);
            }
        });
    }
    addAndUpdateJobCraft(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jobData = yield prismaClient_1.default.scaffhold.findUnique({
                    where: {
                        id: data.scaffId,
                        status: {
                            in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"]
                        },
                        isDeleted: false,
                    },
                    include: { jobCrafts: true },
                });
                if (!jobData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.JOB_NOT_FOUND, 404, "Job not found");
                }
                const craftData = yield prismaClient_1.default.craft.findUnique({
                    where: { id: data.craftId },
                });
                if (!craftData) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CRAFT.NOT_FOUND, 404, "Craft not found");
                }
                let jobCraft;
                const existingJobCraft = yield prismaClient_1.default.jobCraft.findFirst({
                    where: {
                        scaffholdId: data.scaffId,
                        craftId: data.craftId,
                    },
                });
                if (existingJobCraft) {
                    if (existingJobCraft.counts === data.counts) {
                        return {
                            message: responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.COUNT_ALREADY_EXISTS ||
                                "This count is already added, please change the count number",
                            data: existingJobCraft,
                        };
                    }
                    jobCraft = yield prismaClient_1.default.jobCraft.update({
                        where: { id: existingJobCraft.id },
                        data: { counts: data.counts },
                        include: { craft: true },
                    });
                }
                else {
                    jobCraft = yield prismaClient_1.default.jobCraft.create({
                        data: {
                            scaffholdId: data.scaffId,
                            craftId: data.craftId,
                            counts: data.counts,
                        },
                        include: { craft: true },
                    });
                }
                const totalJobCrafts = [...jobData.jobCrafts, jobCraft];
                const isJobLinkCreated = !!(jobData.descreption &&
                    totalJobCrafts.length > 0);
                yield prismaClient_1.default.scaffhold.update({
                    where: { id: data.scaffId },
                    data: { isJobLinkCreated },
                });
                return {
                    message: existingJobCraft
                        ? responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.COUNT_UPDATED_SUCCESS
                        : responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.ADD_SUCCESS,
                    data: jobCraft,
                };
            }
            catch (error) {
                console.error("Error in addJobCraft:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CRAFT.CREATE_FAILED, 500, error.message);
            }
        });
    }
    getJobAndCraftDetails(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffhold = yield prismaClient_1.default.scaffhold.findUnique({
                    where: { id: data.id, isDeleted: false },
                    include: {
                        jobCrafts: {
                            include: { craft: true },
                            orderBy: { id: 'desc' },
                        },
                        company: {
                            select: {
                                id: true,
                                name: true,
                                CMPId: true,
                            },
                        },
                        project: {
                            select: {
                                id: true,
                                clientName: true,
                                clientMobile: true,
                            },
                        },
                    },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Scaffhold not found");
                }
                const { jobCrafts, company, project } = scaffhold, rest = __rest(scaffhold, ["jobCrafts", "company", "project"]);
                const formattedJobCrafts = jobCrafts.map((jc) => {
                    var _a, _b, _c, _d;
                    return ({
                        id: jc.id,
                        craftId: jc.craftId,
                        counts: jc.counts,
                        joinedCount: jc.joinedCount,
                        name: ((_a = jc.craft) === null || _a === void 0 ? void 0 : _a.name) || null,
                        craftImage: ((_b = jc.craft) === null || _b === void 0 ? void 0 : _b.craftImage) || null,
                        createdAt: ((_c = jc.craft) === null || _c === void 0 ? void 0 : _c.createdAt) || jc.createdAt,
                        updatedAt: ((_d = jc.craft) === null || _d === void 0 ? void 0 : _d.updatedAt) || jc.updatedAt,
                    });
                });
                const totalCount = formattedJobCrafts.reduce((sum, jc) => sum + (jc.counts || 0), 0);
                const totalJoined = formattedJobCrafts.reduce((sum, jc) => sum + (jc.joinedCount || 0), 0);
                const vacancyClosed = totalCount === totalJoined;
                const responseData = Object.assign(Object.assign({}, rest), { CMPId: (company === null || company === void 0 ? void 0 : company.CMPId) || null, companyName: (company === null || company === void 0 ? void 0 : company.name) || null, clientName: (project === null || project === void 0 ? void 0 : project.clientName) || null, clientMobile: (project === null || project === void 0 ? void 0 : project.clientMobile) || null, totalCount,
                    totalJoined,
                    vacancyClosed, jobCrafts: formattedJobCrafts });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.FETCH_SUCCESS,
                    data: responseData,
                };
            }
            catch (error) {
                console.error("❗ Error in getJobAndCraftDetails:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getCraftandCountlist() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const jobCrafts = yield prismaClient_1.default.jobCraft.findMany({
                    include: {
                        craft: {
                            select: {
                                name: true,
                                craftImage: true,
                            },
                        },
                    },
                    orderBy: { id: "asc" },
                });
                const craftList = jobCrafts.map((jc) => ({
                    id: jc.id, // JobCraft ID
                    scaffholdId: jc.scaffholdId, // ✅ updated field name
                    craftName: jc.craft.name,
                    craftImage: jc.craft.craftImage,
                    counts: jc.counts,
                }));
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.CRAFT.LIST_FETCH_SUCCESS,
                    data: craftList,
                };
            }
            catch (error) {
                console.error("Error in getCraftandCountlist:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.CRAFT.LIST_FETCH_FAILED, 500, error.message);
            }
        });
    }
    deleteJobCrfats(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const job = yield prismaClient_1.default.scaffhold.findUnique({
                    where: {
                        id: data.scaffId,
                        status: "ACTIVE",
                        isDeleted: false,
                    },
                });
                if (!job) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB.JOB_NOT_FOUND, 404, "Job not found");
                }
                const jobCraft = yield prismaClient_1.default.jobCraft.findFirst({
                    where: {
                        scaffholdId: data.scaffId,
                        id: data.craftId,
                    },
                });
                if (!jobCraft) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.NOT_FOUND, 404, "Craft not found for this job");
                }
                yield prismaClient_1.default.jobCraft.delete({
                    where: {
                        id: jobCraft.id,
                    },
                });
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.JOB_CRAFT.DELETE_SUCCESS,
                };
            }
            catch (error) {
                console.error("Error in deleteJobCrfats:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error;
            }
        });
    }
}
exports.JobServices = JobServices;
