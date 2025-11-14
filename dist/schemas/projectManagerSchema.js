"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = exports.getScaffholdRequestsByCreator = exports.getJobCraftSchema = exports.searchScaffHold = exports.approveRejectRequestSchema = exports.requestedScaffolds = exports.GetUserDetailsSchema = exports.projectDetailById = exports.projectManagerLoginSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.projectManagerLoginSchema = zod_1.default.object({
    user_type: zod_1.default.string(),
    companyId: zod_1.default.string().optional(),
    email: zod_1.default.string().email(),
    password: zod_1.default.string(),
});
exports.projectDetailById = zod_1.default.object({
    id: zod_1.default.coerce.number()
});
exports.GetUserDetailsSchema = zod_1.default.object({
    userId: zod_1.default.coerce.number()
});
exports.requestedScaffolds = zod_1.default.object({
    scaffHoldId: zod_1.default.coerce.number()
});
exports.approveRejectRequestSchema = zod_1.default.object({
    scaffHoldId: zod_1.default.coerce.number(),
    requestId: zod_1.default.coerce.number(),
    status: zod_1.default.enum(["APPROVED", "REJECTED"]),
    reajectionReason: zod_1.default.string().optional()
});
exports.searchScaffHold = zod_1.default.object({
    search: zod_1.default.string().min(0).max(100).optional(),
});
exports.getJobCraftSchema = zod_1.default.object({
    scaffHoldId: zod_1.default.coerce.number(),
});
exports.getScaffholdRequestsByCreator = zod_1.default.object({
    requestId: zod_1.default.coerce.number(),
});
exports.uploadImage = zod_1.default.object({
    idProofImage: zod_1.default.string().min(1, "ID Proof is required"),
});
