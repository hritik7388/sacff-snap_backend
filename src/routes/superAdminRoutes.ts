// src/routes/superAdminRoutes.ts

import { Router } from "express";
import { superAdminController } from "../controllers/superAdminController";

import { authMiddleware, isSubAdmin, isSUperAdmin } from "../middlewares/authMiddleware";
import { clientAuthMiddleware } from "../middlewares/authMiddleware";

const router = Router();


const superAdminRoutes = new superAdminController();
/**
 * @route   POST /api/v1/superAdmin/superAdminLogin
 * @desc    Login a super admin
 * @access  Public
 */
router.post('/login', clientAuthMiddleware, superAdminRoutes.superAdminLogin.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/dashboard
 * @desc    Get super admin dashboard data
 * @access  Private (Super Admin)
 */
router.get('/dashboardData', clientAuthMiddleware,authMiddleware, superAdminRoutes.dashboardData.bind(superAdminRoutes));

/**
 * @route   POST /api/v1/superAdmin/approveCompanyrequest
 * @desc    Approve company request
 * @access  Private (Super Admin)
 */
router.post('/approveCompanyrequest', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.approveCompanyrequest.bind(superAdminRoutes));

/**
 * @route   POST /api/v1/superAdmin/rejectCompanyrequest
 * @desc    Reject company request
 * @access  Private (Super Admin)
 */
router.post('/rejectCompanyrequest', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.rejectCompanyrequest.bind(superAdminRoutes));



/**
* @route   POST /api/v1/superAdmin/addNewCompanyBySuperAdmin
* @desc    Add a new company
* @access  Private (Super Admin)
*/
router.post('/addNewCompanyBySuperAdmin', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.addNewCompanyBySuperAdmin.bind(superAdminRoutes));

/**
 * @route   PATCH /api/v1/superAdmin/inactiveCompanyBySuperAdmin
 * @desc    Inactive the company
 * @access  Private (Super Admin)
 */
router.patch('/blockCompanyBySuperAdmin', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.blockCompanyBySuperAdmin.bind(superAdminRoutes));

/**
 * @route   PATCH /api/v1/superAdmin/activeCompanyBySuperAdmin
 * @desc    Active the company
 * @access  Private (Super Admin)
 */
router.patch('/unblockCompanyBySuperAdmin', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.unblockCompanyBySuperAdmin.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/activeCompanies
 * @desc    Get all active companies
 * @access  Private (Super Admin)
 */
router.get('/activeCompanies', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.getAllActiveCompanies.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/blockedCompanies
 * @desc    Get all blocked companies
 * @access  Private (Super Admin)
 */
router.get('/blockedCompanies', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.getAllBlockedCompanies.bind(superAdminRoutes))


/**
 * @route   DELETE /api/v1/company/suspendedCompanyBySuperAdmin
 * @desc    Suspended the company
 * @access  Private (Super Admin)
 */
router.delete('/deleteCompanyBySuperAdmin', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.deleteCompanyBySuperAdmin.bind(superAdminRoutes));



/**
 * @route   GET /api/v1/company/getNotifictaion
 * @desc    get the notifictaion
 * @access  Private (Super Admin)
 */
router.get('/getNotifictaion', clientAuthMiddleware, authMiddleware, superAdminRoutes.superAdminNotifictaion.bind(superAdminRoutes));

/**
 * @route   PUT /api/v1/company/readNotifictaion
 * @desc    read the notifictaion
 * @access  Private (Super Admin)
 */
router.put('/readNotifictaion', clientAuthMiddleware, authMiddleware, superAdminRoutes.markedNotifictaion.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/getUserData
 * @desc    Get all scaffHolds with pagination
 * @access  Private (Authenticated Users)
 */
router.get("/getUserData", clientAuthMiddleware, authMiddleware, superAdminRoutes.getUserData.bind(superAdminRoutes));


/**
 * @route   POST /api/v1/superAdmin/createBlog
 * @desc    Add a new createBlog
 * @access  Private (Super Admin)
 */
router.post('/createBlog', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.blog.bind(superAdminRoutes));
/**
 * @route   PUT /api/v1/superAdmin/publishBlog
 * @desc    update a new createBlog
 * @access  Private (Super Admin)
 */
router.put('/publishBlog', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.publishblog.bind(superAdminRoutes));

/**
 * @route   DELETE /api/v1/superAdmin/deleteBlog
 * @desc    DELETE a  Blog
 * @access  Private (Super Admin)
 */
router.delete('/deleteBlog', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.deleteblog.bind(superAdminRoutes));

/**
 * @route   DELETE /api/v1/superAdmin/deleteContact
 * @desc    DELETE a  Blog
 * @access  Private (Super Admin)
 */
router.delete('/deleteContact', clientAuthMiddleware, authMiddleware, isSUperAdmin, superAdminRoutes.deletecontactInfo.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/getPublishblog
 * @desc    get a  Blog
 * @access  Private (Super Admin)
 */
router.get('/getBlog', clientAuthMiddleware, superAdminRoutes.getPublishblog.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/contact
 * @desc       contact
 * @access  Private (Super Admin)
 */
router.post('/contact', clientAuthMiddleware, superAdminRoutes.contact.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/getcontactInfo
 * @desc    getcontactInfo
 * @access  Private (Super Admin)
 */
router.get('/getcontactInfo', clientAuthMiddleware, superAdminRoutes.getcontactInfo.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/getcontactId
 * @desc    getcontactInfo
 * @access  Private (Super Admin)
 */
router.get('/getcontactId', clientAuthMiddleware, superAdminRoutes.getContactById.bind(superAdminRoutes));

/**
 * @route   GET /api/v1/superAdmin/getBlogById
 * @desc    getBlogById
 * @access  Private (Super Admin)
 */
router.get('/getBlogById', clientAuthMiddleware, superAdminRoutes.getBlogById.bind(superAdminRoutes));


/** * @route   PUT /api/v1/superAdmin/updateProfileImage
 * @desc    Update Profile Image
 * @access  Private (Authenticated Users)
 */
router.put("/updateProfileImage", clientAuthMiddleware, authMiddleware, superAdminRoutes.updateProfileImage.bind(superAdminRoutes));



/** * @route   POST /api/v1/superAdmin/logout
 * @desc    Logout
 * @access  Private (Authenticated Users)
 */
router.post("/logout", clientAuthMiddleware, authMiddleware, superAdminRoutes.logOut.bind(superAdminRoutes));

export default router;