// src/services/subscriptionServices.ts
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { v4 as uuidv4 } from "uuid";
import { CreateCheckoutSessionDTO, AdminSubscriptionQueryDTO, UpdateSubscriptionStatusDTO } from "../schemas/subscriptionSchema";
import { generateCompanyId, pushNotificationDelhi } from "../helpers/utils";
import { SubscriptionPlan, SubscriptionStatus, Prisma } from "@prisma/client";

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

    // ─── 3. Get company / subAdmin own subscription ──────────────────────────
    async getSubscriptionStatus(companyId: number) {
        try {
            const company = await prisma.company.findUnique({
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
                throw new CustomError("Company not found", 404, "Invalid company ID");
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
            const facilitiesCount = company._count?.projects ?? 0;
            const companyIdNum = Number(company.id);
            const subCode = company.CMPId
                ? `SUB-${company.CMPId.replace(/\D/g, "").slice(0, 4) || (1000 + companyIdNum)}`
                : `SUB-${1000 + companyIdNum}`;
            const invoiceRef = `INV-${1000 + companyIdNum}`;

            const formatDisplayDate = (d: Date | string | null | undefined): string => {
                if (!d) return "";
                const dt = new Date(d);
                if (isNaN(dt.getTime())) return "";
                const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return `${months[dt.getUTCMonth()]} ${dt.getUTCDate()}, ${dt.getUTCFullYear()}`;
            };

            const formatIsoDate = (d: Date | string | null | undefined): string => {
                if (!d) return "";
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
                expMonth: null as number | null,
                expYear: null as number | null,
            };

            let billingHistory: any[] = [];
            let lastPaymentDate = startDateFormatted;
            let lastAmountPaid = planInfo.priceDisplay;
            let lastInvoiceRef = invoiceRef;

            if (subscription.stripeCustomerId) {
                try {
                    const [pmList, invList] = await Promise.all([
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
                        lastAmountPaid = `$${((latest.amount_paid ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        lastInvoiceRef = latest.number || invoiceRef;

                        billingHistory = invList.data.map((inv) => ({
                            id: inv.id,
                            invoice: inv.number || invoiceRef,
                            invoiceNumber: inv.number || invoiceRef,
                            date: formatDisplayDate(new Date(inv.created * 1000)),
                            dateIso: formatIsoDate(new Date(inv.created * 1000)),
                            description: `${planInfo.planName.replace(" Plan", "")} — ${planInfo.billingCycle}`,
                            amount: `$${((inv.amount_paid ?? 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                            amountNumeric: (inv.amount_paid ?? 0) / 100,
                            currency: inv.currency?.toUpperCase() || "USD",
                            status: inv.status === "paid" ? "Paid" : (inv.status ? inv.status.charAt(0).toUpperCase() + inv.status.slice(1) : "Paid"),
                            statusRaw: inv.status,
                            receiptUrl: inv.hosted_invoice_url || inv.invoice_pdf || null,
                            downloadUrl: inv.invoice_pdf || inv.hosted_invoice_url || null,
                            invoicePdf: inv.invoice_pdf || null,
                            hostedInvoiceUrl: inv.hosted_invoice_url || null,
                        }));
                    }
                } catch (stripeErr: any) {
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
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
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

    // ─── Super Admin Subscription Dashboard & Management ─────────────────────

    private getPlanDisplayDetails(planType: SubscriptionPlan | string) {
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

    private getStatusDisplay(status: SubscriptionStatus | string): string {
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

    private async getSubscriptionStats() {
        const [
            totalSubscriptions,
            active,
            pendingPayment,
            pastDue,
            canceled,
            expired,
        ] = await Promise.all([
            prisma.companySubscription.count(),
            prisma.companySubscription.count({ where: { status: "ACTIVE" } }),
            prisma.companySubscription.count({ where: { status: "PENDING" } }),
            prisma.companySubscription.count({ where: { status: "PAST_DUE" } }),
            prisma.companySubscription.count({ where: { status: "CANCELLED" } }),
            prisma.companySubscription.count({ where: { status: "FAILED" } }),
        ]);

        const padZero = (n: number) => (n < 10 ? `0${n}` : `${n}`);

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
    }

    private formatSubscriptionRow(sub: any) {
        const planInfo = this.getPlanDisplayDetails(sub.planType);
        const statusDisplay = this.getStatusDisplay(sub.status);
        const companyIdStr = sub.company?.id?.toString() ?? sub.companyId?.toString() ?? "";
        const subCode = sub.company?.CMPId
            ? `SUB-${sub.company.CMPId.replace(/\D/g, "").slice(0, 4) || (1000 + Number(companyIdStr))}`
            : `SUB-${1000 + Number(companyIdStr || sub.id)}`;

        const renewalDate = sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd).toISOString().split("T")[0]
            : null;

        const facilities = sub.company?._count?.projects ?? 0;

        return {
            id: sub.id.toString(),
            uuid: sub.uuid,
            subscriptionId: sub.id.toString(),
            subscriptionCode: subCode,
            code: subCode,
            companyId: companyIdStr,
            organization: {
                id: companyIdStr,
                uuid: sub.company?.uuid,
                name: sub.company?.name || "Unknown Company",
                code: subCode,
                cmpId: sub.company?.CMPId,
                email: sub.company?.email || "",
                address: sub.company?.address,
                image: sub.company?.image || "",
            },
            company: {
                id: companyIdStr,
                uuid: sub.company?.uuid,
                name: sub.company?.name || "Unknown Company",
                email: sub.company?.email || "",
                address: sub.company?.address,
                mobileNumber: sub.company?.mobileNumber,
                countryCode: sub.company?.countryCode,
                cmpId: sub.company?.CMPId,
                image: sub.company?.image || "",
                status: sub.company?.status,
                isApproved: sub.company?.isApproved,
            },
            name: sub.company?.name || "Unknown Company",
            email: sub.company?.email || "",
            cmpId: sub.company?.CMPId,
            image: sub.company?.image || "",
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

    async getAdminSubscriptions(query: Partial<AdminSubscriptionQueryDTO> = {}) {
        try {
            const page = Math.max(1, Number(query.page) || 1);
            const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
            const skip = (page - 1) * limit;

            const where: Prisma.CompanySubscriptionWhereInput = {};

            // 1. Status Filter
            if (query.status && query.status.trim() !== "") {
                const raw = query.status.trim().toUpperCase().replace(/\s+|-/g, "_");
                if (raw !== "ALL") {
                    if (raw === "ACTIVE") where.status = SubscriptionStatus.ACTIVE;
                    else if (raw === "PENDING") where.status = SubscriptionStatus.PENDING;
                    else if (raw === "PAST_DUE") where.status = SubscriptionStatus.PAST_DUE;
                    else if (raw === "CANCELLED" || raw === "CANCELED") where.status = SubscriptionStatus.CANCELLED;
                    else if (raw === "FAILED" || raw === "EXPIRED") where.status = SubscriptionStatus.FAILED;
                }
            }

            // 2. Search Filter (Company Name, Email, CMPId, SUB-1001, Stripe IDs)
            if (query.search && query.search.trim() !== "") {
                const term = query.search.trim();
                const orList: Prisma.CompanySubscriptionWhereInput[] = [
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
                } else if (!isNaN(Number(term)) && Number.isInteger(Number(term))) {
                    orList.push({ companyId: BigInt(term) });
                    orList.push({ id: BigInt(term) });
                }

                where.OR = orList;
            }

            // 3. Date Range Filter
            if (query.startDate || query.endDate) {
                const dateFilter: Prisma.DateTimeNullableFilter = {};
                if (query.startDate) {
                    const start = new Date(query.startDate);
                    if (!isNaN(start.getTime())) dateFilter.gte = start;
                }
                if (query.endDate) {
                    const end = new Date(query.endDate);
                    if (!isNaN(end.getTime())) dateFilter.lte = end;
                }
                where.currentPeriodEnd = dateFilter;
            }

            // Execute parallel queries for stats, list, and total count
            const [stats, subscriptions, totalCount] = await Promise.all([
                this.getSubscriptionStats(),
                prisma.companySubscription.findMany({
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
                prisma.companySubscription.count({ where }),
            ]);

            const totalPages = Math.ceil(totalCount / limit);
            const formattedSubscriptions = subscriptions.map((sub) =>
                this.formatSubscriptionRow(sub)
            );

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
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError(
                error.message || "Failed to fetch subscriptions",
                500,
                "Admin subscriptions fetch failed"
            );
        }
    }

    async getAdminSubscriptionDashboard() {
        try {
            const stats = await this.getSubscriptionStats();
            return {
                success: true,
                statusCode: 200,
                message: "Subscription dashboard stats fetched successfully",
                data: stats,
            };
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError(
                error.message || "Failed to fetch subscription dashboard stats",
                500,
                "Subscription dashboard stats fetch failed"
            );
        }
    }

    async getAdminSubscriptionById(identifier: string) {
        try {
            if (!identifier) {
                throw new CustomError("Identifier is required", 400, "Missing subscription identifier");
            }

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
            const isNumeric = /^\d+$/.test(identifier);

            let whereCondition: Prisma.CompanySubscriptionWhereInput;

            if (isUuid) {
                whereCondition = { uuid: identifier };
            } else if (isNumeric) {
                const num = BigInt(identifier);
                whereCondition = {
                    OR: [{ id: num }, { companyId: num }],
                };
            } else {
                whereCondition = {
                    OR: [
                        { uuid: identifier },
                        { stripeSubscriptionId: identifier },
                        { stripeCustomerId: identifier },
                        { company: { CMPId: identifier } },
                    ],
                };
            }

            const subscription = await prisma.companySubscription.findFirst({
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
                throw new CustomError("Subscription not found", 404, "No subscription matching identifier");
            }

            const formatted = this.formatSubscriptionRow(subscription);

            // Fetch live Stripe subscription details if available
            let stripeDetails: any = null;
            if (subscription.stripeSubscriptionId) {
                try {
                    const stripeSub = await stripe.subscriptions.retrieve(
                        subscription.stripeSubscriptionId,
                        { expand: ["latest_invoice", "default_payment_method"] }
                    );

                    const invoice = stripeSub.latest_invoice as Stripe.Invoice | null;
                    stripeDetails = {
                        id: stripeSub.id,
                        status: stripeSub.status,
                        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                        collectionMethod: stripeSub.collection_method,
                        created: new Date(stripeSub.created * 1000),
                        currentPeriodStart: new Date(stripeSub.billing_cycle_anchor * 1000),
                        latestInvoice: invoice && typeof invoice === "object" ? {
                            id: invoice.id,
                            amountPaid: (invoice.amount_paid ?? 0) / 100,
                            currency: invoice.currency?.toUpperCase(),
                            status: invoice.status,
                            hostedInvoiceUrl: invoice.hosted_invoice_url,
                            invoicePdf: invoice.invoice_pdf,
                            number: invoice.number,
                        } : null,
                    };
                } catch (stripeErr: any) {
                    console.warn("Could not retrieve live Stripe subscription:", stripeErr.message);
                }
            }

            const companyIdNum = Number(subscription.companyId);
            const subCode = subscription.company?.CMPId
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

            const invoice = stripeDetails?.latestInvoice;
            const isInvoiceConnected = Boolean(invoice?.hostedInvoiceUrl || invoice?.invoicePdf);
            const invoiceLinkText = isInvoiceConnected
                ? (invoice.hostedInvoiceUrl || invoice.invoicePdf)
                : "Provider invoice link not connected";

            return {
                success: true,
                statusCode: 200,
                message: "Subscription details fetched successfully",
                data: {
                    ...formatted,

                    // Modal Header Section
                    subscriptionCode: subCode,
                    code: subCode,
                    title: "Subscription details",
                    role: "Company Administrator",
                    contactRole: "Company Administrator",
                    contactSubtitle: `Company Administrator · ${subscription.company?.email || ""}`,
                    contactInfo: `Company Administrator · ${subscription.company?.email || ""}`,

                    // Modal Grid Cards
                    subscriptionPlan: planInfo.planName,
                    planName: planInfo.planName,
                    billingCycle: planInfo.billingCycle,
                    subscriptionAmount: planInfo.priceDisplay,
                    amountFormatted: planInfo.priceDisplay,
                    startDate,
                    currentPeriodStart: startDate,
                    renewalDate: renewalEndDate,
                    endDate: renewalEndDate,
                    renewalEndDate,
                    currentPeriodEnd: renewalEndDate,

                    // Modal Billing references
                    billingReferences: {
                        invoiceNumber: invoice?.number || invoiceCode,
                        invoiceReference: "Invoice / receipt reference",
                        invoiceUrl: invoice?.hostedInvoiceUrl || null,
                        invoicePdf: invoice?.invoicePdf || null,
                        isConnected: isInvoiceConnected,
                        linkText: invoiceLinkText,
                        displayText: invoiceLinkText,
                        statusText: isInvoiceConnected ? "Connected" : "Provider invoice link not connected",
                    },
                    invoiceNumber: invoice?.number || invoiceCode,
                    invoiceReference: "Invoice / receipt reference",
                    invoiceUrl: invoice?.hostedInvoiceUrl || null,
                    invoicePdf: invoice?.invoicePdf || null,
                    isInvoiceConnected,
                    invoiceStatusText: invoiceLinkText,

                    // Modal Administrative status preview
                    administrativeStatus: statusDisplay,
                    administrativeStatusValue: subscription.status,
                    allowedStatuses: [
                        { label: "Active", value: "ACTIVE" },
                        { label: "Pending", value: "PENDING" },
                        { label: "Past due", value: "PAST_DUE" },
                        { label: "Canceled", value: "CANCELLED" },
                        { label: "Expired", value: "FAILED" },
                    ],

                    projects: (subscription.company as any)?.projects?.map((p: any) => ({
                        id: p.id.toString(),
                        uuid: p.uuid,
                        projectName: p.projectName,
                        clientName: p.clientName,
                        status: p.status,
                        startDate: p.startDate,
                        endDate: p.endDate,
                        createdAt: p.createdAt,
                    })) || [],
                    stripeDetails,
                },
            };
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError(
                error.message || "Failed to fetch subscription details",
                500,
                "Subscription details fetch failed"
            );
        }
    }

    async updateAdminSubscriptionStatus(identifier: string, newStatusRaw: string) {
        try {
            if (!identifier) {
                throw new CustomError("Identifier is required", 400, "Missing subscription identifier");
            }
            if (!newStatusRaw) {
                throw new CustomError("Status is required", 400, "Missing status to update");
            }

            const raw = newStatusRaw.trim().toUpperCase().replace(/\s+|-/g, "_");
            let targetStatus: SubscriptionStatus;

            if (raw === "ACTIVE") targetStatus = SubscriptionStatus.ACTIVE;
            else if (raw === "PENDING") targetStatus = SubscriptionStatus.PENDING;
            else if (raw === "PAST_DUE") targetStatus = SubscriptionStatus.PAST_DUE;
            else if (raw === "CANCELLED" || raw === "CANCELED") targetStatus = SubscriptionStatus.CANCELLED;
            else if (raw === "FAILED" || raw === "EXPIRED") targetStatus = SubscriptionStatus.FAILED;
            else {
                throw new CustomError(
                    "Invalid status value",
                    400,
                    "Allowed: ACTIVE, PENDING, PAST_DUE, CANCELLED, FAILED (or Active, Pending, Past due, Canceled, Expired)"
                );
            }

            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
            const isNumeric = /^\d+$/.test(identifier);

            let whereCondition: Prisma.CompanySubscriptionWhereInput;
            if (isUuid) {
                whereCondition = { uuid: identifier };
            } else if (isNumeric) {
                const num = BigInt(identifier);
                whereCondition = {
                    OR: [{ id: num }, { companyId: num }],
                };
            } else {
                whereCondition = {
                    OR: [
                        { uuid: identifier },
                        { stripeSubscriptionId: identifier },
                        { company: { CMPId: identifier } },
                    ],
                };
            }

            const sub = await prisma.companySubscription.findFirst({
                where: whereCondition,
            });

            if (!sub) {
                throw new CustomError("Subscription not found", 404, "No subscription matching identifier");
            }

            const updated = await prisma.companySubscription.update({
                where: { id: sub.id },
                data: {
                    status: targetStatus,
                    cancelAtPeriodEnd: targetStatus === SubscriptionStatus.CANCELLED ? true : sub.cancelAtPeriodEnd,
                },
            });

            if (targetStatus === SubscriptionStatus.ACTIVE) {
                await prisma.company.update({
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
        } catch (error: any) {
            if (error instanceof CustomError) throw error;
            throw new CustomError(
                error.message || "Failed to update subscription status",
                500,
                "Subscription status update failed"
            );
        }
    }
}
