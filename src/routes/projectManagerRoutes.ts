import {Router} from "express";  
import { projectManagerController } from "../controllers/projectManagerController";
import {authMiddleware} from "../middlewares/authMiddleware";
import {clientAuthMiddleware} from "../middlewares/authMiddleware";
import { isProjectManager } from "../middlewares/authMiddleware";

const router = Router();

const projectManagerRoutes=new projectManagerController();
/**
 * @route   POST /api/v1/projectManager/projectManagerLogin
 * @desc    login Project Manager
 * @access  Public
 */
router.post("/login",clientAuthMiddleware, projectManagerRoutes.commonLogin.bind(projectManagerRoutes)); 

/**
 * @route   GET /api/v1/projectManager/getProjectsList
 * @desc    Get list of projects under projectManager's
 * @access  Private (projectManager)
 */
router.get("/getProjectList",clientAuthMiddleware, authMiddleware, projectManagerRoutes.getProjectList.bind(projectManagerRoutes));
/**
 * @route   GET /api/v1/projectManager/getUserDetails
 * @desc    Get list of competent and projectManager's
 * @access  Private (projectManager)
 */
router.get("/getUserDetails",clientAuthMiddleware, authMiddleware, projectManagerRoutes.getUserDetails.bind(projectManagerRoutes));

/**
 * @route   GET /api/v1/projectManager/getRequestedScaffolds
 * @desc    Get list of competent and projectManager's
 * @access  Private (projectManager)
 */
router.get("/getRequestedScaffolds",clientAuthMiddleware, authMiddleware, projectManagerRoutes.getRequestedScaffolds.bind(projectManagerRoutes));

/**
 * @route   POST /api/v1/projectManager/approveRejectRequest
 * @desc    Approve or Reject ScaffHold Request
 * @access  Private (projectManager)
 */
router.post("/approveRejectRequest",clientAuthMiddleware, authMiddleware, isProjectManager, projectManagerRoutes.approveRejectRequest.bind(projectManagerRoutes));

/**
 * @route   GET /api/v1/projectManager/approveRejectRequest
 * @desc    Approve or Reject ScaffHold Request
 * @access  Private (projectManager)
 */
router.get("/dashboard",clientAuthMiddleware, authMiddleware, isProjectManager, projectManagerRoutes.dashboard.bind(projectManagerRoutes));
 

/**
 * @route   GET /api/v1/projectManager/scaffholdRequestModifications
 * @desc    Get scaffhold request modifications by tradesman
 * @access  Private 
 */
router.get('/getAllPendingModification', clientAuthMiddleware,authMiddleware, projectManagerRoutes.getAllPendingModifiedRequestDetails.bind(projectManagerRoutes));


/** * @route   GET /api/v1/projectManager/myRequests
 * @desc    Get tradesman requests
 * @access  Private projectManager
 */
router.get('/tradesManPendingRequests', clientAuthMiddleware,authMiddleware, projectManagerRoutes.getPendingTrademanRequestList.bind(projectManagerRoutes));

/** * @route   GET /api/v1/projectManager/getScaffHoldJobCraft
 * @desc    Get scaffHold jobCrafts
 * @access  Private
 */
router.get('/getScaffHoldJobCraft', clientAuthMiddleware,authMiddleware, projectManagerRoutes.getScaffHoldJobCraft.bind(projectManagerRoutes));

/** * @route   GET /api/v1/projectManager/getScaffholdRequestsByCreator
 * @desc    Get scaffHold request
 * @access  Private
 */
router.get('/getScaffholdRequestsByCreator', clientAuthMiddleware,authMiddleware, projectManagerRoutes.getScaffholdRequestsByCreator.bind(projectManagerRoutes));


/**
 * @route   PUT /api/v1/user/updateProfileImage
 * @desc    Update user profile image
 * @access  Private
 */
router.put('/updateProfileImage',clientAuthMiddleware,authMiddleware, projectManagerRoutes.updateProfileImage.bind(projectManagerRoutes)
);

 
 


export default router;

