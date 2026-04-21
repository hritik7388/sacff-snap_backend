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
exports.clientAuthMiddleware = exports.isCompetentPerson = exports.isProjectManager = exports.isTradesMan = exports.isSubAdmin = exports.isSUperAdmin = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const authMiddleware = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers.authorization;
    if (authHeader === null || authHeader === void 0 ? void 0 : authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = (jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET));
            let account = null;
            // 🔥 Check based on user_type
            if (decoded.user_type === "COMPANY") {
                account = yield prismaClient_1.default.company.findUnique({
                    where: { id: Number(decoded.id) },
                });
            }
            else {
                account = yield prismaClient_1.default.user.findUnique({
                    where: { id: Number(decoded.id) },
                });
            }
            // ❌ Not Found
            if (!account) {
                return res.status(401).json({
                    success: false,
                    statusCode: 401,
                    message: "Account not found",
                });
            }
            // ❌ Deleted
            if (account.isDeleted) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    message: "Your account has been deleted by Admin.",
                });
            }
            // ❌ Inactive
            if (account.status === "INACTIVE" || account.status === "SUSPENDED") {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    message: "Your account is not active.",
                });
            }
            // ❌ Not Verified
            if (!account.isVerified) {
                return res.status(403).json({
                    success: false,
                    statusCode: 403,
                    message: "Your account is not verified.",
                });
            }
            req.user = {
                user_id: decoded.user_id,
                user_uuid: decoded.user_uuid,
                id: decoded.id,
                user_type: decoded.user_type
            };
            next();
        }
        catch (error) {
            res.status(500).json({ message: 'Invalid or expired token' });
        }
    }
    else {
        res.status(500).json({ message: 'Authorization header missing or malformed' });
    }
});
exports.authMiddleware = authMiddleware;
const isSUperAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_type) !== 'SUPER_ADMIN') {
        return res.status(500).json({ message: 'Access denied: Not a super admin' });
    }
    next();
};
exports.isSUperAdmin = isSUperAdmin;
const isSubAdmin = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_type) !== 'COMPANY') {
        return res.status(500).json({ message: 'Access denied: Not a sub admin' });
    }
    next();
};
exports.isSubAdmin = isSubAdmin;
const isTradesMan = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_type) !== 'TRADESMAN') {
        return res.status(500).json({ message: 'Access denied: Not a tradesman' });
    }
    next();
};
exports.isTradesMan = isTradesMan;
const isProjectManager = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_type) !== 'PROJECT_MANAGER') {
        return res.status(500).json({ message: 'Access denied: Not a project manager' });
    }
    next();
};
exports.isProjectManager = isProjectManager;
const isCompetentPerson = (req, res, next) => {
    var _a;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.user_type) !== 'COMPETENT_PERSON') {
        return res.status(500).json({ message: 'Access denied: Not a competent person' });
    }
    next();
};
exports.isCompetentPerson = isCompetentPerson;
const clientAuthMiddleware = (req, res, next) => {
    const clientKey = req.headers["x-client-key"] || req.headers["client-secret"];
    if (!clientKey) {
        return res.status(500).json({ message: "Client key missing in headers" });
    }
    if (clientKey !== process.env.CLIENT_SECRET) {
        return res.status(500).json({ message: "Invalid client key" });
    }
    next();
};
exports.clientAuthMiddleware = clientAuthMiddleware;
