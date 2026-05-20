// src/routes/subAdminRoutes.ts
import { Router } from "express";
import { subAdminController } from "../controllers/subAdminController";
import { authMiddleware, isSubAdmin } from "../middlewares/authMiddleware";
import { clientAuthMiddleware } from "../middlewares/authMiddleware";

const router = Router();

const subAdminControllers = new subAdminController();
/**
 * @route   POST /api/v1/subAdmin/login
 * @desc    Login subAdmin
 * @access  Public
 */
router.post("/subAdminLogin", clientAuthMiddleware, subAdminControllers.subAdminLogin.bind(subAdminControllers));

/**
 * @route   POST /api/v1/subAdmin/addTeamMember
 * @desc    Add a team member under subAdmin's company
 * @access  Private (subAdmin)
 */
router.post("/addTeamMember", clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.addTeamMember.bind(subAdminControllers));

/**
 * @route   PUT /api/v1/subAdmin/updateTeamMember
 * @desc    Update a team member under subAdmin's company
 * @access  Private (subAdmin)
 */
router.put("/updateTeamMember", clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.updateTeamMember.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/getProjectManagersList
 * @desc    Get list of project managers under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get("/getProjectManagersList", clientAuthMiddleware, authMiddleware, subAdminControllers.getProjectManagersList.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/getCompetentPersonList
 * @desc    Get list of competent persons under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get("/getCompetentPersonList", clientAuthMiddleware, authMiddleware, subAdminControllers.getCompetentPersonList.bind(subAdminControllers));


/**
 * @route   GET /api/v1/subAdmin/getCompanyCompetentPerson
 * @desc    Get list of competent persons under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get("/getCompanyCompetentPerson", clientAuthMiddleware, authMiddleware, subAdminControllers.getCompanyCompetentPerson.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/getTradesManList
 * @desc    Get list of tradesman under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get("/getTradesManList", clientAuthMiddleware, authMiddleware, subAdminControllers.getTradesManList.bind(subAdminControllers));

/**
 * @route   POST /api/v1/subAdmin/createNewProject
 * @desc    Create a new project under subAdmin's company
 * @access  Private (subAdmin)
 */
router.post("/createNewProject", clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.createNewProject.bind(subAdminControllers));

/**
 * @route   POST /api/v1/subAdmin/upadteProject
 * @desc    UPADTE a new project under subAdmin's company
 * @access  Private (subAdmin)
 */
router.put("/upadteProject", clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.upadteProject.bind(subAdminControllers));


/**
 * @route   GET /api/v1/subAdmin/dashboard
 * @desc    Get sub admin dashboard data
 * @access  Private (subAdmin)
 */
router.get('/dashboardData', clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.dashboardData.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/scaffholdDashboard
 * @desc    Get scaff  subadmin dashboard data
 * @access  Private (subAdmin)
 */
router.get('/scaffholdDashboard', clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.scaffholdDashboard.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/projectDashboard
 * @desc    Get project  subadmin dashboard data
 * @access  Private (subAdmin)
 */
router.get('/projectDashboard', clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.projectDashboard.bind(subAdminControllers));
/**
 * @route   GET /api/v1/subAdmin/scaffStatusDashboard
 * @desc    Get scaffStatus  subadmin dashboard data
 * @access  Private (subAdmin)
 */
router.get('/scaffStatusDashboard', clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.scaffStatusDashboard.bind(subAdminControllers));

/**
 * @route   POST /api/v1/subAdmin/searchCompetentPerson
 * @desc    Search team members ( competent persons, ) under subAdmin's company
 * @access  Private (subAdmin)
 */
router.post('/searchTeamMemeber', clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.searchTeamMemberController.bind(subAdminControllers));

/**
 * @route   POST /api/v1/subAdmin/searchTeamMemberByScaffhold
 * @desc    Search team members by scaffhold id under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get('/searchTeamMemberByScaffhold', clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.getTeamMemberByScaffHoldIdController.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/getScaffHoldRequests
 * @desc    Get scaffhold requests by scaffhold id under subAdmin's company
 * @access  Private (subAdmin)
 */
router.get('/getScaffHoldRequests', clientAuthMiddleware, authMiddleware, subAdminControllers.getScaffHoldRequests.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/getTimelineImagesByStatus
 * @desc    Get timeline images by status with pagination
 * @access  Private (subAdmin)
 */
router.get('/getTimelineImagesByStatus', clientAuthMiddleware, authMiddleware, subAdminControllers.getTimelineImagesByStatus.bind(subAdminControllers));


/**
 * @route   GET /api/v1/subAdmin/getProjectsList
 * @desc    Get list of projects under projectManager's
 * @access   Private (subAdmin)
 */
router.get("/getProjectList", clientAuthMiddleware, authMiddleware, subAdminControllers.getProjectList.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/getProjectScaffHold
 * @desc    Get scaffHold details by Project ID
 * @access  Private (Authenticated Users)
 */
router.get("/getProjectScaffHold",clientAuthMiddleware, authMiddleware, subAdminControllers.getProjectScaffHold.bind(subAdminControllers));



/**
 * @route   GET /api/v1/subAdmin/getAllScaffHold
 * @desc    Get all scaffHolds with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getAllScaffHold", clientAuthMiddleware, authMiddleware, subAdminControllers.getAllScaffHold.bind(subAdminControllers));

/**
 * @route   GET /api/v1/subAdmin/getUserData
 * @desc    Get all scaffHolds with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getUserData", clientAuthMiddleware, authMiddleware, subAdminControllers.getUserData.bind(subAdminControllers));


/** * @route   GET /api/v1/subAdmin/deleteUserBySubAdmin
 * @desc    Get user deleted by id
 * @access  Private (Authenticated Users)
 */
router.delete("/deleteUserBySubAdmin", clientAuthMiddleware, authMiddleware, isSubAdmin, subAdminControllers.deleteUserBySubAdmin.bind(subAdminControllers));



/** * @route   POST /api/v1/subadmin/logoutCompany
 * @desc    Logout
 * @access  Private (Authenticated Users)
 */
router.post("/logOutCompany", clientAuthMiddleware, authMiddleware, subAdminControllers.logOutCompany.bind(subAdminControllers));
export default router;