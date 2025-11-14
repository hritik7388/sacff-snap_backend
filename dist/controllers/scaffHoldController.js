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
const scaffHold = new scaffHoldServices_1.ScaffHoldsServices();
class scaffHoldController {
    createScaffHold(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const data = scaffHoldSchema_1.scaffHoldSchema.parse(req.body);
                const scaffHoldData = yield scaffHold.createScaffHold(userId, data);
                res.status(201).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
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
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const projectId = scaffHoldSchema_1.projectScaffhold.parse(req.query);
                const scaffHoldData = yield scaffHold.getProjectScaffHold(projectId, page, limit);
                res.status(200).json(scaffHoldData);
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
                const scaffHoldData = yield scaffHold.scaffHoldCompetentPersons(data);
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
                const scaffHoldData = yield scaffHold.scaffAndCompetentPersons(data);
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
                const competentData = yield scaffHold.addCompetentPersonToScaffHold(data);
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
                const competentData = yield scaffHold.removeCompetentPersonFromScaffHold(data);
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
}
exports.scaffHoldController = scaffHoldController;
