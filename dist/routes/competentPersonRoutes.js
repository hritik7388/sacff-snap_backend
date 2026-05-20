"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/competentPersonRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const competentPersonController_1 = require("../controllers/competentPersonController");
const router = (0, express_1.Router)();
const competentPersonRoutes = new competentPersonController_1.competentPersonController();
/**
 * @route   GET /api/v1/competentPerson/dashboard
 * @desc    Get CompetentPerson dashboard data
 * @access  Private
 */
router.get("/dashboard", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isCompetentPerson, competentPersonRoutes.dashboard.bind(competentPersonRoutes));
/**
 * @route   POST /api/v1/competentPerson/createInspection
 * @desc    Create a new inspection record
 * @access  Private
 */
router.post("/createInspection", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isCompetentPerson, competentPersonRoutes.createInspection.bind(competentPersonRoutes));
/**
 * @route   GET /api/v1/competentPerson/getInspections
 * @desc    Get all inspection records for the competent person
 * @access  Private
 */
router.get("/getInspections", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, competentPersonRoutes.getInspections.bind(competentPersonRoutes));
/**
 * @route   POST /api/v1/competentPerson/competentPersonTimeline
 * @desc    Create a new competent person timeline record
 * @access  Private
 */
router.post("/competentPersonTimeline", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isCompetentPerson, competentPersonRoutes.competentPersonTimeline.bind(competentPersonRoutes));
/**
 * @route   POST /api/v1/competentPerson/TimelineTag
 * @desc    Create a new competent person timeline tag record
 * @access  Private
 */
router.post("/TimelineTag", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isCompetentPerson, competentPersonRoutes.TimelineTag.bind(competentPersonRoutes));
/**
 * @route   GET /api/v1/competentPerson/getScaffholdTimeline
 * @desc    Get scaffhold timeline records
 * @access  Private
 */
router.get("/getScaffholdTimeline", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, competentPersonRoutes.getScaffholdTimeline.bind(competentPersonRoutes));
/**
 * @route   GET /api/v1/competentPerson/getScaffholdInspections
 * @desc    Get scaffhold inspections records
 * @access  Private
 */
router.get("/getAllTimelineImages", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, competentPersonRoutes.getAllTimelineImages.bind(competentPersonRoutes));
/**
 * @route   GET /api/v1/competentPerson/getScaffholdInspections
 * @desc    Get scaffhold inspections records
 * @access  Private
 */
router.get("/getCompetentPersonScaffHold", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, competentPersonRoutes.getCompetentPersonScaffHold.bind(competentPersonRoutes));
/**
 * @route   GET /api/v1/rental-cycle/:scaffHoldId
 * @desc    Get rental cycle details
 * @access  Private
 */
router.get("/getRentalCycle/:scaffHoldId", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, competentPersonRoutes.getRentalCycle.bind(competentPersonRoutes));
/**
 * @route   POST /api/v1/rental-cycle/clear
 * @desc    Manually clear rental cycle (TAG action)
 * @access  Private
 */
router.post("/clearRentalCycle", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, competentPersonRoutes.clearRentalCycle.bind(competentPersonRoutes));
/**
 * @route   GET /api/v1/competentPerson/getCompetentProjectList
 * @desc    Get list of projects under competent's
 * @access  Private (projectManager)
 */
router.get("/getCompetentProjectList", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, competentPersonRoutes.getCompetnetProjectList.bind(competentPersonRoutes));
exports.default = router;
