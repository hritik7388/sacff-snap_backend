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
exports.PasswordController = void 0;
const passwordServices_1 = require("../services/passwordServices");
const passwordSchema_1 = require("../schemas/passwordSchema");
const password = new passwordServices_1.PasswordServices();
class PasswordController {
    changePassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const id = req.user.id;
                const data = passwordSchema_1.chnagePasswordSchema.parse(req.body);
                const result = yield password.changePasswordService(data, id);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    forgotPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = passwordSchema_1.forgotPasswordSchema.parse(req.body);
                const result = yield password.forgotPasswordServices(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    resendOTP(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = passwordSchema_1.forgotPasswordSchema.parse(req.body);
                const result = yield password.resendOTPServices(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    verifyOTP(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = passwordSchema_1.verifyOTPSchema.parse(req.body);
                const result = yield password.verifyOTPService(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    resetPassword(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = passwordSchema_1.resetPasswordSchema.parse(req.body);
                const result = yield password.resetPasswordService(data);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getNotificationSetting(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const result = yield password.getNotificationSetting(userId);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
    upsertNotificationSetting(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.user.id;
                const result = yield password.upsertNotificationSetting(userId, req.body);
                res.status(200).json(result);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.PasswordController = PasswordController;
