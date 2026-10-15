"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/subscriptionRoutes.ts
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const subscriptionController_1 = require("../controllers/subscriptionController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const subscriptionController = new subscriptionController_1.SubscriptionController();
/**
 * ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────
 */
/**
 * @route   GET /api/v1/subscription/plans
 * @desc    List all available pricing plans (pricing page – no auth required)
 * @access  Public
 */
router.get("/plans", subscriptionController.getPlans.bind(subscriptionController));
/**
 * @route   POST /api/v1/subscription/webhook
 * @desc    Stripe webhook – raw body required; bypasses JSON parser
 * @access  Public (Stripe-signed)
 *
 * IMPORTANT: This route must come BEFORE express.json() is applied.
 * We apply express.raw() inline to capture the raw Buffer needed for
 * Stripe signature verification.
 */
router.post("/webhook", express_2.default.raw({ type: "application/json" }), subscriptionController.handleWebhook.bind(subscriptionController));
/**
 * @route   POST /api/v1/subscription/checkout
 * @desc    Register company & create Stripe Checkout Session (pricing page – no auth required)
 * @access  Public
 * @body    { name, email, password, mobileNumber, countryCode, address, image?, latitude?, longitude?, planType: "MONTHLY" | "YEARLY", successUrl?, cancelUrl? }
 */
router.post("/checkout", subscriptionController.createCheckoutSession.bind(subscriptionController));
/**
 * @route   GET /api/v1/subscription/session/:sessionId
 * @desc    Retrieve checkout session details after payment redirect
 * @access  Public
 */
router.get("/session/:sessionId", subscriptionController.getSessionDetails.bind(subscriptionController));
/**
 * ─── AUTHENTICATED COMPANY ROUTES ───────────────────────────────────────────
 */
/**
 * @route   GET /api/v1/subscription/status
 * @desc    Get current subscription status for authenticated company
 * @access  Private (COMPANY)
 */
router.get("/status", authMiddleware_1.clientAuthMiddleware, authMiddleware_1.authMiddleware, subscriptionController.getSubscriptionStatus.bind(subscriptionController));
/**
 * @route   POST /api/v1/subscription/cancel
 * @desc    Cancel subscription at period end (no immediate termination)
 * @access  Private (COMPANY)
 */
router.post("/cancel", authMiddleware_1.clientAuthMiddleware, authMiddleware_1.authMiddleware, subscriptionController.cancelSubscription.bind(subscriptionController));
exports.default = router;
