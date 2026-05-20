// src/routes/projectManagerRoutes.ts
import { Router } from "express";
import { projectManagerController } from "../controllers/projectManagerController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { clientAuthMiddleware } from "../middlewares/authMiddleware";
import { isProjectManager } from "../middlewares/authMiddleware";
import { Request, Response } from "express";
import prisma from "../config/prismaClient";
const router = Router();

const projectManagerRoutes = new projectManagerController();
/**
 * @route   POST /api/v1/projectManager/projectManagerLogin
 * @desc    login Project Manager
 * @access  Public
 */
router.post("/login", clientAuthMiddleware, projectManagerRoutes.commonLogin.bind(projectManagerRoutes));

/**
 * @route   GET /api/v1/projectManager/getProjectsList
 * @desc    Get list of projects under projectManager's
 * @access  Private (projectManager)
 */
router.get("/getProjectList", clientAuthMiddleware, authMiddleware, projectManagerRoutes.getProjectList.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/getUserDetails
 * @desc    Get list of competent and projectManager's
 * @access  Private (projectManager)
 */
router.get("/getUserDetails", clientAuthMiddleware, authMiddleware, projectManagerRoutes.getUserDetails.bind(projectManagerRoutes));

/**
 * @route   GET /api/v1/projectManager/getRequestedScaffolds
 * @desc    Get list of competent and projectManager's
 * @access  Private (projectManager)
 */
router.get("/getRequestedScaffolds", clientAuthMiddleware, authMiddleware, projectManagerRoutes.getRequestedScaffolds.bind(projectManagerRoutes));

/**
 * @route   POST /api/v1/projectManager/approveRejectRequest
 * @desc    Approve or Reject ScaffHold Request
 * @access  Private (projectManager)
 */
router.post("/approveRejectRequest", clientAuthMiddleware, authMiddleware, isProjectManager, projectManagerRoutes.approveRejectRequest.bind(projectManagerRoutes));

/**
 * @route   GET /api/v1/projectManager/approveRejectRequest
 * @desc    Approve or Reject ScaffHold Request
 * @access  Private (projectManager)
 */
router.get("/dashboard", clientAuthMiddleware, authMiddleware, isProjectManager, projectManagerRoutes.dashboard.bind(projectManagerRoutes));


/**
 * @route   GET /api/v1/projectManager/scaffholdRequestModifications
 * @desc    Get scaffhold request modifications by tradesman
 * @access  Private 
 */
router.get('/getAllPendingModification', clientAuthMiddleware, authMiddleware, projectManagerRoutes.getAllPendingModifiedRequestDetails.bind(projectManagerRoutes));


/** * @route   GET /api/v1/projectManager/myRequests
 * @desc    Get tradesman requests
 * @access  Private projectManager
 */
router.get('/tradesManPendingRequests', clientAuthMiddleware, authMiddleware, projectManagerRoutes.getPendingTrademanRequestList.bind(projectManagerRoutes));

/** * @route   GET /api/v1/projectManager/getScaffHoldJobCraft
 * @desc    Get scaffHold jobCrafts
 * @access  Private
 */
router.get('/getScaffHoldJobCraft', clientAuthMiddleware, authMiddleware, projectManagerRoutes.getScaffHoldJobCraft.bind(projectManagerRoutes));

/** * @route   GET /api/v1/projectManager/getScaffholdRequestsByCreator
 * @desc    Get scaffHold request
 * @access  Private
 */
router.get('/getScaffholdRequestsByCreator', clientAuthMiddleware, authMiddleware, projectManagerRoutes.getScaffholdRequestsByCreator.bind(projectManagerRoutes));


/**
 * @route   PUT /api/v1/user/updateProfileImage
 * @desc    Update user profile image
 * @access  Private
 */
router.put('/updateProfileImage', clientAuthMiddleware, authMiddleware, projectManagerRoutes.updateProfileImage.bind(projectManagerRoutes)
);

/**
 * @route   PUT /api/v1/user/updateUserProfileImage
 * @desc    Update user profile image
 * @access  Private
 */
router.put('/updateUserProfileImage', clientAuthMiddleware, authMiddleware, projectManagerRoutes.updateUserProfileImage.bind(projectManagerRoutes)
);


/**
 * @route   GET /api/v1/subAdmin/generateProjectJobLink/:projectId
 * @desc    Generate project job link
 * @access  Private (subAdmin)
 */

router.get(
    "/generateProjectJobLink/:PJT",
    clientAuthMiddleware,
    authMiddleware,
    projectManagerRoutes
        .generateProjectJobLink
        .bind(projectManagerRoutes)
);

router.get(
    "/job/:PJT",
    async (
        req: Request,
        res: Response
    ): Promise<any> => {

        try {

            // ✅ GET PJT
            const PJT =
                req.params.PJT as string;

            console.log("PJT:", PJT);

            // ✅ FIND PROJECT
            const project =
                await prisma.project.findFirst({
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
            const playStoreUrl =
                "https://play.google.com/store/apps/details?id=com.domain.scaff_snap";

            // ✅ APP DEEP LINK
            const deepLink =
                `scaffsnapp://job/${PJT}`;

            // ✅ UNIVERSAL LINK
            const universalLink =
                `https://api.scaffsnapp.com/api/v1/projectManager/job/${PJT}`;

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

        } catch (error: any) {

            console.log(error);

            return res.status(500).json({

                success: false,

                message: error.message,

            });

        }
    }
);


// ✅ ANDROID APP LINKS
router.get(
    "/.well-known/assetlinks.json",
    (
        req: Request,
        res: Response
    ): any => {

        return res.json([
            {
                relation: [
                    "delegate_permission/common.handle_all_urls"
                ],

                target: {

                    namespace:
                        "android_app",

                    package_name:
                        process.env
                            .ANDROID_PACKAGE_NAME,

                    sha256_cert_fingerprints: [
                        process.env
                            .ANDROID_SHA256 as string
                    ]
                }
            }
        ]);
    }
);


// ✅ IOS UNIVERSAL LINKS
router.get(
    "/.well-known/apple-app-site-association",
    (
        req: Request,
        res: Response
    ): any => {

        res.setHeader(
            "Content-Type",
            "application/json"
        );

        return res.json({

            applinks: {

                apps: [],

                details: [
                    {
                        appID:
                            `${process.env.IOS_TEAM_ID}.${process.env.IOS_BUNDLE_ID}`,

                        paths: [
                            "/api/v1/projectManager/job/*"
                        ]
                    }
                ]
            }
        });
    }
);



export default router;

