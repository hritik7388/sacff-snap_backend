// src/services/subscriptionServices.ts
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { v4 as uuidv4 } from "uuid";
import { CreateCheckoutSessionDTO } from "../schemas/subscriptionSchema";
import { generateCompanyId, pushNotificationDelhi } from "../helpers/utils";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-09-30.endive" as any,
});

// Helper: get Stripe Price IDs dynamically from env with fallback
function getPriceMap(): Record<"MONTHLY" | "YEARLY", string> {
    const monthly = process.env.STRIPE_MONTHLY_PRICE_ID || "price_1UQMopSGvKUyTYwhHvZyZSi6";
    const yearly = process.env.STRIPE_YEARLY_PRICE_ID || "price_1UQMqRSGvKUyTYwhDY3qClLF";
    return {
        MONTHLY: monthly,
        YEARLY: yearly,
    };
}

// Helper: get subscription period dates from Stripe billing_cycle_anchor & interval
function getPeriodDates(sub: Stripe.Subscription): { periodStart: Date | null; periodEnd: Date | null } {
    // billing_cycle_anchor is the anchor; for current period, we derive from items
    const item = sub.items?.data?.[0];
    const interval = item?.price?.recurring?.interval;
    const anchor = sub.billing_cycle_anchor;

    if (!anchor) return { periodStart: null, periodEnd: null };

    const periodStart = new Date(anchor * 1000);
    const periodEnd = new Date(anchor * 1000);

    if (interval === "month") {
        periodEnd.setMonth(periodEnd.getMonth() + (item?.price?.recurring?.interval_count ?? 1));
    } else if (interval === "year") {
        periodEnd.setFullYear(periodEnd.getFullYear() + (item?.price?.recurring?.interval_count ?? 1));
    }

    return { periodStart, periodEnd };
}

// Helper: get subscription ID from Stripe Invoice.parent
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
    const parent = (invoice as any).parent;
    if (!parent) return null;
    if (parent.type === "subscription_details" && parent.subscription_details?.subscription) {
        return parent.subscription_details.subscription;
    }
    return null;
}

export class SubscriptionServices {
    // ─── 1. Get all available plans (pricing page) ──────────────────────────
    async getPlans() {
        try {
            const priceMap = getPriceMap();
            const [monthlyPrice, yearlyPrice] = await Promise.all([
                stripe.prices.retrieve(priceMap.MONTHLY, { expand: ["product"] }),
                stripe.prices.retrieve(priceMap.YEARLY, { expand: ["product"] }),
            ]);

            const formatPrice = (price: Stripe.Price) => {
                const product = price.product as Stripe.Product;
                return {
                    priceId: price.id,
                    planType: price.recurring?.interval === "month" ? "MONTHLY" : "YEARLY",
                    planName: product.name,
                    description: product.description,
                    amount: (price.unit_amount ?? 0) / 100,
                    currency: price.currency.toUpperCase(),
                    interval: price.recurring?.interval,
                    features: product.metadata?.features
                        ? product.metadata.features.split(",").map((f: string) => f.trim())
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
        } catch (error: any) {
            throw new CustomError(error.message, 500, "Failed to fetch plans from Stripe");
        }
    }

    // ─── 2. Create Stripe Checkout Session (with Company Registration) ─────────
    async createCheckoutSession(data: CreateCheckoutSessionDTO) {
        try {
            const priceMap = getPriceMap();
            const priceId = priceMap[data.planType];
            if (!priceId) {
                throw new CustomError("Invalid plan type", 400, "Plan type must be MONTHLY or YEARLY");
            }

            // 1. Check if company with this email already exists
            let company = await prisma.company.findUnique({
                where: { email: data.email },
            });

            if (company) {
                // Check if already active
                const activeSub = await (prisma as any).companySubscription.findFirst({
                    where: { companyId: company.id, status: "ACTIVE" },
                });

                if (activeSub) {
                    throw new CustomError(
                        "This company email already has an active subscription. Please log in to manage your account.",
                        400,
                        "Active subscription already exists"
                    );
                }
            } else {
                // Register the new company
                const hashedPassword = bcrypt.hashSync(data.password, 10);
                const cmpId = generateCompanyId();

                company = await prisma.company.create({
                    data: {
                        uuid: uuidv4(),
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
                    const superAdmins = await prisma.user.findMany({
                        where: { user_type: "SUPER_ADMIN" },
                        select: { id: true },
                    });

                    if (superAdmins && superAdmins.length > 0) {
                        const superAdmin = superAdmins[0];
                        const superAdminDevice = await prisma.device.findFirst({
                            where: { deviceToken: { not: null } },
                            select: { deviceToken: true },
                        });

                        await prisma.notification.create({
                            data: {
                                uuid: uuidv4(),
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

                        if (superAdminDevice?.deviceToken) {
                            await pushNotificationDelhi(
                                superAdminDevice.deviceToken,
                                "New Company Registered",
                                `A new company "${data.name}" has registered for a subscription (${company.CMPId}).`
                            );
                        }
                    }
                } catch (notifErr) {
                    console.error("SuperAdmin notification skipped:", notifErr);
                }
            }

            const companyId = Number(company.id);

            // 2. Re-use existing Stripe customer or create one
            let stripeCustomerId: string;
            const existingSub = await (prisma as any).companySubscription.findFirst({
                where: { companyId, stripeCustomerId: { not: null } },
                select: { stripeCustomerId: true },
            });

            if (existingSub?.stripeCustomerId) {
                stripeCustomerId = existingSub.stripeCustomerId;
            } else {
                const customer = await stripe.customers.create({
                    email: company.email,
                    name: company.name,
                    metadata: { companyId: companyId.toString() },
                });
                stripeCustomerId = customer.id;
            }

            const successUrl =
                data.successUrl ||
                `${process.env.FRONTEND_URL || "https://scaffsnapp.com"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;

            const cancelUrl =
                data.cancelUrl ||
                `${process.env.FRONTEND_URL || "https://scaffsnapp.com"}/pricing?canceled=true`;

            // 3. Create Stripe Checkout Session
            const session = await stripe.checkout.sessions.create({
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
            } else if (data.planType === "YEARLY") {
                endDate.setFullYear(endDate.getFullYear() + 1);
            }

            // 5. Persist a PENDING subscription record with start & end dates
            await (prisma as any).companySubscription.upsert({
                where: { companyId },
                create: {
                    uuid: uuidv4(),
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
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError(error.message, 500, "Failed to create checkout session");
        }
    }

    // ─── 3. Get company subscription status ─────────────────────────────────
    async getSubscriptionStatus(companyId: number) {
        try {
            const subscription = await (prisma as any).companySubscription.findUnique({
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
        } catch (error: any) {
            throw new CustomError(error.message, 500, "Failed to fetch subscription status");
        }
    }

    // ─── 4. Cancel subscription ──────────────────────────────────────────────
    async cancelSubscription(companyId: number) {
        try {
            const subscription = await (prisma as any).companySubscription.findUnique({
                where: { companyId },
            });

            if (!subscription || !subscription.stripeSubscriptionId) {
                throw new CustomError("No active subscription found", 404, "No active subscription to cancel");
            }

            if (subscription.status !== "ACTIVE") {
                throw new CustomError("Subscription is not active", 400, "Only active subscriptions can be cancelled");
            }

            // Cancel at period end (graceful cancellation)
            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                cancel_at_period_end: true,
            });

            const updated = await (prisma as any).companySubscription.update({
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
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError(error.message, 500, "Failed to cancel subscription");
        }
    }

    // ─── 5. Get checkout session details (for success page) ─────────────────
    async getCheckoutSessionDetails(sessionId: string, companyId?: number) {
        try {
            const session = await stripe.checkout.sessions.retrieve(sessionId, {
                expand: ["line_items", "subscription"],
            });

            if (!session) {
                throw new CustomError("Session not found", 404, "Checkout session not found");
            }

            // Validate if companyId is provided
            if (companyId && session.metadata?.companyId && session.metadata.companyId !== companyId.toString()) {
                throw new CustomError("Unauthorized", 403, "Session does not belong to this company");
            }

            const sub = session.subscription as Stripe.Subscription | null;

            // If payment succeeded, synchronize database to ACTIVE & approve company immediately
            if (session.payment_status === "paid" && session.metadata?.companyId) {
                const targetCompanyId = Number(session.metadata.companyId);
                const planType = (session.metadata.planType ?? "MONTHLY") as "MONTHLY" | "YEARLY";
                const stripeSubId = typeof session.subscription === "string"
                    ? session.subscription
                    : (session.subscription as any)?.id ?? null;

                let periodStart: Date | null = null;
                let periodEnd: Date | null = null;

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
                    } else if (planType === "YEARLY") {
                        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
                    }
                }

                try {
                    await (prisma as any).companySubscription.updateMany({
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

                    await prisma.company.update({
                        where: { id: targetCompanyId },
                        data: {
                            isApproved: "APPROVED",
                            isVerified: true,
                        },
                    });

                    console.log(`✅ Subscription synchronized & ACTIVATED for company ${targetCompanyId}`);
                } catch (dbErr) {
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
                    subscriptionStatus: sub?.status ?? null,
                    planType: session.metadata?.planType,
                    amountTotal: (session.amount_total ?? 0) / 100,
                    currency: session.currency?.toUpperCase(),
                    customerEmail: session.customer_details?.email,
                    lineItems: session.line_items?.data.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        amount: (item.amount_total ?? 0) / 100,
                        currency: item.currency?.toUpperCase(),
                    })),
                },
            };
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError(error.message, 500, "Failed to retrieve session details");
        }
    }

    // ─── 6. Stripe Webhook Handler ───────────────────────────────────────────
    async handleWebhook(rawBody: Buffer, signature: string) {
        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                rawBody,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err: any) {
            throw new CustomError(`Webhook signature verification failed: ${err.message}`, 400, "Invalid webhook signature");
        }

        console.log(`✅ Stripe Webhook received: ${event.type}`);

        switch (event.type) {
            case "checkout.session.completed": {
                await this._handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
                break;
            }
            case "invoice.payment_succeeded": {
                await this._handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
                break;
            }
            case "invoice.payment_failed": {
                await this._handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
                break;
            }
            case "customer.subscription.updated": {
                await this._handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
                break;
            }
            case "customer.subscription.deleted": {
                await this._handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
                break;
            }
            default:
                console.log(`⚠️  Unhandled Stripe event: ${event.type}`);
        }

        return { received: true };
    }

    // ─── Private webhook handlers ────────────────────────────────────────────

    private async _handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
        const companyId = Number(session.metadata?.companyId);
        const planType = (session.metadata?.planType ?? "MONTHLY") as "MONTHLY" | "YEARLY";
        if (!companyId) return;

        // Payment must be paid to provision access
        if (session.payment_status !== "paid") {
            console.log(`⚠️  Checkout session ${session.id} payment_status is not 'paid'. Skipping.`);
            return;
        }

        const stripeSubId = typeof session.subscription === "string"
            ? session.subscription
            : (session.subscription as any)?.id ?? null;

        let periodStart: Date | null = null;
        let periodEnd: Date | null = null;

        if (stripeSubId) {
            const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
            const dates = getPeriodDates(stripeSub);
            periodStart = dates.periodStart;
            periodEnd = dates.periodEnd;
        }

        if (!periodStart || !periodEnd) {
            periodStart = new Date();
            periodEnd = new Date(periodStart);
            if (planType === "MONTHLY") {
                periodEnd.setMonth(periodEnd.getMonth() + 1);
            } else if (planType === "YEARLY") {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }
        }

        await (prisma as any).companySubscription.upsert({
            where: { companyId },
            create: {
                uuid: uuidv4(),
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
        await prisma.company.update({
            where: { id: companyId },
            data: {
                isApproved: "APPROVED",
                isVerified: true,
            },
        });

        console.log(`✅ Subscription ACTIVATED and Company ${companyId} APPROVED`);
    }

    private async _handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
        // Get subscription ID from invoice.parent (new Stripe API)
        const subId = getSubscriptionIdFromInvoice(invoice);
        if (!subId) return;

        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const companyId = Number(stripeSub.metadata?.companyId);
        if (!companyId) return;

        const { periodStart, periodEnd } = getPeriodDates(stripeSub);

        await (prisma as any).companySubscription.updateMany({
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
    }

    private async _handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
        const subId = getSubscriptionIdFromInvoice(invoice);
        if (!subId) return;

        const stripeSub = await stripe.subscriptions.retrieve(subId);
        const companyId = Number(stripeSub.metadata?.companyId);
        if (!companyId) return;

        await (prisma as any).companySubscription.updateMany({
            where: { companyId },
            data: { status: "PAST_DUE" },
        });

        console.log(`⚠️  Invoice payment FAILED for company ${companyId}`);
    }

    private async _handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const companyId = Number(subscription.metadata?.companyId);
        if (!companyId) return;

        const statusMap: Record<string, string> = {
            active: "ACTIVE",
            past_due: "PAST_DUE",
            canceled: "CANCELLED",
            unpaid: "PAST_DUE",
            trialing: "ACTIVE",
            incomplete: "PENDING",
            incomplete_expired: "CANCELLED",
            paused: "PAST_DUE",
        };

        const newStatus = statusMap[subscription.status] ?? "PENDING";
        const { periodStart, periodEnd } = getPeriodDates(subscription);

        await (prisma as any).companySubscription.updateMany({
            where: { companyId },
            data: {
                status: newStatus,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
            },
        });

        console.log(`🔄 Subscription updated for company ${companyId} → ${newStatus}`);
    }

    private async _handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const companyId = Number(subscription.metadata?.companyId);
        if (!companyId) return;

        await (prisma as any).companySubscription.updateMany({
            where: { companyId },
            data: {
                status: "CANCELLED",
                stripeSubscriptionId: subscription.id,
                cancelAtPeriodEnd: false,
            },
        });

        console.log(`❌ Subscription CANCELLED for company ${companyId}`);
    }
}
