"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFilter = exports.scaffHoldDetailsById = exports.getrequestSacffHold = exports.requestSacffHold = exports.searchScaffHold = exports.deleteRequest = exports.GetTradesManDetailsSchema = exports.jobApplicationSchema = exports.updateScaffOldSRequestchema = exports.requestScaffOldSchema = exports.seacrchJobSchema = exports.joinCraftTradesManSchema = exports.tradesManCraftSchema = exports.tradesManLoginSchema = exports.updateProfileSchema = exports.tradesManRegisterSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const emptyToUndefined = zod_1.default.string().transform((val) => (val.trim() === "" ? undefined : val));
exports.tradesManRegisterSchema = zod_1.default.object({
    name: zod_1.default.string().min(1, "Tradesman Name is required"),
    email: zod_1.default.string().email("Invalid email format").min(1, "Email is required"),
    mobileNumber: zod_1.default
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
    craft: zod_1.default.string().min(1, "Craft is required"),
    experience: zod_1.default.string().min(1, "Experience is required"),
    address: zod_1.default.string().min(1, "Address is required"),
    password: zod_1.default.string().min(8, "Password must be at least 8 characters long"),
    countryCode: zod_1.default.string().min(1, "Country code is required").optional(),
    idProofImage: zod_1.default.string().min(1, "ID Proof is required"),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.updateProfileSchema = zod_1.default.object({
    id: zod_1.default.number(),
    name: zod_1.default.string().min(1, "Tradesman Name is required").optional(),
    mobileNumber: zod_1.default
        .string()
        .min(10, "Phone number must be at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters").optional(),
    craft: zod_1.default.string().min(1, "Craft is required").optional(),
    experience: zod_1.default.string().min(1, "Experience is required").optional(),
    address: zod_1.default.string().min(1, "Address is required").optional(),
    password: zod_1.default.string().min(8, "Password must be at least 8 characters long").optional(),
    countryCode: zod_1.default.string().min(1, "Country code is required").optional(),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
    photoImage: zod_1.default.string().min(1, "ID Proof is required").optional(),
});
exports.tradesManLoginSchema = zod_1.default.object({
    user_type: zod_1.default.string(),
    email: zod_1.default.string().email("Invalid email format").min(1, "Email is required"),
    password: zod_1.default.string().min(8, "Password must be at least 8 characters long"),
});
exports.tradesManCraftSchema = zod_1.default.object({
    name: zod_1.default.coerce.string().min(1, "Craft Name is required"),
    search: zod_1.default.string().min(0).max(100).optional(),
    scaffHoldId: zod_1.default.coerce.number(),
});
exports.joinCraftTradesManSchema = zod_1.default.object({
    jobId: zod_1.default.number(),
    craftId: zod_1.default.number(),
    tradesManId: zod_1.default.number()
});
exports.seacrchJobSchema = zod_1.default.object({
    CMPID: zod_1.default.string(),
    SCAFFID: zod_1.default.string()
});
exports.requestScaffOldSchema = zod_1.default.object({
    scaffHoldId: zod_1.default.number(),
    length: zod_1.default.string().optional(),
    width: zod_1.default.string().optional(),
    height: zod_1.default.string().optional(),
    priority: zod_1.default.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    expectedEndDate: zod_1.default.string().optional(),
    notes: zod_1.default.string().optional()
});
exports.updateScaffOldSRequestchema = zod_1.default.object({
    requestId: zod_1.default.number(),
    length: zod_1.default.string().optional(),
    width: zod_1.default.string().optional(),
    height: zod_1.default.string().optional(),
    priority: zod_1.default.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    expectedEndDate: zod_1.default.string().optional(),
    notes: zod_1.default.string().optional()
});
exports.jobApplicationSchema = zod_1.default.object({
    scaffHoldId: zod_1.default.coerce.number(),
});
exports.GetTradesManDetailsSchema = zod_1.default.object({
    id: zod_1.default.number(),
});
exports.deleteRequest = zod_1.default.object({
    scaffHoldId: zod_1.default.number(),
});
exports.searchScaffHold = zod_1.default.object({
    search: zod_1.default.string().min(0).max(100).optional(),
});
exports.requestSacffHold = zod_1.default.object({
    scaffHoldId: zod_1.default.coerce.number(),
});
exports.getrequestSacffHold = zod_1.default.object({
    parentId: zod_1.default.coerce.number(),
});
exports.scaffHoldDetailsById = zod_1.default.object({
    id: zod_1.default.coerce.number()
});
exports.searchFilter = zod_1.default.object({
    search: zod_1.default.string().min(0).max(100).optional(),
    sort: zod_1.default.enum(["ASC", "DESC"]).optional().or(emptyToUndefined),
    status: zod_1.default
        .union([
        zod_1.default.enum(["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"]),
        zod_1.default.array(zod_1.default.enum(["PRE_ERECTED", "ERECTED", "DISMANTLED"]))
    ])
        .optional().or(zod_1.default.literal("")),
    tags: zod_1.default
        .union([
        zod_1.default.enum(["GREEN", "RED", "YELLOW"]),
        zod_1.default.array(zod_1.default.enum(["GREEN", "RED", "YELLOW"]))
    ])
        .optional().or(zod_1.default.literal("")),
    priority: zod_1.default
        .union([
        zod_1.default.enum(["LOW", "MEDIUM", "HIGH"]),
        zod_1.default.array(zod_1.default.enum(["LOW", "MEDIUM", "HIGH"]))
    ])
        .optional().or(zod_1.default.literal("")),
});
