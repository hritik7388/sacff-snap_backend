"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/faqRoutes.ts
const express_1 = require("express");
const faqController_1 = __importDefault(require("../controllers/faqController"));
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
// Public landing page API
router.get("/getActiveFAQs", authMiddleware_1.clientAuthMiddleware, faqController_1.default.getActiveFAQs.bind(faqController_1.default));
// SuperAdmin CRUD APIs
router.post("/", authMiddleware_1.clientAuthMiddleware, faqController_1.default.createFAQ.bind(faqController_1.default));
router.get("/:id", authMiddleware_1.clientAuthMiddleware, faqController_1.default.getFAQById.bind(faqController_1.default));
router.patch("/:id", authMiddleware_1.clientAuthMiddleware, faqController_1.default.updateFAQ.bind(faqController_1.default));
router.delete("/:id", authMiddleware_1.clientAuthMiddleware, faqController_1.default.deleteFAQ.bind(faqController_1.default));
exports.default = router;
