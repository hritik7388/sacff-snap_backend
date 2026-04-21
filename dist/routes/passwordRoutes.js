"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const password_1 = require("../controllers/password");
const router = (0, express_1.Router)();
const passwordRoutes = new password_1.PasswordController();
/**
 * @route   POST /api/v1/password/changePassword
 * @desc    Change Password
 * @access  Private (Authenticated Users)
 */
router.post("/changePassword", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, passwordRoutes.changePassword.bind(passwordRoutes));
/**
 * @route   POST /api/v1/password/forgotPassword
 * @desc    Forgot Password
 * @access  Public
 */
router.post("/forgotPassword", authMiddleware_2.clientAuthMiddleware, passwordRoutes.forgotPassword.bind(passwordRoutes));
/**
 * @route   POST /api/v1/password/resendOTP
 * @desc    Resend OTP
 * @access  Public
 */
router.post("/resendOTP", authMiddleware_2.clientAuthMiddleware, passwordRoutes.resendOTP.bind(passwordRoutes));
/** * @route   POST /api/v1/password/verifyOTP
 * @desc    Verify OTP
 * @access  Public
 */
router.post("/verifyOTP", authMiddleware_2.clientAuthMiddleware, passwordRoutes.verifyOTP.bind(passwordRoutes));
/** * @route   POST /api/v1/password/resetPassword
 * @desc    resetPassword
 * @access  Public
 */
router.post("/resetPassword", authMiddleware_2.clientAuthMiddleware, passwordRoutes.resetPassword.bind(passwordRoutes));
exports.default = router;
