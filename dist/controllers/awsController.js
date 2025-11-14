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
exports.awsCredentialController = void 0;
const awsServices_1 = require("../services/awsServices");
const uploadImageSChema_1 = require("../schemas/uploadImageSChema");
const awsData = new awsServices_1.awsCredentialServices();
class awsCredentialController {
    awsCredentials(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield awsData.awsCredentials(); // This is the service method
                res.status(200).json(data);
            }
            catch (err) {
                next(err);
            }
        });
    }
    getProfileImageUrl(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = uploadImageSChema_1.uploadImageSchema.parse(req.body); // ✅ Zod validation
                const upload = yield awsData.getProfileImageUrl(data);
                res.status(200).json(upload);
            }
            catch (err) {
                next(err);
            }
        });
    }
    generateReadUrl(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = uploadImageSChema_1.ImageKeySchema.parse(req.body); // ✅ Zod validation
                const urlData = yield awsData.generateReadUrl(data);
                res.status(200).json(urlData);
            }
            catch (err) {
                next(err);
            }
        });
    }
}
exports.awsCredentialController = awsCredentialController;
