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
const customError_1 = require("../types/customError");
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
                // Resolve actual TradesMan ID from Bearer Token User ID
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
                const result = yield tradesMan.getAllQuestionnairesForTradesmanServices(tradesman.id, query.filter, query.page, query.limit, query.search);
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
                const { id } = tradesManSchema_1.getQuestionnaireByIdSchema.parse(req.query);
                const result = yield tradesMan.getQuestionnaireByIdForTradesmanServices(id);
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
                const { id } = tradesManSchema_1.startQuizSchema.parse(req.body);
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
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    throw new customError_1.CustomError("Unauthorized", 401, "User not authenticated");
                }
                // Read attemptId from query params
                const { attemptId } = tradesManSchema_1.getCurrentQuestionSchema.parse(req.query);
                const tradesman = yield prismaClient_1.default.tradesMan.findUnique({
                    where: {
                        userId: BigInt(userId),
                    },
                    select: {
                        id: true,
                    },
                });
                if (!tradesman) {
                    throw new customError_1.CustomError("Tradesman not found", 404, "Tradesman profile does not exist");
                }
                const result = yield tradesMan.getCurrentQuestionService(attemptId, tradesman.id);
                return res.status(200).json(result);
            }
            catch (error) {
                next(error);
            }
        });
    }
    // 4. Submit Answer
    submitAnswer(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { attemptId } = tradesManSchema_1.getCurrentQuestionSchema.parse(req.body);
                const { selectedOptionId } = tradesManSchema_1.submitAnswerSchema.parse(req.body);
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "Tradesman authentication required",
                    });
                }
                // Get actual TradesMan ID from authenticated User ID
                const tradesman = yield prismaClient_1.default.tradesMan.findUnique({
                    where: {
                        userId: BigInt(userId),
                    },
                    select: {
                        id: true,
                    },
                });
                if (!tradesman) {
                    throw new customError_1.CustomError("Tradesman not found", 404, "Tradesman profile does not exist");
                }
                const result = yield tradesMan.submitAnswerService(attemptId, tradesman.id, selectedOptionId == null
                    ? null
                    : BigInt(selectedOptionId));
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
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "Tradesman authentication required",
                    });
                }
                const tradesman = yield prismaClient_1.default.tradesMan.findFirst({
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
                        message: "Tradesman not found",
                    });
                }
                const result = yield tradesMan.getCertificatesService(tradesman.id);
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (err) {
                next(err);
            }
        });
    }
    getCertificateById(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                const { certificateId } = req.params;
                if (typeof certificateId !== "string") {
                    return res.status(400).json({
                        success: false,
                        message: "Invalid certificate ID",
                    });
                }
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "Tradesman authentication required",
                    });
                }
                const tradesman = yield prismaClient_1.default.tradesMan.findFirst({
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
                        message: "Tradesman not found",
                    });
                }
                const result = yield tradesMan.getCertificateByIdService(BigInt(certificateId), tradesman.id);
                return res.status(200).json(Object.assign({ success: true }, result));
            }
            catch (err) {
                next(err);
            }
        });
    }
    enrollQuestionnaire(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // 1. Get User ID from Bearer Token
                const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: "Unauthorized",
                    });
                }
                // 2. Get Questionnaire ID from request body
                const { questionnaireId } = req.body;
                if (questionnaireId === undefined ||
                    questionnaireId === null ||
                    !/^[1-9]\d*$/.test(String(questionnaireId))) {
                    return res.status(400).json({
                        success: false,
                        message: "Valid questionnaireId is required",
                    });
                }
                // 3. Resolve actual TradesMan ID using token User ID
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
                // 4. Enroll using actual TradesMan ID
                const result = yield tradesMan.enrollQuestionnaireService(BigInt(questionnaireId), tradesman.id);
                return res.status(200).json(result);
            }
            catch (error) {
                console.error("ENROLL QUESTIONNAIRE ERROR:", error);
                next(error);
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
