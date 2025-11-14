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
exports.jobController = void 0;
const jobSchema_1 = require("../schemas/jobSchema");
const jobServices_1 = require("../services/jobServices");
const jobServicesController = new jobServices_1.JobServices();
class jobController {
    updateDescreption(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = jobSchema_1.jobSchema.parse(req.body);
                const job = yield jobServicesController.updateJobDescreption(id, data);
                res.status(200).json(job);
            }
            catch (err) {
                next(err);
            }
        });
    }
    addJobCraft(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = jobSchema_1.jobCraftSchema.parse(req.body);
                const job = yield jobServicesController.addAndUpdateJobCraft(data);
                res.status(200).json(job);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getJobCraft(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = jobSchema_1.getJobCraftSchema.parse(req.query);
                const job = yield jobServicesController.getJobAndCraftDetails(data);
                res.status(200).json(job);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getCraftandCountlist(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield jobServicesController.getCraftandCountlist();
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    deleteJobCrfats(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = jobSchema_1.deleteJobCraftSchema.parse(req.body);
                const result = yield jobServicesController.deleteJobCrfats(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.jobController = jobController;
