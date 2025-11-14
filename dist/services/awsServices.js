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
exports.awsCredentialServices = void 0;
const customError_1 = require("../types/customError");
const responseMessages_1 = require("../constants/responseMessages");
const dotenv_1 = __importDefault(require("dotenv"));
const utils_1 = require("../helpers/utils");
dotenv_1.default.config();
const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const allowedDocumentTypes = ["application/pdf", "image/jpg", "image/png"];
class awsCredentialServices {
    awsCredentials() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const credentials = {
                    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                    bucketName: process.env.AWS_BUCKET_NAME,
                    region: process.env.AWS_REGION,
                };
                if (!credentials.accessKeyId || !credentials.secretAccessKey || !credentials.bucketName || !credentials.region) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AWS.NOT_SET, 500, "AWS credentials are not set");
                }
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.AWS.FETCH_SUCCESS,
                    data: credentials,
                };
            }
            catch (error) {
                console.error("❌ Error fetching AWS credentials:", error);
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AWS.FETCH_FAILED, 500, error.message);
            }
        });
    }
    getProfileImageUrl(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { filename, contentType } = data;
                const result = yield (0, utils_1.generatePresignedUrl)(filename, contentType);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.AWS.PRESIGNED_URL_SUCCESS,
                    data: { upload_url: result.url, image_key: result.key },
                };
            }
            catch (error) {
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AWS.PRESIGNED_URL_FAILED, 500, error.message);
            }
        });
    }
    generateReadUrl(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const url = yield (0, utils_1.generateReadUrl)(data.key);
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.AWS.READ_URL_SUCCESS,
                    data: { url },
                };
            }
            catch (error) {
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.AWS.READ_URL_FAILED, 500, error.message);
            }
        });
    }
}
exports.awsCredentialServices = awsCredentialServices;
