"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.timeLineTag = exports.timeLine = exports.statusScahema = exports.GetInspectionsSchema = exports.InspectionSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.InspectionSchema = zod_1.default.object({
    scaffholdId: zod_1.default.number(),
    Date: zod_1.default.string(),
    shift: zod_1.default.string(),
    notes: zod_1.default.string().optional(),
});
exports.GetInspectionsSchema = zod_1.default.object({
    scaffholdId: zod_1.default.coerce.number()
});
exports.statusScahema = zod_1.default.object({
    scaffholdId: zod_1.default.coerce.number()
});
exports.timeLine = zod_1.default.object({
    scaffholdId: zod_1.default.number(),
    timeLineStatus: zod_1.default.enum(["PRE_ERECTED", "ERECTED", "DISMANTLED"]).optional(),
    notes: zod_1.default.string().optional(),
    images: zod_1.default.array(zod_1.default.string()).optional(),
    address: zod_1.default.string().optional(),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.timeLineTag = zod_1.default.object({
    scaffholdId: zod_1.default.number(),
    tag: zod_1.default.enum(["UNTAGED", "GREEN", "RED", "YELLOW"]).optional(),
    notes: zod_1.default.string().optional(),
});
