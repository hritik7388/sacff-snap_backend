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
exports.RoiServices = exports.SCAFF_ENTERPRISE_CONFIG = void 0;
// src/services/roiServices.ts
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const customError_1 = require("../types/customError");
const uuid_1 = require("uuid");
const responseMessages_1 = require("../constants/responseMessages");
const utils_1 = require("../helpers/utils");
exports.SCAFF_ENTERPRISE_CONFIG = {
    profiles: {
        commercial: {
            label: "Commercial Construction",
            volume: 500,
            wastedLaborHoursPerBuild: 4.5,
            ghostRentalDaysPerBuild: 3.2,
            rebuildRate: 0.08,
            adminHoursPerBuild: 1.5,
            fullyBurdenedLaborRate: 65.0,
            scaffoldRentalCostPerDay: 15.0,
            averageCostPerErection: 3200,
            scaffSnappAnnualCost: 0,
        },
        industrial: {
            label: "Industrial & Heavy Facilities",
            volume: 500,
            wastedLaborHoursPerBuild: 6.5,
            ghostRentalDaysPerBuild: 5.0,
            rebuildRate: 0.12,
            adminHoursPerBuild: 2.5,
            fullyBurdenedLaborRate: 85.0,
            scaffoldRentalCostPerDay: 25.0,
            averageCostPerErection: 5200,
            scaffSnappAnnualCost: 0,
        },
    },
    defaults: {
        wastedLaborHoursPerBuild: 4.5,
        ghostRentalDaysPerBuild: 3.2,
        rebuildRate: 0.08,
        adminHoursPerBuild: 1.5,
        fullyBurdenedLaborRate: 65.0,
        scaffoldRentalCostPerDay: 15.0,
        averageCostPerErection: 3200,
        scaffSnappAnnualCost: 0,
    },
    efficiencies: {
        laborCapture: 0.45,
        rentalCapture: 0.70,
        buildsCapture: 0.40,
        adminCapture: 0.80,
    },
};
class RoiServices {
    // Format currency helper
    formatCurrency(value) {
        return value.toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        });
    }
    // Core Calculation Engine (SCAFF_ENTERPRISE_CONFIG - Zero Magic Numbers)
    computeCalculation(data) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24;
        const inputs = (data === null || data === void 0 ? void 0 : data.inputs) || {};
        const segment = (data.segment ||
            data.profile ||
            inputs.segment ||
            "commercial").toLowerCase();
        const profile = exports.SCAFF_ENTERPRISE_CONFIG.profiles[segment] ||
            exports.SCAFF_ENTERPRISE_CONFIG.profiles.commercial;
        // 1. Resolve inputs with fallback to segment profile defaults
        let volume = (_f = (_e = (_d = (_c = (_b = (_a = data.volume) !== null && _a !== void 0 ? _a : data.annualBuildVolume) !== null && _b !== void 0 ? _b : data.annualScaffoldCount) !== null && _c !== void 0 ? _c : data.scaffolds) !== null && _d !== void 0 ? _d : inputs.volume) !== null && _e !== void 0 ? _e : profile.volume) !== null && _f !== void 0 ? _f : 500;
        if (isNaN(volume) || volume < 1)
            volume = 500;
        volume = Math.max(1, Math.min(volume, 50000));
        const laborRate = Math.max(0, (_m = (_l = (_k = (_j = (_h = (_g = data.laborRate) !== null && _g !== void 0 ? _g : data.fullyBurdenedLaborRate) !== null && _h !== void 0 ? _h : data.hourlyLaborRate) !== null && _j !== void 0 ? _j : data.hourlyRate) !== null && _k !== void 0 ? _k : inputs.labor_rate) !== null && _l !== void 0 ? _l : inputs.laborRate) !== null && _m !== void 0 ? _m : profile.fullyBurdenedLaborRate);
        const rentalRate = Math.max(0, (_t = (_s = (_r = (_q = (_p = (_o = data.rentalRate) !== null && _o !== void 0 ? _o : data.scaffoldRentalCostPerDay) !== null && _p !== void 0 ? _p : data.dailyRentalCost) !== null && _q !== void 0 ? _q : data.dailyCost) !== null && _r !== void 0 ? _r : inputs.rental_rate) !== null && _s !== void 0 ? _s : inputs.rentalRate) !== null && _t !== void 0 ? _t : profile.scaffoldRentalCostPerDay);
        const erectionCost = Math.max(0, (_x = (_w = (_v = (_u = data.erectionCost) !== null && _u !== void 0 ? _u : data.averageCostPerErection) !== null && _v !== void 0 ? _v : inputs.erection_cost) !== null && _w !== void 0 ? _w : inputs.erectionCost) !== null && _x !== void 0 ? _x : profile.averageCostPerErection);
        const laborHours = Math.max(0, (_3 = (_2 = (_1 = (_0 = (_z = (_y = data.laborHours) !== null && _y !== void 0 ? _y : data.wastedLaborHoursPerBuild) !== null && _z !== void 0 ? _z : data.standbyHours) !== null && _0 !== void 0 ? _0 : data.standbyHrs) !== null && _1 !== void 0 ? _1 : inputs.wasted_labor_hours) !== null && _2 !== void 0 ? _2 : inputs.laborHours) !== null && _3 !== void 0 ? _3 : profile.wastedLaborHoursPerBuild);
        const rentalDays = Math.max(0, (_8 = (_7 = (_6 = (_5 = (_4 = data.rentalDays) !== null && _4 !== void 0 ? _4 : data.ghostRentalDaysPerBuild) !== null && _5 !== void 0 ? _5 : data.avgRentalDurationDays) !== null && _6 !== void 0 ? _6 : inputs.ghost_rental_days) !== null && _7 !== void 0 ? _7 : inputs.rentalDays) !== null && _8 !== void 0 ? _8 : profile.ghostRentalDaysPerBuild);
        let rebuildPct = Math.max(0, (_12 = (_11 = (_10 = (_9 = data.rebuildRate) !== null && _9 !== void 0 ? _9 : data.rebuildPct) !== null && _10 !== void 0 ? _10 : inputs.rebuild_rate) !== null && _11 !== void 0 ? _11 : inputs.rebuildRate) !== null && _12 !== void 0 ? _12 : profile.rebuildRate);
        if (rebuildPct > 1)
            rebuildPct = rebuildPct / 100;
        const adminHours = Math.max(0, (_16 = (_15 = (_14 = (_13 = data.adminHours) !== null && _13 !== void 0 ? _13 : data.adminHoursPerBuild) !== null && _14 !== void 0 ? _14 : inputs.admin_hours) !== null && _15 !== void 0 ? _15 : inputs.adminHours) !== null && _16 !== void 0 ? _16 : profile.adminHoursPerBuild);
        const softwareTCO = Math.max(0, (_21 = (_20 = (_19 = (_18 = (_17 = data.softwareTCO) !== null && _17 !== void 0 ? _17 : data.scaffSnappAnnualCost) !== null && _18 !== void 0 ? _18 : inputs.software_tco) !== null && _19 !== void 0 ? _19 : inputs.softwareTCO) !== null && _20 !== void 0 ? _20 : profile.scaffSnappAnnualCost) !== null && _21 !== void 0 ? _21 : 0);
        const crewSize = Math.max(1, (_24 = (_23 = (_22 = data.crewSize) !== null && _22 !== void 0 ? _22 : data.crewSizePerBuild) !== null && _23 !== void 0 ? _23 : inputs.crewSize) !== null && _24 !== void 0 ? _24 : 4);
        // 2. Enterprise Waste Calculations (Losses)
        const laborLoss = Math.round(volume * laborHours * laborRate * 100) / 100;
        const rentalLoss = Math.round(volume * rentalDays * rentalRate * 100) / 100;
        const buildsLoss = Math.round(volume * rebuildPct * erectionCost * 100) / 100;
        const adminLoss = Math.round(volume * adminHours * laborRate * 100) / 100;
        const totalLoss = Math.round((laborLoss + rentalLoss + buildsLoss + adminLoss) * 100) / 100;
        // 3. Enterprise Value Realization / Savings
        const laborSaved = Math.round(laborLoss * exports.SCAFF_ENTERPRISE_CONFIG.efficiencies.laborCapture * 100) / 100;
        const rentalSaved = Math.round(rentalLoss * exports.SCAFF_ENTERPRISE_CONFIG.efficiencies.rentalCapture * 100) / 100;
        const buildsSaved = Math.round(buildsLoss * exports.SCAFF_ENTERPRISE_CONFIG.efficiencies.buildsCapture * 100) / 100;
        const adminSaved = Math.round(adminLoss * exports.SCAFF_ENTERPRISE_CONFIG.efficiencies.adminCapture * 100) / 100;
        const totalSavings = Math.round((laborSaved + rentalSaved + buildsSaved + adminSaved) * 100) / 100;
        const netSavings = Math.round((totalSavings - softwareTCO) * 100) / 100;
        const netROI = softwareTCO > 0
            ? Math.round(((netSavings / softwareTCO) * 100) * 10) / 10
            : 0;
        // 4. Payback Logic
        let paybackPeriodText = "";
        if (softwareTCO === 0) {
            paybackPeriodText = "Immediate";
        }
        else if (netSavings <= 0) {
            paybackPeriodText = "Never";
        }
        else {
            const paybackMonths = parseFloat(((softwareTCO / totalSavings) * 12).toFixed(1));
            paybackPeriodText = `${paybackMonths} Months`;
        }
        // 5. Recovery Breakdown Percentages
        const totalRecovery = totalSavings || 1;
        const laborPercent = Math.round((laborSaved / totalRecovery) * 100);
        const rentalPercent = Math.round((rentalSaved / totalRecovery) * 100);
        const buildsPercent = Math.round((buildsSaved / totalRecovery) * 100);
        const adminPercent = Math.max(0, 100 - laborPercent - rentalPercent - buildsPercent);
        // 6. 12-Month Cumulative Trajectory
        const monthSavings = totalSavings / 12;
        const monthlyTrajectory = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1;
            const cumulative = Math.round(monthSavings * month * 100) / 100;
            return {
                month,
                monthLabel: `M${month}`,
                monthlySavings: Math.round(monthSavings * 100) / 100,
                cumulativeSavings: cumulative,
                formattedCumulative: this.formatCurrency(cumulative),
                percentage: Math.min(100, Math.round((cumulative / (totalSavings || 1)) * 100)),
            };
        });
        // 7. Recommended Plan Tier
        let planName;
        let planPrice;
        let features;
        if (volume < 60) {
            planName = "Starter";
            planPrice = 299;
            features = "Up to 60 scaffolds/yr · Core tracking · Email support";
        }
        else if (volume <= 180) {
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
            segment,
            operationInputs: {
                volume,
                annualBuildVolume: volume,
                annualScaffoldCount: volume,
                laborRate,
                fullyBurdenedLaborRate: laborRate,
                hourlyLaborRate: laborRate,
                rentalRate,
                scaffoldRentalCostPerDay: rentalRate,
                dailyRentalCost: rentalRate,
                erectionCost,
                averageCostPerErection: erectionCost,
                laborHours,
                wastedLaborHoursPerBuild: laborHours,
                standbyHours: laborHours,
                rentalDays,
                ghostRentalDaysPerBuild: rentalDays,
                avgRentalDurationDays: rentalDays,
                rebuildRate: rebuildPct,
                adminHours,
                adminHoursPerBuild: adminHours,
                softwareTCO,
                scaffSnappAnnualCost: softwareTCO,
                crewSizePerBuild: crewSize,
            },
            metrics: {
                lossLabor: laborLoss,
                lossRental: rentalLoss,
                lossErections: buildsLoss,
                lossAdmin: adminLoss,
                totalGrossLoss: totalLoss,
                laborSaved,
                rentalSaved,
                buildsSaved,
                adminSaved,
                recoveredCapital: totalSavings,
                netAnnualSavings: netSavings,
                calculatedROI: netROI,
                paybackPeriod: paybackPeriodText,
                // Backward-compatible aliases
                ghostRentalExposure: rentalLoss,
                standbyLaborLeakage: laborLoss,
                totalAnnualLeakage: totalLoss,
                potentialRecoverableValue: totalSavings,
            },
            formattedMetrics: {
                lossLabor: this.formatCurrency(laborLoss),
                lossRental: this.formatCurrency(rentalLoss),
                lossErections: this.formatCurrency(buildsLoss),
                lossAdmin: this.formatCurrency(adminLoss),
                totalGrossLoss: this.formatCurrency(totalLoss),
                recoveredCapital: this.formatCurrency(totalSavings),
                netAnnualSavings: this.formatCurrency(netSavings),
                calculatedROI: softwareTCO > 0 ? `${netROI.toFixed(1)}%` : "N/A",
                paybackPeriod: paybackPeriodText,
                ghostRentalExposure: this.formatCurrency(rentalLoss),
                standbyLaborLeakage: this.formatCurrency(laborLoss),
                totalAnnualLeakage: this.formatCurrency(totalLoss),
                potentialRecoverableValue: this.formatCurrency(totalSavings),
            },
            recoveryBreakdown: {
                labor: {
                    amount: laborSaved,
                    formatted: this.formatCurrency(laborSaved),
                    percentage: laborPercent,
                    captureRate: exports.SCAFF_ENTERPRISE_CONFIG.efficiencies.laborCapture,
                },
                rental: {
                    amount: rentalSaved,
                    formatted: this.formatCurrency(rentalSaved),
                    percentage: rentalPercent,
                    captureRate: exports.SCAFF_ENTERPRISE_CONFIG.efficiencies.rentalCapture,
                },
                builds: {
                    amount: buildsSaved,
                    formatted: this.formatCurrency(buildsSaved),
                    percentage: buildsPercent,
                    captureRate: exports.SCAFF_ENTERPRISE_CONFIG.efficiencies.buildsCapture,
                },
                admin: {
                    amount: adminSaved,
                    formatted: this.formatCurrency(adminSaved),
                    percentage: adminPercent,
                    captureRate: exports.SCAFF_ENTERPRISE_CONFIG.efficiencies.adminCapture,
                },
                // Compatibility aliases
                ghostRental: {
                    amount: rentalSaved,
                    formatted: this.formatCurrency(rentalSaved),
                    percentage: rentalPercent,
                },
                standbyLabor: {
                    amount: laborSaved,
                    formatted: this.formatCurrency(laborSaved),
                    percentage: laborPercent,
                },
                adminAndRebuild: {
                    amount: Math.round((adminSaved + buildsSaved) * 100) / 100,
                    formatted: this.formatCurrency(Math.round((adminSaved + buildsSaved) * 100) / 100),
                    percentage: Math.min(100, buildsPercent + adminPercent),
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
                const resolvedFirstName = data.firstName && data.firstName.trim().length > 0
                    ? data.firstName.trim()
                    : `Guest User ${Math.floor(100000 + Math.random() * 900000)}`;
                data.firstName = resolvedFirstName;
                // Create record in database
                const roiLead = yield prismaClient_1.default.roiLead.create({
                    data: {
                        uuid: (0, uuid_1.v4)(),
                        firstName: resolvedFirstName,
                        email: data.email || "",
                        company: data.company || "",
                        state: data.state || "",
                        notes: data.notes || null,
                        segment: calculation.segment || data.segment || "commercial",
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
    // ─── 4b. Update ROI Lead Details & Send Email ─────────────────────────────
    updateLead(leadIdentifier, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const targetId = (_a = leadIdentifier !== null && leadIdentifier !== void 0 ? leadIdentifier : data.leadId) !== null && _a !== void 0 ? _a : data.id;
                if (!targetId) {
                    throw new customError_1.CustomError("leadId is required", 400, "Missing leadId in request");
                }
                let existingLead;
                const isNumeric = typeof targetId === "number" ||
                    (!isNaN(Number(targetId)) && typeof targetId === "string" && !targetId.includes("-"));
                if (isNumeric) {
                    existingLead = yield prismaClient_1.default.roiLead.findUnique({
                        where: { id: BigInt(targetId) },
                    });
                }
                else {
                    existingLead = yield prismaClient_1.default.roiLead.findUnique({
                        where: { uuid: String(targetId) },
                    });
                }
                if (!existingLead) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.ROI.NOT_FOUND, 404, "ROI lead does not exist");
                }
                // Check operational inputs for recalculation if updated
                const annualScaffoldCount = data.annualScaffoldCount !== undefined
                    ? data.annualScaffoldCount
                    : existingLead.annualScaffoldCount;
                const avgRentalDurationDays = data.avgRentalDurationDays !== undefined
                    ? data.avgRentalDurationDays
                    : existingLead.avgRentalDurationDays;
                const dailyRentalCost = data.dailyRentalCost !== undefined
                    ? data.dailyRentalCost
                    : existingLead.dailyRentalCost;
                const crewSizePerBuild = data.crewSizePerBuild !== undefined
                    ? data.crewSizePerBuild
                    : existingLead.crewSizePerBuild;
                const hourlyLaborRate = data.hourlyLaborRate !== undefined
                    ? data.hourlyLaborRate
                    : existingLead.hourlyLaborRate;
                const standbyHours = data.standbyHours !== undefined
                    ? data.standbyHours
                    : existingLead.standbyHours;
                // Recalculate ROI metrics with the operational inputs
                const calculation = this.computeCalculation({
                    annualScaffoldCount,
                    avgRentalDurationDays,
                    dailyRentalCost,
                    crewSizePerBuild,
                    hourlyLaborRate,
                    standbyHours,
                });
                // Prepare updated fields
                const updateData = {
                    annualScaffoldCount: calculation.operationInputs.annualScaffoldCount,
                    avgRentalDurationDays: calculation.operationInputs.avgRentalDurationDays,
                    dailyRentalCost: calculation.operationInputs.dailyRentalCost,
                    crewSizePerBuild: calculation.operationInputs.crewSizePerBuild,
                    hourlyLaborRate: calculation.operationInputs.hourlyLaborRate,
                    standbyHours: calculation.operationInputs.standbyHours,
                    ghostRentalExposure: calculation.metrics.ghostRentalExposure,
                    standbyLaborLeakage: calculation.metrics.standbyLaborLeakage,
                    totalAnnualLeakage: calculation.metrics.totalAnnualLeakage,
                    potentialRecoverableValue: calculation.metrics.potentialRecoverableValue,
                    ghostRentalRecovery: calculation.recoveryBreakdown.ghostRental.amount,
                    standbyLaborRecovery: calculation.recoveryBreakdown.standbyLabor.amount,
                    adminRecovery: calculation.recoveryBreakdown.adminAndRebuild.amount,
                    recommendedPlan: calculation.recommendedPlan.planName,
                    recommendedPlanPrice: calculation.recommendedPlan.monthlyPrice,
                    recommendedPlanAnnual: calculation.recommendedPlan.annualPrice,
                };
                if (data.firstName !== undefined && data.firstName !== null) {
                    updateData.firstName = data.firstName.trim();
                }
                if (data.email !== undefined && data.email !== null) {
                    updateData.email = data.email.trim();
                }
                if (data.company !== undefined && data.company !== null) {
                    updateData.company = data.company.trim();
                }
                if (data.state !== undefined && data.state !== null) {
                    updateData.state = data.state.trim();
                }
                if (data.notes !== undefined && data.notes !== null) {
                    updateData.notes = data.notes;
                }
                const updatedLead = yield prismaClient_1.default.roiLead.update({
                    where: { id: existingLead.id },
                    data: updateData,
                });
                // Send calculation email to user if email is provided
                if (updatedLead.email && updatedLead.email.trim().length > 0) {
                    try {
                        yield this.sendLeadEmails({
                            firstName: updatedLead.firstName,
                            email: updatedLead.email,
                            company: updatedLead.company,
                            state: updatedLead.state,
                            notes: updatedLead.notes || "",
                            segment: "commercial",
                            annualScaffoldCount: updatedLead.annualScaffoldCount,
                            avgRentalDurationDays: updatedLead.avgRentalDurationDays,
                            dailyRentalCost: updatedLead.dailyRentalCost,
                            crewSizePerBuild: updatedLead.crewSizePerBuild,
                            hourlyLaborRate: updatedLead.hourlyLaborRate,
                            standbyHours: updatedLead.standbyHours,
                        }, calculation, updatedLead.uuid);
                    }
                    catch (mailErr) {
                        console.error("Non-critical error sending updated ROI calculation email:", mailErr);
                    }
                }
                return {
                    success: true,
                    statusCode: 200,
                    message: responseMessages_1.RESPONSE_MESSAGES.ROI.UPDATE_SUCCESS,
                    data: Object.assign({ leadId: updatedLead.id.toString(), uuid: updatedLead.uuid, leadInfo: {
                            firstName: updatedLead.firstName,
                            email: updatedLead.email,
                            company: updatedLead.company,
                            state: updatedLead.state,
                            notes: updatedLead.notes,
                            status: updatedLead.status,
                            createdAt: updatedLead.createdAt,
                            updatedAt: updatedLead.updatedAt,
                        } }, calculation),
                };
            }
            catch (error) {
                console.error("Error updating ROI lead details:", error);
                if (error instanceof customError_1.CustomError)
                    throw error;
                throw new customError_1.CustomError("Failed to update ROI lead", 500, error.message);
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
            // 1. Email to Lead (Customer - only sent if email is provided)
            if (data.email && data.email.trim().length > 0) {
                const leadHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 28px; border-radius: 12px; border: 1px solid #334155;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${LOGO_URL}" alt="ScaffSnapp" style="height: 48px;" />
          <h2 style="color: #fbbf24; margin: 12px 0 4px;">Your ScaffSnapp Custom Savings Estimate</h2>
          <p style="color: #94a3b8; font-size: 14px; margin: 0;">Prepared for ${data.firstName} at ${data.company || "Your Company"}</p>
        </div>

        <div style="background: #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #fbbf24;">
          <h3 style="margin-top: 0; color: #f8fafc; font-size: 16px;">Enterprise Scaffolding Waste Breakdown (${calc.segment === "industrial" ? "Industrial" : "Commercial"} Profile)</h3>
          <p style="margin: 6px 0; color: #cbd5e1;">👷 <strong>Wasted Standby Labor:</strong> <span style="color: #fb923c;">${calc.formattedMetrics.lossLabor}</span> <span style="color: #4ade80; font-size: 12px;">(Recovers: ${this.formatCurrency(calc.metrics.laborSaved)})</span></p>
          <p style="margin: 6px 0; color: #cbd5e1;">🏗️ <strong>Ghost Rental Fees:</strong> <span style="color: #facc15;">${calc.formattedMetrics.lossRental}</span> <span style="color: #4ade80; font-size: 12px;">(Recovers: ${this.formatCurrency(calc.metrics.rentalSaved)})</span></p>
          <p style="margin: 6px 0; color: #cbd5e1;">🔄 <strong>Redundant Re-Erections:</strong> <span style="color: #38bdf8;">${calc.formattedMetrics.lossErections}</span> <span style="color: #4ade80; font-size: 12px;">(Recovers: ${this.formatCurrency(calc.metrics.buildsSaved)})</span></p>
          <p style="margin: 6px 0; color: #cbd5e1;">📋 <strong>Manual Administrative Labor:</strong> <span style="color: #a78bfa;">${calc.formattedMetrics.lossAdmin}</span> <span style="color: #4ade80; font-size: 12px;">(Recovers: ${this.formatCurrency(calc.metrics.adminSaved)})</span></p>
          <hr style="border: none; border-top: 1px solid #334155; margin: 12px 0;" />
          <p style="margin: 6px 0; color: #cbd5e1;">💰 <strong>Total Gross Annual Loss:</strong> <span style="color: #f87171; font-weight: bold;">${calc.formattedMetrics.totalGrossLoss}</span></p>
          <p style="margin: 12px 0 0; font-size: 18px; font-weight: bold; color: #4ade80;">🎯 <strong>Potential Recoverable Capital:</strong> ${calc.formattedMetrics.recoveredCapital} / year</p>
          ${calc.metrics.paybackPeriod ? `<p style="margin: 4px 0 0; font-size: 13px; color: #94a3b8;">Payback Period: <strong style="color: #f8fafc;">${calc.metrics.paybackPeriod}</strong></p>` : ""}
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
                try {
                    yield utils_1.mailTransporter.sendMail({
                        from: `"ScaffSnapp" <${process.env.SMTP_USER}>`,
                        to: data.email.trim(),
                        subject: `Your Scaffolding ROI Savings Projection — ${data.company || "Estimate"}`,
                        html: leadHtml,
                    });
                }
                catch (custErr) {
                    console.error("Non-critical error sending customer ROI email:", custErr);
                }
            }
            // 2. Email to Admin
            const adminEmail = process.env.SMTP_USER || "admin@scaffsnapp.com";
            const adminHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0284c7; margin-top: 0;">🚀 New ROI Calculator Lead Captured</h2>
        <p><strong>Name:</strong> ${data.firstName}</p>
        <p><strong>Email:</strong> ${data.email || "N/A"}</p>
        <p><strong>Company:</strong> ${data.company || "N/A"}</p>
        <p><strong>State:</strong> ${data.state || "N/A"}</p>
        <p><strong>Notes:</strong> ${data.notes || "N/A"}</p>
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
            // Send admin notification
            if (adminEmail) {
                try {
                    yield utils_1.mailTransporter.sendMail({
                        from: `"ScaffSnapp System" <${process.env.SMTP_USER}>`,
                        to: adminEmail,
                        subject: `[New Lead] ${data.company || data.firstName || "Guest Lead"} — ${calc.formattedMetrics.potentialRecoverableValue} Potential Recovery`,
                        html: adminHtml,
                    });
                }
                catch (adminErr) {
                    console.error("Non-critical error sending admin ROI notification email:", adminErr);
                }
            }
        });
    }
}
exports.RoiServices = RoiServices;
