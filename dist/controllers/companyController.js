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
exports.CompanyControllers = void 0;
const companySchema_1 = require("../schemas/companySchema");
const comapnyServices_1 = require("../services/comapnyServices");
const companyServiceController = new comapnyServices_1.CompanyServices();
class CompanyControllers {
    registerCompany(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = companySchema_1.companyRegisterSchema.parse(req.body);
                const company = yield companyServiceController.registerCompany(data);
                res.status(201).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    updatedCompanyDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = companySchema_1.companyUpdateSchema.parse(req.body);
                const company = yield companyServiceController.updateCompanyDetails(data);
                res.status(200).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    updatedCompanyProfileDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = companySchema_1.companyUpdateSchema.parse(req.body);
                const company = yield companyServiceController.updateCompanyProfile(data);
                res.status(200).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAllCompnay(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const companies = yield companyServiceController.getCompanyallDetails(page, limit);
                res.status(200).json(companies);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getCompanyById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = companySchema_1.companyIdSchema.parse(req.query);
                const company = yield companyServiceController.getCompanyById(data);
                res.status(200).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    requestListApproval(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const companies = yield companyServiceController.requestListApproval(page, limit);
                res.status(200).json(companies);
            }
            catch (err) {
                next(err);
            }
        });
    }
    searchCompany(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const data = req.query.search;
                const searchData = yield companyServiceController.searchCompany(data, page, limit);
                res.status(200).json(searchData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    changePassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = companySchema_1.chnagePasswordSchema.parse(req.body);
                const result = yield companyServiceController.changePasswordService(data, id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    forgotPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = companySchema_1.forgotPasswordSchema.parse(req.body);
                const result = yield companyServiceController.forgotPasswordServices(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    resendOTP(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = companySchema_1.forgotPasswordSchema.parse(req.body);
                const result = yield companyServiceController.resendOTPServices(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    verifyOTP(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = companySchema_1.verifyOTPSchema.parse(req.body);
                const result = yield companyServiceController.verifyOTPService(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    resetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = companySchema_1.resetPasswordSchema.parse(req.body);
                const result = yield companyServiceController.resetPasswordService(data, id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateProfileImage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = companySchema_1.updateProfileImageSchema.parse(req.body);
                const result = yield companyServiceController.updateProfileImage(id, data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.CompanyControllers = CompanyControllers;
