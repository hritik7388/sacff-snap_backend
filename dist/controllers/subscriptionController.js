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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionController = void 0;
const subscriptionServices_1 = require("../services/subscriptionServices");
const subscriptionSchema_1 = require("../schemas/subscriptionSchema");
const subscriptionService = new subscriptionServices_1.SubscriptionServices();
class SubscriptionController {
    /**
     * @route   GET /api/v1/subscription/plans
     * @desc    Get all available subscription plans (public – pricing page)
     * @access  Public
     */
    getPlans(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield subscriptionService.getPlans();
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   POST /api/v1/subscription/checkout
     * @desc    Register company & create Stripe Checkout Session
     * @access  Public
     */
    createCheckoutSession(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = subscriptionSchema_1.createCheckoutSessionSchema.parse(req.body);
                const result = yield subscriptionService.createCheckoutSession(data);
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   GET /api/v1/subscription/status
     * @desc    Get the current subscription status for the authenticated company
     * @access  Private (COMPANY)
     */
    getSubscriptionStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyId = req.user.id;
                const result = yield subscriptionService.getSubscriptionStatus(companyId);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   POST /api/v1/subscription/cancel
     * @desc    Cancel the current subscription at period end
     * @access  Private (COMPANY)
     */
    cancelSubscription(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const companyId = req.user.id;
                const result = yield subscriptionService.cancelSubscription(companyId);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   GET /api/v1/subscription/session/:sessionId
     * @desc    Retrieve checkout session details after successful payment
     * @access  Public
     */
    getSessionDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const sessionId = req.params.sessionId;
                const companyId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const result = yield subscriptionService.getCheckoutSessionDetails(sessionId, companyId);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   POST /api/v1/subscription/webhook
     * @desc    Stripe webhook endpoint – must use raw body (express.raw)
     * @access  Public (Stripe-signed)
     */
    handleWebhook(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const signature = req.headers["stripe-signature"];
                if (!signature) {
                    res.status(400).json({ success: false, message: "Missing stripe-signature header" });
                    return;
                }
                // req.body is a Buffer when express.raw() middleware is applied on this route
                const result = yield subscriptionService.handleWebhook(req.body, Array.isArray(signature) ? signature[0] : signature);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   GET /api/v1/subscription/admin/subscriptions
     * @desc    Get subscriptions list with filters, search, and pagination for super admin
     * @access  Private (Super Admin)
     */
    getAdminSubscriptions(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = subscriptionSchema_1.adminSubscriptionQuerySchema.parse(req.query);
                const result = yield subscriptionService.getAdminSubscriptions(query);
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   GET /api/v1/subscription/admin/dashboard
     * @desc    Get subscription dashboard statistics for super admin
     * @access  Private (Super Admin)
     */
    getAdminSubscriptionDashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield subscriptionService.getAdminSubscriptionDashboard();
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   GET /api/v1/subscription/admin/:id
     * @desc    Get single subscription details for super admin
     * @access  Private (Super Admin)
     */
    getAdminSubscriptionById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
                const result = yield subscriptionService.getAdminSubscriptionById(id);
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   PATCH /api/v1/subscription/admin/status
     * @route   PATCH /api/v1/subscription/admin/:id/status
     * @desc    Update subscription status for super admin (Administrative status preview)
     * @access  Private (Super Admin)
     */
    updateAdminSubscriptionStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = subscriptionSchema_1.updateSubscriptionStatusSchema.parse(req.body);
                const id = req.params.id || data.id || data.subscriptionId;
                const result = yield subscriptionService.updateAdminSubscriptionStatus(String(id), data.status);
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.SubscriptionController = SubscriptionController;
