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
exports.RoiController = void 0;
const roiServices_1 = require("../services/roiServices");
const roiSchema_1 = require("../schemas/roiSchema");
const roiServices = new roiServices_1.RoiServices();
class RoiController {
    /**
     * @route   POST /api/v1/roi/submit
     * @desc    Submit lead details and unlock full ROI results (Modal in Screenshot 2)
     * @access  Public / Client Key
     */
    submitLead(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = roiSchema_1.submitRoiLeadSchema.parse(req.body);
                const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
                const userAgent = req.headers["user-agent"];
                const result = yield roiServices.submitLead(data, { ip, userAgent });
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   GET /api/v1/roi/leads
     * @desc    Get all ROI leads with pagination, search, and summary stats
     * @access  Private (Super Admin)
     */
    getLeads(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = roiSchema_1.adminRoiQuerySchema.parse(req.query);
                const result = yield roiServices.getLeads(query);
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   GET /api/v1/roi/leads/:id
     * @desc    Get a single ROI lead details and calculation breakdown
     * @access  Private (Super Admin)
     */
    getLeadById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paramId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
                // Allow lookup by numeric ID or UUID
                const result = yield roiServices.getLeadById(paramId);
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   PATCH /api/v1/roi/leads/:id/status
     * @desc    Update ROI lead status (NEW, CONTACTED, QUALIFIED, CONVERTED, CLOSED) & notes
     * @access  Private (Super Admin)
     */
    updateLeadStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = roiSchema_1.roiLeadIdSchema.parse({ id: req.params.id });
                const data = roiSchema_1.updateRoiStatusSchema.parse(req.body);
                const result = yield roiServices.updateLeadStatus(id, data);
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   DELETE /api/v1/roi/leads/:id
     * @desc    Delete an ROI lead
     * @access  Private (Super Admin)
     */
    deleteLead(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = roiSchema_1.roiLeadIdSchema.parse({ id: req.params.id });
                const result = yield roiServices.deleteLead(id);
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    /**
     * @route   GET /api/v1/roi/analytics
     * @desc    Get aggregated ROI analytics and stats for Super Admin dashboard
     * @access  Private (Super Admin)
     */
    getAnalytics(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield roiServices.getAnalytics();
                res.status(result.statusCode).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.RoiController = RoiController;
