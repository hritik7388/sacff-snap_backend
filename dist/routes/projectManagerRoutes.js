"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/projectManagerRoutes.ts
const express_1 = require("express");
const projectManagerController_1 = require("../controllers/projectManagerController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const authMiddleware_3 = require("../middlewares/authMiddleware");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const router = (0, express_1.Router)();
const projectManagerRoutes = new projectManagerController_1.projectManagerController();
/**
 * @route   POST /api/v1/projectManager/projectManagerLogin
 * @desc    login Project Manager
 * @access  Public
 */
router.post("/login", authMiddleware_2.clientAuthMiddleware, projectManagerRoutes.commonLogin.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/getProjectsList
 * @desc    Get list of projects under projectManager's
 * @access  Private (projectManager)
 */
router.get("/getProjectList", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getProjectList.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/getUserDetails
 * @desc    Get list of competent and projectManager's
 * @access  Private (projectManager)
 */
router.get("/getUserDetails", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getUserDetails.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/getRequestedScaffolds
 * @desc    Get list of competent and projectManager's
 * @access  Private (projectManager)
 */
router.get("/getRequestedScaffolds", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getRequestedScaffolds.bind(projectManagerRoutes));
/**
 * @route   POST /api/v1/projectManager/approveRejectRequest
 * @desc    Approve or Reject ScaffHold Request
 * @access  Private (projectManager)
 */
router.post("/approveRejectRequest", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_3.isProjectManager, projectManagerRoutes.approveRejectRequest.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/approveRejectRequest
 * @desc    Approve or Reject ScaffHold Request
 * @access  Private (projectManager)
 */
router.get("/dashboard", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_3.isProjectManager, projectManagerRoutes.dashboard.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/scaffholdRequestModifications
 * @desc    Get scaffhold request modifications by tradesman
 * @access  Private
 */
router.get('/getAllPendingModification', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getAllPendingModifiedRequestDetails.bind(projectManagerRoutes));
/** * @route   GET /api/v1/projectManager/myRequests
 * @desc    Get tradesman requests
 * @access  Private projectManager
 */
router.get('/tradesManPendingRequests', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getPendingTrademanRequestList.bind(projectManagerRoutes));
/** * @route   GET /api/v1/projectManager/getScaffHoldJobCraft
 * @desc    Get scaffHold jobCrafts
 * @access  Private
 */
router.get('/getScaffHoldJobCraft', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getScaffHoldJobCraft.bind(projectManagerRoutes));
/** * @route   GET /api/v1/projectManager/getScaffholdRequestsByCreator
 * @desc    Get scaffHold request
 * @access  Private
 */
router.get('/getScaffholdRequestsByCreator', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.getScaffholdRequestsByCreator.bind(projectManagerRoutes));
/**
 * @route   PUT /api/v1/user/updateProfileImage
 * @desc    Update user profile image
 * @access  Private
 */
router.put('/updateProfileImage', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.updateProfileImage.bind(projectManagerRoutes));
/**
 * @route   PUT /api/v1/user/updateUserProfileImage
 * @desc    Update user profile image
 * @access  Private
 */
router.put('/updateUserProfileImage', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes.updateUserProfileImage.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/subAdmin/generateProjectJobLink/:projectId
 * @desc    Generate project job link
 * @access  Private (subAdmin)
 */
router.get("/generateProjectJobLink/:PJT", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, projectManagerRoutes
    .generateProjectJobLink
    .bind(projectManagerRoutes));
router.get("/job/:PJT", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // ✅ GET PJT
        const PJT = req.params.PJT;
        console.log("PJT:", PJT);
        // ✅ FIND PROJECT
        const project = yield prismaClient_1.default.project.findFirst({
            where: {
                PJT: PJT,
            },
        });
        // ✅ PROJECT NOT FOUND
        if (!project) {
            return res.status(404).send(`
                    <!DOCTYPE html>

                    <html>

                    <head>

                        <title>
                            Project Not Found
                        </title>

                    </head>

                    <body>

                        <h2>
                            Project not found
                        </h2>

                    </body>

                    </html>
                `);
        }
        // ✅ PLAY STORE URL
        const playStoreUrl = "https://play.google.com/store/apps/details?id=com.domain.scaff_snap";
        // ✅ APP DEEP LINK
        const deepLink = `scaffsnapp://job/${PJT}`;
        // ✅ UNIVERSAL LINK
        const universalLink = `https://api.scaffsnapp.com/api/v1/projectManager/job/${PJT}`;
        // ✅ RESPONSE HTML
        return res.send(`
<!DOCTYPE html>

<html>

<head>

    <meta charset="UTF-8" />

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    />

    <title>
        Opening ScaffSnapp
    </title>

    <style>

        body {

            font-family: Arial, sans-serif;

            display: flex;

            justify-content: center;

            align-items: center;

            height: 100vh;

            margin: 0;

            background: #ffffff;

            flex-direction: column;

        }

        h2 {

            color: #333;

        }

    </style>

</head>

<body>

    <h2>
        Opening ScaffSnapp...
    </h2>

    <script>

        const deepLink =
            "${deepLink}";

        const playStoreUrl =
            "${playStoreUrl}";

        const universalLink =
            "${universalLink}";

        // ✅ DEVICE CHECK
        const isAndroid =
            /Android/i.test(
                navigator.userAgent
            );

        const isiPhone =
            /iPhone|iPad|iPod/i.test(
                navigator.userAgent
            );

        // ✅ OPEN APP
        function openApp() {

            // Android
            if (isAndroid) {

                // Try App Link
                window.location.href =
                    universalLink;

                // Fallback Deep Link
                setTimeout(() => {

                    window.location.href =
                        deepLink;

                }, 1000);

                // Final Fallback Play Store
                setTimeout(() => {

                    window.location.href =
                        playStoreUrl;

                }, 2500);

            }

            // iOS
            else if (isiPhone) {

                window.location.href =
                    deepLink;

            }

            // Other Devices
            else {

                window.location.href =
                    playStoreUrl;

            }
        }

        // ✅ START
        openApp();

    </script>

</body>

</html>
            `);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}));
// ✅ ANDROID APP LINKS
router.get("/.well-known/assetlinks.json", (req, res) => {
    return res.json([
        {
            relation: [
                "delegate_permission/common.handle_all_urls"
            ],
            target: {
                namespace: "android_app",
                package_name: process.env
                    .ANDROID_PACKAGE_NAME,
                sha256_cert_fingerprints: [
                    process.env
                        .ANDROID_SHA256
                ]
            }
        }
    ]);
});
// ✅ IOS UNIVERSAL LINKS
router.get("/.well-known/apple-app-site-association", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    return res.json({
        applinks: {
            apps: [],
            details: [
                {
                    appID: `${process.env.IOS_TEAM_ID}.${process.env.IOS_BUNDLE_ID}`,
                    paths: [
                        "/api/v1/projectManager/job/*"
                    ]
                }
            ]
        }
    });
});
exports.default = router;
