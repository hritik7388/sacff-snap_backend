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
exports.scaffHoldController = void 0;
const scaffHoldServices_1 = require("../services/scaffHoldServices");
const scaffHoldSchema_1 = require("../schemas/scaffHoldSchema");
const tradesManSchema_1 = require("../schemas/tradesManSchema");
const scaffHold = new scaffHoldServices_1.ScaffHoldsServices();
class scaffHoldController {
    getAllScaffHold(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const scaffHoldData = yield scaffHold.getAllScaffHolds(page, limit);
                res.status(200).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffHoldDetailsById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = scaffHoldSchema_1.scaffHoldDetailsById.parse(req.query);
                const scaffHoldData = yield scaffHold.getScaffHoldById(data);
                res.status(200).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getProjectScaffHold(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const projectId = BigInt(req.body.projectId);
                // ✅ Zod validation
                const data = tradesManSchema_1.searchFilter.parse(req.body);
                // 📄 pagination
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                // 🚀 service call
                const result = yield scaffHold.getProjectScaffHold(data, page, limit, projectId);
                return res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffHoldCompetentPerson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = scaffHoldSchema_1.scaffCompetentPerson.parse(req.query);
                const scaffHoldData = yield scaffHold.projectCompetentPersons(data);
                res.status(200).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffCompetentPerson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = scaffHoldSchema_1.scaffHoldDetailsById.parse(req.query);
                const scaffHoldData = yield scaffHold.projectAndCompetentPersons(data);
                res.status(200).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    addScaffHoldCompetentPerson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = scaffHoldSchema_1.ScaffCompetentPerson.parse(req.body);
                const userId = req.user.id;
                const competentData = yield scaffHold.addCompetentPersonToProject(userId, data);
                res.status(200).json(competentData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    removeScaffHoldCompetentPerson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = scaffHoldSchema_1.removeScaffCompetentPerson.parse(req.query);
                const competentData = yield scaffHold.removeCompetentPersonFromProject(data);
                res.status(200).json(competentData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    changeTagsPriority(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = scaffHoldSchema_1.changePriorityAndTagsSchema.parse(req.body);
                const Chnages = yield scaffHold.changePriorityAndTags(data);
                res.status(200).json(Chnages);
            }
            catch (err) {
                next(err);
            }
        });
    }
    companyNotifictaion(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const company = yield scaffHold.getCompanyNotifications(userId);
                res.status(200).json(company);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffHoldHistory(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const requestId = parseInt(req.query.requestId);
                const scaffHoldData = yield scaffHold.getScaffholdRequestHistory(requestId);
                res.status(200).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.scaffHoldController = scaffHoldController;
