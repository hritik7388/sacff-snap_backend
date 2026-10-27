// src/routes/roiRoutes.ts
import { Router } from "express";
import { RoiController } from "../controllers/roiController";
import { authMiddleware, isSUperAdmin } from "../middlewares/authMiddleware";

const router = Router();
const roiController = new RoiController();

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
router.get(
  "/analytics",
  authMiddleware,
  isSUperAdmin,
  roiController.getAnalytics.bind(roiController)
);

/**
 * @route   GET /api/v1/roi/leads
 * @desc    List all submitted ROI leads with pagination, search, and filters
 * @access  Private (Super Admin)
 */
router.get(
  "/leads",
  authMiddleware,
  isSUperAdmin,
  roiController.getLeads.bind(roiController)
);

/**
 * @route   GET /api/v1/roi/leads/:id
 * @desc    Get single ROI lead by ID or UUID with full breakdown & trajectory
 * @access  Private (Super Admin)
 */
router.get(
  "/leads/:id",
  authMiddleware,
  isSUperAdmin,
  roiController.getLeadById.bind(roiController)
);

/**
 * @route   PATCH /api/v1/roi/leads/:id/status
 * @desc    Update ROI lead status (NEW, CONTACTED, QUALIFIED, CONVERTED, CLOSED) & notes
 * @access  Private (Super Admin)
 */
router.patch(
  "/leads/:id/status",
  authMiddleware,
  isSUperAdmin,
  roiController.updateLeadStatus.bind(roiController)
);

/**
 * @route   DELETE /api/v1/roi/leads/:id
 * @desc    Delete an ROI lead record
 * @access  Private (Super Admin)
 */
router.delete(
  "/leads/:id",
  authMiddleware,
  isSUperAdmin,
  roiController.deleteLead.bind(roiController)
);

export default router;
