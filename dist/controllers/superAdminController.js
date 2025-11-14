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
Object.defineProperty(exports, "__esModule", { value: true });
exports.superAdminController = void 0;
const superAdminServices_1 = require("../services/superAdminServices");
const superAdminSchema_1 = require("../schemas/superAdminSchema");
const superAdmin = new superAdminServices_1.superAdminServices();
class superAdminController {
    superAdminLogin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.superAdminSchema.parse(req.body);
                const user = yield superAdmin.loginSuperAdminServices(data);
                res.status(200).json(user);
            }
            catch (err) {
                next(err);
            }
        });
    }
    dashboardData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield superAdmin.adminDashboard();
                res.status(200).json(data);
            }
            catch (err) {
                next(err);
            }
        });
    }
    approveCompanyrequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.approveCompanyRequestSchema.parse(req.body);
                const company = yield superAdmin.approveCompanyRequest(data);
                res.status(200).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    rejectCompanyrequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.rejectCompanyRequestSchema.parse(req.body);
                const company = yield superAdmin.rejectCompanyRequest(data);
                res.status(200).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    addNewCompanyBySuperAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.addNewCompanySchema.parse(req.body);
                const company = yield superAdmin.addNewCompanyBySuperAdmin(data);
                res.status(201).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    blockCompanyBySuperAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.companyStatus.parse(req.body);
                const company = yield superAdmin.blockCompany(data);
                res.status(201).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    unblockCompanyBySuperAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.companyStatus.parse(req.body);
                const company = yield superAdmin.unblockCompany(data);
                res.status(201).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAllActiveCompanies(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const companies = yield superAdmin.getAllActiveCompanies(page, limit);
                res.status(200).json(companies);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAllBlockedCompanies(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const companies = yield superAdmin.getAllBlockedCompanies(page, limit);
                res.status(200).json(companies);
            }
            catch (err) {
                next(err);
            }
        });
    }
    deleteCompanyBySuperAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.companyStatus.parse(req.body);
                const company = yield superAdmin.deleteCompany(data);
                res.status(201).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    superAdminNotifictaion(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const company = yield superAdmin.getSuperAdminNotifications();
                res.status(201).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    markedNotifictaion(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.notifictaion.parse(req.body);
                const company = yield superAdmin.markNotificationAsRead(data);
                res.status(201).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.superAdminController = superAdminController;
