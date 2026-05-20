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
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
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
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
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
    // src/services/awsServices.ts
    scaffHoldPdf(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
            try {
                // ✅ NEW SOURCE: ProjectScaffholdRequest
                const request = yield prismaClient_1.default.projectScaffholdRequest.findFirst({
                    where: {
                        id: data.id,
                    },
                    include: {
                        project: {
                            include: {
                                createdBy: true,
                            },
                        },
                        createdBy: {
                            include: {
                                user: true,
                            },
                        },
                    },
                });
                if (!request) {
                    throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.NOT_FOUND, 404, "Request not found");
                }
                // ✅ FORMAT DATA FOR PDF
                const formattedResponse = {
                    id: request.id,
                    uuid: request.uuid,
                    PJT: ((_a = request.project) === null || _a === void 0 ? void 0 : _a.PJT) || null,
                    CMPID: ((_c = (_b = request.project) === null || _b === void 0 ? void 0 : _b.createdBy) === null || _c === void 0 ? void 0 : _c.CMPId) || null,
                    companyName: ((_e = (_d = request.project) === null || _d === void 0 ? void 0 : _d.createdBy) === null || _e === void 0 ? void 0 : _e.name) || null,
                    address: request.address || ((_f = request.project) === null || _f === void 0 ? void 0 : _f.clientAddress) || null,
                    // project scaffold request fields
                    startDate: request.startDate,
                    endDate: request.endDate,
                    latitude: request.latitude,
                    longitude: request.longitude,
                    description: request.description,
                    craft: request.craft,
                    length: request.length,
                    width: request.width,
                    height: request.height,
                    priority: request.priority,
                    tag: request.tag,
                    SCAFFID: request.SCAFFID,
                    REQID: request.REQID,
                    notes: request.notes,
                    status: request.status,
                    lightDuty: request.lightDuty,
                    mediumDuty: request.mediumDuty,
                    heavyDuty: request.heavyDuty,
                    tradesmanUserType: ((_h = (_g = request.createdBy) === null || _g === void 0 ? void 0 : _g.user) === null || _h === void 0 ? void 0 : _h.user_type) || null,
                    projectId: request.projectId,
                    createdAt: request.createdAt,
                    updatedAt: request.updatedAt,
                    // 🔥 tradesman info (who created request)
                    tradesmanName: ((_k = (_j = request.createdBy) === null || _j === void 0 ? void 0 : _j.user) === null || _k === void 0 ? void 0 : _k.name) || null,
                    tradesmanEmail: ((_m = (_l = request.createdBy) === null || _l === void 0 ? void 0 : _l.user) === null || _m === void 0 ? void 0 : _m.email) || null,
                    tradesmanMobile: ((_p = (_o = request.createdBy) === null || _o === void 0 ? void 0 : _o.user) === null || _p === void 0 ? void 0 : _p.mobileNumber) || null,
                    // 🔥 project info
                    projectName: ((_q = request.project) === null || _q === void 0 ? void 0 : _q.projectName) || null,
                    clientName: ((_r = request.project) === null || _r === void 0 ? void 0 : _r.clientName) || null,
                    clientMobile: ((_s = request.project) === null || _s === void 0 ? void 0 : _s.clientMobile) || null,
                    clientEmail: ((_t = request.project) === null || _t === void 0 ? void 0 : _t.clientEmail) || null,
                };
                // ✅ GENERATE PDF
                const pdfBuffer = yield (0, utils_1.pdfGenerator)(formattedResponse);
                // 3. Prepare uploads folder
                const fileName = `scaffhold-request-${request.id}.pdf`;
                const uploadsPath = path_1.default.join(process.cwd(), "uploads");
                if (!fs_1.default.existsSync(uploadsPath)) {
                    fs_1.default.mkdirSync(uploadsPath, { recursive: true });
                }
                const pdfPath = path_1.default.join(uploadsPath, fileName);
                // 4. Save PDF locally
                fs_1.default.writeFileSync(pdfPath, pdfBuffer);
                // 5. Generate URL
                const SERVER_URL = process.env.SERVER_URL || "http://localhost:3001";
                const pdfUrl = `${SERVER_URL}/uploads/${fileName}`;
                return {
                    message: responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_BY_ID_SUCCESS,
                    pdfUrl: pdfUrl,
                };
            }
            catch (error) {
                console.error("❌ Get scaffhold request PDF error:", error);
                if (error instanceof customError_1.CustomError) {
                    throw error;
                }
                throw new customError_1.CustomError(responseMessages_1.RESPONSE_MESSAGES.SCAFFHOLD.FETCH_FAILED, 500, error.message);
            }
        });
    }
}
exports.awsCredentialServices = awsCredentialServices;
