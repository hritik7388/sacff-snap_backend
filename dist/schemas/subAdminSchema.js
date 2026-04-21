"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimelineImageFilter = exports.scaffHoldRequest = exports.TeamMemberSchema = exports.searchTeamMemberSchema = exports.updateProjectSchema = exports.addNewProjectSchema = exports.updateTeamMemberSchema = exports.addTeamMemberSchema = exports.subAdminLoginSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.subAdminLoginSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string(),
});
exports.addTeamMemberSchema = zod_1.default.object({
    name: zod_1.default.string().min(2).max(100),
    user_type: zod_1.default.enum(["PROJECT_MANAGER", "COMPETENT_PERSON"]),
    email: zod_1.default.string().email(),
    mobileNumber: zod_1.default.string().min(6).max(15),
    countryCode: zod_1.default.string().min(1).max(5).optional(),
    address: zod_1.default.string().min(5).max(200).optional(),
    password: zod_1.default.string().min(6).max(100),
    idProofImage: zod_1.default.string().min(1).max(500).optional(),
    photoImage: zod_1.default.string().min(1).max(500).optional(),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.updateTeamMemberSchema = zod_1.default.object({
    id: zod_1.default.number(),
    name: zod_1.default.string().min(2).max(100),
    user_type: zod_1.default.enum(["PROJECT_MANAGER", "COMPETENT_PERSON"]),
    email: zod_1.default.string().email(),
    mobileNumber: zod_1.default.string().min(6).max(15).optional(),
    countryCode: zod_1.default.string().min(1).max(5).optional(),
    address: zod_1.default.string().min(5).max(200).optional(),
    idProofImage: zod_1.default.string().min(1).max(500).optional(),
    photoImage: zod_1.default.string().min(1).max(500).optional(),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.addNewProjectSchema = zod_1.default.object({
    projectName: zod_1.default.string().min(2).max(100),
    clientName: zod_1.default.string().min(2).max(100),
    clientEmail: zod_1.default.string().email(),
    clientMobile: zod_1.default.string().min(6).max(15),
    clientCountryCode: zod_1.default.string().min(1).max(5).optional(),
    clientAddress: zod_1.default.string().min(5).max(200).optional(),
    startDate: zod_1.default.string(), // ✅ required and valid date
    endDate: zod_1.default.string(),
    projectManagerId: zod_1.default.array(zod_1.default.number()).min(1, "At least 1 projectManger persons are required"),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.updateProjectSchema = zod_1.default.object({
    id: zod_1.default.number(),
    projectName: zod_1.default.string().min(2).max(100).optional(),
    clientName: zod_1.default.string().min(2).max(100).optional(),
    clientEmail: zod_1.default.string().email().optional(),
    clientMobile: zod_1.default.string().min(6).max(15).optional(),
    clientCountryCode: zod_1.default.string().min(1).max(5).optional(),
    clientAddress: zod_1.default.string().min(5).max(200).optional(),
    startDate: zod_1.default.string().optional(), // ✅ required and valid date
    endDate: zod_1.default.string().optional(),
    projectManagerId: zod_1.default.array(zod_1.default.number()).min(1, "At least 1 projectManger persons are required"),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.searchTeamMemberSchema = zod_1.default.object({
    user_type: zod_1.default.enum(["PROJECT_MANAGER", "COMPETENT_PERSON"]),
    search: zod_1.default.string().min(1).max(100).optional(),
});
exports.TeamMemberSchema = zod_1.default.object({
    user_type: zod_1.default.enum(["PROJECT_MANAGER", "COMPETENT_PERSON", "TRADESMAN"]),
    scaffHoldId: zod_1.default.coerce.number(),
});
exports.scaffHoldRequest = zod_1.default.object({
    scaffHoldId: zod_1.default.coerce.number(),
    search: zod_1.default.string().min(0).max(100).optional(),
});
exports.TimelineImageFilter = zod_1.default.object({
    scaffHoldId: zod_1.default.coerce.number().optional(),
    status: zod_1.default.string().optional(),
});
