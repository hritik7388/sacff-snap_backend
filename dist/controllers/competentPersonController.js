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
exports.competentPersonController = void 0;
const competentPersonServices_1 = require("../services/competentPersonServices");
const competentPersonSchema_1 = require("../schemas/competentPersonSchema");
const competentPerson = new competentPersonServices_1.CompetentPersonServices;
class competentPersonController {
    dashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const result = yield competentPerson.dashboard(id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    createInspection(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = competentPersonSchema_1.InspectionSchema.parse(req.body);
                const result = yield competentPerson.createInspection(id, data);
                res.status(201).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getInspections(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = competentPersonSchema_1.GetInspectionsSchema.parse(req.query);
                const result = yield competentPerson.getInspectionsByScaffholdId(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    competentPersonTimeline(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = competentPersonSchema_1.timeLine.parse(req.body);
                const result = yield competentPerson.competentPersonTimeline(id, data);
                res.status(201).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    TimelineTag(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = competentPersonSchema_1.timeLineTag.parse(req.body);
                const result = yield competentPerson.Timelinetag(id, data);
                res.status(201).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffholdTimeline(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = competentPersonSchema_1.GetInspectionsSchema.parse(req.query);
                const result = yield competentPerson.getScaffholdTimeline(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAllTimelineImages(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = competentPersonSchema_1.GetInspectionsSchema.parse(req.query);
                const result = yield competentPerson.getAllTimelineImages(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getCompetentPersonScaffHold(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const id = req.user.id;
                const result = yield competentPerson.getScaffHoldListForCompetentPerson(id, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.competentPersonController = competentPersonController;
