// src/routes/awsRoutes.ts

import { Router } from "express";
import { awsCredentialController } from "../controllers/awsController";

import { authMiddleware } from "../middlewares/authMiddleware";
import { clientAuthMiddleware } from "../middlewares/authMiddleware";

const router = Router();


const awsCredentialRoutes = new awsCredentialController();


/**
 * @route   GET /api/v1/aws/awsCredentials
 * @desc    Get AWS credentials
 * @access  Private (Super Admin)
 */
router.get('/awsCredentials', clientAuthMiddleware, awsCredentialRoutes.awsCredentials.bind(awsCredentialRoutes));


/**
 * @route   POST /api/v1/aws/uploadProfileImage
 * @desc    Generate S3 presigned URL for uploading profile image or documents
 * @access  Private (Client)
 */
router.post('/uploadProfileImage', clientAuthMiddleware, awsCredentialRoutes.getProfileImageUrl.bind(awsCredentialRoutes));

/**
 * @route   POST /api/v1/aws/readImageUrl
 * @desc    Generate presigned URL to read/download an image from S3 using the key
 * @access  Private (Client)
 */
router.put('/readImageUrl', clientAuthMiddleware, awsCredentialRoutes.generateReadUrl.bind(awsCredentialRoutes)
);
/**
 * @route   POST /api/v1/aws/scaffHoldPdf
 * @desc    Generate presigned URL to read/download a pdf 
 * @access  Private (Client)
 */
router.get('/scaffHoldPdf', clientAuthMiddleware, awsCredentialRoutes.scaffHoldPdf.bind(awsCredentialRoutes))




export default router;