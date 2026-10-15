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
const client_1 = require("@prisma/client");
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
    // ─── 3. Get company / subAdmin own subscription ──────────────────────────
    getSubscriptionStatus(companyId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const company = yield prismaClient_1.default.company.findUnique({
                    where: { id: BigInt(companyId) },
                    include: {
                        subscription: true,
                        _count: {
                            select: {
                                projects: {
                                    where: { isDeleted: false },
                                },
                            },
                        },
                    },
                });
                if (!company) {
                    throw new customError_1.CustomError("Company not found", 404, "Invalid company ID");
                }
                const subscription = company.subscription;
                if (!subscription) {
                    return {
                        success: true,
                        statusCode: 200,
                        message: "No active subscription found",
                        data: {
                            isSubscribed: false,
                            subscription: null,
                            currentSubscription: null,
                            paymentDetails: null,
                            billingHistory: [],
                            company: {
                                id: company.id.toString(),
                                uuid: company.uuid,
                                name: company.name,
                                email: company.email,
                                cmpId: company.CMPId,
                            },
                        },
                    };
                }
                const planInfo = this.getPlanDisplayDetails(subscription.planType);
                const statusDisplay = this.getStatusDisplay(subscription.status);
                const facilitiesCount = (_b = (_a = company._count) === null || _a === void 0 ? void 0 : _a.projects) !== null && _b !== void 0 ? _b : 0;
                const companyIdNum = Number(company.id);
                const subCode = company.CMPId
                    ? `SUB-${company.CMPId.replace(/\D/g, "").slice(0, 4) || (1000 + companyIdNum)}`
                    : `SUB-${1000 + companyIdNum}`;
                const invoiceRef = `INV-${1000 + companyIdNum}`;
                const formatDisplayDate = (d) => {
                    if (!d)
                        return "";
                    const dt = new Date(d);
                    if (isNaN(dt.getTime()))
                        return "";
                    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    return `${months[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
                };
                const formatIsoDate = (d) => {
                    if (!d)
                        return "";
                    const dt = new Date(d);
                    return isNaN(dt.getTime()) ? "" : dt.toISOString().split("T")[0];
                };
                const startDateFormatted = formatDisplayDate(subscription.currentPeriodStart || subscription.createdAt);
                const renewalDateFormatted = formatDisplayDate(subscription.currentPeriodEnd);
                let paymentMethod = {
                    brand: "Visa",
                    last4: "4242",
                    display: "Visa ending 4242",
                    type: "Credit / Debit Card",
                    managedBy: "Payment provider managed",
                    expMonth: null,
                    expYear: null,
                };
                let billingHistory = [];
                let lastPaymentDate = startDateFormatted;
                let lastAmountPaid = planInfo.priceDisplay;
                let lastInvoiceRef = invoiceRef;
                if (subscription.stripeCustomerId) {
                    try {
                        const [pmList, invList] = yield Promise.all([
                            stripe.paymentMethods.list({
                                customer: subscription.stripeCustomerId,
                                type: "card",
                            }),
                            stripe.invoices.list({
                                customer: subscription.stripeCustomerId,
                                limit: 24,
                            }),
                        ]);
                        if (pmList.data.length > 0 && pmList.data[0].card) {
                            const card = pmList.data[0].card;
                            const brandName = card.brand ? card.brand.charAt(0).toUpperCase() + card.brand.slice(1) : "Card";
                            paymentMethod = {
                                brand: brandName,
                                last4: card.last4 || "4242",
                                display: `${brandName} ending ${card.last4 || "4242"}`,
                                type: "Credit / Debit Card",
                                managedBy: "Payment provider managed",
                                expMonth: card.exp_month,
                                expYear: card.exp_year,
                            };
                        }
                        if (invList.data.length > 0) {
                            const latest = invList.data[0];
                            lastPaymentDate = formatDisplayDate(new Date(latest.created * 1000));
                            lastAmountPaid = `$${(((_c = latest.amount_paid) !== null && _c !== void 0 ? _c : 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            lastInvoiceRef = latest.number || invoiceRef;
                            billingHistory = invList.data.map((inv) => {
                                var _a, _b, _c;
                                return ({
                                    id: inv.id,
                                    invoice: inv.number || invoiceRef,
                                    invoiceNumber: inv.number || invoiceRef,
                                    date: formatDisplayDate(new Date(inv.created * 1000)),
                                    dateIso: formatIsoDate(new Date(inv.created * 1000)),
                                    description: `${planInfo.planName.replace(" Plan", "")} — ${planInfo.billingCycle}`,
                                    amount: `$${(((_a = inv.amount_paid) !== null && _a !== void 0 ? _a : 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                                    amountNumeric: ((_b = inv.amount_paid) !== null && _b !== void 0 ? _b : 0) / 100,
                                    currency: ((_c = inv.currency) === null || _c === void 0 ? void 0 : _c.toUpperCase()) || "USD",
                                    status: inv.status === "paid" ? "Paid" : (inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : "Paid"),
                                    statusRaw: inv.status,
                                    receiptUrl: inv.hosted_invoice_url || inv.invoice_pdf || null,
                                    downloadUrl: inv.invoice_pdf || inv.hosted_invoice_url || null,
                                    invoicePdf: inv.invoice_pdf || null,
                                    hostedInvoiceUrl: inv.hosted_invoice_url || null,
                                });
                            });
                        }
                    }
                    catch (stripeErr) {
                        console.warn("Could not retrieve Stripe customer data for subadmin:", stripeErr.message);
                    }
                }
                if (billingHistory.length === 0) {
                    billingHistory.push({
                        id: `inv_${subscription.id}`,
                        invoice: invoiceRef,
                        invoiceNumber: invoiceRef,
                        date: startDateFormatted,
                        dateIso: formatIsoDate(subscription.currentPeriodStart || subscription.createdAt),
                        description: `${planInfo.planName.replace(" Plan", "")} — ${planInfo.billingCycle}`,
                        amount: planInfo.priceDisplay,
                        amountNumeric: planInfo.amount,
                        currency: "USD",
                        status: subscription.status === "ACTIVE" ? "Paid" : "Pending",
                        statusRaw: subscription.status,
                        receiptUrl: null,
                        downloadUrl: null,
                        invoicePdf: null,
                        hostedInvoiceUrl: null,
                    });
                }
                return {
                    success: true,
                    statusCode: 200,
                    message: "Subscription status fetched",
                    data: {
                        // Current Subscription Overview Card
                        currentSubscription: {
                            planName: `${planInfo.planName} Plan`,
                            planTitle: `${planInfo.planName} Plan`,
                            planType: subscription.planType,
                            status: subscription.status,
                            statusDisplay,
                            isActive: subscription.status === "ACTIVE",
                            cost: planInfo.amount,
                            costDisplay: planInfo.priceDisplay,
                            costPerInterval: `${planInfo.priceDisplay} / ${planInfo.intervalDisplay.replace("per ", "")}`,
                            billedText: `Billed ${planInfo.billingCycle.toLowerCase()}`,
                            billingCycle: planInfo.billingCycle,
                            interval: planInfo.intervalDisplay.replace("per ", ""),
                            facilities: facilitiesCount,
                            facilitiesCount,
                            nextRenewal: renewalDateFormatted,
                            nextRenewalIso: formatIsoDate(subscription.currentPeriodEnd),
                            renewalDate: renewalDateFormatted,
                            subscriptionStart: startDateFormatted,
                            subscriptionStartIso: formatIsoDate(subscription.currentPeriodStart || subscription.createdAt),
                            startDate: startDateFormatted,
                            companyName: company.name,
                            company: company.name,
                            companyEmail: company.email,
                            companyCode: subCode,
                            cmpId: company.CMPId,
                        },
                        // Payment details Card
                        paymentDetails: {
                            title: "Payment details",
                            subtitle: "Payment method used for this subscription",
                            method: paymentMethod.display,
                            cardEnding: `${paymentMethod.brand} ending ${paymentMethod.last4}`,
                            cardType: paymentMethod.type,
                            brand: paymentMethod.brand,
                            last4: paymentMethod.last4,
                            management: paymentMethod.managedBy,
                            lastPayment: lastPaymentDate,
                            lastPaymentDate,
                            lastAmountPaid,
                            invoiceReference: lastInvoiceRef,
                            invoiceNumber: lastInvoiceRef,
                        },
                        // Billing history Card
                        billingHistory,
                        invoices: billingHistory,
                        // Backward-compatibility mirrors
                        isSubscribed: subscription.status === "ACTIVE",
                        subscription: {
                            id: subscription.id.toString(),
                            uuid: subscription.uuid,
                            planType: subscription.planType,
                            planName: `${planInfo.planName} Plan`,
                            status: subscription.status,
                            statusDisplay,
                            currentPeriodStart: subscription.currentPeriodStart,
                            currentPeriodEnd: subscription.currentPeriodEnd,
                            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                            createdAt: subscription.createdAt,
                            updatedAt: subscription.updatedAt,
                        },
                        company: {
                            id: company.id.toString(),
                            uuid: company.uuid,
                            name: company.name,
                            email: company.email,
                            address: company.address,
                            mobileNumber: company.mobileNumber,
                            countryCode: company.countryCode,
                            cmpId: company.CMPId,
                            image: company.image,
                        },
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
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
    // ─── Super Admin Subscription Dashboard & Management ─────────────────────
    getPlanDisplayDetails(planType) {
        if (planType === "YEARLY") {
            return {
                planName: "Professional",
                billingCycle: "Annual",
                amount: 1200.0,
                currency: "USD",
                priceDisplay: "$1,200.00",
                intervalDisplay: "per year",
            };
        }
        return {
            planName: "Starter",
            billingCycle: "Monthly",
            amount: 99.0,
            currency: "USD",
            priceDisplay: "$99.00",
            intervalDisplay: "per month",
        };
    }
    getStatusDisplay(status) {
        switch (status) {
            case "ACTIVE":
                return "Active";
            case "PENDING":
                return "Pending";
            case "PAST_DUE":
                return "Past due";
            case "CANCELLED":
                return "Canceled";
            case "FAILED":
                return "Expired";
            default:
                return status;
        }
    }
    getSubscriptionStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const [totalSubscriptions, active, pendingPayment, pastDue, canceled, expired,] = yield Promise.all([
                prismaClient_1.default.companySubscription.count(),
                prismaClient_1.default.companySubscription.count({ where: { status: "ACTIVE" } }),
                prismaClient_1.default.companySubscription.count({ where: { status: "PENDING" } }),
                prismaClient_1.default.companySubscription.count({ where: { status: "PAST_DUE" } }),
                prismaClient_1.default.companySubscription.count({ where: { status: "CANCELLED" } }),
                prismaClient_1.default.companySubscription.count({ where: { status: "FAILED" } }),
            ]);
            const padZero = (n) => (n < 10 ? `0${n}` : `${n}`);
            return {
                totalSubscriptions,
                active,
                pendingPayment,
                pastDue,
                canceled,
                expired,
                total: totalSubscriptions,
                activeSubscriptions: active,
                pendingPaymentSubscriptions: pendingPayment,
                pastDueSubscriptions: pastDue,
                canceledSubscriptions: canceled,
                expiredSubscriptions: expired,
                formatted: {
                    total: padZero(totalSubscriptions),
                    active: padZero(active),
                    pendingPayment: padZero(pendingPayment),
                    pastDue: padZero(pastDue),
                    canceled: padZero(canceled),
                    expired: padZero(expired),
                },
            };
        });
    }
    formatSubscriptionRow(sub) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4;
        const planInfo = this.getPlanDisplayDetails(sub.planType);
        const statusDisplay = this.getStatusDisplay(sub.status);
        const companyIdStr = (_e = (_c = (_b = (_a = sub.company) === null || _a === void 0 ? void 0 : _a.id) === null || _b === void 0 ? void 0 : _b.toString()) !== null && _c !== void 0 ? _c : (_d = sub.companyId) === null || _d === void 0 ? void 0 : _d.toString()) !== null && _e !== void 0 ? _e : "";
        const subCode = ((_f = sub.company) === null || _f === void 0 ? void 0 : _f.CMPId)
            ? `SUB-${sub.company.CMPId.replace(/\D/g, "").slice(0, 4) || (1000 + Number(companyIdStr))}`
            : `SUB-${1000 + Number(companyIdStr || sub.id)}`;
        const renewalDate = sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd).toISOString().split("T")[0]
            : null;
        const facilities = (_j = (_h = (_g = sub.company) === null || _g === void 0 ? void 0 : _g._count) === null || _h === void 0 ? void 0 : _h.projects) !== null && _j !== void 0 ? _j : 0;
        return {
            id: sub.id.toString(),
            uuid: sub.uuid,
            subscriptionId: sub.id.toString(),
            subscriptionCode: subCode,
            code: subCode,
            companyId: companyIdStr,
            organization: {
                id: companyIdStr,
                uuid: (_k = sub.company) === null || _k === void 0 ? void 0 : _k.uuid,
                name: ((_l = sub.company) === null || _l === void 0 ? void 0 : _l.name) || "Unknown Company",
                code: subCode,
                cmpId: (_m = sub.company) === null || _m === void 0 ? void 0 : _m.CMPId,
                email: ((_o = sub.company) === null || _o === void 0 ? void 0 : _o.email) || "",
                address: (_p = sub.company) === null || _p === void 0 ? void 0 : _p.address,
                image: ((_q = sub.company) === null || _q === void 0 ? void 0 : _q.image) || "",
            },
            company: {
                id: companyIdStr,
                uuid: (_r = sub.company) === null || _r === void 0 ? void 0 : _r.uuid,
                name: ((_s = sub.company) === null || _s === void 0 ? void 0 : _s.name) || "Unknown Company",
                email: ((_t = sub.company) === null || _t === void 0 ? void 0 : _t.email) || "",
                address: (_u = sub.company) === null || _u === void 0 ? void 0 : _u.address,
                mobileNumber: (_v = sub.company) === null || _v === void 0 ? void 0 : _v.mobileNumber,
                countryCode: (_w = sub.company) === null || _w === void 0 ? void 0 : _w.countryCode,
                cmpId: (_x = sub.company) === null || _x === void 0 ? void 0 : _x.CMPId,
                image: ((_y = sub.company) === null || _y === void 0 ? void 0 : _y.image) || "",
                status: (_z = sub.company) === null || _z === void 0 ? void 0 : _z.status,
                isApproved: (_0 = sub.company) === null || _0 === void 0 ? void 0 : _0.isApproved,
            },
            name: ((_1 = sub.company) === null || _1 === void 0 ? void 0 : _1.name) || "Unknown Company",
            email: ((_2 = sub.company) === null || _2 === void 0 ? void 0 : _2.email) || "",
            cmpId: (_3 = sub.company) === null || _3 === void 0 ? void 0 : _3.CMPId,
            image: ((_4 = sub.company) === null || _4 === void 0 ? void 0 : _4.image) || "",
            plan: {
                name: planInfo.planName,
                type: sub.planType,
                billingCycle: planInfo.billingCycle,
                amount: planInfo.amount,
                currency: planInfo.currency,
                priceDisplay: planInfo.priceDisplay,
                intervalDisplay: planInfo.intervalDisplay,
            },
            planName: planInfo.planName,
            planType: sub.planType,
            billingCycle: planInfo.billingCycle,
            billing: {
                amount: planInfo.amount,
                currency: planInfo.currency,
                amountFormatted: planInfo.priceDisplay,
                intervalFormatted: planInfo.intervalDisplay,
                display: `${planInfo.priceDisplay} ${planInfo.intervalDisplay}`,
            },
            amount: planInfo.amount,
            billingAmount: planInfo.priceDisplay,
            billingInterval: planInfo.intervalDisplay,
            facilities,
            facilitiesCount: facilities,
            projectsCount: facilities,
            renewalDate,
            currentPeriodStart: sub.currentPeriodStart,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            status: sub.status,
            statusDisplay,
            stripeCustomerId: sub.stripeCustomerId,
            stripeSubscriptionId: sub.stripeSubscriptionId,
            stripeSessionId: sub.stripeSessionId,
            createdAt: sub.createdAt,
            updatedAt: sub.updatedAt,
        };
    }
    getAdminSubscriptions() {
        return __awaiter(this, arguments, void 0, function* (query = {}) {
            try {
                const page = Math.max(1, Number(query.page) || 1);
                const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
                const skip = (page - 1) * limit;
                const where = {};
                // 1. Status Filter
                if (query.status && query.status.trim() !== "") {
                    const raw = query.status.trim().toUpperCase().replace(/\s+|-/g, "_");
                    if (raw !== "ALL") {
                        if (raw === "ACTIVE")
                            where.status = client_1.SubscriptionStatus.ACTIVE;
                        else if (raw === "PENDING")
                            where.status = client_1.SubscriptionStatus.PENDING;
                        else if (raw === "PAST_DUE")
                            where.status = client_1.SubscriptionStatus.PAST_DUE;
                        else if (raw === "CANCELLED" || raw === "CANCELED")
                            where.status = client_1.SubscriptionStatus.CANCELLED;
                        else if (raw === "FAILED" || raw === "EXPIRED")
                            where.status = client_1.SubscriptionStatus.FAILED;
                    }
                }
                // 2. Search Filter (Company Name, Email, CMPId, SUB-1001, Stripe IDs)
                if (query.search && query.search.trim() !== "") {
                    const term = query.search.trim();
                    const orList = [
                        { company: { name: { contains: term } } },
                        { company: { email: { contains: term } } },
                        { company: { CMPId: { contains: term } } },
                        { stripeSubscriptionId: { contains: term } },
                        { stripeCustomerId: { contains: term } },
                        { stripeSessionId: { contains: term } },
                        { uuid: { contains: term } },
                    ];
                    const subMatch = term.match(/sub-?(\d+)/i);
                    if (subMatch && subMatch[1]) {
                        const rawNum = parseInt(subMatch[1], 10);
                        const candidateId = rawNum >= 1000 ? rawNum - 1000 : rawNum;
                        orList.push({ companyId: BigInt(candidateId) });
                        orList.push({ id: BigInt(candidateId) });
                    }
                    else if (!isNaN(Number(term)) && Number.isInteger(Number(term))) {
                        orList.push({ companyId: BigInt(term) });
                        orList.push({ id: BigInt(term) });
                    }
                    where.OR = orList;
                }
                // 3. Date Range Filter
                if (query.startDate || query.endDate) {
                    const dateFilter = {};
                    if (query.startDate) {
                        const start = new Date(query.startDate);
                        if (!isNaN(start.getTime()))
                            dateFilter.gte = start;
                    }
                    if (query.endDate) {
                        const end = new Date(query.endDate);
                        if (!isNaN(end.getTime()))
                            dateFilter.lte = end;
                    }
                    where.currentPeriodEnd = dateFilter;
                }
                // Execute parallel queries for stats, list, and total count
                const [stats, subscriptions, totalCount] = yield Promise.all([
                    this.getSubscriptionStats(),
                    prismaClient_1.default.companySubscription.findMany({
                        where,
                        include: {
                            company: {
                                select: {
                                    id: true,
                                    uuid: true,
                                    name: true,
                                    email: true,
                                    address: true,
                                    mobileNumber: true,
                                    countryCode: true,
                                    CMPId: true,
                                    image: true,
                                    status: true,
                                    isApproved: true,
                                    createdAt: true,
                                    _count: {
                                        select: {
                                            projects: {
                                                where: { isDeleted: false },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: {
                            [query.sortBy || "createdAt"]: query.sortOrder || "desc",
                        },
                        skip,
                        take: limit,
                    }),
                    prismaClient_1.default.companySubscription.count({ where }),
                ]);
                const totalPages = Math.ceil(totalCount / limit);
                const formattedSubscriptions = subscriptions.map((sub) => this.formatSubscriptionRow(sub));
                return {
                    success: true,
                    statusCode: 200,
                    message: "Subscriptions fetched successfully",
                    data: {
                        stats,
                        subscriptions: formattedSubscriptions,
                        list: formattedSubscriptions,
                        pagination: {
                            totalResults: totalCount,
                            totalCount,
                            totalPages,
                            currentPage: page,
                            page,
                            limit,
                            hasNextPage: page < totalPages,
                            hasPrevPage: page > 1,
                        },
                        totalResults: totalCount,
                        totalCount,
                        totalPages,
                        page,
                        limit,
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(error.message || "Failed to fetch subscriptions", 500, "Admin subscriptions fetch failed");
            }
        });
    }
    getAdminSubscriptionDashboard() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this.getSubscriptionStats();
                return {
                    success: true,
                    statusCode: 200,
                    message: "Subscription dashboard stats fetched successfully",
                    data: stats,
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(error.message || "Failed to fetch subscription dashboard stats", 500, "Subscription dashboard stats fetch failed");
            }
        });
    }
    getAdminSubscriptionById(identifier) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g;
            try {
                if (!identifier) {
                    throw new customError_1.CustomError("Identifier is required", 400, "Missing subscription identifier");
                }
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
                const isNumeric = /^\d+$/.test(identifier);
                let whereCondition;
                if (isUuid) {
                    whereCondition = { uuid: identifier };
                }
                else if (isNumeric) {
                    const num = BigInt(identifier);
                    whereCondition = {
                        OR: [{ id: num }, { companyId: num }],
                    };
                }
                else {
                    whereCondition = {
                        OR: [
                            { uuid: identifier },
                            { stripeSubscriptionId: identifier },
                            { stripeCustomerId: identifier },
                            { company: { CMPId: identifier } },
                        ],
                    };
                }
                const subscription = yield prismaClient_1.default.companySubscription.findFirst({
                    where: whereCondition,
                    include: {
                        company: {
                            include: {
                                projects: {
                                    where: { isDeleted: false },
                                    select: {
                                        id: true,
                                        uuid: true,
                                        projectName: true,
                                        clientName: true,
                                        status: true,
                                        startDate: true,
                                        endDate: true,
                                        createdAt: true,
                                    },
                                },
                                _count: {
                                    select: {
                                        projects: {
                                            where: { isDeleted: false },
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
                if (!subscription) {
                    throw new customError_1.CustomError("Subscription not found", 404, "No subscription matching identifier");
                }
                const formatted = this.formatSubscriptionRow(subscription);
                // Fetch live Stripe subscription details if available
                let stripeDetails = null;
                if (subscription.stripeSubscriptionId) {
                    try {
                        const stripeSub = yield stripe.subscriptions.retrieve(subscription.stripeSubscriptionId, { expand: ["latest_invoice", "default_payment_method"] });
                        const invoice = stripeSub.latest_invoice;
                        stripeDetails = {
                            id: stripeSub.id,
                            status: stripeSub.status,
                            cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                            collectionMethod: stripeSub.collection_method,
                            created: new Date(stripeSub.created * 1000),
                            currentPeriodStart: new Date(stripeSub.billing_cycle_anchor * 1000),
                            latestInvoice: invoice && typeof invoice === "object" ? {
                                id: invoice.id,
                                amountPaid: ((_a = invoice.amount_paid) !== null && _a !== void 0 ? _a : 0) / 100,
                                currency: (_b = invoice.currency) === null || _b === void 0 ? void 0 : _b.toUpperCase(),
                                status: invoice.status,
                                hostedInvoiceUrl: invoice.hosted_invoice_url,
                                invoicePdf: invoice.invoice_pdf,
                                number: invoice.number,
                            } : null,
                        };
                    }
                    catch (stripeErr) {
                        console.warn("Could not retrieve live Stripe subscription:", stripeErr.message);
                    }
                }
                const companyIdNum = Number(subscription.companyId);
                const subCode = ((_c = subscription.company) === null || _c === void 0 ? void 0 : _c.CMPId)
                    ? `SUB-${subscription.company.CMPId.replace(/\D/g, "").slice(0, 4) || (1000 + companyIdNum)}`
                    : `SUB-${1000 + companyIdNum}`;
                const invoiceCode = `INV-${1000 + companyIdNum}`;
                const planInfo = this.getPlanDisplayDetails(subscription.planType);
                const statusDisplay = this.getStatusDisplay(subscription.status);
                const startDate = subscription.currentPeriodStart
                    ? new Date(subscription.currentPeriodStart).toISOString().split("T")[0]
                    : subscription.createdAt
                        ? new Date(subscription.createdAt).toISOString().split("T")[0]
                        : null;
                const renewalEndDate = subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toISOString().split("T")[0]
                    : null;
                const invoice = stripeDetails === null || stripeDetails === void 0 ? void 0 : stripeDetails.latestInvoice;
                const isInvoiceConnected = Boolean((invoice === null || invoice === void 0 ? void 0 : invoice.hostedInvoiceUrl) || (invoice === null || invoice === void 0 ? void 0 : invoice.invoicePdf));
                const invoiceLinkText = isInvoiceConnected
                    ? (invoice.hostedInvoiceUrl || invoice.invoicePdf)
                    : "Provider invoice link not connected";
                return {
                    success: true,
                    statusCode: 200,
                    message: "Subscription details fetched successfully",
                    data: Object.assign(Object.assign({}, formatted), { 
                        // Modal Header Section
                        subscriptionCode: subCode, code: subCode, title: "Subscription details", role: "Company Administrator", contactRole: "Company Administrator", contactSubtitle: `Company Administrator · ${((_d = subscription.company) === null || _d === void 0 ? void 0 : _d.email) || ""}`, contactInfo: `Company Administrator · ${((_e = subscription.company) === null || _e === void 0 ? void 0 : _e.email) || ""}`, 
                        // Modal Grid Cards
                        subscriptionPlan: planInfo.planName, planName: planInfo.planName, billingCycle: planInfo.billingCycle, subscriptionAmount: planInfo.priceDisplay, amountFormatted: planInfo.priceDisplay, startDate, currentPeriodStart: startDate, renewalDate: renewalEndDate, endDate: renewalEndDate, renewalEndDate, currentPeriodEnd: renewalEndDate, 
                        // Modal Billing references
                        billingReferences: {
                            invoiceNumber: (invoice === null || invoice === void 0 ? void 0 : invoice.number) || invoiceCode,
                            invoiceReference: "Invoice / receipt reference",
                            invoiceUrl: (invoice === null || invoice === void 0 ? void 0 : invoice.hostedInvoiceUrl) || null,
                            invoicePdf: (invoice === null || invoice === void 0 ? void 0 : invoice.invoicePdf) || null,
                            isConnected: isInvoiceConnected,
                            linkText: invoiceLinkText,
                            displayText: invoiceLinkText,
                            statusText: isInvoiceConnected ? "Connected" : "Provider invoice link not connected",
                        }, invoiceNumber: (invoice === null || invoice === void 0 ? void 0 : invoice.number) || invoiceCode, invoiceReference: "Invoice / receipt reference", invoiceUrl: (invoice === null || invoice === void 0 ? void 0 : invoice.hostedInvoiceUrl) || null, invoicePdf: (invoice === null || invoice === void 0 ? void 0 : invoice.invoicePdf) || null, isInvoiceConnected, invoiceStatusText: invoiceLinkText, 
                        // Modal Administrative status preview
                        administrativeStatus: statusDisplay, administrativeStatusValue: subscription.status, allowedStatuses: [
                            { label: "Active", value: "ACTIVE" },
                            { label: "Pending", value: "PENDING" },
                            { label: "Past due", value: "PAST_DUE" },
                            { label: "Canceled", value: "CANCELLED" },
                            { label: "Expired", value: "FAILED" },
                        ], projects: ((_g = (_f = subscription.company) === null || _f === void 0 ? void 0 : _f.projects) === null || _g === void 0 ? void 0 : _g.map((p) => ({
                            id: p.id.toString(),
                            uuid: p.uuid,
                            projectName: p.projectName,
                            clientName: p.clientName,
                            status: p.status,
                            startDate: p.startDate,
                            endDate: p.endDate,
                            createdAt: p.createdAt,
                        }))) || [], stripeDetails }),
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(error.message || "Failed to fetch subscription details", 500, "Subscription details fetch failed");
            }
        });
    }
    updateAdminSubscriptionStatus(identifier, newStatusRaw) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!identifier) {
                    throw new customError_1.CustomError("Identifier is required", 400, "Missing subscription identifier");
                }
                if (!newStatusRaw) {
                    throw new customError_1.CustomError("Status is required", 400, "Missing status to update");
                }
                const raw = newStatusRaw.trim().toUpperCase().replace(/\s+|-/g, "_");
                let targetStatus;
                if (raw === "ACTIVE")
                    targetStatus = client_1.SubscriptionStatus.ACTIVE;
                else if (raw === "PENDING")
                    targetStatus = client_1.SubscriptionStatus.PENDING;
                else if (raw === "PAST_DUE")
                    targetStatus = client_1.SubscriptionStatus.PAST_DUE;
                else if (raw === "CANCELLED" || raw === "CANCELED")
                    targetStatus = client_1.SubscriptionStatus.CANCELLED;
                else if (raw === "FAILED" || raw === "EXPIRED")
                    targetStatus = client_1.SubscriptionStatus.FAILED;
                else {
                    throw new customError_1.CustomError("Invalid status value", 400, "Allowed: ACTIVE, PENDING, PAST_DUE, CANCELLED, FAILED (or Active, Pending, Past due, Canceled, Expired)");
                }
                const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
                const isNumeric = /^\d+$/.test(identifier);
                let whereCondition;
                if (isUuid) {
                    whereCondition = { uuid: identifier };
                }
                else if (isNumeric) {
                    const num = BigInt(identifier);
                    whereCondition = {
                        OR: [{ id: num }, { companyId: num }],
                    };
                }
                else {
                    whereCondition = {
                        OR: [
                            { uuid: identifier },
                            { stripeSubscriptionId: identifier },
                            { company: { CMPId: identifier } },
                        ],
                    };
                }
                const sub = yield prismaClient_1.default.companySubscription.findFirst({
                    where: whereCondition,
                });
                if (!sub) {
                    throw new customError_1.CustomError("Subscription not found", 404, "No subscription matching identifier");
                }
                const updated = yield prismaClient_1.default.companySubscription.update({
                    where: { id: sub.id },
                    data: {
                        status: targetStatus,
                        cancelAtPeriodEnd: targetStatus === client_1.SubscriptionStatus.CANCELLED ? true : sub.cancelAtPeriodEnd,
                    },
                });
                if (targetStatus === client_1.SubscriptionStatus.ACTIVE) {
                    yield prismaClient_1.default.company.update({
                        where: { id: sub.companyId },
                        data: {
                            isApproved: "APPROVED",
                            status: "ACTIVE",
                        },
                    });
                }
                const statusDisplay = this.getStatusDisplay(targetStatus);
                return {
                    success: true,
                    statusCode: 200,
                    message: `Subscription status updated to ${statusDisplay} successfully`,
                    data: {
                        id: updated.id.toString(),
                        uuid: updated.uuid,
                        companyId: updated.companyId.toString(),
                        status: updated.status,
                        statusDisplay,
                        administrativeStatus: statusDisplay,
                        cancelAtPeriodEnd: updated.cancelAtPeriodEnd,
                        updatedAt: updated.updatedAt,
                    },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(error.message || "Failed to update subscription status", 500, "Subscription status update failed");
            }
        });
    }
}
exports.SubscriptionServices = SubscriptionServices;
