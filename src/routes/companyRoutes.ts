import {Router} from "express";
import {CompanyControllers} from "../controllers/companyController";
import {authMiddleware, isSubAdmin, isSUperAdmin} from "../middlewares/authMiddleware";
import {clientAuthMiddleware} from "../middlewares/authMiddleware";

const router = Router();

const companyController = new CompanyControllers();
/**
 * @route   POST /api/v1/company/register
 * @desc    Register a new company
 * @access  Public
 */
router.post("/registerCompany", clientAuthMiddleware, companyController.registerCompany.bind(companyController));

 

/**
 * @route   PUT /api/v1/company/update
 * @desc    Upadte a existing  company
 * @access  Public
 */
router.put("/updatedCompanyDetails",clientAuthMiddleware, authMiddleware,isSUperAdmin, companyController.updatedCompanyDetails.bind(companyController));

/**
 * @route   GET /api/v1/company/all
 * @desc    Get all companies
 * @access  Private (Super Admin)
 */
router.get("/getAllCompnay",clientAuthMiddleware, authMiddleware, companyController.getAllCompnay.bind(companyController));

/**
 * @route   GET /api/v1/company/getCompanyById
 * @desc    Get company by ID
 * @access  Private (Super Admin)
 */
router.get("/getCompanyById", clientAuthMiddleware, authMiddleware, companyController.getCompanyById.bind(companyController));

/**
 * @route   GET /api/v1/company/requestListApproval
 * @desc    Get all companies
 * @access  Private (Super Admin)
 */
router.get("/requestListApproval",clientAuthMiddleware, authMiddleware, isSUperAdmin,companyController.requestListApproval.bind(companyController));
 
/**
 * @route   POST /api/v1/company/searchCompany
 * @desc    Search company by ID or name
 * @access  Private (Super Admin)
 */
router.get('/searchCompany', clientAuthMiddleware,authMiddleware, companyController.searchCompany.bind(companyController));



export default router;