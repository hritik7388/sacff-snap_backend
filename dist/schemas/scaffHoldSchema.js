"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePriorityAndTagsSchema = exports.removeScaffCompetentPerson = exports.ScaffCompetentPerson = exports.projectScaffhold = exports.scaffCompetentPerson = exports.scaffHoldDetailsById = exports.scaffHoldSchema = void 0;
const client_1 = require("@prisma/client");
const zod_1 = __importDefault(require("zod"));
exports.scaffHoldSchema = zod_1.default.object({
    startDate: zod_1.default.string(), // ✅ required and valid date
    endDate: zod_1.default.string(),
    address: zod_1.default.string().optional(),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
    priority: zod_1.default.enum([client_1.Priority.HIGH, client_1.Priority.MEDIUM, client_1.Priority.LOW]).optional(),
    projectId: zod_1.default.number().optional(),
    competentPersonIds: zod_1.default.array(zod_1.default.number()).min(2, "At least 2 competent persons are required"),
    descreption: zod_1.default.string().optional(),
});
exports.scaffHoldDetailsById = zod_1.default.object({
    id: zod_1.default.coerce.number(),
});
exports.scaffCompetentPerson = zod_1.default.object({
    id: zod_1.default.coerce.number(),
    search: zod_1.default.string().min(0).max(100).optional(),
});
exports.projectScaffhold = zod_1.default.object({
    id: zod_1.default.coerce.number()
});
exports.ScaffCompetentPerson = zod_1.default.object({
    scaffHoldId: zod_1.default.number(),
    competentPersonIds: zod_1.default.array(zod_1.default.number()).min(1, "At least 1 competent persons are required"),
});
exports.removeScaffCompetentPerson = zod_1.default.object({
    scaffHoldId: zod_1.default.coerce.number(),
    competentPersonIds: zod_1.default.coerce.number(),
});
exports.changePriorityAndTagsSchema = zod_1.default.object({
    scaffholdId: zod_1.default.number(),
    priority: zod_1.default.enum(["LOW", "MEDIUM", "HIGH"]).optional(), // match Prisma enum
    tag: zod_1.default.enum(["UNTAGED", "GREEN", "RED", "YELLOW"]).optional(), // match Prisma enum
});
