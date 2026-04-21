// src/routes/scaffHoldRoutes.ts
import { Router } from "express"; 

import {authMiddleware, isSubAdmin} from "../middlewares/authMiddleware";
import {clientAuthMiddleware} from "../middlewares/authMiddleware";
import { scaffHoldController } from "../controllers/scaffHoldController";
import { isProjectManager } from "../middlewares/authMiddleware";

const router = Router();

const scaffHoldRoutes = new scaffHoldController();

/**
 * @route   POST /api/v1/scaffHold/createScaffHold
 * @desc    Create a new scaffHold
 * @access  Private (Authenticated Users)
 */
router.post("/createScaffHold",clientAuthMiddleware, authMiddleware,isProjectManager , scaffHoldRoutes.createScaffHold.bind(scaffHoldRoutes));

/**
 * @route   GET /api/v1/scaffHold/getAllScaffHold
 * @desc    Get all scaffHolds with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getAllScaffHold",clientAuthMiddleware, authMiddleware, scaffHoldRoutes.getAllScaffHold.bind(scaffHoldRoutes));

/**
 * @route   GET /api/v1/scaffHold/getScaffHoldDetailsById
 * @desc    Get scaffHold details by ID
 * @access  Private (Authenticated Users)
 */
router.get("/getScaffHoldDetailsById",clientAuthMiddleware, authMiddleware, scaffHoldRoutes.getScaffHoldDetailsById.bind(scaffHoldRoutes));

/**
 * @route   GET /api/v1/scaffHold/getProjectScaffHold/:projectId
 * @desc    Get scaffHold details by Project ID
 * @access  Private (Authenticated Users)
 */
router.get("/getProjectScaffHold",clientAuthMiddleware, authMiddleware, scaffHoldRoutes.getProjectScaffHold.bind(scaffHoldRoutes));

/**
 * @route   GET /api/v1/scaffHold/getScaffHoldCompetentPerson
 * @desc    Get competent persons for a scaffHold by scaffHold ID with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getScaffHoldCompetentPerson",clientAuthMiddleware, authMiddleware, scaffHoldRoutes.getScaffHoldCompetentPerson.bind(scaffHoldRoutes));
/**
 * @route   GET /api/v1/scaffHold/getScaffCompetentPerson
 * @desc    Get competent persons for a scaffHold by scaffHold ID with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getScaffCompetentPerson",clientAuthMiddleware, authMiddleware, scaffHoldRoutes.getScaffCompetentPerson.bind(scaffHoldRoutes));

/**
 * @route POST/api/v1/scaffhold/addCompetentPerson
 * @des   add competent person by id 
 * @access Private (Authenticated Users)
 */
router.post("/addCompetentPerson",clientAuthMiddleware, authMiddleware,isProjectManager, scaffHoldRoutes.addScaffHoldCompetentPerson.bind(scaffHoldRoutes));

/**
 * @route DELETE/api/v1/scaffhold/removeCompetentPerson
 * @des   remove competent person by id 
 * @access Private (Authenticated Users)
 */
router.delete("/removeCompetentPerson",clientAuthMiddleware, authMiddleware,isProjectManager, scaffHoldRoutes.removeScaffHoldCompetentPerson.bind(scaffHoldRoutes));

/**
 * @route PUT/api/v1/scaffhold/changeTagsPriority
 * @des   changeTagsPriority by projectmanger 
 * @access Private (Authenticated Users)
 */
router.put("/changeTagsPriority",clientAuthMiddleware, authMiddleware,isProjectManager, scaffHoldRoutes.changeTagsPriority.bind(scaffHoldRoutes));


/**
 * @route   GET /api/v1/scaffhold/getNotifictaion
 * @desc    get the notifictaion
 * @access  Private (SCAFFHOLD)
 */
router.get('/getNotifictaion',clientAuthMiddleware, authMiddleware,isSubAdmin, scaffHoldRoutes.companyNotifictaion.bind(scaffHoldRoutes));


export default router;