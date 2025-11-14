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
exports.projectManagerController = void 0;
const projectManagerServices_1 = require("../services/projectManagerServices");
const projectManagerSchema_1 = require("../schemas/projectManagerSchema");
const tradesManSchema_1 = require("../schemas/tradesManSchema");
const projectManager = new projectManagerServices_1.ProjectManagerServices();
class projectManagerController {
    commonLogin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = projectManagerSchema_1.projectManagerLoginSchema.parse(req.body);
                const user = yield projectManager.commonLoginServices(data);
                res.status(200).json(user);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getProjectList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const status = req.query.status;
                const id = req.user.id;
                const result = yield projectManager.getProjectListServices(id, page, limit, status);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getUserDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const result = yield projectManager.getUserDetails(id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getRequestedScaffolds(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scaffHoldId = projectManagerSchema_1.requestedScaffolds.parse(req.query);
                const result = yield projectManager.getRequestedScaffolds(scaffHoldId);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    approveRejectRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = projectManagerSchema_1.approveRejectRequestSchema.parse(req.body);
                const result = yield projectManager.approveOrRejectScaffHoldRequest(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getPendingTrademanRequestList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const data = tradesManSchema_1.searchFilter.parse(req.query);
                const result = yield projectManager.getTrademanPendingRequestListServices(data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAllPendingModifiedRequestDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const data = tradesManSchema_1.searchFilter.parse(req.query);
                const result = yield projectManager.getAllPendingModifiedRequestsByParentId(data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffHoldJobCraft(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = projectManagerSchema_1.getJobCraftSchema.parse(req.query);
                const result = yield projectManager.getScaffHoldJobAndCraftDetails(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffholdRequestsByCreator(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = projectManagerSchema_1.getScaffholdRequestsByCreator.parse(req.query);
                const result = yield projectManager.getScaffholdRequestsByCreator(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    dashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const result = yield projectManager.getDashboardStats(id);
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
                const userId = req.user.id;
                const data = projectManagerSchema_1.uploadImage.parse(req.body);
                const result = yield projectManager.updateProfileImage(userId, data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.projectManagerController = projectManagerController;
