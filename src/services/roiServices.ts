// src/services/roiServices.ts
import prisma from "../config/prismaClient";
import { CustomError } from "../types/customError";
import { v4 as uuidv4 } from "uuid";
import {
  SubmitRoiLeadDTO,
  AdminRoiQueryDTO,
  UpdateRoiStatusDTO,
} from "../schemas/roiSchema";
import { RESPONSE_MESSAGES } from "../constants/responseMessages";
import { mailTransporter } from "../helpers/utils";
import { Prisma, RoiLeadStatus } from "@prisma/client";

export interface RoiCalculationResult {
  operationInputs: {
    annualScaffoldCount: number;
    avgRentalDurationDays: number;
    dailyRentalCost: number;
    crewSizePerBuild: number;
    hourlyLaborRate: number;
    standbyHours: number;
  };
  metrics: {
    ghostRentalExposure: number;
    standbyLaborLeakage: number;
    totalAnnualLeakage: number;
    potentialRecoverableValue: number;
  };
  formattedMetrics: {
    ghostRentalExposure: string;
    standbyLaborLeakage: string;
    totalAnnualLeakage: string;
    potentialRecoverableValue: string;
  };
  recoveryBreakdown: {
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

  // Core Calculation Engine
  computeCalculation(data: Partial<SubmitRoiLeadDTO>): RoiCalculationResult {
    // 1. Resolve inputs with fallback to defaults or aliases
    const scaffolds = Math.max(0, data.annualScaffoldCount ?? data.scaffolds ?? 120);
    const rentalDays = Math.max(0, data.avgRentalDurationDays ?? data.rentalDays ?? 18);
    const dailyCost = Math.max(0, data.dailyRentalCost ?? data.dailyCost ?? 480);
    const crewSize = Math.max(0, data.crewSizePerBuild ?? data.crewSize ?? 4);
    const hourlyRate = Math.max(0, data.hourlyLaborRate ?? data.hourlyRate ?? 68);
    const standbyHrs = Math.max(0, data.standbyHours ?? data.standbyHrs ?? 6);

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
    let planName: "Starter" | "Professional" | "Enterprise";
    let planPrice: number;
    let features: string;

    if (scaffolds < 60) {
      planName = "Starter";
      planPrice = 299;
      features = "Up to 60 scaffolds/yr · Core tracking · Email support";
    } else if (scaffolds <= 180) {
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
  async submitLead(data: SubmitRoiLeadDTO, meta?: { ip?: string; userAgent?: string }) {
    try {
      const calculation = this.computeCalculation(data);

      // Create record in database
      const roiLead = await prisma.roiLead.create({
        data: {
          uuid: uuidv4(),
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
    await mailTransporter.sendMail({
      from: `"ScaffSnapp" <${process.env.SMTP_USER}>`,
      to: data.email,
      subject: `Your Scaffolding ROI Savings Projection — ${data.company}`,
      html: leadHtml,
    });

    // Send admin notification
    if (adminEmail) {
      await mailTransporter.sendMail({
        from: `"ScaffSnapp System" <${process.env.SMTP_USER}>`,
        to: adminEmail,
        subject: `[New Lead] ${data.company} — ${calc.formattedMetrics.potentialRecoverableValue} Potential Recovery`,
        html: adminHtml,
      });
    }
  }
}
