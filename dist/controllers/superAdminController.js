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
    createQuestionnaire(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.createQuestionnaireSchema.parse(req.body);
                // JWT authentication middleware must attach the verified user to req.user.
                const superAdminId = BigInt(req.user.id);
                const result = yield superAdmin.createQuestionnaireServices(data, superAdminId);
                res.status(201).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getQuestionnaireDashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield superAdmin.getQuestionnaireDashboardServices();
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAllQuestionnaires(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.searchQuestionnaireSchema.parse({
                    search: req.query.search,
                    status: req.query.status,
                    startDate: req.query.startDate,
                    endDate: req.query.endDate,
                });
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const result = yield superAdmin.getAllQuestionnairesServices(data, page, limit);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getQuestionnaireById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const result = yield superAdmin.getQuestionnaireByIdServices(Array.isArray(req.params.id) ? ((_a = req.params.id[0]) !== null && _a !== void 0 ? _a : "") : req.params.id);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    // 2. Update quiz by ID
    updateQuestionnaire(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = String((_a = req.body.id) !== null && _a !== void 0 ? _a : "");
                const data = superAdminSchema_1.updateQuestionnaireSchema.parse(req.body);
                const result = yield superAdmin.updateQuestionnaireServices(id, data);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    // 3. Change quiz status
    changeQuestionnaireStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = String((_a = req.body.id) !== null && _a !== void 0 ? _a : "");
                const { status } = superAdminSchema_1.changeQuestionnaireStatusSchema.parse(req.body);
                const result = yield superAdmin.changeQuestionnaireStatusServices(id, status);
                res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
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
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const company = yield superAdmin.getSuperAdminNotifications(id, page, limit);
                res.status(200).json(company);
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
                res.status(200).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getUserData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const scaffHoldData = yield superAdmin.getUserDetails(id);
                res.status(200).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    blog(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = superAdminSchema_1.blogSchema.parse(req.body);
                const blogData = yield superAdmin.blogCreationBySuperAdmin(id, data);
                res.status(200).json(blogData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    publishblog(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = superAdminSchema_1.publishblogSchema.parse(req.body);
                const blogData = yield superAdmin.publishBlog(id, data);
                res.status(200).json(blogData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    deleteblog(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = superAdminSchema_1.deleteblogSchema.parse(req.query);
                const blogData = yield superAdmin.delteBlog(id, data);
                res.status(200).json(blogData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    deletecontactInfo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = superAdminSchema_1.deleteContact.parse(req.query);
                const blogData = yield superAdmin.delteContact(id, data);
                res.status(200).json(blogData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getPublishblogs(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const search = req.query.search ? String(req.query.search) : undefined;
                const page = req.query.page ? Number(req.query.page) : 1;
                const limit = req.query.limit ? Number(req.query.limit) : 10;
                const status = req.query.status ? String(req.query.status) : undefined;
                const result = yield superAdmin.getpublishBlogs(status, search, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getPublishblog(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const search = req.query.search ? String(req.query.search) : undefined;
                const page = req.query.page ? Number(req.query.page) : 1;
                const limit = req.query.limit ? Number(req.query.limit) : 10;
                const status = req.query.status ? String(req.query.status) : undefined;
                const result = yield superAdmin.getpublishBlog(status, search, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    contact(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = superAdminSchema_1.contact.parse(req.body);
                const result = yield superAdmin.contactInfo(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getcontactInfo(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const search = req.query.search ? String(req.query.search) : undefined;
                const page = req.query.page ? Number(req.query.page) : 1;
                const limit = req.query.limit ? Number(req.query.limit) : 10;
                const result = yield superAdmin.getContactInfo(search, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getContactById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = superAdminSchema_1.Contactinfo.parse(req.query);
                const result = yield superAdmin.getContactById(id);
                return res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    getBlogById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = superAdminSchema_1.blogByIdSchema.parse(req.query);
                const result = yield superAdmin.getBlogbyId(id);
                return res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    updateProfileImage(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = superAdminSchema_1.updateProfileImageSchema.parse(req.body);
                const result = yield superAdmin.updateUserProfileImage(id, data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    logOut(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = superAdminSchema_1.logout.parse(req.body);
                const result = yield superAdmin.logoutUser(id, data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.superAdminController = superAdminController;
