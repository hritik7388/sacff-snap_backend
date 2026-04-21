"use strict";
// src/services/awsServices.ts
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
const prismaClient_1 = __importDefault(require("../config/prismaClient"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
    scaffHoldPdf(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const scaffhold = yield prismaClient_1.default.scaffhold.findFirst({
                    where: {
                        id: data.id,
                        isDeleted: false,
                        status: {
                            in: ["ACTIVE", "PRE_ERECTED", "ERECTED", "DISMANTLED"],
                        },
                    },
                    include: {
                        project: true,
                        company: true,
                    },
                });
                if (!scaffhold) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 401, "ScaffHold not found");
                }
                const formattedResponse = {
                    id: scaffhold.id,
                    uuid: scaffhold.uuid,
                    startDate: scaffhold.startDate,
                    endDate: scaffhold.endDate,
                    latitude: scaffhold.latitude,
                    longitude: scaffhold.longitude,
                    priority: scaffhold.priority,
                    tag: scaffhold.tag,
                    SCAFFID: scaffhold.SCAFFID,
                    address: scaffhold.address,
                    projectName: scaffhold.projectName,
                    status: scaffhold.status,
                    projectId: scaffhold.projectId,
                    companyId: scaffhold.companyId,
                    createdById: scaffhold.createdById,
                    createdAt: scaffhold.createdAt,
                    updatedAt: scaffhold.updatedAt,
                    CMPId: ((_a = scaffhold.company) === null || _a === void 0 ? void 0 : _a.CMPId) || null,
                    companyName: ((_b = scaffhold.company) === null || _b === void 0 ? void 0 : _b.name) || null,
                    clientName: ((_c = scaffhold.project) === null || _c === void 0 ? void 0 : _c.clientName) || null,
                    clientMobile: ((_d = scaffhold.project) === null || _d === void 0 ? void 0 : _d.clientMobile) || null,
                };
                const pdfBuffer = yield (0, utils_1.pdfGenerator)(formattedResponse);
                // 3. Prepare uploads folder
                const fileName = `scaffhold-${scaffhold.id}.pdf`;
                const uploadsPath = path_1.default.join(process.cwd(), "uploads");
                if (!fs_1.default.existsSync(uploadsPath))
                    fs_1.default.mkdirSync(uploadsPath, { recursive: true });
                const pdfPath = path_1.default.join(uploadsPath, fileName);
                // 4. Save PDF
                fs_1.default.writeFileSync(pdfPath, pdfBuffer);
                // 5. Return URL
                const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";
                const pdfUrl = `${SERVER_URL}/uploads/${fileName}`;
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_BY_ID_SUCCESS,
                    pdfUrl: pdfUrl
                };
            }
            catch (error) {
                console.error("❌ Get scaffhold by id error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw error instanceof customError_1.CustomError
                    ? error
                    : new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
}
exports.awsCredentialServices = awsCredentialServices;
