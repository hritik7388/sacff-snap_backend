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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/services/faqServices.ts
const uuid_1 = require("uuid");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
class FAQServices {
    // Create FAQ
    createFAQService(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const faq = yield prismaClient_1.default.fAQ.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        question: data.question,
                        answer: data.answer,
                        status: (_a = data.status) !== null && _a !== void 0 ? _a : "ACTIVE",
                        sortOrder: (_b = data.sortOrder) !== null && _b !== void 0 ? _b : 0,
                    },
                });
                return {
                    message: "FAQ created successfully",
                    data: Object.assign(Object.assign({}, faq), { id: faq.id.toString() }),
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to create FAQ", 500, error.message);
            }
        });
    }
    // Get all FAQs for SuperAdmin
    getAllFAQsService() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10) {
            try {
                const skip = (page - 1) * limit;
                const [faqs, total] = yield Promise.all([
                    prismaClient_1.default.fAQ.findMany({
                        skip,
                        take: limit,
                        orderBy: [
                            { sortOrder: "asc" },
                            { createdAt: "desc" },
                        ],
                    }),
                    prismaClient_1.default.fAQ.count(),
                ]);
                return {
                    message: "FAQs fetched successfully",
                    data: faqs.map((faq) => (Object.assign(Object.assign({}, faq), { id: faq.id.toString() }))),
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to fetch FAQs", 500, error.message);
            }
        });
    }
    // Get particular FAQ
    getFAQByIdService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const faq = yield prismaClient_1.default.fAQ.findUnique({
                    where: { id },
                });
                if (!faq) {
                    throw new customError_1.CustomError("FAQ not found", 404, "Invalid FAQ ID");
                }
                return {
                    message: "FAQ fetched successfully",
                    data: Object.assign(Object.assign({}, faq), { id: faq.id.toString() }),
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to fetch FAQ", 500, error.message);
            }
        });
    }
    // Update FAQ
    updateFAQService(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingFAQ = yield prismaClient_1.default.fAQ.findUnique({
                    where: { id },
                });
                if (!existingFAQ) {
                    throw new customError_1.CustomError("FAQ not found", 404, "Invalid FAQ ID");
                }
                const faq = yield prismaClient_1.default.fAQ.update({
                    where: { id },
                    data,
                });
                return {
                    message: "FAQ updated successfully",
                    data: Object.assign(Object.assign({}, faq), { id: faq.id.toString() }),
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to update FAQ", 500, error.message);
            }
        });
    }
    // Permanently delete FAQ
    deleteFAQService(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existingFAQ = yield prismaClient_1.default.fAQ.findUnique({
                    where: { id },
                });
                if (!existingFAQ) {
                    throw new customError_1.CustomError("FAQ not found", 404, "Invalid FAQ ID");
                }
                yield prismaClient_1.default.fAQ.delete({
                    where: { id },
                });
                return {
                    message: "FAQ deleted permanently",
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to delete FAQ", 500, error.message);
            }
        });
    }
    // Public landing page: active FAQs only
    getActiveFAQsService() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const faqs = yield prismaClient_1.default.fAQ.findMany({
                    where: {
                        status: "ACTIVE",
                    },
                    select: {
                        uuid: true,
                        question: true,
                        answer: true,
                        sortOrder: true,
                    },
                    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
                });
                return {
                    message: "FAQs fetched successfully",
                    data: faqs,
                };
            }
            catch (error) {
                throw new customError_1.CustomError("Failed to fetch landing page FAQs", 500, error.message);
            }
        });
    }
}
exports.default = new FAQServices();
