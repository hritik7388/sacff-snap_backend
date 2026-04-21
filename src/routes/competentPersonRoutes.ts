// src/routes/competentPersonRoutes.ts
import { Router } from "express";
import { authMiddleware, isCompetentPerson } from "../middlewares/authMiddleware";
import { clientAuthMiddleware } from "../middlewares/authMiddleware";
import { competentPersonController } from "../controllers/competentPersonController";

const router = Router();

const competentPersonRoutes = new competentPersonController();
/**
 * @route   GET /api/v1/competentPerson/dashboard
 * @desc    Get CompetentPerson dashboard data
 * @access  Private
 */
router.get("/dashboard", clientAuthMiddleware, authMiddleware, isCompetentPerson, competentPersonRoutes.dashboard.bind(competentPersonRoutes));

/**
 * @route   POST /api/v1/competentPerson/createInspection
 * @desc    Create a new inspection record
 * @access  Private
 */
router.post("/createInspection", clientAuthMiddleware, authMiddleware, isCompetentPerson, competentPersonRoutes.createInspection.bind(competentPersonRoutes));

/**
 * @route   GET /api/v1/competentPerson/getInspections
 * @desc    Get all inspection records for the competent person
 * @access  Private
 */
router.get("/getInspections", clientAuthMiddleware, authMiddleware, competentPersonRoutes.getInspections.bind(competentPersonRoutes));

/**
 * @route   POST /api/v1/competentPerson/competentPersonTimeline
 * @desc    Create a new competent person timeline record
 * @access  Private
 */
router.post("/competentPersonTimeline", clientAuthMiddleware, authMiddleware, isCompetentPerson, competentPersonRoutes.competentPersonTimeline.bind(competentPersonRoutes));

/**
 * @route   POST /api/v1/competentPerson/TimelineTag
 * @desc    Create a new competent person timeline tag record
 * @access  Private
 */
router.post("/TimelineTag", clientAuthMiddleware, authMiddleware, isCompetentPerson, competentPersonRoutes.TimelineTag.bind(competentPersonRoutes));

/**
 * @route   GET /api/v1/competentPerson/getScaffholdTimeline
 * @desc    Get scaffhold timeline records
 * @access  Private
 */
router.get("/getScaffholdTimeline", clientAuthMiddleware, authMiddleware, competentPersonRoutes.getScaffholdTimeline.bind(competentPersonRoutes));

/**
 * @route   GET /api/v1/competentPerson/getScaffholdInspections
 * @desc    Get scaffhold inspections records
 * @access  Private
 */
router.get("/getAllTimelineImages", clientAuthMiddleware, authMiddleware, competentPersonRoutes.getAllTimelineImages.bind(competentPersonRoutes));


/**
 * @route   GET /api/v1/competentPerson/getScaffholdInspections
 * @desc    Get scaffhold inspections records
 * @access  Private
 */
router.get("/getCompetentPersonScaffHold", clientAuthMiddleware, authMiddleware, competentPersonRoutes.getCompetentPersonScaffHold.bind(competentPersonRoutes));



export default router;