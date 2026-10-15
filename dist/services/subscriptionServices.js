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
exports.SubscriptionServices = void 0;
// src/services/subscriptionServices.ts
const stripe_1 = __importDefault(require("stripe"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const uuid_1 = require("uuid");
const utils_1 = require("../helpers/utils");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-09-30.endive",
});
// Helper: get Stripe Price IDs dynamically from env with fallback
function getPriceMap() {
    const monthly = process.env.STRIPE_MONTHLY_PRICE_ID || "price_1UQMopSGvKUyTYwhHvZyZSi6";
    const yearly = process.env.STRIPE_YEARLY_PRICE_ID || "price_1UQMqRSGvKUyTYwhDY3qClLF";
    return {
        MONTHLY: monthly,
        YEARLY: yearly,
    };
}
// Helper: get subscription period dates from Stripe billing_cycle_anchor & interval
function getPeriodDates(sub) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    // billing_cycle_anchor is the anchor; for current period, we derive from items
    const item = (_b = (_a = sub.items) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b[0];
    const interval = (_d = (_c = item === null || item === void 0 ? void 0 : item.price) === null || _c === void 0 ? void 0 : _c.recurring) === null || _d === void 0 ? void 0 : _d.interval;
    const anchor = sub.billing_cycle_anchor;
    if (!anchor)
        return { periodStart: null, periodEnd: null };
    const periodStart = new Date(anchor * 1000);
    const periodEnd = new Date(anchor * 1000);
    if (interval === "month") {
        periodEnd.setMonth(periodEnd.getMonth() + ((_g = (_f = (_e = item === null || item === void 0 ? void 0 : item.price) === null || _e === void 0 ? void 0 : _e.recurring) === null || _f === void 0 ? void 0 : _f.interval_count) !== null && _g !== void 0 ? _g : 1));
    }
    else if (interval === "year") {
        periodEnd.setFullYear(periodEnd.getFullYear() + ((_k = (_j = (_h = item === null || item === void 0 ? void 0 : item.price) === null || _h === void 0 ? void 0 : _h.recurring) === null || _j === void 0 ? void 0 : _j.interval_count) !== null && _k !== void 0 ? _k : 1));
    }
    return { periodStart, periodEnd };
}
// Helper: get subscription ID from Stripe Invoice.parent
function getSubscriptionIdFromInvoice(invoice) {
    var _a;
    const parent = invoice.parent;
    if (!parent)
        return null;
    if (parent.type === "subscription_details" && ((_a = parent.subscription_details) === null || _a === void 0 ? void 0 : _a.subscription)) {
        return parent.subscription_details.subscription;
    }
    return null;
}
class SubscriptionServices {
    // ─── 1. Get all available plans (pricing page) ──────────────────────────
    getPlans() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const priceMap = getPriceMap();
                const [monthlyPrice, yearlyPrice] = yield Promise.all([
                    stripe.prices.retrieve(priceMap.MONTHLY, { expand: ["product"] }),
                    stripe.prices.retrieve(priceMap.YEARLY, { expand: ["product"] }),
                ]);
                const formatPrice = (price) => {
                    var _a, _b, _c, _d;
                    const product = price.product;
                    return {
                        priceId: price.id,
                        planType: ((_a = price.recurring) === null || _a === void 0 ? void 0 : _a.interval) === "month" ? "MONTHLY" : "YEARLY",
                        planName: product.name,
                        description: product.description,
                        amount: ((_b = price.unit_amount) !== null && _b !== void 0 ? _b : 0) / 100,
                        currency: price.currency.toUpperCase(),
                        interval: (_c = price.recurring) === null || _c === void 0 ? void 0 : _c.interval,
                        features: ((_d = product.metadata) === null || _d === void 0 ? void 0 : _d.features)
                            ? product.metadata.features.split(",").map((f) => f.trim())
                            : [],
                    };
                };
                return {
                    success: true,
                    statusCode: 200,
                    message: "Plans fetched successfully",
                    data: {
                        plans: [formatPrice(monthlyPrice), formatPrice(yearlyPrice)],
                    },
                };
            }
            catch (error) {
                throw new customError_1.CustomError(error.message, 500, "Failed to fetch plans from Stripe");
            }
        });
    }
    // ─── 2. Create Stripe Checkout Session (with Company Registration) ─────────
    createCheckoutSession(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const priceMap = getPriceMap();
                const priceId = priceMap[data.planType];
                if (!priceId) {
                    throw new customError_1.CustomError("Invalid plan type", 400, "Plan type must be MONTHLY or YEARLY");
                }
                // 1. Check if company with this email already exists
                let company = yield prismaClient_1.default.company.findUnique({
                    where: { email: data.email },
                });
                if (company) {
                    // Check if already active
                    const activeSub = yield prismaClient_1.default.companySubscription.findFirst({
                        where: { companyId: company.id, status: "ACTIVE" },
                    });
                    if (activeSub) {
                        throw new customError_1.CustomError("This company email already has an active subscription. Please log in to manage your account.", 400, "Active subscription already exists");
                    }
                }
                else {
                    // Register the new company
                    const hashedPassword = bcryptjs_1.default.hashSync(data.password, 10);
                    const cmpId = (0, utils_1.generateCompanyId)();
                    company = yield prismaClient_1.default.company.create({
                        data: {
                            uuid: (0, uuid_1.v4)(),
                            name: data.name,
                            email: data.email,
                            address: data.address,
                            password: hashedPassword,
                            mobileNumber: data.mobileNumber,
                            countryCode: data.countryCode || "+91",
                            isApproved: "PENDING",
                            latitude: data.latitude,
                            longitude: data.longitude,
                            CMPId: cmpId,
                            image: data.image || "",
                            user_type: "COMPANY",
                        },
                    });
                    // Notify Super Admin of new company registration
                    try {
                        const superAdmins = yield prismaClient_1.default.user.findMany({
                            where: { user_type: "SUPER_ADMIN" },
                            select: { id: true },
                        });
                        if (superAdmins && superAdmins.length > 0) {
                            const superAdmin = superAdmins[0];
                            const superAdminDevice = yield prismaClient_1.default.device.findFirst({
                                where: { deviceToken: { not: null } },
                                select: { deviceToken: true },
                            });
                            yield prismaClient_1.default.notification.create({
                                data: {
                                    uuid: (0, uuid_1.v4)(),
                                    title: "New Company Registered",
                                    message: `A new company "${company.name}" has registered via subscription checkout (${cmpId}).`,
                                    type: "NEW_COMPANY_REGISTERED",
                                    role: "SUPER_ADMIN",
                                    companyId: company.id,
                                    isRead: false,
                                    receiverId: Number(superAdmin.id),
                                    senderId: company.id.toString(),
                                    notificationImage: "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/companyReg.png",
                                },
                            });
                            if (superAdminDevice === null || superAdminDevice === void 0 ? void 0 : superAdminDevice.deviceToken) {
                                yield (0, utils_1.pushNotificationDelhi)(superAdminDevice.deviceToken, "New Company Registered", `A new company "${data.name}" has registered for a subscription (${company.CMPId}).`);
                            }
                        }
                    }
                    catch (notifErr) {
                        console.error("SuperAdmin notification skipped:", notifErr);
                    }
                }
                const companyId = Number(company.id);
                // 2. Re-use existing Stripe customer or create one
                let stripeCustomerId;
                const existingSub = yield prismaClient_1.default.companySubscription.findFirst({
                    where: { companyId, stripeCustomerId: { not: null } },
                    select: { stripeCustomerId: true },
                });
                if (existingSub === null || existingSub === void 0 ? void 0 : existingSub.stripeCustomerId) {
                    stripeCustomerId = existingSub.stripeCustomerId;
                }
                else {
                    const customer = yield stripe.customers.create({
                        email: company.email,
                        name: company.name,
                        metadata: { companyId: companyId.toString() },
                    });
                    stripeCustomerId = customer.id;
                }
                const successUrl = data.successUrl ||
                    `${process.env.FRONTEND_URL || "https://scaffsnapp.com"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
                const cancelUrl = data.cancelUrl ||
                    `${process.env.FRONTEND_URL || "https://scaffsnapp.com"}/pricing?canceled=true`;
                // 3. Create Stripe Checkout Session
                const session = yield stripe.checkout.sessions.create({
                    customer: stripeCustomerId,
                    mode: "subscription",
                    line_items: [
                        {
                            price: priceId,
                            quantity: 1,
                        },
                    ],
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                    metadata: {
                        companyId: companyId.toString(),
                        planType: data.planType,
                    },
                    subscription_data: {
                        metadata: {
                            companyId: companyId.toString(),
                            planType: data.planType,
                        },
                    },
                    allow_promotion_codes: true,
                    billing_address_collection: "required",
                });
                // 4. Calculate subscription start and end dates
                const startDate = new Date();
                const endDate = new Date(startDate);
                if (data.planType === "MONTHLY") {
                    endDate.setMonth(endDate.getMonth() + 1);
                }
                else if (data.planType === "YEARLY") {
                    endDate.setFullYear(endDate.getFullYear() + 1);
                }
                // 5. Persist a PENDING subscription record with start & end dates
                yield prismaClient_1.default.companySubscription.upsert({
                    where: { companyId },
                    create: {
                        uuid: (0, uuid_1.v4)(),
                        companyId,
                        planType: data.planType,
                        status: "PENDING",
                        stripeCustomerId,
                        stripeSessionId: session.id,
                        currentPeriodStart: startDate,
                        currentPeriodEnd: endDate,
                    },
                    update: {
                        planType: data.planType,
                        status: "PENDING",
                        stripeCustomerId,
                        stripeSessionId: session.id,
                        stripeSubscriptionId: null,
                        currentPeriodStart: startDate,
                        currentPeriodEnd: endDate,
                    },
                });
                return {
                    success: true,
                    statusCode: 200,
                    message: "Company registered and checkout session created successfully",
                    data: {
                        sessionId: session.id,
                        checkoutUrl: session.url,
                        planType: data.planType,
                        subscription: {
                            status: "PENDING",
                            currentPeriodStart: startDate,
                            currentPeriodEnd: endDate,
                        },
                        company: {
                            id: company.id,
                            uuid: company.uuid,
                            name: company.name,
                            email: company.email,
                            address: company.address,
                            mobileNumber: company.mobileNumber,
                            countryCode: company.countryCode,
                            CMPId: company.CMPId,
                            isApproved: company.isApproved,
                        },
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(error.message, 500, "Failed to create checkout session");
            }
        });
    }
    // ─── 3. Get company subscription status ─────────────────────────────────
    getSubscriptionStatus(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield prismaClient_1.default.companySubscription.findUnique({
                    where: { companyId },
                });
                if (!subscription) {
                    return {
                        success: true,
                        statusCode: 200,
                        message: "No active subscription found",
                        data: { isSubscribed: false, subscription: null },
                    };
                }
                return {
                    success: true,
                    statusCode: 200,
                    message: "Subscription status fetched",
                    data: {
                        isSubscribed: subscription.status === "ACTIVE",
                        subscription: {
                            id: subscription.id,
                            uuid: subscription.uuid,
                            planType: subscription.planType,
                            status: subscription.status,
                            currentPeriodStart: subscription.currentPeriodStart,
                            currentPeriodEnd: subscription.currentPeriodEnd,
                            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                            createdAt: subscription.createdAt,
                            updatedAt: subscription.updatedAt,
                        },
                    },
                };
            }
            catch (error) {
                throw new customError_1.CustomError(error.message, 500, "Failed to fetch subscription status");
            }
        });
    }
    // ─── 4. Cancel subscription ──────────────────────────────────────────────
    cancelSubscription(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const subscription = yield prismaClient_1.default.companySubscription.findUnique({
                    where: { companyId },
                });
                if (!subscription || !subscription.stripeSubscriptionId) {
                    throw new customError_1.CustomError("No active subscription found", 404, "No active subscription to cancel");
                }
                if (subscription.status !== "ACTIVE") {
                    throw new customError_1.CustomError("Subscription is not active", 400, "Only active subscriptions can be cancelled");
                }
                // Cancel at period end (graceful cancellation)
                yield stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                    cancel_at_period_end: true,
                });
                const updated = yield prismaClient_1.default.companySubscription.update({
                    where: { companyId },
                    data: { cancelAtPeriodEnd: true },
                });
                return {
                    success: true,
                    statusCode: 200,
                    message: "Subscription will be cancelled at the end of the billing period",
                    data: {
                        cancelAtPeriodEnd: true,
                        currentPeriodEnd: updated.currentPeriodEnd,
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(error.message, 500, "Failed to cancel subscription");
            }
        });
    }
    // ─── 5. Get checkout session details (for success page) ─────────────────
    getCheckoutSessionDetails(sessionId, companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            try {
                const session = yield stripe.checkout.sessions.retrieve(sessionId, {
                    expand: ["line_items", "subscription"],
                });
                if (!session) {
                    throw new customError_1.CustomError("Session not found", 404, "Checkout session not found");
                }
                // Validate if companyId is provided
                if (companyId && ((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.companyId) && session.metadata.companyId !== companyId.toString()) {
                    throw new customError_1.CustomError("Unauthorized", 403, "Session does not belong to this company");
                }
                const sub = session.subscription;
                // If payment succeeded, synchronize database to ACTIVE & approve company immediately
                if (session.payment_status === "paid" && ((_b = session.metadata) === null || _b === void 0 ? void 0 : _b.companyId)) {
                    const targetCompanyId = Number(session.metadata.companyId);
                    const planType = ((_c = session.metadata.planType) !== null && _c !== void 0 ? _c : "MONTHLY");
                    const stripeSubId = typeof session.subscription === "string"
                        ? session.subscription
                        : (_e = (_d = session.subscription) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : null;
                    let periodStart = null;
                    let periodEnd = null;
                    if (sub) {
                        const dates = getPeriodDates(sub);
                        periodStart = dates.periodStart;
                        periodEnd = dates.periodEnd;
                    }
                    if (!periodStart || !periodEnd) {
                        periodStart = new Date();
                        periodEnd = new Date(periodStart);
                        if (planType === "MONTHLY") {
                            periodEnd.setMonth(periodEnd.getMonth() + 1);
                        }
                        else if (planType === "YEARLY") {
                            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                        }
                    }
                    try {
                        yield prismaClient_1.default.companySubscription.updateMany({
                            where: { companyId: targetCompanyId },
                            data: {
                                status: "ACTIVE",
                                planType,
                                stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
                                stripeSessionId: session.id,
                                stripeSubscriptionId: stripeSubId,
                                currentPeriodStart: periodStart,
                                currentPeriodEnd: periodEnd,
                                cancelAtPeriodEnd: false,
                            },
                        });
                        yield prismaClient_1.default.company.update({
                            where: { id: targetCompanyId },
                            data: {
                                isApproved: "APPROVED",
                                isVerified: true,
                            },
                        });
                        console.log(`✅ Subscription synchronized & ACTIVATED for company ${targetCompanyId}`);
                    }
                    catch (dbErr) {
                        console.error("Database sync error in getCheckoutSessionDetails:", dbErr);
                    }
                }
                return {
                    success: true,
                    statusCode: 200,
                    message: "Session details fetched",
                    data: {
                        sessionId: session.id,
                        paymentStatus: session.payment_status,
                        subscriptionStatus: (_f = sub === null || sub === void 0 ? void 0 : sub.status) !== null && _f !== void 0 ? _f : null,
                        planType: (_g = session.metadata) === null || _g === void 0 ? void 0 : _g.planType,
                        amountTotal: ((_h = session.amount_total) !== null && _h !== void 0 ? _h : 0) / 100,
                        currency: (_j = session.currency) === null || _j === void 0 ? void 0 : _j.toUpperCase(),
                        customerEmail: (_k = session.customer_details) === null || _k === void 0 ? void 0 : _k.email,
                        lineItems: (_l = session.line_items) === null || _l === void 0 ? void 0 : _l.data.map((item) => {
                            var _a, _b;
                            return ({
                                description: item.description,
                                quantity: item.quantity,
                                amount: ((_a = item.amount_total) !== null && _a !== void 0 ? _a : 0) / 100,
                                currency: (_b = item.currency) === null || _b === void 0 ? void 0 : _b.toUpperCase(),
                            });
                        }),
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(error.message, 500, "Failed to retrieve session details");
            }
        });
    }
    // ─── 6. Stripe Webhook Handler ───────────────────────────────────────────
    handleWebhook(rawBody, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            let event;
            try {
                event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
            }
            catch (err) {
                throw new customError_1.CustomError(`Webhook signature verification failed: ${err.message}`, 400, "Invalid webhook signature");
            }
            console.log(`✅ Stripe Webhook received: ${event.type}`);
            switch (event.type) {
                case "checkout.session.completed": {
                    yield this._handleCheckoutSessionCompleted(event.data.object);
                    break;
                }
                case "invoice.payment_succeeded": {
                    yield this._handleInvoicePaymentSucceeded(event.data.object);
                    break;
                }
                case "invoice.payment_failed": {
                    yield this._handleInvoicePaymentFailed(event.data.object);
                    break;
                }
                case "customer.subscription.updated": {
                    yield this._handleSubscriptionUpdated(event.data.object);
                    break;
                }
                case "customer.subscription.deleted": {
                    yield this._handleSubscriptionDeleted(event.data.object);
                    break;
                }
                default:
                    console.log(`⚠️  Unhandled Stripe event: ${event.type}`);
            }
            return { received: true };
        });
    }
    // ─── Private webhook handlers ────────────────────────────────────────────
    _handleCheckoutSessionCompleted(session) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const companyId = Number((_a = session.metadata) === null || _a === void 0 ? void 0 : _a.companyId);
            const planType = ((_c = (_b = session.metadata) === null || _b === void 0 ? void 0 : _b.planType) !== null && _c !== void 0 ? _c : "MONTHLY");
            if (!companyId)
                return;
            // Payment must be paid to provision access
            if (session.payment_status !== "paid") {
                console.log(`⚠️  Checkout session ${session.id} payment_status is not 'paid'. Skipping.`);
                return;
            }
            const stripeSubId = typeof session.subscription === "string"
                ? session.subscription
                : (_e = (_d = session.subscription) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : null;
            let periodStart = null;
            let periodEnd = null;
            if (stripeSubId) {
                const stripeSub = yield stripe.subscriptions.retrieve(stripeSubId);
                const dates = getPeriodDates(stripeSub);
                periodStart = dates.periodStart;
                periodEnd = dates.periodEnd;
            }
            if (!periodStart || !periodEnd) {
                periodStart = new Date();
                periodEnd = new Date(periodStart);
                if (planType === "MONTHLY") {
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                }
                else if (planType === "YEARLY") {
                    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                }
            }
            yield prismaClient_1.default.companySubscription.upsert({
                where: { companyId },
                create: {
                    uuid: (0, uuid_1.v4)(),
                    companyId,
                    planType,
                    status: "ACTIVE",
                    stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
                    stripeSessionId: session.id,
                    stripeSubscriptionId: stripeSubId,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                    cancelAtPeriodEnd: false,
                },
                update: {
                    planType,
                    status: "ACTIVE",
                    stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
                    stripeSessionId: session.id,
                    stripeSubscriptionId: stripeSubId,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                    cancelAtPeriodEnd: false,
                },
            });
            // Automatically approve and verify company now that payment is confirmed
            yield prismaClient_1.default.company.update({
                where: { id: companyId },
                data: {
                    isApproved: "APPROVED",
                    isVerified: true,
                },
            });
            console.log(`✅ Subscription ACTIVATED and Company ${companyId} APPROVED`);
        });
    }
    _handleInvoicePaymentSucceeded(invoice) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Get subscription ID from invoice.parent (new Stripe API)
            const subId = getSubscriptionIdFromInvoice(invoice);
            if (!subId)
                return;
            const stripeSub = yield stripe.subscriptions.retrieve(subId);
            const companyId = Number((_a = stripeSub.metadata) === null || _a === void 0 ? void 0 : _a.companyId);
            if (!companyId)
                return;
            const { periodStart, periodEnd } = getPeriodDates(stripeSub);
            yield prismaClient_1.default.companySubscription.updateMany({
                where: { companyId },
                data: {
                    status: "ACTIVE",
                    stripeSubscriptionId: subId,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                    cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                },
            });
            console.log(`✅ Invoice payment succeeded for company ${companyId}`);
        });
    }
    _handleInvoicePaymentFailed(invoice) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const subId = getSubscriptionIdFromInvoice(invoice);
            if (!subId)
                return;
            const stripeSub = yield stripe.subscriptions.retrieve(subId);
            const companyId = Number((_a = stripeSub.metadata) === null || _a === void 0 ? void 0 : _a.companyId);
            if (!companyId)
                return;
            yield prismaClient_1.default.companySubscription.updateMany({
                where: { companyId },
                data: { status: "PAST_DUE" },
            });
            console.log(`⚠️  Invoice payment FAILED for company ${companyId}`);
        });
    }
    _handleSubscriptionUpdated(subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const companyId = Number((_a = subscription.metadata) === null || _a === void 0 ? void 0 : _a.companyId);
            if (!companyId)
                return;
            const statusMap = {
                active: "ACTIVE",
                past_due: "PAST_DUE",
                canceled: "CANCELLED",
                unpaid: "PAST_DUE",
                trialing: "ACTIVE",
                incomplete: "PENDING",
                incomplete_expired: "CANCELLED",
                paused: "PAST_DUE",
            };
            const newStatus = (_b = statusMap[subscription.status]) !== null && _b !== void 0 ? _b : "PENDING";
            const { periodStart, periodEnd } = getPeriodDates(subscription);
            yield prismaClient_1.default.companySubscription.updateMany({
                where: { companyId },
                data: {
                    status: newStatus,
                    currentPeriodStart: periodStart,
                    currentPeriodEnd: periodEnd,
                    cancelAtPeriodEnd: subscription.cancel_at_period_end,
                },
            });
            console.log(`🔄 Subscription updated for company ${companyId} → ${newStatus}`);
        });
    }
    _handleSubscriptionDeleted(subscription) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const companyId = Number((_a = subscription.metadata) === null || _a === void 0 ? void 0 : _a.companyId);
            if (!companyId)
                return;
            yield prismaClient_1.default.companySubscription.updateMany({
                where: { companyId },
                data: {
                    status: "CANCELLED",
                    stripeSubscriptionId: subscription.id,
                    cancelAtPeriodEnd: false,
                },
            });
            console.log(`❌ Subscription CANCELLED for company ${companyId}`);
        });
    }
}
exports.SubscriptionServices = SubscriptionServices;
