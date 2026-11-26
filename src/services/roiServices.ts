// src/services/roiServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { v4 as uuidv4 } from "uuid";
import {
  SubmitRoiLeadDTO,
  AdminRoiQueryDTO,
  UpdateRoiStatusDTO,
  UpdateRoiLeadDTO,
} from "../schemas/roiSchema";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { mailTransporter } from "../helpers/utils";
import { Prisma, RoiLeadStatus } from "@prisma/client";

export const SCAFF_ENTERPRISE_CONFIG = {
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

export interface RoiCalculationResult {
  segment: "commercial" | "industrial";
  operationInputs: {
    volume: number;
    annualBuildVolume: number;
    annualScaffoldCount: number;
    laborRate: number;
    fullyBurdenedLaborRate: number;
    hourlyLaborRate: number;
    rentalRate: number;
    scaffoldRentalCostPerDay: number;
    dailyRentalCost: number;
    erectionCost: number;
    averageCostPerErection: number;
    laborHours: number;
    wastedLaborHoursPerBuild: number;
    standbyHours: number;
    rentalDays: number;
    ghostRentalDaysPerBuild: number;
    avgRentalDurationDays: number;
    rebuildRate: number;
    adminHours: number;
    adminHoursPerBuild: number;
    softwareTCO: number;
    scaffSnappAnnualCost: number;
    crewSizePerBuild: number;
  };
  metrics: {
    // Enterprise Engine losses (Zero Magic Numbers)
    lossLabor: number;
    lossRental: number;
    lossErections: number;
    lossAdmin: number;
    totalGrossLoss: number;
    // Enterprise Engine savings
    laborSaved: number;
    rentalSaved: number;
    buildsSaved: number;
    adminSaved: number;
    recoveredCapital: number;
    netAnnualSavings: number;
    calculatedROI: number;
    paybackPeriod: string;
    // Backward-compatibility aliases
    ghostRentalExposure: number;
    standbyLaborLeakage: number;
    totalAnnualLeakage: number;
    potentialRecoverableValue: number;
  };
  formattedMetrics: {
    lossLabor: string;
    lossRental: string;
    lossErections: string;
    lossAdmin: string;
    totalGrossLoss: string;
    recoveredCapital: string;
    netAnnualSavings: string;
    calculatedROI: string;
    paybackPeriod: string;
    ghostRentalExposure: string;
    standbyLaborLeakage: string;
    totalAnnualLeakage: string;
    potentialRecoverableValue: string;
  };
  recoveryBreakdown: {
    labor: {
      amount: number;
      formatted: string;
      percentage: number;
      captureRate: number;
    };
    rental: {
      amount: number;
      formatted: string;
      percentage: number;
      captureRate: number;
    };
    builds: {
      amount: number;
      formatted: string;
      percentage: number;
      captureRate: number;
    };
    admin: {
      amount: number;
      formatted: string;
      percentage: number;
      captureRate: number;
    };
    // Compatibility aliases
    ghostRental: {
      amount: number;
      formatted: string;
      percentage: number;
    };
    standbyLabor: {
      amount: number;
      formatted: string;
      percentage: number;
    };
    adminAndRebuild: {
      amount: number;
      formatted: string;
      percentage: number;
    };
  };
  monthlyTrajectory: Array<{
    month: number;
    monthLabel: string;
    monthlySavings: number;
    cumulativeSavings: number;
    formattedCumulative: string;
    percentage: number;
  }>;
  recommendedPlan: {
    planName: "Starter" | "Professional" | "Enterprise";
    monthlyPrice: number;
    annualPrice: number;
    formattedMonthly: string;
    formattedAnnual: string;
    features: string;
  };
}

export class RoiServices {
  // Format currency helper
  private formatCurrency(value: number): string {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }

  // Core Calculation Engine (SCAFF_ENTERPRISE_CONFIG - Zero Magic Numbers)
  computeCalculation(data: any): RoiCalculationResult {
    const inputs = data?.inputs || {};
    const segment = (
      data.segment ||
      data.profile ||
      inputs.segment ||
      "commercial"
    ).toLowerCase() as "commercial" | "industrial";

    const profile =
      SCAFF_ENTERPRISE_CONFIG.profiles[segment] ||
      SCAFF_ENTERPRISE_CONFIG.profiles.commercial;

    // 1. Resolve inputs with fallback to segment profile defaults
    let volume =
      data.volume ??
      data.annualBuildVolume ??
      data.annualScaffoldCount ??
      data.scaffolds ??
      inputs.volume ??
      profile.volume ??
      500;
    if (isNaN(volume) || volume < 1) volume = 500;
    volume = Math.max(1, Math.min(volume, 50000));

    const laborRate = Math.max(
      0,
      data.laborRate ??
        data.fullyBurdenedLaborRate ??
        data.hourlyLaborRate ??
        data.hourlyRate ??
        inputs.labor_rate ??
        inputs.laborRate ??
        profile.fullyBurdenedLaborRate
    );

    const rentalRate = Math.max(
      0,
      data.rentalRate ??
        data.scaffoldRentalCostPerDay ??
        data.dailyRentalCost ??
        data.dailyCost ??
        inputs.rental_rate ??
        inputs.rentalRate ??
        profile.scaffoldRentalCostPerDay
    );

    const erectionCost = Math.max(
      0,
      data.erectionCost ??
        data.averageCostPerErection ??
        inputs.erection_cost ??
        inputs.erectionCost ??
        profile.averageCostPerErection
    );

    const laborHours = Math.max(
      0,
      data.laborHours ??
        data.wastedLaborHoursPerBuild ??
        data.standbyHours ??
        data.standbyHrs ??
        inputs.wasted_labor_hours ??
        inputs.laborHours ??
        profile.wastedLaborHoursPerBuild
    );

    const rentalDays = Math.max(
      0,
      data.rentalDays ??
        data.ghostRentalDaysPerBuild ??
        data.avgRentalDurationDays ??
        inputs.ghost_rental_days ??
        inputs.rentalDays ??
        profile.ghostRentalDaysPerBuild
    );

    let rebuildPct = Math.max(
      0,
      data.rebuildRate ??
        data.rebuildPct ??
        inputs.rebuild_rate ??
        inputs.rebuildRate ??
        profile.rebuildRate
    );
    if (rebuildPct > 1) rebuildPct = rebuildPct / 100;

    const adminHours = Math.max(
      0,
      data.adminHours ??
        data.adminHoursPerBuild ??
        inputs.admin_hours ??
        inputs.adminHours ??
        profile.adminHoursPerBuild
    );

    const softwareTCO = Math.max(
      0,
      data.softwareTCO ??
        data.scaffSnappAnnualCost ??
        inputs.software_tco ??
        inputs.softwareTCO ??
        profile.scaffSnappAnnualCost ??
        0
    );

    const crewSize = Math.max(
      1,
      data.crewSize ?? data.crewSizePerBuild ?? inputs.crewSize ?? 4
    );

    // 2. Enterprise Waste Calculations (Losses)
    const laborLoss = Math.round(volume * laborHours * laborRate * 100) / 100;
    const rentalLoss = Math.round(volume * rentalDays * rentalRate * 100) / 100;
    const buildsLoss = Math.round(volume * rebuildPct * erectionCost * 100) / 100;
    const adminLoss = Math.round(volume * adminHours * laborRate * 100) / 100;
    const totalLoss =
      Math.round((laborLoss + rentalLoss + buildsLoss + adminLoss) * 100) / 100;

    // 3. Enterprise Value Realization / Savings
    const laborSaved =
      Math.round(laborLoss * SCAFF_ENTERPRISE_CONFIG.efficiencies.laborCapture * 100) / 100;
    const rentalSaved =
      Math.round(rentalLoss * SCAFF_ENTERPRISE_CONFIG.efficiencies.rentalCapture * 100) / 100;
    const buildsSaved =
      Math.round(buildsLoss * SCAFF_ENTERPRISE_CONFIG.efficiencies.buildsCapture * 100) / 100;
    const adminSaved =
      Math.round(adminLoss * SCAFF_ENTERPRISE_CONFIG.efficiencies.adminCapture * 100) / 100;
    const totalSavings =
      Math.round((laborSaved + rentalSaved + buildsSaved + adminSaved) * 100) / 100;

    const netSavings = Math.round((totalSavings - softwareTCO) * 100) / 100;
    const netROI =
      softwareTCO > 0
        ? Math.round(((netSavings / softwareTCO) * 100) * 10) / 10
        : 0;

    // 4. Payback Logic
    let paybackPeriodText = "";
    if (softwareTCO === 0) {
      paybackPeriodText = "Immediate";
    } else if (netSavings <= 0) {
      paybackPeriodText = "Never";
    } else {
      const paybackMonths = parseFloat(
        ((softwareTCO / totalSavings) * 12).toFixed(1)
      );
      paybackPeriodText = `${paybackMonths} Months`;
    }

    // 5. Recovery Breakdown Percentages
    const totalRecovery = totalSavings || 1;
    const laborPercent = Math.round((laborSaved / totalRecovery) * 100);
    const rentalPercent = Math.round((rentalSaved / totalRecovery) * 100);
    const buildsPercent = Math.round((buildsSaved / totalRecovery) * 100);
    const adminPercent = Math.max(
      0,
      100 - laborPercent - rentalPercent - buildsPercent
    );

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
        percentage: Math.min(
          100,
          Math.round((cumulative / (totalSavings || 1)) * 100)
        ),
      };
    });

    // 7. Recommended Plan Tier
    let planName: "Starter" | "Professional" | "Enterprise";
    let planPrice: number;
    let features: string;

    if (volume < 60) {
      planName = "Starter";
      planPrice = 299;
      features = "Up to 60 scaffolds/yr · Core tracking · Email support";
    } else if (volume <= 180) {
      planName = "Professional";
      planPrice = 599;
      features = "Up to 180 scaffolds/yr · Full analytics · Priority support";
    } else {
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
          captureRate: SCAFF_ENTERPRISE_CONFIG.efficiencies.laborCapture,
        },
        rental: {
          amount: rentalSaved,
          formatted: this.formatCurrency(rentalSaved),
          percentage: rentalPercent,
          captureRate: SCAFF_ENTERPRISE_CONFIG.efficiencies.rentalCapture,
        },
        builds: {
          amount: buildsSaved,
          formatted: this.formatCurrency(buildsSaved),
          percentage: buildsPercent,
          captureRate: SCAFF_ENTERPRISE_CONFIG.efficiencies.buildsCapture,
        },
        admin: {
          amount: adminSaved,
          formatted: this.formatCurrency(adminSaved),
          percentage: adminPercent,
          captureRate: SCAFF_ENTERPRISE_CONFIG.efficiencies.adminCapture,
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
          formatted: this.formatCurrency(
            Math.round((adminSaved + buildsSaved) * 100) / 100
          ),
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
  async submitLead(data: SubmitRoiLeadDTO, meta?: { ip?: string; userAgent?: string }) {
    try {
      const calculation = this.computeCalculation(data);

      const resolvedFirstName =
        data.firstName && data.firstName.trim().length > 0
          ? data.firstName.trim()
          : `Guest User ${Math.floor(100000 + Math.random() * 900000)}`;

      data.firstName = resolvedFirstName;

      // Create record in database
      const roiLead = await prisma.roiLead.create({
        data: {
          uuid: uuidv4(),
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

          ipAddress: meta?.ip || null,
          userAgent: meta?.userAgent || null,
        },
      });

      // Send email notifications asynchronously (non-blocking)
      this.sendLeadEmails(data, calculation, roiLead.uuid).catch((err) => {
        console.error("Non-critical error sending ROI lead notification emails:", err);
      });

      return {
        success: true,
        statusCode: 201,
        message: RESPONSE_MESSAGES.ROI.SUBMIT_SUCCESS,
        data: {
          leadId: roiLead.id.toString(),
          uuid: roiLead.uuid,
          leadInfo: {
            firstName: roiLead.firstName,
            email: roiLead.email,
            company: roiLead.company,
            state: roiLead.state,
            createdAt: roiLead.createdAt,
          },
          ...calculation,
        },
      };
    } catch (error: any) {
      console.error("Error creating ROI lead submission:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError(RESPONSE_MESSAGES.ROI.SUBMIT_FAILED, 500, error.message);
    }
  }

  // ─── 2. Get All ROI Leads (Super Admin) ──────────────────────────────────────
  async getLeads(query: AdminRoiQueryDTO) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        state,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = query;

      const skip = (page - 1) * limit;

      const where: Prisma.RoiLeadWhereInput = {};

      if (status) {
        where.status = status as RoiLeadStatus;
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
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [total, leads, aggregations] = await Promise.all([
        prisma.roiLead.count({ where }),
        prisma.roiLead.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.roiLead.aggregate({
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
        message: RESPONSE_MESSAGES.ROI.FETCH_ALL_SUCCESS,
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
    } catch (error: any) {
      console.error("Error fetching ROI leads:", error);
      throw new CustomError("Failed to fetch ROI leads", 500, error.message);
    }
  }

  // ─── 3. Get Lead by ID (Super Admin) ─────────────────────────────────────────
  async getLeadById(idOrUuid: string | number) {
    try {
      let lead;
      if (typeof idOrUuid === "number" || !isNaN(Number(idOrUuid))) {
        lead = await prisma.roiLead.findUnique({
          where: { id: BigInt(idOrUuid) },
        });
      } else {
        lead = await prisma.roiLead.findUnique({
          where: { uuid: idOrUuid },
        });
      }

      if (!lead) {
        throw new CustomError(RESPONSE_MESSAGES.ROI.NOT_FOUND, 404, "ROI lead does not exist");
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
        message: RESPONSE_MESSAGES.ROI.FETCH_BY_ID_SUCCESS,
        data: {
          id: lead.id.toString(),
          uuid: lead.uuid,
          firstName: lead.firstName,
          email: lead.email,
          company: lead.company,
          state: lead.state,
          status: lead.status,
          notes: lead.notes,
          ipAddress: lead.ipAddress,
          userAgent: lead.userAgent,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
          ...fullCalculation,
        },
      };
    } catch (error: any) {
      console.error("Error fetching ROI lead by id:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to fetch ROI lead details", 500, error.message);
    }
  }

  // ─── 4. Update ROI Lead Status (Super Admin) ─────────────────────────────────
  async updateLeadStatus(id: number, data: UpdateRoiStatusDTO) {
    try {
      const existing = await prisma.roiLead.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existing) {
        throw new CustomError(RESPONSE_MESSAGES.ROI.NOT_FOUND, 404, "ROI lead not found");
      }

      const updated = await prisma.roiLead.update({
        where: { id: BigInt(id) },
        data: {
          status: data.status,
          ...(data.notes !== undefined ? { notes: data.notes } : {}),
        },
      });

      return {
        success: true,
        statusCode: 200,
        message: RESPONSE_MESSAGES.ROI.UPDATE_STATUS_SUCCESS,
        data: {
          id: updated.id.toString(),
          uuid: updated.uuid,
          status: updated.status,
          notes: updated.notes,
          updatedAt: updated.updatedAt,
        },
      };
    } catch (error: any) {
      console.error("Error updating ROI lead status:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to update ROI lead status", 500, error.message);
    }
  }

  // ─── 4b. Update ROI Lead Details & Send Email ─────────────────────────────
  async updateLead(
    leadIdentifier: string | number | undefined,
    data: UpdateRoiLeadDTO
  ) {
    try {
      const targetId = leadIdentifier ?? data.leadId ?? data.id;

      if (!targetId) {
        throw new CustomError("leadId is required", 400, "Missing leadId in request");
      }

      let existingLead;
      const isNumeric =
        typeof targetId === "number" ||
        (!isNaN(Number(targetId)) && typeof targetId === "string" && !targetId.includes("-"));

      if (isNumeric) {
        existingLead = await prisma.roiLead.findUnique({
          where: { id: BigInt(targetId) },
        });
      } else {
        existingLead = await prisma.roiLead.findUnique({
          where: { uuid: String(targetId) },
        });
      }

      if (!existingLead) {
        throw new CustomError(RESPONSE_MESSAGES.ROI.NOT_FOUND, 404, "ROI lead does not exist");
      }

      // Check operational inputs for recalculation if updated
      const annualScaffoldCount =
        data.annualScaffoldCount !== undefined
          ? data.annualScaffoldCount
          : existingLead.annualScaffoldCount;
      const avgRentalDurationDays =
        data.avgRentalDurationDays !== undefined
          ? data.avgRentalDurationDays
          : existingLead.avgRentalDurationDays;
      const dailyRentalCost =
        data.dailyRentalCost !== undefined
          ? data.dailyRentalCost
          : existingLead.dailyRentalCost;
      const crewSizePerBuild =
        data.crewSizePerBuild !== undefined
          ? data.crewSizePerBuild
          : existingLead.crewSizePerBuild;
      const hourlyLaborRate =
        data.hourlyLaborRate !== undefined
          ? data.hourlyLaborRate
          : existingLead.hourlyLaborRate;
      const standbyHours =
        data.standbyHours !== undefined
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
      const updateData: Prisma.RoiLeadUpdateInput = {
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

      const updatedLead = await prisma.roiLead.update({
        where: { id: existingLead.id },
        data: updateData,
      });

      // Send calculation email to user if email is provided
      if (updatedLead.email && updatedLead.email.trim().length > 0) {
        try {
          await this.sendLeadEmails(
            {
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
            },
            calculation,
            updatedLead.uuid
          );
        } catch (mailErr) {
          console.error("Non-critical error sending updated ROI calculation email:", mailErr);
        }
      }

      return {
        success: true,
        statusCode: 200,
        message: RESPONSE_MESSAGES.ROI.UPDATE_SUCCESS,
        data: {
          leadId: updatedLead.id.toString(),
          uuid: updatedLead.uuid,
          leadInfo: {
            firstName: updatedLead.firstName,
            email: updatedLead.email,
            company: updatedLead.company,
            state: updatedLead.state,
            notes: updatedLead.notes,
            status: updatedLead.status,
            createdAt: updatedLead.createdAt,
            updatedAt: updatedLead.updatedAt,
          },
          ...calculation,
        },
      };
    } catch (error: any) {
      console.error("Error updating ROI lead details:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to update ROI lead", 500, error.message);
    }
  }

  // ─── 5. Delete ROI Lead (Super Admin) ────────────────────────────────────────
  async deleteLead(id: number) {
    try {
      const existing = await prisma.roiLead.findUnique({
        where: { id: BigInt(id) },
      });

      if (!existing) {
        throw new CustomError(RESPONSE_MESSAGES.ROI.NOT_FOUND, 404, "ROI lead not found");
      }

      await prisma.roiLead.delete({
        where: { id: BigInt(id) },
      });

      return {
        success: true,
        statusCode: 200,
        message: RESPONSE_MESSAGES.ROI.DELETE_SUCCESS,
      };
    } catch (error: any) {
      console.error("Error deleting ROI lead:", error);
      if (error instanceof CustomError) throw error;
      throw new CustomError("Failed to delete ROI lead", 500, error.message);
    }
  }

  // ─── 6. Analytics & Dashboard Statistics (Super Admin) ───────────────────────
  async getAnalytics() {
    try {
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalLeads,
        leadsThisMonth,
        leadsThisWeek,
        aggregates,
        statusGrouping,
        planGrouping,
        stateGrouping,
      ] = await Promise.all([
        prisma.roiLead.count(),
        prisma.roiLead.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
        prisma.roiLead.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
        prisma.roiLead.aggregate({
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
        prisma.roiLead.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        prisma.roiLead.groupBy({
          by: ["recommendedPlan"],
          _count: { _all: true },
        }),
        prisma.roiLead.groupBy({
          by: ["state"],
          _count: { _all: true },
          orderBy: { _count: { state: "desc" } },
          take: 10,
        }),
      ]);

      const statusMap: Record<string, number> = {
        NEW: 0,
        CONTACTED: 0,
        QUALIFIED: 0,
        CONVERTED: 0,
        CLOSED: 0,
      };
      statusGrouping.forEach((s) => {
        statusMap[s.status] = s._count._all;
      });

      const planMap: Record<string, number> = {
        Starter: 0,
        Professional: 0,
        Enterprise: 0,
      };
      planGrouping.forEach((p) => {
        if (p.recommendedPlan) planMap[p.recommendedPlan] = p._count._all;
      });

      return {
        success: true,
        statusCode: 200,
        message: RESPONSE_MESSAGES.ROI.ANALYTICS_SUCCESS,
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
    } catch (error: any) {
      console.error("Error fetching ROI analytics:", error);
      throw new CustomError("Failed to fetch ROI analytics", 500, error.message);
    }
  }

  // ─── Private: Email Dispatch ────────────────────────────────────────────────
  private async sendLeadEmails(
    data: SubmitRoiLeadDTO,
    calc: RoiCalculationResult,
    leadUuid: string
  ) {
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
        await mailTransporter.sendMail({
          from: `"ScaffSnapp" <${process.env.SMTP_USER}>`,
          to: data.email.trim(),
          subject: `Your Scaffolding ROI Savings Projection — ${data.company || "Estimate"}`,
          html: leadHtml,
        });
      } catch (custErr) {
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
        await mailTransporter.sendMail({
          from: `"ScaffSnapp System" <${process.env.SMTP_USER}>`,
          to: adminEmail,
          subject: `[New Lead] ${data.company || data.firstName || "Guest Lead"} — ${calc.formattedMetrics.potentialRecoverableValue} Potential Recovery`,
          html: adminHtml,
        });
      } catch (adminErr) {
        console.error("Non-critical error sending admin ROI notification email:", adminErr);
      }
    }
  }
}
