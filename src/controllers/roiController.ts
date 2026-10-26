// src/controllers/roiController.ts
import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import { RoiServices } from "../services/roiServices";
import {
  submitRoiLeadSchema,
  adminRoiQuerySchema,
  roiLeadIdSchema,
  updateRoiStatusSchema,
} from "../schemas/roiSchema";

const roiServices = new RoiServices();

export class RoiController {

  /**
   * @route   POST /api/v1/roi/submit
   * @desc    Submit lead details and unlock full ROI results (Modal in Screenshot 2)
   * @access  Public / Client Key
   */
  async submitLead(req: Request, res: Response, next: Function) {
    try {
      const data = submitRoiLeadSchema.parse(req.body);
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress;
      const userAgent = req.headers["user-agent"] as string;

      const result = await roiServices.submitLead(data, { ip, userAgent });
      res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @route   GET /api/v1/roi/leads
   * @desc    Get all ROI leads with pagination, search, and summary stats
   * @access  Private (Super Admin)
   */
  async getLeads(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const query = adminRoiQuerySchema.parse(req.query);
      const result = await roiServices.getLeads(query);
      res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @route   GET /api/v1/roi/leads/:id
   * @desc    Get a single ROI lead details and calculation breakdown
   * @access  Private (Super Admin)
   */
  async getLeadById(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      // Allow lookup by numeric ID or UUID
      const result = await roiServices.getLeadById(paramId);
      res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @route   PATCH /api/v1/roi/leads/:id/status
   * @desc    Update ROI lead status (NEW, CONTACTED, QUALIFIED, CONVERTED, CLOSED) & notes
   * @access  Private (Super Admin)
   */
  async updateLeadStatus(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const { id } = roiLeadIdSchema.parse({ id: req.params.id });
      const data = updateRoiStatusSchema.parse(req.body);
      const result = await roiServices.updateLeadStatus(id, data);
      res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @route   DELETE /api/v1/roi/leads/:id
   * @desc    Delete an ROI lead
   * @access  Private (Super Admin)
   */
  async deleteLead(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const { id } = roiLeadIdSchema.parse({ id: req.params.id });
      const result = await roiServices.deleteLead(id);
      res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * @route   GET /api/v1/roi/analytics
   * @desc    Get aggregated ROI analytics and stats for Super Admin dashboard
   * @access  Private (Super Admin)
   */
  async getAnalytics(req: AuthenticatedRequest, res: Response, next: Function) {
    try {
      const result = await roiServices.getAnalytics();
      res.status(result.statusCode).json(result);
    } catch (err) {
      next(err);
    }
  }
}
