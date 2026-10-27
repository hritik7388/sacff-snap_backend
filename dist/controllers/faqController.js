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
const faqSchema_1 = require("../schemas/faqSchema");
const faqServices_1 = __importDefault(require("../services/faqServices"));
class FAQController {
    // Create FAQ
    createFAQ(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = faqSchema_1.createFAQSchema.parse(req.body);
                const result = yield faqServices_1.default.createFAQService(data);
                return res.status(201).json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    }
    // Get all FAQs for SuperAdmin
    getAllFAQs(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Math.max(1, Number(req.query.page) || 1);
                const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
                const result = yield faqServices_1.default.getAllFAQsService(page, limit);
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    }
    // Get FAQ by ID
    getFAQById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = Array.isArray(req.params.id)
                    ? req.params.id[0]
                    : req.params.id;
                const result = yield faqServices_1.default.getFAQByIdService(BigInt(id));
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    }
    // Update FAQ
    updateFAQ(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = Array.isArray(req.params.id)
                    ? req.params.id[0]
                    : req.params.id;
                const parsed = faqSchema_1.updateFAQSchema.safeParse(req.body);
                if (!parsed.success) {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid FAQ data",
                        errors: parsed.error.flatten(),
                    });
                }
                const result = yield faqServices_1.default.updateFAQService(BigInt(id), parsed.data);
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    }
    // Permanently delete FAQ
    deleteFAQ(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = Array.isArray(req.params.id)
                    ? req.params.id[0]
                    : req.params.id;
                const result = yield faqServices_1.default.deleteFAQService(BigInt(id));
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    }
    // Public landing page FAQs
    getActiveFAQs(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield faqServices_1.default.getActiveFAQsService();
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (error) {
                next(error);
            }
        });
    }
}
exports.default = new FAQController();
