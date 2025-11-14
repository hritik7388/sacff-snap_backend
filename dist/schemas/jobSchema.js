"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteJobCraftSchema = exports.getJobCraftSchema = exports.updateJobCraftSchema = exports.jobCraftSchema = exports.jobSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.jobSchema = zod_1.default.object({
    scaffHoldId: zod_1.default.number(),
    descreption: zod_1.default.string()
});
exports.jobCraftSchema = zod_1.default.object({
    scaffId: zod_1.default.number(),
    craftId: zod_1.default.number(),
    counts: zod_1.default.number()
});
exports.updateJobCraftSchema = zod_1.default.object({
    id: zod_1.default.number(),
    craftId: zod_1.default.number(),
    counts: zod_1.default.number()
});
exports.getJobCraftSchema = zod_1.default.object({
    id: zod_1.default.coerce.number(),
});
exports.deleteJobCraftSchema = zod_1.default.object({
    scaffId: zod_1.default.number(),
    craftId: zod_1.default.number(),
});
