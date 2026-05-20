// src/routes/tradesManRoutes.ts
import {Router} from "express"; 
import { tradesManController } from "../controllers/tradesManController";
import {authMiddleware, isTradesMan} from "../middlewares/authMiddleware";
import {clientAuthMiddleware} from "../middlewares/authMiddleware";

const router = Router();

const tradesManRoutes=new tradesManController();
/**
 * @route   POST /api/v1/tradesMan/tradesManRegister
 * @desc    register TradesMan
 * @access  Public
 */
router.post("/register",clientAuthMiddleware, tradesManRoutes.tradesManRegister.bind(tradesManRoutes));
/**
 * @route   POST /api/v1/tradesMan/tradesManLogin
 * @desc    login TradesMan
 * @access  Public
 */
router.post("/login",clientAuthMiddleware, tradesManRoutes.tradesManLogin.bind(tradesManRoutes));


/**
 * @route   POST /api/v1/tradesMan/getTradesManDetails
 * @desc    details TradesMan
 * @access  Public
 */
router.get("/getTradesManDetails",clientAuthMiddleware, authMiddleware,tradesManRoutes.getTradesManDetails.bind(tradesManRoutes));

/**
 * @route   GET /api/v1/tradesMan/getCraftList
 * @desc    Upadte a existing  tradesMan
 * @access  Public
 */
router.get("/crafts",clientAuthMiddleware, tradesManRoutes.getCraftManList.bind(tradesManRoutes));

/**
 * @route   GET /api/v1/tradesMan/getTradesManCraftList
 * @desc    Upadte a existing  tradesMan
 * @access  Public
 */
router.get("/tradesManCrafts",clientAuthMiddleware, authMiddleware,tradesManRoutes.getTradesManCraftList.bind(tradesManRoutes));

/**
 * @route   PUT /api/v1/tradesMan/updateProfile
 * @desc    Update TradesMan profile
 * @access  Private
 */
router.put("/updateProfile",clientAuthMiddleware,authMiddleware,isTradesMan,tradesManRoutes.updateProfile.bind(tradesManRoutes));

 

/**
 * @route   POST /api/v1/tradesMan/requestScaffhold
 * @desc    Request Scaffhold by tradesman
 * @access  Private
 */
router.post('/requestScaffhold', clientAuthMiddleware,authMiddleware,isTradesMan, tradesManRoutes.requestScaffhold.bind(tradesManRoutes));

/** * @route   PUT /api/v1/tradesMan/updateScaffHoldRequest
 * @desc    Update Scaffhold Request by tradesman
 * @access  Private
 */
router.put('/updateScaffHoldRequest', clientAuthMiddleware,authMiddleware,isTradesMan, tradesManRoutes.updateScaffHoldRequestController.bind(tradesManRoutes));


/** * @route   GET /api/v1/tradesMan/myRequests
 * @desc    Get tradesman requests
 * @access  Private
 */
router.get('/myRequests', clientAuthMiddleware,authMiddleware, tradesManRoutes.getTrademanRequestList.bind(tradesManRoutes));

/**
 * @route   POST /api/v1/tradesMan/joinProject
 * @desc    Join Project by tradesman
 * @access  Private 
 */
router.post('/joinProject', clientAuthMiddleware,authMiddleware,isTradesMan, tradesManRoutes.joinProject.bind(tradesManRoutes));

/**
 * @route   GET /api/v1/tradesMan/joinedScaffholds
 * @desc    Get joined scaffholds by tradesman
 * @access  Private 
 */
router.get('/joinedScaffholds', clientAuthMiddleware,authMiddleware,isTradesMan, tradesManRoutes.getJoinedScaffholds.bind(tradesManRoutes));

/**
 * @route   GET /api/v1/tradesMan/dashboard
 * @desc    Get tradesman dashboard data
 * @access  Private 
 */
router.get('/dashboard', clientAuthMiddleware,authMiddleware,isTradesMan, tradesManRoutes.dashboard.bind(tradesManRoutes));


/** * @route   GET /api/v1/tradesMan/scaffholds
 * @desc    Get all scaffholds
 * @access  Private 
 */
router.get('/filterScaffHolds', clientAuthMiddleware,authMiddleware,isTradesMan, tradesManRoutes.filterScaffHolds.bind(tradesManRoutes));
 

/** * @route   DELETE /api/v1/tradesMan/deleteScaffHoldRequest
 * @desc    Delete scaffhold request by tradesman
 * @access  Private 
 */
router.delete('/deleteScaffHoldRequest', clientAuthMiddleware,authMiddleware,isTradesMan, tradesManRoutes.deleteScaffHoldRequest.bind(tradesManRoutes));

/**
 * @route   GET /api/v1/tradesMan/scaffholdRequestDetails
 * @desc    Get scaffhold request details by tradesman
 * @access  Private 
 */
router.get('/getScaffholdRequestDetailsById', clientAuthMiddleware,authMiddleware, tradesManRoutes.getScaffholdRequestDetails.bind(tradesManRoutes));

/**
 * @route   GET /api/v1/tradesMan/scaffholdRequestModifications
 * @desc    Get scaffhold request modifications by tradesman
 * @access  Private 
 */
router.get('/getModificationRequest', clientAuthMiddleware,authMiddleware, tradesManRoutes.getModifiedRequestDetails.bind(tradesManRoutes));
 

/**
 * @route   GET /api/v1/tradesMan/scaffholdRequestModifications
 * @desc    Get scaffhold request modifications by tradesman
 * @access  Private 
 */
router.get('/getAllModificationRequest', clientAuthMiddleware,authMiddleware, tradesManRoutes.getAllModifiedRequestDetails.bind(tradesManRoutes));
 

 
 /**
  * @route   GET /api/v1/tradesMan/getScaffHoldDetailsById
  * @desc    Get scaffHold details by ID
  * @access  Private (Authenticated Users)
  */
 router.get("/getTradesManScaffHoldDetailsById",clientAuthMiddleware, authMiddleware, tradesManRoutes.getTradesManScaffHoldDetailsById.bind(tradesManRoutes));

 /**
  * @route   POST /api/v1/tradesMan/getSearchFilterScaffHold
  * @desc    Get scaffHold details by ID with search filter
  * @access  Private (Authenticated Users)
  */
 router.post("/getSearchFilterScaffHold",clientAuthMiddleware, authMiddleware, tradesManRoutes.getSearchFilterScaffHolds.bind(tradesManRoutes));


  /**
  * @route   POST /api/v1/tradesMan/getFilterScaffHolds
  * @desc    Get scaffHold details by ID with search filter
  * @access  Private (Authenticated Users)
  */
 router.post("/getFilterScaffHolds",clientAuthMiddleware, authMiddleware, tradesManRoutes.getFilterScaffHolds.bind(tradesManRoutes));

    /**
     * @route   DELETE /api/v1/tradesMan/deleteAccount
     * @desc    Delete tradesman account
     * @access  Private (Authenticated Users)
     */
   router.delete("/deleteAccount",clientAuthMiddleware, authMiddleware, tradesManRoutes.delteTradesManAccount.bind(tradesManRoutes));
   

export default router;