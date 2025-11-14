"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const superAdminController_1 = require("../controllers/superAdminController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const superAdminRoutes = new superAdminController_1.superAdminController();
/**
 * @route   POST /api/v1/superAdmin/superAdminLogin
 * @desc    Login a super admin
 * @access  Public
 */
router.post('/login', authMiddleware_2.clientAuthMiddleware, superAdminRoutes.superAdminLogin.bind(superAdminRoutes));
/**
 * @route   GET /api/v1/superAdmin/dashboard
 * @desc    Get super admin dashboard data
 * @access  Private (Super Admin)
 */
router.get('/dashboardData', authMiddleware_2.clientAuthMiddleware, superAdminRoutes.dashboardData.bind(superAdminRoutes));
/**
 * @route   POST /api/v1/superAdmin/approveCompanyrequest
 * @desc    Approve company request
 * @access  Private (Super Admin)
 */
router.post('/approveCompanyrequest', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.approveCompanyrequest.bind(superAdminRoutes));
/**
 * @route   POST /api/v1/superAdmin/rejectCompanyrequest
 * @desc    Reject company request
 * @access  Private (Super Admin)
 */
router.post('/rejectCompanyrequest', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.rejectCompanyrequest.bind(superAdminRoutes));
/**
* @route   POST /api/v1/superAdmin/addNewCompanyBySuperAdmin
* @desc    Add a new company
* @access  Private (Super Admin)
*/
router.post('/addNewCompanyBySuperAdmin', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.addNewCompanyBySuperAdmin.bind(superAdminRoutes));
/**
 * @route   PATCH /api/v1/superAdmin/inactiveCompanyBySuperAdmin
 * @desc    Inactive the company
 * @access  Private (Super Admin)
 */
router.patch('/blockCompanyBySuperAdmin', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.blockCompanyBySuperAdmin.bind(superAdminRoutes));
/**
 * @route   PATCH /api/v1/superAdmin/activeCompanyBySuperAdmin
 * @desc    Active the company
 * @access  Private (Super Admin)
 */
router.patch('/unblockCompanyBySuperAdmin', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.unblockCompanyBySuperAdmin.bind(superAdminRoutes));
/**
 * @route   GET /api/v1/superAdmin/activeCompanies
 * @desc    Get all active companies
 * @access  Private (Super Admin)
 */
router.get('/activeCompanies', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.getAllActiveCompanies.bind(superAdminRoutes));
/**
 * @route   GET /api/v1/superAdmin/blockedCompanies
 * @desc    Get all blocked companies
 * @access  Private (Super Admin)
 */
router.get('/blockedCompanies', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.getAllBlockedCompanies.bind(superAdminRoutes));
/**
 * @route   DELETE /api/v1/company/suspendedCompanyBySuperAdmin
 * @desc    Suspended the company
 * @access  Private (Super Admin)
 */
router.delete('/deleteCompanyBySuperAdmin', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.deleteCompanyBySuperAdmin.bind(superAdminRoutes));
/**
 * @route   GET /api/v1/company/getNotifictaion
 * @desc    get the notifictaion
 * @access  Private (Super Admin)
 */
router.get('/getNotifictaion', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, superAdminRoutes.superAdminNotifictaion.bind(superAdminRoutes));
/**
 * @route   PUT /api/v1/company/readNotifictaion
 * @desc    read the notifictaion
 * @access  Private (Super Admin)
 */
router.put('/readNotifictaion', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, superAdminRoutes.markedNotifictaion.bind(superAdminRoutes));
exports.default = router;
