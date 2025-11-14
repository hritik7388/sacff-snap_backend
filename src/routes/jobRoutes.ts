import {Router} from "express"; 
import {authMiddleware, clientAuthMiddleware, isProjectManager} from "../middlewares/authMiddleware";
import { jobController } from "../controllers/jobController";


const router = Router();
const jobRoutes=new jobController();
 

/**
 * @route   POST /api/v1/job/createJob
 * @desc    create a job
 * @access  Public
 */
router.post("/updateDescreption",clientAuthMiddleware, authMiddleware,isProjectManager, jobRoutes.updateDescreption.bind(jobRoutes));
/**
 * @route   POST /api/v1/job/addJobCraft
 * @desc    add crfat
 * @access  Public
 */
router.post("/addJobCraft",clientAuthMiddleware, authMiddleware,isProjectManager, jobRoutes.addJobCraft.bind(jobRoutes));
 
/**
 * @route   GET /api/v1/job/getJobCraft
 * @desc    getJobCraft
 * @access  Public
 */
router.get("/getJobCraft",clientAuthMiddleware, authMiddleware, jobRoutes.getJobCraft.bind(jobRoutes));


/**
 * @route   GET /api/v1/job/getCraftandCountlist
 * @desc    Get list of all crafts with total count
 * @access  Public / Authenticated (depending on your use case)
 */
router.get("/getCraftandCountlist",clientAuthMiddleware,authMiddleware,isProjectManager,jobRoutes.getCraftandCountlist.bind(jobRoutes));

/**
 * @route   DELETE /api/v1/job/deleteJobCraft
 * @desc    Delete a craft from a job
 * @access  Protected (Project Manager / Authenticated)
 */
router.delete("/deleteJobCraft",clientAuthMiddleware, authMiddleware,isProjectManager,jobRoutes.deleteJobCrfats.bind(jobRoutes));



export default router;