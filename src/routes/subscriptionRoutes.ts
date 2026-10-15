// src/routes/subscriptionRoutes.ts
import { Router, Request, Response, NextFunction } from "express";
import express from "express";
import { SubscriptionController } from "../controllers/subscriptionController";
import { authMiddleware, clientAuthMiddleware } from "../middlewares/authMiddleware";

const router = Router();
const subscriptionController = new SubscriptionController();

/**
 * ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────
 */

/**
 * @route   GET /api/v1/subscription/plans
 * @desc    List all available pricing plans (pricing page – no auth required)
 * @access  Public
 */
router.get(
    "/plans",
    subscriptionController.getPlans.bind(subscriptionController)
);

/**
 * @route   POST /api/v1/subscription/webhook
 * @desc    Stripe webhook – raw body required; bypasses JSON parser
 * @access  Public (Stripe-signed)
 *
 * IMPORTANT: This route must come BEFORE express.json() is applied.
 * We apply express.raw() inline to capture the raw Buffer needed for
 * Stripe signature verification.
 */
router.post(
    "/webhook",
    express.raw({ type: "application/json" }),
    subscriptionController.handleWebhook.bind(subscriptionController)
);

/**
 * @route   POST /api/v1/subscription/checkout
 * @desc    Register company & create Stripe Checkout Session (pricing page – no auth required)
 * @access  Public
 * @body    { name, email, password, mobileNumber, countryCode, address, image?, latitude?, longitude?, planType: "MONTHLY" | "YEARLY", successUrl?, cancelUrl? }
 */
router.post(
    "/checkout",
    subscriptionController.createCheckoutSession.bind(subscriptionController)
);

/**
 * @route   GET /api/v1/subscription/session/:sessionId
 * @desc    Retrieve checkout session details after payment redirect
 * @access  Public
 */
router.get(
    "/session/:sessionId",
    subscriptionController.getSessionDetails.bind(subscriptionController)
);

/**
 * ─── AUTHENTICATED COMPANY (SUBADMIN) ROUTES ───────────────────────────────
 */


/**
 * @route   POST /api/v1/subscription/cancel
 * @desc    Cancel subscription at period end (no immediate termination)
 * @access  Private (COMPANY)
 */
router.post(
    "/cancel",
    clientAuthMiddleware,
    authMiddleware,
    subscriptionController.cancelSubscription.bind(subscriptionController)
);

export default router;


