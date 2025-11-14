"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const jobController_1 = require("../controllers/jobController");
const router = (0, express_1.Router)();
const jobRoutes = new jobController_1.jobController();
/**
 * @route   POST /api/v1/job/createJob
 * @desc    create a job
 * @access  Public
 */
router.post("/updateDescreption", authMiddleware_1.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isProjectManager, jobRoutes.updateDescreption.bind(jobRoutes));
/**
 * @route   POST /api/v1/job/addJobCraft
 * @desc    add crfat
 * @access  Public
 */
router.post("/addJobCraft", authMiddleware_1.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isProjectManager, jobRoutes.addJobCraft.bind(jobRoutes));
/**
 * @route   GET /api/v1/job/getJobCraft
 * @desc    getJobCraft
 * @access  Public
 */
router.get("/getJobCraft", authMiddleware_1.clientAuthMiddleware, authMiddleware_1.authMiddleware, jobRoutes.getJobCraft.bind(jobRoutes));
/**
 * @route   GET /api/v1/job/getCraftandCountlist
 * @desc    Get list of all crafts with total count
 * @access  Public / Authenticated (depending on your use case)
 */
router.get("/getCraftandCountlist", authMiddleware_1.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isProjectManager, jobRoutes.getCraftandCountlist.bind(jobRoutes));
/**
 * @route   DELETE /api/v1/job/deleteJobCraft
 * @desc    Delete a craft from a job
 * @access  Protected (Project Manager / Authenticated)
 */
router.delete("/deleteJobCraft", authMiddleware_1.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isProjectManager, jobRoutes.deleteJobCrfats.bind(jobRoutes));
exports.default = router;
