"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/roiRoutes.ts
const express_1 = require("express");
const roiController_1 = require("../controllers/roiController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const roiController = new roiController_1.RoiController();
/**
 * ─── PUBLIC ROUTES (Marketing Website & ROI Calculator) ─────────────────────
 */
/**
 * @route   POST /api/v1/roi/submit
 * @desc    Submit lead information to unlock results (Modal in Screenshot 2)
 * @access  Public
 */
router.post("/submit", roiController.submitLead.bind(roiController));
/**
 * ─── ADMIN ROUTES (Super Admin Dashboard) ───────────────────────────────────
 */
/**
 * @route   GET /api/v1/roi/analytics
 * @desc    Get aggregated ROI calculator analytics & metrics
 * @access  Private (Super Admin)
 */
router.get("/analytics", authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, roiController.getAnalytics.bind(roiController));
/**
 * @route   GET /api/v1/roi/leads
 * @desc    List all submitted ROI leads with pagination, search, and filters
 * @access  Private (Super Admin)
 */
router.get("/leads", authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, roiController.getLeads.bind(roiController));
/**
 * @route   GET /api/v1/roi/leads/:id
 * @desc    Get single ROI lead by ID or UUID with full breakdown & trajectory
 * @access  Private (Super Admin)
 */
router.get("/leads/:id", authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, roiController.getLeadById.bind(roiController));
/**
 * @route   PATCH /api/v1/roi/leads/:id/status
 * @desc    Update ROI lead status (NEW, CONTACTED, QUALIFIED, CONVERTED, CLOSED) & notes
 * @access  Private (Super Admin)
 */
router.patch("/leads/:id/status", authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, roiController.updateLeadStatus.bind(roiController));
/**
 * @route   DELETE /api/v1/roi/leads/:id
 * @desc    Delete an ROI lead record
 * @access  Private (Super Admin)
 */
router.delete("/leads/:id", authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, roiController.deleteLead.bind(roiController));
exports.default = router;
