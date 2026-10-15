// src/controllers/subscriptionController.ts
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/index";
import { SubscriptionServices } from "../services/subscriptionServices";
import { createCheckoutSessionSchema } from "../schemas/subscriptionSchema";

const subscriptionService = new SubscriptionServices();

export class SubscriptionController {
    /**
     * @route   GET /api/v1/subscription/plans
     * @desc    Get all available subscription plans (public – pricing page)
     * @access  Public
     */
    async getPlans(req: Request, res: Response, next: Function) {
        try {
            const result = await subscriptionService.getPlans();
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @route   POST /api/v1/subscription/checkout
     * @desc    Register company & create Stripe Checkout Session
     * @access  Public
     */
    async createCheckoutSession(req: Request, res: Response, next: Function) {
        try {
            const data = createCheckoutSessionSchema.parse(req.body);
            const result = await subscriptionService.createCheckoutSession(data);
            res.status(result.statusCode).json(result);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @route   GET /api/v1/subscription/status
     * @desc    Get the current subscription status for the authenticated company
     * @access  Private (COMPANY)
     */
    async getSubscriptionStatus(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const companyId = req.user!.id;
            const result = await subscriptionService.getSubscriptionStatus(companyId);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @route   POST /api/v1/subscription/cancel
     * @desc    Cancel the current subscription at period end
     * @access  Private (COMPANY)
     */
    async cancelSubscription(req: AuthenticatedRequest, res: Response, next: Function) {
        try {
            const companyId = req.user!.id;
            const result = await subscriptionService.cancelSubscription(companyId);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @route   GET /api/v1/subscription/session/:sessionId
     * @desc    Retrieve checkout session details after successful payment
     * @access  Public
     */
    async getSessionDetails(req: Request, res: Response, next: Function) {
        try {
            const sessionId = req.params.sessionId as string;
            const companyId = (req as AuthenticatedRequest).user?.id;
            const result = await subscriptionService.getCheckoutSessionDetails(sessionId, companyId);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }

    /**
     * @route   POST /api/v1/subscription/webhook
     * @desc    Stripe webhook endpoint – must use raw body (express.raw)
     * @access  Public (Stripe-signed)
     */
    async handleWebhook(req: Request, res: Response, next: Function) {
        try {
            const signature = req.headers["stripe-signature"];

            if (!signature) {
                res.status(400).json({ success: false, message: "Missing stripe-signature header" });
                return;
            }

            // req.body is a Buffer when express.raw() middleware is applied on this route
            const result = await subscriptionService.handleWebhook(req.body as Buffer, Array.isArray(signature) ? signature[0] : signature);
            res.status(200).json(result);
        } catch (err) {
            next(err);
        }
    }
}
