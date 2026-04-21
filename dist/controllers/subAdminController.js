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
exports.subAdminController = void 0;
const subAdminServices_1 = require("../services/subAdminServices");
const subAdminSchema_1 = require("../schemas/subAdminSchema");
const tradesManSchema_1 = require("../schemas/tradesManSchema");
const superAdminSchema_1 = require("../schemas/superAdminSchema");
const subAdmin = new subAdminServices_1.subAdminServices();
class subAdminController {
    subAdminLogin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = subAdminSchema_1.subAdminLoginSchema.parse(req.body);
                const user = yield subAdmin.loginSubAdminServices(data);
                res.status(200).json(user);
            }
            catch (err) {
                next(err);
            }
        });
    }
    addTeamMember(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = subAdminSchema_1.addTeamMemberSchema.parse(req.body);
                const teamMember = yield subAdmin.addTeamMemberServices(id, data);
                res.status(201).json(teamMember);
            }
            catch (err) {
                next(err);
            }
        });
    }
    updateTeamMember(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = subAdminSchema_1.updateTeamMemberSchema.parse(req.body);
                const teamMember = yield subAdmin.editTeamMemberServices(data);
                res.status(201).json(teamMember);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getProjectManagersList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const id = req.user.id;
                const result = yield subAdmin.getProjectManagersListServices(id, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getCompetentPersonList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const data = tradesManSchema_1.searchFilter.parse(req.query);
                const id = req.user.id;
                const result = yield subAdmin.getCompetentPersonListServices(id, data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getCompanyCompetentPerson(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const id = req.user.id;
                const result = yield subAdmin.getCompanyCompetentPersonList(id, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getTradesManList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const result = yield subAdmin.getTradesManListServices(page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    createNewProject(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = subAdminSchema_1.addNewProjectSchema.parse(req.body);
                const project = yield subAdmin.createNewProject(id, data);
                res.status(201).json(project);
            }
            catch (err) {
                next(err);
            }
        });
    }
    upadteProject(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = subAdminSchema_1.updateProjectSchema.parse(req.body);
                const project = yield subAdmin.updateProject(id, data);
                res.status(201).json(project);
            }
            catch (err) {
                next(err);
            }
        });
    }
    dashboardData(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = yield subAdmin.teamMemberDashboard(id);
                res.status(200).json(data);
            }
            catch (err) {
                next(err);
            }
        });
    }
    scaffholdDashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = yield subAdmin.scaffholdDashboard(id);
                res.status(200).json(data);
            }
            catch (err) {
                next(err);
            }
        });
    }
    projectDashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = yield subAdmin.projectDashboard(id);
                res.status(200).json(data);
            }
            catch (err) {
                next(err);
            }
        });
    }
    scaffStatusDashboard(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = yield subAdmin.scaffholdStatusDashboard(id);
                res.status(200).json(data);
            }
            catch (err) {
                next(err);
            }
        });
    }
    searchTeamMemberController(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = subAdminSchema_1.searchTeamMemberSchema.parse(req.body);
                const userData = yield subAdmin.searchTeamMember(data);
                res.status(200).json(userData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getTeamMemberByScaffHoldIdController(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = subAdminSchema_1.TeamMemberSchema.parse(req.query);
                const userData = yield subAdmin.searchTeamMemberByScaffhold(data);
                res.status(200).json(userData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getScaffHoldRequests(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const data = subAdminSchema_1.scaffHoldRequest.parse(req.query);
                const result = yield subAdmin.getRequestByScaffHoldId(data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getTimelineImagesByStatus(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const data = subAdminSchema_1.TimelineImageFilter.parse(req.query);
                const result = yield subAdmin.getTimelineImagesByStatus(data, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getProjectList(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const result = yield subAdmin.getProjectListServices(id, page, limit);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getAllScaffHold(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const scaffHoldData = yield subAdmin.getAllScaffHolds(id, page, limit);
                res.status(200).json(scaffHoldData);
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
                const scaffHoldData = yield subAdmin.getUserDetails(id);
                res.status(200).json(scaffHoldData);
            }
            catch (err) {
                next(err);
            }
        });
    }
    deleteUserBySubAdmin(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const userId = Number(req.query.userId);
                const subAdminId = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const result = yield subAdmin.deleteUserBySubAdminServices(subAdminId, userId);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    logOutCompany(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const id = Number((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
                const data = superAdminSchema_1.logout.parse(req.body);
                const result = yield subAdmin.logoutCompany(id, data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.subAdminController = subAdminController;
