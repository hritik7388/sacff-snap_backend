"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifictaion = exports.addNewCompanySchema = exports.companyStatus = exports.rejectCompanyRequestSchema = exports.approveCompanyRequestSchema = exports.superAdminSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.superAdminSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string(),
});
exports.approveCompanyRequestSchema = zod_1.default.object({
    id: zod_1.default.number(),
});
exports.rejectCompanyRequestSchema = zod_1.default.object({
    id: zod_1.default.number(),
});
exports.companyStatus = zod_1.default.object({
    id: zod_1.default.number(),
});
exports.addNewCompanySchema = zod_1.default.object({
    name: zod_1.default.string().min(1, "Company Name is required"),
    email: zod_1.default.string().email("Invalid email format").min(1, "Email is required"),
    image: zod_1.default.string(),
    password: zod_1.default.string().min(8, "Password must be at least 8 characters long"),
    mobileNumber: zod_1.default
        .string()
        .min(10, "Phone number mustbe at least 10 characters long")
        .max(15, "Phone number cannot exceed 15 characters"),
    countryCode: zod_1.default.string().min(1, "Country code is required").optional(),
    address: zod_1.default.string().min(1, "Address is required"),
    latitude: zod_1.default.number().optional(),
    longitude: zod_1.default.number().optional(),
});
exports.notifictaion = zod_1.default.object({
    id: zod_1.default.number(),
});
