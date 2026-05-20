"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/scaffHoldRoutes.ts
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const scaffHoldController_1 = require("../controllers/scaffHoldController");
const authMiddleware_3 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const scaffHoldRoutes = new scaffHoldController_1.scaffHoldController();
/**
 * @route   GET /api/v1/scaffHold/getAllScaffHold
 * @desc    Get all scaffHolds with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getAllScaffHold", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, scaffHoldRoutes.getAllScaffHold.bind(scaffHoldRoutes));
/**
 * @route   GET /api/v1/scaffHold/getScaffHoldDetailsById
 * @desc    Get scaffHold details by ID
 * @access  Private (Authenticated Users)
 */
router.get("/getScaffHoldDetailsById", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, scaffHoldRoutes.getScaffHoldDetailsById.bind(scaffHoldRoutes));
/**
 * @route   GET /api/v1/scaffHold/getProjectScaffHold/:projectId
 * @desc    Get scaffHold details by Project ID
 * @access  Private (Authenticated Users)
 */
router.post("/getNewProjectScaffHold", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, scaffHoldRoutes.getProjectScaffHold.bind(scaffHoldRoutes));
/**
 * @route   GET /api/v1/scaffHold/getScaffHoldCompetentPerson
 * @desc    Get competent persons for a scaffHold by scaffHold ID with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getScaffHoldCompetentPerson", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, scaffHoldRoutes.getScaffHoldCompetentPerson.bind(scaffHoldRoutes));
/**
 * @route   GET /api/v1/scaffHold/getScaffCompetentPerson
 * @desc    Get competent persons for a scaffHold by scaffHold ID with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getScaffCompetentPerson", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, scaffHoldRoutes.getScaffCompetentPerson.bind(scaffHoldRoutes));
/**
 * @route POST/api/v1/scaffhold/addCompetentPerson
 * @des   add competent person by id
 * @access Private (Authenticated Users)
 */
router.post("/addCompetentPerson", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_3.isProjectManager, scaffHoldRoutes.addScaffHoldCompetentPerson.bind(scaffHoldRoutes));
/**
 * @route DELETE/api/v1/scaffhold/removeCompetentPerson
 * @des   remove competent person by id
 * @access Private (Authenticated Users)
 */
router.delete("/removeCompetentPerson", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_3.isProjectManager, scaffHoldRoutes.removeScaffHoldCompetentPerson.bind(scaffHoldRoutes));
/**
 * @route PUT/api/v1/scaffhold/changeTagsPriority
 * @des   changeTagsPriority by projectmanger
 * @access Private (Authenticated Users)
 */
router.put("/changeTagsPriority", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_3.isProjectManager, scaffHoldRoutes.changeTagsPriority.bind(scaffHoldRoutes));
/**
 * @route   GET /api/v1/scaffhold/getNotifictaion
 * @desc    get the notifictaion
 * @access  Private (SCAFFHOLD)
 */
router.get('/getNotifictaion', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, scaffHoldRoutes.companyNotifictaion.bind(scaffHoldRoutes));
router.get("/reqHistory", authMiddleware_1.authMiddleware, authMiddleware_2.clientAuthMiddleware, scaffHoldRoutes.getScaffHoldHistory.bind(scaffHoldRoutes));
exports.default = router;
