// src/routes/companyRoutes.ts
import { Router } from "express";
import { CompanyControllers } from "../controllers/companyController";
import { authMiddleware, isSubAdmin, isSUperAdmin } from "../middlewares/authMiddleware";
import { clientAuthMiddleware } from "../middlewares/authMiddleware";

const router = Router();

const companyController = new CompanyControllers();
/**
 * @route   POST /api/v1/company/register
 * @desc    Register a new company
 * @access  Public
 */
router.post("/registerCompany", clientAuthMiddleware, companyController.registerCompany.bind(companyController));

/**
 * @route   PUT /api/v1/company/update
 * @desc    Upadte a existing  company
 * @access  Public
 */
router.put("/updatedCompanyDetails", clientAuthMiddleware, authMiddleware, companyController.updatedCompanyDetails.bind(companyController));

/**
 * @route   PUT /api/v1/company/updatedCompanyProfileDetails
 * @desc    Upadte a existing  company
 * @access  Public
 */
router.put("/updatedCompanyProfile", clientAuthMiddleware, authMiddleware, companyController.updatedCompanyProfileDetails.bind(companyController));

/**
 * @route   GET /api/v1/company/all
 * @desc    Get all companies
 * @access  Private (Super Admin)
 */
router.get("/getAllCompnay", clientAuthMiddleware, authMiddleware, companyController.getAllCompnay.bind(companyController));

/**
 * @route   GET /api/v1/company/getCompanyById
 * @desc    Get company by ID
 * @access  Private (Super Admin)
 */
router.get("/getCompanyById", clientAuthMiddleware, authMiddleware, companyController.getCompanyById.bind(companyController));

/**
 * @route   GET /api/v1/company/requestListApproval
 * @desc    Get all companies
 * @access  Private (Super Admin)
 */
router.get("/requestListApproval", clientAuthMiddleware, authMiddleware, isSUperAdmin, companyController.requestListApproval.bind(companyController));

/**
 * @route   POST /api/v1/company/searchCompany
 * @desc    Search company by ID or name
 * @access  Private (Super Admin)
 */
router.get('/searchCompany', clientAuthMiddleware, authMiddleware, companyController.searchCompany.bind(companyController));

/**
 * @route   POST /api/v1/company/changePassword
 * @desc    Change Password
 * @access  Private (Authenticated Users)
 */
router.post("/changePassword", clientAuthMiddleware, authMiddleware, companyController.changePassword.bind(companyController));

/**
 * @route   POST /api/v1/company/forgotPassword
 * @desc    Forgot Password
 * @access  Public
 */
router.post("/forgotPassword", clientAuthMiddleware, companyController.forgotPassword.bind(companyController));

/**
 * @route   POST /api/v1/company/resendOTP
 * @desc    Resend OTP
 * @access  Public
 */
router.post("/resendOTP", clientAuthMiddleware, companyController.resendOTP.bind(companyController));

/** * @route   POST /api/v1/company/verifyOTP
 * @desc    Verify OTP
 * @access  Public
 */
router.post("/verifyOTP", clientAuthMiddleware, companyController.verifyOTP.bind(companyController));

/** * @route   POST /api/v1/company/resetPassword
 * @desc    resetPassword
 * @access  Public
 */
router.post("/resetPassword", clientAuthMiddleware, authMiddleware, companyController.resetPassword.bind(companyController));

/**
 *  
 * @route   POST /api/v1/company/updateProfileImage
 * @desc    Update Profile Image
 * @access  Private (Authenticated Users)
 */
router.put("/updateProfileImage", clientAuthMiddleware, authMiddleware, companyController.updateProfileImage.bind(companyController));
export default router;