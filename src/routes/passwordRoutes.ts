// src/routes/passwordRoutes.ts
import {Router} from "express";  
import {authMiddleware} from "../middlewares/authMiddleware";
import {clientAuthMiddleware} from "../middlewares/authMiddleware"; 
import {PasswordController} from "../controllers/password";

const router = Router();

const passwordRoutes=new PasswordController();
/**
 * @route   POST /api/v1/password/changePassword
 * @desc    Change Password
 * @access  Private (Authenticated Users)
 */
router.post("/changePassword",clientAuthMiddleware,authMiddleware, passwordRoutes.changePassword.bind(passwordRoutes));

/**
 * @route   POST /api/v1/password/forgotPassword
 * @desc    Forgot Password
 * @access  Public
 */
router.post("/forgotPassword",clientAuthMiddleware, passwordRoutes.forgotPassword.bind(passwordRoutes));

/**
 * @route   POST /api/v1/password/resendOTP
 * @desc    Resend OTP
 * @access  Public
 */
router.post("/resendOTP",clientAuthMiddleware, passwordRoutes.resendOTP.bind(passwordRoutes));


 


/** * @route   POST /api/v1/password/verifyOTP
 * @desc    Verify OTP
 * @access  Public
 */
router.post("/verifyOTP",clientAuthMiddleware, passwordRoutes.verifyOTP.bind(passwordRoutes));

/** * @route   POST /api/v1/password/resetPassword
 * @desc    resetPassword
 * @access  Public
 */
router.post("/resetPassword",clientAuthMiddleware, passwordRoutes.resetPassword.bind(passwordRoutes));

/**
 * @route   GET /api/v1/password/settings
 * @desc    Get notification settings of logged-in user
 * @access  Private
 */
router.get(
  "/settings",
  clientAuthMiddleware,authMiddleware,
  passwordRoutes.getNotificationSetting.bind(passwordRoutes)
);

/**
 * @route   POST /api/v1/password/settings
 * @desc    Create or update notification settings
 * @access  Private
 */
router.post(
  "/settings",
  clientAuthMiddleware,authMiddleware,
  passwordRoutes.upsertNotificationSetting.bind(passwordRoutes)
);

export default router;