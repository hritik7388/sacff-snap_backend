"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const projectManagerController_1 = require("../controllers/projectManagerController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const authMiddleware_3 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const projectManagerRoutes = new projectManagerController_1.projectManagerController();
/**
 * @route   POST /api/v1/projectManager/projectManagerLogin
 * @desc    login Project Manager
 * @access  Public
 */
router.post("/login", authMiddleware_2.clientAuthMiddleware, projectManagerRoutes.commonLogin.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/getProjectsList
 * @desc    Get list of projects under projectManager's
 * @access  Private (projectManager)
 */
router.get("/getProjectList", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getProjectList.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/getUserDetails
 * @desc    Get list of competent and projectManager's
 * @access  Private (projectManager)
 */
router.get("/getUserDetails", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getUserDetails.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/getRequestedScaffolds
 * @desc    Get list of competent and projectManager's
 * @access  Private (projectManager)
 */
router.get("/getRequestedScaffolds", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getRequestedScaffolds.bind(projectManagerRoutes));
/**
 * @route   POST /api/v1/projectManager/approveRejectRequest
 * @desc    Approve or Reject ScaffHold Request
 * @access  Private (projectManager)
 */
router.post("/approveRejectRequest", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_3.isProjectManager, projectManagerRoutes.approveRejectRequest.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/approveRejectRequest
 * @desc    Approve or Reject ScaffHold Request
 * @access  Private (projectManager)
 */
router.get("/dashboard", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_3.isProjectManager, projectManagerRoutes.dashboard.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/scaffholdRequestModifications
 * @desc    Get scaffhold request modifications by tradesman
 * @access  Private
 */
router.get('/getAllPendingModification', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getAllPendingModifiedRequestDetails.bind(projectManagerRoutes));
/** * @route   GET /api/v1/projectManager/myRequests
 * @desc    Get tradesman requests
 * @access  Private projectManager
 */
router.get('/tradesManPendingRequests', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getPendingTrademanRequestList.bind(projectManagerRoutes));
/** * @route   GET /api/v1/projectManager/getScaffHoldJobCraft
 * @desc    Get scaffHold jobCrafts
 * @access  Private
 */
router.get('/getScaffHoldJobCraft', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getScaffHoldJobCraft.bind(projectManagerRoutes));
/** * @route   GET /api/v1/projectManager/getScaffholdRequestsByCreator
 * @desc    Get scaffHold request
 * @access  Private
 */
router.get('/getScaffholdRequestsByCreator', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getScaffholdRequestsByCreator.bind(projectManagerRoutes));
/**
 * @route   PUT /api/v1/user/updateProfileImage
 * @desc    Update user profile image
 * @access  Private
 */
router.put('/updateProfileImage', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.updateProfileImage.bind(projectManagerRoutes));
exports.default = router;
