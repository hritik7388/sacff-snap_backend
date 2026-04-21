"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/subAdminRoutes.ts
const express_1 = require("express");
const subAdminController_1 = require("../controllers/subAdminController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const subAdminControllers = new subAdminController_1.subAdminController();
/**
 * @route   POST /api/v1/subAdmin/login
 * @desc    Login subAdmin
 * @access  Public
 */
router.post("/subAdminLogin", authMiddleware_2.clientAuthMiddleware, subAdminControllers.subAdminLogin.bind(subAdminControllers));
/**
 * @route   POST /api/v1/subAdmin/addTeamMember
 * @desc    Add a team member under subAdmin's company
 * @access  Private (subAdmin)
 */
router.post("/addTeamMember", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.addTeamMember.bind(subAdminControllers));
/**
 * @route   PUT /api/v1/subAdmin/updateTeamMember
 * @desc    Update a team member under subAdmin's company
 * @access  Private (subAdmin)
 */
router.put("/updateTeamMember", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.updateTeamMember.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getProjectManagersList
 * @desc    Get list of project managers under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get("/getProjectManagersList", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getProjectManagersList.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getCompetentPersonList
 * @desc    Get list of competent persons under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get("/getCompetentPersonList", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getCompetentPersonList.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getCompanyCompetentPerson
 * @desc    Get list of competent persons under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get("/getCompanyCompetentPerson", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getCompanyCompetentPerson.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getTradesManList
 * @desc    Get list of tradesman under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get("/getTradesManList", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getTradesManList.bind(subAdminControllers));
/**
 * @route   POST /api/v1/subAdmin/createNewProject
 * @desc    Create a new project under subAdmin's company
 * @access  Private (subAdmin)
 */
router.post("/createNewProject", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.createNewProject.bind(subAdminControllers));
/**
 * @route   POST /api/v1/subAdmin/upadteProject
 * @desc    UPADTE a new project under subAdmin's company
 * @access  Private (subAdmin)
 */
router.put("/upadteProject", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.upadteProject.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/dashboard
 * @desc    Get sub admin dashboard data
 * @access  Private (subAdmin)
 */
router.get('/dashboardData', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.dashboardData.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/scaffholdDashboard
 * @desc    Get scaff  subadmin dashboard data
 * @access  Private (subAdmin)
 */
router.get('/scaffholdDashboard', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.scaffholdDashboard.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/projectDashboard
 * @desc    Get project  subadmin dashboard data
 * @access  Private (subAdmin)
 */
router.get('/projectDashboard', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.projectDashboard.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/scaffStatusDashboard
 * @desc    Get scaffStatus  subadmin dashboard data
 * @access  Private (subAdmin)
 */
router.get('/scaffStatusDashboard', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.scaffStatusDashboard.bind(subAdminControllers));
/**
 * @route   POST /api/v1/subAdmin/searchCompetentPerson
 * @desc    Search team members ( competent persons, ) under subAdmin's company
 * @access  Private (subAdmin)
 */
router.post('/searchTeamMemeber', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.searchTeamMemberController.bind(subAdminControllers));
/**
 * @route   POST /api/v1/subAdmin/searchTeamMemberByScaffhold
 * @desc    Search team members by scaffhold id under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get('/searchTeamMemberByScaffhold', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.getTeamMemberByScaffHoldIdController.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getScaffHoldRequests
 * @desc    Get scaffhold requests by scaffhold id under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get('/getScaffHoldRequests', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getScaffHoldRequests.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getTimelineImagesByStatus
 * @desc    Get timeline images by status with pagination
 * @access  Private (subAdmin)
 */
router.get('/getTimelineImagesByStatus', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getTimelineImagesByStatus.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getProjectsList
 * @desc    Get list of projects under projectManager's
 * @access   Private (subAdmin)
 */
router.get("/getProjectList", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getProjectList.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getAllScaffHold
 * @desc    Get all scaffHolds with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getAllScaffHold", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getAllScaffHold.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/getUserData
 * @desc    Get all scaffHolds with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getUserData", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.getUserData.bind(subAdminControllers));
/** * @route   GET /api/v1/subAdmin/deleteUserBySubAdmin
 * @desc    Get user deleted by id
 * @access  Private (Authenticated Users)
 */
router.delete("/deleteUserBySubAdmin", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSubAdmin, subAdminControllers.deleteUserBySubAdmin.bind(subAdminControllers));
/** * @route   POST /api/v1/subadmin/logoutCompany
 * @desc    Logout
 * @access  Private (Authenticated Users)
 */
router.post("/logOutCompany", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, subAdminControllers.logOutCompany.bind(subAdminControllers));
exports.default = router;
