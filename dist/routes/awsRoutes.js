"use strict";
// src/routes/awsRoutes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const awsController_1 = require("../controllers/awsController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const awsCredentialRoutes = new awsController_1.awsCredentialController();
/**
 * @route   GET /api/v1/aws/awsCredentials
 * @desc    Get AWS credentials
 * @access  Private (Super Admin)
 */
router.get('/awsCredentials', authMiddleware_1.clientAuthMiddleware, awsCredentialRoutes.awsCredentials.bind(awsCredentialRoutes));
/**
 * @route   POST /api/v1/aws/uploadProfileImage
 * @desc    Generate S3 presigned URL for uploading profile image or documents
 * @access  Private (Client)
 */
router.post('/uploadProfileImage', authMiddleware_1.clientAuthMiddleware, awsCredentialRoutes.getProfileImageUrl.bind(awsCredentialRoutes));
/**
 * @route   POST /api/v1/aws/readImageUrl
 * @desc    Generate presigned URL to read/download an image from S3 using the key
 * @access  Private (Client)
 */
router.put('/readImageUrl', authMiddleware_1.clientAuthMiddleware, awsCredentialRoutes.generateReadUrl.bind(awsCredentialRoutes));
/**
 * @route   POST /api/v1/aws/scaffHoldPdf
 * @desc    Generate presigned URL to read/download a pdf
 * @access  Private (Client)
 */
router.get('/scaffHoldPdf', authMiddleware_1.clientAuthMiddleware, awsCredentialRoutes.scaffHoldPdf.bind(awsCredentialRoutes));
exports.default = router;
