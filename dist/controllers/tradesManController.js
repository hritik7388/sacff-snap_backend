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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tradesManController = void 0;
const tradesManServices_1 = require("../services/tradesManServices");
const tradesManSchema_1 = require("../schemas/tradesManSchema");
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
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
    getAllQuestionnairesForTradesman(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                }
                const query = tradesManSchema_1.getAllQuestionnairesForTradesmanSchema.parse(req.query);
                // Get the actual TradesMan profile ID using the authenticated user ID.
                const tradesman = yield prismaClient_1.default.tradesMan.findUnique({
                    where: {
                        userId: BigInt(userId),
                    },
                    select: {
                        id: true,
                    },
                });
                if (!tradesman) {
                    return res.status(404).json({
                        success: false,
                        message: "Tradesman profile not found",
                    });
                }
                const result = yield tradesMan.getAllQuestionnairesForTradesmanServices(tradesman.id, query.filter, query.page, query.limit);
                return res.status(200).json(result);
            }
            catch (err) {
                console.error("GET QUESTIONNAIRES ERROR:", err);
                next(err);
            }
        });
    }
    getQuestionnaireByIdForTradesman(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = tradesManSchema_1.getQuestionnaireByIdSchema.parse(req.params);
                const result = yield tradesMan.getQuestionnaireByIdForTradesmanServices(id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    saveVideoProgress(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { id } = tradesManSchema_1.getQuestionnaireByIdSchema.parse(req.params);
                const { watchedPercent } = tradesManSchema_1.videoProgressSchema.parse(req.body);
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                }
                const tradesman = yield prismaClient_1.default.tradesMan.findUnique({
                    where: {
                        userId: BigInt(userId),
                    },
                    select: {
                        id: true,
                    },
                });
                if (!tradesman) {
                    return res.status(404).json({
                        success: false,
                        message: "Tradesman profile not found",
                    });
                }
                // Correct order: tradesmanId, questionnaireId, watchedPercent
                const result = yield tradesMan.saveVideoProgressService(tradesman.id, BigInt(id), watchedPercent);
                return res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    // 2. Start Quiz
    startQuiz(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { id } = tradesManSchema_1.startQuizSchema.parse(req.params);
                const tradesmanId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!tradesmanId) {
                    return res.status(401).json({
                        success: false,
                        message: "Tradesman authentication required",
                    });
                }
                const result = yield tradesMan.startQuizService(BigInt(id), BigInt(tradesmanId));
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (err) {
                next(err);
            }
        });
    }
    // 3. Get Current Question
    getCurrentQuestion(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { attemptId } = tradesManSchema_1.getCurrentQuestionSchema.parse(req.params);
                const tradesmanId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!tradesmanId) {
                    return res.status(401).json({
                        success: false,
                        message: "Tradesman authentication required",
                    });
                }
                const result = yield tradesMan.getCurrentQuestionService(BigInt(attemptId), BigInt(tradesmanId));
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (err) {
                next(err);
            }
        });
    }
    // 4. Submit Answer
    submitAnswer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { attemptId } = tradesManSchema_1.getCurrentQuestionSchema.parse(req.params);
                const { selectedOptionId } = tradesManSchema_1.submitAnswerSchema.parse(req.body);
                const tradesmanId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!tradesmanId) {
                    return res.status(401).json({
                        success: false,
                        message: "Tradesman authentication required",
                    });
                }
                const result = yield tradesMan.submitAnswerService(BigInt(attemptId), BigInt(tradesmanId), selectedOptionId == null ? null : BigInt(selectedOptionId));
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (err) {
                next(err);
            }
        });
    }
    // 5. Get Certificates
    getCertificates(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const tradesmanId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!tradesmanId) {
                    return res.status(401).json({
                        success: false,
                        message: "Tradesman authentication required",
                    });
                }
                const result = yield tradesMan.getCertificatesService(BigInt(tradesmanId));
                return res.status(200).json(Object.assign({ success: true }, result));
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
    requestScaffhold(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = tradesManSchema_1.requestScaffOldSchema.parse(req.body);
                const result = yield tradesMan.requestProjectScaffHoldServices(id, data);
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
                const result = yield tradesMan.updateProjectScaffHoldRequest(id, data);
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
                const result = yield tradesMan.getJoinedProjects(id, page, limit);
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
                const result = yield tradesMan.filterProjects(data, page, limit);
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
                const result = yield tradesMan.deleteProjectScaffHoldRequest(data);
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
                const result = yield tradesMan.getProjectRequestFilterData(data, page, limit);
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
                // ✅ GET PROJECT ID FROM PARAMS (NOT USER)
                const projectId = Number(req.query.projectId);
                const data = tradesManSchema_1.searchFilter.parse(req.body);
                const result = yield tradesMan.getFilteredProjectRequestsByProjectId(projectId, data, page, limit);
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
