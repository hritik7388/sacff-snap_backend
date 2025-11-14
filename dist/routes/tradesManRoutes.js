"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tradesManController_1 = require("../controllers/tradesManController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const tradesManRoutes = new tradesManController_1.tradesManController();
/**
 * @route   POST /api/v1/tradesMan/tradesManRegister
 * @desc    register TradesMan
 * @access  Public
 */
router.post("/register", authMiddleware_2.clientAuthMiddleware, tradesManRoutes.tradesManRegister.bind(tradesManRoutes));
/**
 * @route   POST /api/v1/tradesMan/tradesManLogin
 * @desc    login TradesMan
 * @access  Public
 */
router.post("/login", authMiddleware_2.clientAuthMiddleware, tradesManRoutes.tradesManLogin.bind(tradesManRoutes));
/**
 * @route   POST /api/v1/tradesMan/getTradesManDetails
 * @desc    details TradesMan
 * @access  Public
 */
router.get("/getTradesManDetails", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.getTradesManDetails.bind(tradesManRoutes));
/**
 * @route   GET /api/v1/tradesMan/getCraftList
 * @desc    Upadte a existing  tradesMan
 * @access  Public
 */
router.get("/crafts", authMiddleware_2.clientAuthMiddleware, tradesManRoutes.getCraftManList.bind(tradesManRoutes));
/**
 * @route   GET /api/v1/tradesMan/getTradesManCraftList
 * @desc    Upadte a existing  tradesMan
 * @access  Public
 */
router.get("/tradesManCrafts", authMiddleware_2.clientAuthMiddleware, tradesManRoutes.getTradesManCraftList.bind(tradesManRoutes));
/**
 * @route   PUT /api/v1/tradesMan/updateProfile
 * @desc    Update TradesMan profile
 * @access  Private
 */
router.put("/updateProfile", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.updateProfile.bind(tradesManRoutes));
/**
 * @route   POST /api/v1/tradesMan/search
 * @desc    Search Job by CMPId and SCAFFID
 * @access  Private
 */
router.post('/searchJob', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.searchJob.bind(tradesManRoutes));
/**
 * @route   POST /api/v1/tradesMan/requestScaffhold
 * @desc    Request Scaffhold by tradesman
 * @access  Private
 */
router.post('/requestScaffhold', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.requestScaffhold.bind(tradesManRoutes));
/** * @route   PUT /api/v1/tradesMan/updateScaffHoldRequest
 * @desc    Update Scaffhold Request by tradesman
 * @access  Private
 */
router.put('/updateScaffHoldRequest', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.updateScaffHoldRequestController.bind(tradesManRoutes));
/** * @route   GET /api/v1/tradesMan/myRequests
 * @desc    Get tradesman requests
 * @access  Private
 */
router.get('/myRequests', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, tradesManRoutes.getTrademanRequestList.bind(tradesManRoutes));
/**
 * @route   POST /api/v1/tradesMan/joinProject
 * @desc    Join Project by tradesman
 * @access  Private
 */
router.post('/joinProject', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.joinProject.bind(tradesManRoutes));
/**
 * @route   GET /api/v1/tradesMan/joinedScaffholds
 * @desc    Get joined scaffholds by tradesman
 * @access  Private
 */
router.get('/joinedScaffholds', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.getJoinedScaffholds.bind(tradesManRoutes));
/**
 * @route   GET /api/v1/tradesMan/dashboard
 * @desc    Get tradesman dashboard data
 * @access  Private
 */
router.get('/dashboard', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.dashboard.bind(tradesManRoutes));
/** * @route   GET /api/v1/tradesMan/scaffholds
 * @desc    Get all scaffholds
 * @access  Private
 */
router.get('/filterScaffHolds', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.filterScaffHolds.bind(tradesManRoutes));
/** * @route   DELETE /api/v1/tradesMan/deleteScaffHoldRequest
 * @desc    Delete scaffhold request by tradesman
 * @access  Private
 */
router.delete('/deleteScaffHoldRequest', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isTradesMan, tradesManRoutes.deleteScaffHoldRequest.bind(tradesManRoutes));
/**
 * @route   GET /api/v1/tradesMan/scaffholdRequestDetails
 * @desc    Get scaffhold request details by tradesman
 * @access  Private
 */
router.get('/getScaffholdRequestDetailsById', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, tradesManRoutes.getScaffholdRequestDetails.bind(tradesManRoutes));
/**
 * @route   GET /api/v1/tradesMan/scaffholdRequestModifications
 * @desc    Get scaffhold request modifications by tradesman
 * @access  Private
 */
router.get('/getModificationRequest', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, tradesManRoutes.getModifiedRequestDetails.bind(tradesManRoutes));
/**
 * @route   GET /api/v1/tradesMan/scaffholdRequestModifications
 * @desc    Get scaffhold request modifications by tradesman
 * @access  Private
 */
router.get('/getAllModificationRequest', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, tradesManRoutes.getAllModifiedRequestDetails.bind(tradesManRoutes));
/**
 * @route   GET /api/v1/tradesMan/getScaffHoldDetailsById
 * @desc    Get scaffHold details by ID
 * @access  Private (Authenticated Users)
 */
router.get("/getTradesManScaffHoldDetailsById", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, tradesManRoutes.getTradesManScaffHoldDetailsById.bind(tradesManRoutes));
/**
 * @route   POST /api/v1/tradesMan/getSearchFilterScaffHold
 * @desc    Get scaffHold details by ID with search filter
 * @access  Private (Authenticated Users)
 */
router.post("/getSearchFilterScaffHold", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, tradesManRoutes.getSearchFilterScaffHolds.bind(tradesManRoutes));
/**
* @route   POST /api/v1/tradesMan/getFilterScaffHolds
* @desc    Get scaffHold details by ID with search filter
* @access  Private (Authenticated Users)
*/
router.post("/getFilterScaffHolds", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, tradesManRoutes.getFilterScaffHolds.bind(tradesManRoutes));
exports.default = router;
