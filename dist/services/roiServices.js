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
exports.RoiServices = void 0;
// src/services/roiServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
class RoiServices {
    // Format currency helper
    formatCurrency(value) {
        return value.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });
    }
    // Core Calculation Engine
    computeCalculation(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        // 1. Resolve inputs with fallback to defaults or aliases
        const scaffolds = Math.max(0, (_b = (_a = data.annualScaffoldCount) !== null && _a !== void 0 ? _a : data.scaffolds) !== null && _b !== void 0 ? _b : 120);
        const rentalDays = Math.max(0, (_d = (_c = data.avgRentalDurationDays) !== null && _c !== void 0 ? _c : data.rentalDays) !== null && _d !== void 0 ? _d : 18);
        const dailyCost = Math.max(0, (_f = (_e = data.dailyRentalCost) !== null && _e !== void 0 ? _e : data.dailyCost) !== null && _f !== void 0 ? _f : 480);
        const crewSize = Math.max(0, (_h = (_g = data.crewSizePerBuild) !== null && _g !== void 0 ? _g : data.crewSize) !== null && _h !== void 0 ? _h : 4);
        const hourlyRate = Math.max(0, (_k = (_j = data.hourlyLaborRate) !== null && _j !== void 0 ? _j : data.hourlyRate) !== null && _k !== void 0 ? _k : 68);
        const standbyHrs = Math.max(0, (_m = (_l = data.standbyHours) !== null && _l !== void 0 ? _l : data.standbyHrs) !== null && _m !== void 0 ? _m : 6);
        // 2. Primary Economic Leakage Formulas
        // Ghost rental: scaffolds * rentalDays * dailyCost * 21%
        const ghostRental = Math.round(scaffolds * rentalDays * dailyCost * 0.21 * 100) / 100;
        // Standby labor: scaffolds * standbyHrs * crewSize * hourlyRate
        const standbyLabor = Math.round(scaffolds * standbyHrs * crewSize * hourlyRate * 100) / 100;
        // Admin overhead benchmark: scaffolds * $1,200
        const adminOverhead = Math.round(scaffolds * 1200 * 100) / 100;
        const totalLeakage = Math.round((ghostRental + standbyLabor + adminOverhead) * 100) / 100;
        // Recoverable at conservative 35% capture rate with ScaffSnapp
        const recoverable = Math.round(totalLeakage * 0.35 * 100) / 100;
        // 3. Recovery Breakdown
        const ghostRecovery = Math.round(ghostRental * 0.35 * 100) / 100;
        const standbyRecovery = Math.round(standbyLabor * 0.35 * 100) / 100;
        const adminRecovery = Math.round(adminOverhead * 0.35 * 100) / 100;
        const totalRecovery = ghostRecovery + standbyRecovery + adminRecovery || 1;
        const ghostPercent = Math.round((ghostRecovery / totalRecovery) * 100);
        const standbyPercent = Math.round((standbyRecovery / totalRecovery) * 100);
        const adminPercent = Math.max(0, 100 - ghostPercent - standbyPercent);
        // 4. 12-Month Cumulative Trajectory
        const monthSavings = recoverable / 12;
        const monthlyTrajectory = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const cumulative = Math.round(monthSavings * month * 100) / 100;
            return {
                month,
                monthLabel: `M${month}`,
                monthlySavings: Math.round(monthSavings * 100) / 100,
                cumulativeSavings: cumulative,
                formattedCumulative: this.formatCurrency(cumulative),
                percentage: Math.min(100, Math.round((cumulative / (recoverable || 1)) * 100)),
            };
        });
        // 5. Recommended Plan Tier
        let planName;
        let planPrice;
        let features;
        if (scaffolds < 60) {
            planName = "Starter";
            planPrice = 299;
            features = "Up to 60 scaffolds/yr · Core tracking · Email support";
        }
        else if (scaffolds <= 180) {
            planName = "Professional";
            planPrice = 599;
            features = "Up to 180 scaffolds/yr · Full analytics · Priority support";
        }
        else {
            planName = "Enterprise";
            planPrice = 999;
            features = "Unlimited scaffolds · Custom integrations · Dedicated CSM";
        }
        const annualPrice = planPrice * 12;
        return {
            operationInputs: {
                annualScaffoldCount: scaffolds,
                avgRentalDurationDays: rentalDays,
                dailyRentalCost: dailyCost,
                crewSizePerBuild: crewSize,
                hourlyLaborRate: hourlyRate,
                standbyHours: standbyHrs,
            },
            metrics: {
                ghostRentalExposure: ghostRental,
                standbyLaborLeakage: standbyLabor,
                totalAnnualLeakage: totalLeakage,
                potentialRecoverableValue: recoverable,
            },
            formattedMetrics: {
                ghostRentalExposure: this.formatCurrency(ghostRental),
                standbyLaborLeakage: this.formatCurrency(standbyLabor),
                totalAnnualLeakage: this.formatCurrency(totalLeakage),
                potentialRecoverableValue: this.formatCurrency(recoverable),
            },
            recoveryBreakdown: {
                ghostRental: {
                    amount: ghostRecovery,
                    formatted: this.formatCurrency(ghostRecovery),
                    percentage: ghostPercent,
                },
                standbyLabor: {
                    amount: standbyRecovery,
                    formatted: this.formatCurrency(standbyRecovery),
                    percentage: standbyPercent,
                },
                adminAndRebuild: {
                    amount: adminRecovery,
                    formatted: this.formatCurrency(adminRecovery),
                    percentage: adminPercent,
                },
            },
            monthlyTrajectory,
            recommendedPlan: {
                planName,
                monthlyPrice: planPrice,
                annualPrice,
                formattedMonthly: this.formatCurrency(planPrice) + "/month",
                formattedAnnual: this.formatCurrency(annualPrice) + "/year",
                features,
            },
        };
    }
    // ─── 1. Submit Lead & Unlock Results (Public API) ────────────────────────────
    submitLead(data, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const calculation = this.computeCalculation(data);
                // Create record in database
                const roiLead = yield prismaClient_1.default.roiLead.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        firstName: data.firstName,
                        email: data.email,
                        company: data.company,
                        state: data.state,
                        notes: data.notes || null,
                        // Operation inputs
                        annualScaffoldCount: calculation.operationInputs.annualScaffoldCount,
                        avgRentalDurationDays: calculation.operationInputs.avgRentalDurationDays,
                        dailyRentalCost: calculation.operationInputs.dailyRentalCost,
                        crewSizePerBuild: calculation.operationInputs.crewSizePerBuild,
                        hourlyLaborRate: calculation.operationInputs.hourlyLaborRate,
                        standbyHours: calculation.operationInputs.standbyHours,
                        // Calculated results
                        ghostRentalExposure: calculation.metrics.ghostRentalExposure,
                        standbyLaborLeakage: calculation.metrics.standbyLaborLeakage,
                        totalAnnualLeakage: calculation.metrics.totalAnnualLeakage,
                        potentialRecoverableValue: calculation.metrics.potentialRecoverableValue,
                        // Breakdown & Recommendation
                        ghostRentalRecovery: calculation.recoveryBreakdown.ghostRental.amount,
                        standbyLaborRecovery: calculation.recoveryBreakdown.standbyLabor.amount,
                        adminRecovery: calculation.recoveryBreakdown.adminAndRebuild.amount,
                        recommendedPlan: calculation.recommendedPlan.planName,
                        recommendedPlanPrice: calculation.recommendedPlan.monthlyPrice,
                        recommendedPlanAnnual: calculation.recommendedPlan.annualPrice,
                        ipAddress: (meta === null || meta === void 0 ? void 0 : meta.ip) || null,
                        userAgent: (meta === null || meta === void 0 ? void 0 : meta.userAgent) || null,
                    },
                });
                // Send email notifications asynchronously (non-blocking)
                this.sendLeadEmails(data, calculation, roiLead.uuid).catch((err) => {
                    console.error("Non-critical error sending ROI lead notification emails:", err);
                });
                return {
                    success: true,
                    statusCode: 201,
                    message: responseMessages_1.RESPONSE_MESSAGES.ROI.SUBMIT_SUCCESS,
                    data: Object.assign({ leadId: roiLead.id.toString(), uuid: roiLead.uuid, leadInfo: {
                            firstName: roiLead.firstName,
                            email: roiLead.email,
                            company: roiLead.company,
                            state: roiLead.state,
                            createdAt: roiLead.createdAt,
                        } }, calculation),
                };
            }
            catch (error) {
                console.error("Error creating ROI lead submission:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.ROI.SUBMIT_FAILED, 500, error.message);
            }
        });
    }
    // ─── 2. Get All ROI Leads (Super Admin) ──────────────────────────────────────
    getLeads(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { page = 1, limit = 10, search, status, state, startDate, endDate, sortBy = "createdAt", sortOrder = "desc", } = query;
                const skip = (page - 1) * limit;
                const where = {};
                if (status) {
                    where.status = status;
                }
                if (state) {
                    where.state = { contains: state };
                }
                if (search) {
                    where.OR = [
                        { firstName: { contains: search } },
                        { email: { contains: search } },
                        { company: { contains: search } },
                        { state: { contains: search } },
                    ];
                }
                if (startDate || endDate) {
                    where.createdAt = {};
                    if (startDate)
                        where.createdAt.gte = new Date(startDate);
                    if (endDate)
                        where.createdAt.lte = new Date(endDate);
                }
                const [total, leads, aggregations] = yield Promise.all([
                    prismaClient_1.default.roiLead.count({ where }),
                    prismaClient_1.default.roiLead.findMany({
                        where,
                        skip,
                        take: limit,
                        orderBy: { [sortBy]: sortOrder },
                    }),
                    prismaClient_1.default.roiLead.aggregate({
                        where,
                        _sum: {
                            totalAnnualLeakage: true,
                            potentialRecoverableValue: true,
                        },
                        _avg: {
                            potentialRecoverableValue: true,
                            annualScaffoldCount: true,
                        },
                    }),
                ]);
                const formattedLeads = leads.map((lead) => ({
                    id: lead.id.toString(),
                    uuid: lead.uuid,
                    firstName: lead.firstName,
                    email: lead.email,
                    company: lead.company,
                    state: lead.state,
                    status: lead.status,
                    notes: lead.notes,
                    annualScaffoldCount: lead.annualScaffoldCount,
                    avgRentalDurationDays: lead.avgRentalDurationDays,
                    dailyRentalCost: lead.dailyRentalCost,
                    crewSizePerBuild: lead.crewSizePerBuild,
                    hourlyLaborRate: lead.hourlyLaborRate,
                    standbyHours: lead.standbyHours,
                    ghostRentalExposure: lead.ghostRentalExposure,
                    formattedGhostRental: this.formatCurrency(lead.ghostRentalExposure),
                    standbyLaborLeakage: lead.standbyLaborLeakage,
                    formattedStandbyLabor: this.formatCurrency(lead.standbyLaborLeakage),
                    totalAnnualLeakage: lead.totalAnnualLeakage,
                    formattedTotalLeakage: this.formatCurrency(lead.totalAnnualLeakage),
                    potentialRecoverableValue: lead.potentialRecoverableValue,
                    formattedRecoverable: this.formatCurrency(lead.potentialRecoverableValue),
                    recommendedPlan: lead.recommendedPlan,
                    recommendedPlanPrice: lead.recommendedPlanPrice,
                    createdAt: lead.createdAt,
                    updatedAt: lead.updatedAt,
                }));
                return {
                    success: true,
                    statusCode: 200,
                    message: responseMessages_1.RESPONSE_MESSAGES.ROI.FETCH_ALL_SUCCESS,
                    data: {
                        leads: formattedLeads,
                        pagination: {
                            total,
                            page,
                            limit,
                            totalPages: Math.ceil(total / limit),
                        },
                        summary: {
                            totalLeadsCount: total,
                            totalLeakageSum: aggregations._sum.totalAnnualLeakage || 0,
                            formattedTotalLeakage: this.formatCurrency(aggregations._sum.totalAnnualLeakage || 0),
                            totalRecoverableSum: aggregations._sum.potentialRecoverableValue || 0,
                            formattedTotalRecoverable: this.formatCurrency(aggregations._sum.potentialRecoverableValue || 0),
                            avgRecoverable: Math.round((aggregations._avg.potentialRecoverableValue || 0) * 100) / 100,
                            formattedAvgRecoverable: this.formatCurrency(aggregations._avg.potentialRecoverableValue || 0),
                        },
                    },
                };
            }
            catch (error) {
                console.error("Error fetching ROI leads:", error);
                throw new customError_1.CustomError("Failed to fetch ROI leads", 500, error.message);
            }
        });
    }
    // ─── 3. Get Lead by ID (Super Admin) ─────────────────────────────────────────
    getLeadById(idOrUuid) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let lead;
                if (typeof idOrUuid === "number" || !isNaN(Number(idOrUuid))) {
                    lead = yield prismaClient_1.default.roiLead.findUnique({
                        where: { id: BigInt(idOrUuid) },
                    });
                }
                else {
                    lead = yield prismaClient_1.default.roiLead.findUnique({
                        where: { uuid: idOrUuid },
                    });
                }
                if (!lead) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.ROI.NOT_FOUND, 404, "ROI lead does not exist");
                }
                // Recompute rich breakdown and trajectory
                const fullCalculation = this.computeCalculation({
                    annualScaffoldCount: lead.annualScaffoldCount,
                    avgRentalDurationDays: lead.avgRentalDurationDays,
                    dailyRentalCost: lead.dailyRentalCost,
                    crewSizePerBuild: lead.crewSizePerBuild,
                    hourlyLaborRate: lead.hourlyLaborRate,
                    standbyHours: lead.standbyHours,
                });
                return {
                    success: true,
                    statusCode: 200,
                    message: responseMessages_1.RESPONSE_MESSAGES.ROI.FETCH_BY_ID_SUCCESS,
                    data: Object.assign({ id: lead.id.toString(), uuid: lead.uuid, firstName: lead.firstName, email: lead.email, company: lead.company, state: lead.state, status: lead.status, notes: lead.notes, ipAddress: lead.ipAddress, userAgent: lead.userAgent, createdAt: lead.createdAt, updatedAt: lead.updatedAt }, fullCalculation),
                };
            }
            catch (error) {
                console.error("Error fetching ROI lead by id:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to fetch ROI lead details", 500, error.message);
            }
        });
    }
    // ─── 4. Update ROI Lead Status (Super Admin) ─────────────────────────────────
    updateLeadStatus(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existing = yield prismaClient_1.default.roiLead.findUnique({
                    where: { id: BigInt(id) },
                });
                if (!existing) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.ROI.NOT_FOUND, 404, "ROI lead not found");
                }
                const updated = yield prismaClient_1.default.roiLead.update({
                    where: { id: BigInt(id) },
                    data: Object.assign({ status: data.status }, (data.notes !== undefined ? { notes: data.notes } : {})),
                });
                return {
                    success: true,
                    statusCode: 200,
                    message: responseMessages_1.RESPONSE_MESSAGES.ROI.UPDATE_STATUS_SUCCESS,
                    data: {
                        id: updated.id.toString(),
                        uuid: updated.uuid,
                        status: updated.status,
                        notes: updated.notes,
                        updatedAt: updated.updatedAt,
                    },
                };
            }
            catch (error) {
                console.error("Error updating ROI lead status:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to update ROI lead status", 500, error.message);
            }
        });
    }
    // ─── 5. Delete ROI Lead (Super Admin) ────────────────────────────────────────
    deleteLead(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const existing = yield prismaClient_1.default.roiLead.findUnique({
                    where: { id: BigInt(id) },
                });
                if (!existing) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.ROI.NOT_FOUND, 404, "ROI lead not found");
                }
                yield prismaClient_1.default.roiLead.delete({
                    where: { id: BigInt(id) },
                });
                return {
                    success: true,
                    statusCode: 200,
                    message: responseMessages_1.RESPONSE_MESSAGES.ROI.DELETE_SUCCESS,
                };
            }
            catch (error) {
                console.error("Error deleting ROI lead:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to delete ROI lead", 500, error.message);
            }
        });
    }
    // ─── 6. Analytics & Dashboard Statistics (Super Admin) ───────────────────────
    getAnalytics() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                const [totalLeads, leadsThisMonth, leadsThisWeek, aggregates, statusGrouping, planGrouping, stateGrouping,] = yield Promise.all([
                    prismaClient_1.default.roiLead.count(),
                    prismaClient_1.default.roiLead.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
                    prismaClient_1.default.roiLead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
                    prismaClient_1.default.roiLead.aggregate({
                        _sum: {
                            totalAnnualLeakage: true,
                            potentialRecoverableValue: true,
                            ghostRentalExposure: true,
                            standbyLaborLeakage: true,
                        },
                        _avg: {
                            potentialRecoverableValue: true,
                            annualScaffoldCount: true,
                        },
                    }),
                    prismaClient_1.default.roiLead.groupBy({
                        by: ["status"],
                        _count: { _all: true },
                    }),
                    prismaClient_1.default.roiLead.groupBy({
                        by: ["recommendedPlan"],
                        _count: { _all: true },
                    }),
                    prismaClient_1.default.roiLead.groupBy({
                        by: ["state"],
                        _count: { _all: true },
                        orderBy: { _count: { state: "desc" } },
                        take: 10,
                    }),
                ]);
                const statusMap = {
                    NEW: 0,
                    CONTACTED: 0,
                    QUALIFIED: 0,
                    CONVERTED: 0,
                    CLOSED: 0,
                };
                statusGrouping.forEach((s) => {
                    statusMap[s.status] = s._count._all;
                });
                const planMap = {
                    Starter: 0,
                    Professional: 0,
                    Enterprise: 0,
                };
                planGrouping.forEach((p) => {
                    if (p.recommendedPlan)
                        planMap[p.recommendedPlan] = p._count._all;
                });
                return {
                    success: true,
                    statusCode: 200,
                    message: responseMessages_1.RESPONSE_MESSAGES.ROI.ANALYTICS_SUCCESS,
                    data: {
                        overview: {
                            totalLeads,
                            leadsThisMonth,
                            leadsThisWeek,
                            totalEstimatedLeakage: aggregates._sum.totalAnnualLeakage || 0,
                            formattedTotalLeakage: this.formatCurrency(aggregates._sum.totalAnnualLeakage || 0),
                            totalPotentialRecoverable: aggregates._sum.potentialRecoverableValue || 0,
                            formattedTotalRecoverable: this.formatCurrency(aggregates._sum.potentialRecoverableValue || 0),
                            avgRecoverableSavings: Math.round((aggregates._avg.potentialRecoverableValue || 0) * 100) / 100,
                            formattedAvgRecoverable: this.formatCurrency(aggregates._avg.potentialRecoverableValue || 0),
                            avgScaffoldCount: Math.round((aggregates._avg.annualScaffoldCount || 0) * 10) / 10,
                        },
                        byStatus: statusMap,
                        byRecommendedPlan: planMap,
                        topStates: stateGrouping.map((st) => ({
                            state: st.state,
                            leadCount: st._count._all,
                        })),
                    },
                };
            }
            catch (error) {
                console.error("Error fetching ROI analytics:", error);
                throw new customError_1.CustomError("Failed to fetch ROI analytics", 500, error.message);
            }
        });
    }
    // ─── Private: Email Dispatch ────────────────────────────────────────────────
    sendLeadEmails(data, calc, leadUuid) {
        return __awaiter(this, void 0, void 0, function* () {
            const LOGO_URL = "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";
            // 1. Email to Lead (Customer)
            const leadHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 12px; border: 1px solid #334155;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${LOGO_URL}" alt="ScaffSnapp" style="height: 48px;" />
          <h2 style="color: #fbbf24; margin: 12px 0 4px;">Your ScaffSnapp Custom Savings Estimate</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Prepared for ${data.firstName} at ${data.company}</p>
        </div>

        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #fbbf24;">
          <h3 style="margin-top: 0; color: #f8fafc; font-size: 16px;">Key Findings</h3>
          <p style="margin: 6px 0; color: #cbd5e1;">🏗️ <strong>Est. Ghost Rental Exposure:</strong> <span style="color: #fb923c;">${calc.formattedMetrics.ghostRentalExposure}</span></p>
          <p style="margin: 6px 0; color: #cbd5e1;">👷 <strong>Est. Standby Labor Leakage:</strong> <span style="color: #facc15;">${calc.formattedMetrics.standbyLaborLeakage}</span></p>
          <p style="margin: 6px 0; color: #cbd5e1;">💰 <strong>Total Est. Annual Leakage:</strong> <span style="color: #f87171;">${calc.formattedMetrics.totalAnnualLeakage}</span></p>
          <p style="margin: 12px 0 0; font-size: 18px; font-weight: bold; color: #4ade80;">🎯 <strong>Potential Recoverable Value:</strong> ${calc.formattedMetrics.potentialRecoverableValue} / year</p>
        </div>

        <div style="background: #1e293b; padding: 18px; border-radius: 8px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 8px; color: #fbbf24;">Recommended Package: ${calc.recommendedPlan.planName} Plan</h4>
          <p style="margin: 4px 0; color: #cbd5e1;">${calc.recommendedPlan.formattedMonthly} · ${calc.recommendedPlan.formattedAnnual}</p>
          <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">${calc.recommendedPlan.features}</p>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <p style="color: #94a3b8; font-size: 13px;">Ready to stop rental leakage and recover up to ${calc.formattedMetrics.potentialRecoverableValue}?</p>
          <p style="color: #64748b; font-size: 11px; margin-top: 20px;">Ref ID: ${leadUuid} · ScaffSnapp Industrial Intelligence</p>
        </div>
      </div>
    `;
            // 2. Email to Admin
            const adminEmail = process.env.SMTP_USER || "admin@scaffsnapp.com";
            const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0284c7; margin-top: 0;">🚀 New ROI Calculator Lead Captured</h2>
        <p><strong>Name:</strong> ${data.firstName}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Company:</strong> ${data.company}</p>
        <p><strong>State:</strong> ${data.state}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <h3>Operational Profile</h3>
        <ul>
          <li><strong>Annual Scaffolds:</strong> ${calc.operationInputs.annualScaffoldCount}</li>
          <li><strong>Avg Duration:</strong> ${calc.operationInputs.avgRentalDurationDays} days</li>
          <li><strong>Daily Cost:</strong> $${calc.operationInputs.dailyRentalCost}</li>
          <li><strong>Crew Size:</strong> ${calc.operationInputs.crewSizePerBuild} workers</li>
          <li><strong>Labor Rate:</strong> $${calc.operationInputs.hourlyLaborRate}/hr</li>
          <li><strong>Standby Hours:</strong> ${calc.operationInputs.standbyHours} hrs</li>
        </ul>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
        <h3>Financial Projections</h3>
        <ul>
          <li><strong>Total Annual Leakage:</strong> ${calc.formattedMetrics.totalAnnualLeakage}</li>
          <li><strong>Potential Recoverable:</strong> <span style="color: #16a34a; font-weight: bold;">${calc.formattedMetrics.potentialRecoverableValue}</span></li>
          <li><strong>Recommended Tier:</strong> ${calc.recommendedPlan.planName} (${calc.recommendedPlan.formattedMonthly})</li>
        </ul>
        <p style="font-size: 12px; color: #64748b;">Lead UUID: ${leadUuid}</p>
      </div>
    `;
            // Send customer email
            yield utils_1.mailTransporter.sendMail({
                from: `"ScaffSnapp" <${process.env.SMTP_USER}>`,
                to: data.email,
                subject: `Your Scaffolding ROI Savings Projection — ${data.company}`,
                html: leadHtml,
            });
            // Send admin notification
            if (adminEmail) {
                yield utils_1.mailTransporter.sendMail({
                    from: `"ScaffSnapp System" <${process.env.SMTP_USER}>`,
                    to: adminEmail,
                    subject: `[New Lead] ${data.company} — ${calc.formattedMetrics.potentialRecoverableValue} Potential Recovery`,
                    html: adminHtml,
                });
            }
        });
    }
}
exports.RoiServices = RoiServices;
