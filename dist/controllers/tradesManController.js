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
exports.tradesManController = void 0;
const tradesManServices_1 = require("../services/tradesManServices");
const tradesManSchema_1 = require("../schemas/tradesManSchema");
const tradesMan = new tradesManServices_1.tradesManServices();
class tradesManController {
    dashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const result = yield tradesMan.dashboard(id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    tradesManRegister(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = tradesManSchema_1.tradesManRegisterSchema.parse(req.body);
                const user = yield tradesMan.registerTradesManServices(data);
                res.status(201).json(user);
            }
            catch (err) {
                next(err);
            }
        });
    }
    tradesManLogin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = tradesManSchema_1.tradesManLoginSchema.parse(req.body);
                const user = yield tradesMan.tradesmanloginServices(data);
                res.status(200).json(user);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getTradesManDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const result = yield tradesMan.getTradesManDetails(id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getCraftManList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const result = yield tradesMan.getCraftListServices();
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getTradesManCraftList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const craftName = tradesManSchema_1.tradesManCraftSchema.parse(req.query);
                const result = yield tradesMan.getTradesManCraftListServices(craftName);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateProfile(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = tradesManSchema_1.updateProfileSchema.parse(req.body);
                const updatedUser = yield tradesMan.updateTradesManProfile(data);
                // Send response
                res.status(200).json(updatedUser);
            }
            catch (err) {
                next(err);
            }
        });
    }
    searchJob(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = tradesManSchema_1.seacrchJobSchema.parse(req.body);
                const result = yield tradesMan.searchJob(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    requestScaffhold(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = tradesManSchema_1.requestScaffOldSchema.parse(req.body);
                const result = yield tradesMan.requestScaffHoldServices(id, data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateScaffHoldRequestController(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = tradesManSchema_1.updateScaffOldSRequestchema.parse(req.body);
                const result = yield tradesMan.updateScaffHoldRequest(id, data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getTrademanRequestList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const id = req.user.id;
                const data = tradesManSchema_1.searchFilter.parse(req.query);
                const result = yield tradesMan.getTrademanRequestListServices(id, data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    joinProject(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = tradesManSchema_1.jobApplicationSchema.parse(req.body);
                const result = yield tradesMan.joinProjectServices(id, data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getJoinedScaffholds(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const id = req.user.id;
                const result = yield tradesMan.getJoinedScaffholds(id, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    filterScaffHolds(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const data = tradesManSchema_1.searchScaffHold.parse(req.query);
                const result = yield tradesMan.filterScaffHolds(data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    deleteScaffHoldRequest(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = tradesManSchema_1.deleteRequest.parse(req.body);
                const result = yield tradesMan.deleteScaffHoldRequest(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffholdRequestDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = tradesManSchema_1.requestSacffHold.parse(req.query);
                const result = yield tradesMan.getRequestScaffHoldById(id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getModifiedRequestDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = tradesManSchema_1.getrequestSacffHold.parse(req.query);
                const result = yield tradesMan.getModifiedRequestsByParentId(id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAllModifiedRequestDetails(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const data = tradesManSchema_1.searchFilter.parse(req.query);
                const result = yield tradesMan.getAllModifiedRequestsByParentId(id, data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getTradesManScaffHoldDetailsById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = tradesManSchema_1.scaffHoldDetailsById.parse(req.query);
                const scaffHoldData = yield tradesMan.getTradesManScaffHoldDetailsById(id, data);
                res.status(200).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getSearchFilterScaffHolds(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const data = tradesManSchema_1.searchFilter.parse(req.body);
                const result = yield tradesMan.getSearchFilterData(data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getFilterScaffHolds(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.body.page) || 1;
                const limit = Number(req.body.limit) || 10;
                const id = req.user.id;
                const data = tradesManSchema_1.searchFilter.parse(req.body);
                const result = yield tradesMan.getFilteredScaffHolds(id, data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    delteTradesManAccount(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const result = yield tradesMan.deleteTradesman(id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.tradesManController = tradesManController;
