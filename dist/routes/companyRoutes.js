"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const companyController_1 = require("../controllers/companyController");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const authMiddleware_2 = require("../middlewares/authMiddleware");
const router = (0, express_1.Router)();
const companyController = new companyController_1.CompanyControllers();
/**
 * @route   POST /api/v1/company/register
 * @desc    Register a new company
 * @access  Public
 */
router.post("/registerCompany", authMiddleware_2.clientAuthMiddleware, companyController.registerCompany.bind(companyController));
/**
 * @route   PUT /api/v1/company/update
 * @desc    Upadte a existing  company
 * @access  Public
 */
router.put("/updatedCompanyDetails", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, companyController.updatedCompanyDetails.bind(companyController));
/**
 * @route   GET /api/v1/company/all
 * @desc    Get all companies
 * @access  Private (Super Admin)
 */
router.get("/getAllCompnay", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, companyController.getAllCompnay.bind(companyController));
/**
 * @route   GET /api/v1/company/getCompanyById
 * @desc    Get company by ID
 * @access  Private (Super Admin)
 */
router.get("/getCompanyById", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, companyController.getCompanyById.bind(companyController));
/**
 * @route   GET /api/v1/company/requestListApproval
 * @desc    Get all companies
 * @access  Private (Super Admin)
 */
router.get("/requestListApproval", authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, authMiddleware_1.isSUperAdmin, companyController.requestListApproval.bind(companyController));
/**
 * @route   POST /api/v1/company/searchCompany
 * @desc    Search company by ID or name
 * @access  Private (Super Admin)
 */
router.get('/searchCompany', authMiddleware_2.clientAuthMiddleware, authMiddleware_1.authMiddleware, companyController.searchCompany.bind(companyController));
exports.default = router;
