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
exports.pdfGenerator = exports.qrCodeGenerator = exports.sendMail = exports.pushNotificationDelhi = exports.reqscaffHoldIdGenerator = exports.projectIdGenerator = exports.scaffHoldIdGenerator = exports.generateJobId = exports.generateProjectId = exports.generateCompanyId = exports.generateOTP = exports.generateToken = exports.generateReadUrl = exports.generatePresignedUrl = exports.extractS3Key = exports.mailTransporter = void 0;
// src/helpers/utils.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const qrcode_1 = __importDefault(require("qrcode"));
;
const html_pdf_node_1 = __importDefault(require("html-pdf-node"));
const templates_1 = require("../helpers/templates");
exports.mailTransporter = nodemailer_1.default.createTransport({
    host: process.env.EMAIL_HOST, // smtp.gmail.com
    port: Number(process.env.EMAIL_PORT), // 587
    secure: false, // Gmail requires false for port 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const allowedDocumentTypes = ["application/pdf"];
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const firebaseAdminConfig_1 = __importDefault(require("../config/firebaseAdminConfig"));
const customError_1 = require("../types/customError");
if (!firebase_admin_1.default.apps.length) {
    firebase_admin_1.default.initializeApp({
        credential: firebase_admin_1.default.credential.cert(firebaseAdminConfig_1.default),
    });
}
const extractS3Key = (image) => {
    if (!image)
        return null;
    // Agar URL hai to key nikalo
    if (image.startsWith('http')) {
        const url = new URL(image);
        return url.pathname.substring(1); // remove leading /
    }
    // Already key hai
    return image;
};
exports.extractS3Key = extractS3Key;
const generatePresignedUrl = (filename, contentType) => __awaiter(void 0, void 0, void 0, function* () {
    const timestamp = Date.now();
    const sanitizedFilename = filename.replace(/\s+/g, "_");
    let folder = "";
    if (allowedImageTypes.includes(contentType))
        folder = "profile_image";
    else if (allowedDocumentTypes.includes(contentType))
        folder = "user_verification_docs";
    else
        throw new Error("Unsupported file type");
    const key = `${timestamp}-${sanitizedFilename}`;
    const putObjectCommand = new client_s3_1.PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });
    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectCommand, { expiresIn: 3600 });
    return { url, key };
});
exports.generatePresignedUrl = generatePresignedUrl;
const generateReadUrl = (key) => __awaiter(void 0, void 0, void 0, function* () {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
    });
    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 3600 });
    return url;
});
exports.generateReadUrl = generateReadUrl;
const generateToken = (payload, expiresIn = "30d") => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn });
};
exports.generateToken = generateToken;
const generateOTP = () => {
    const otp = Math.floor(100000 + Math.random() * 900000);
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
    return { otp, expiresAt };
};
exports.generateOTP = generateOTP;
const generateCompanyId = () => {
    const num = Math.floor(100000 + Math.random() * 900000); // 1000–9999
    return `CMP-${num}`;
};
exports.generateCompanyId = generateCompanyId;
const generateProjectId = () => {
    const num = Math.floor(100000 + Math.random() * 900000); // 1000–9999
    return `PJT-${num}`;
};
exports.generateProjectId = generateProjectId;
const generateJobId = () => {
    const num = Math.floor(100000 + Math.random() * 900000); // 1000–9999
    return `JOB-${num}`;
};
exports.generateJobId = generateJobId;
const scaffHoldIdGenerator = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `SCF-${num}`;
};
exports.scaffHoldIdGenerator = scaffHoldIdGenerator;
const projectIdGenerator = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `PJT-${num}`;
};
exports.projectIdGenerator = projectIdGenerator;
const reqscaffHoldIdGenerator = () => {
    const num = Math.floor(100000 + Math.random() * 900000);
    return `REQ-${num}`;
};
exports.reqscaffHoldIdGenerator = reqscaffHoldIdGenerator;
const pushNotificationDelhi = (deviceToken, title, body) => __awaiter(void 0, void 0, void 0, function* () {
    const message = {
        token: deviceToken,
        notification: {
            title,
            body,
        },
        data: {
            title,
            body,
        },
    };
    try {
        const response = yield firebase_admin_1.default.messaging().send(message);
        return response;
    }
    catch (error) {
        if (error.code === "messaging/registration-token-not-registered") {
            return { success: false, reason: "Invalid or expired token" };
        }
        console.error("❌ FCM Error:", error);
        throw new Error(`Push notification failed: ${error.message}`);
    }
});
exports.pushNotificationDelhi = pushNotificationDelhi;
const sendMail = (to, subject, htmlBody) => __awaiter(void 0, void 0, void 0, function* () {
    const mail = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html: htmlBody,
    };
    try {
        const response = yield exports.mailTransporter.sendMail(mail);
        return {
            success: true,
            message: "Email sent successfully",
            messageId: response.messageId,
        };
    }
    catch (error) {
        console.error("❌ Email Error:", error);
        // -----------------------------
        // HANDLE KNOWN ERRORS
        // -----------------------------
        // Invalid email format / envelope address issue
        if (error.code === "EENVELOPE") {
            return {
                success: false,
                reason: "Invalid email address format",
            };
        }
        // Gmail incorrect password / app password invalid (535)
        if (error.responseCode === 535) {
            return {
                success: false,
                reason: "SMTP authentication failed (invalid email or app password)",
            };
        }
        // SMTP connection failure
        if (error.code === "ECONNECTION") {
            return {
                success: false,
                reason: "Unable to connect to email server (ECONNECTION)",
            };
        }
        // Timeout
        if (error.code === "ETIMEDOUT") {
            return {
                success: false,
                reason: "Email server timeout",
            };
        }
        // -----------------------------
        // UNKNOWN ERROR (fallback)
        // -----------------------------
        return {
            success: false,
            reason: error.message || "Unknown email sending error",
        };
    }
});
exports.sendMail = sendMail;
const qrCodeGenerator = (text, userType, status) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const qr = yield qrcode_1.default.toDataURL(text, {
            errorCorrectionLevel: "H",
            scale: 6,
        });
        return {
            success: true,
            qrCode: qr,
            url: text,
        };
    }
    catch (error) {
        console.error("QR Error:", error);
        return {
            success: false,
            message: "QR code generation failed",
        };
    }
});
exports.qrCodeGenerator = qrCodeGenerator;
const pdfGenerator = (scaffholdDetails) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tag = (_a = scaffholdDetails.tag) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        if (!tag || tag === "RED") {
            throw new customError_1.CustomError("PDF generation not allowed for untagged or RED scaffold.");
        }
        const BASE_URL = "https://scaff-snap.onelink.me/1Cvw/uwq12rs8";
        const qrFinalLink = `${BASE_URL}?scaffId=${scaffholdDetails.id}` +
            `&userType=${scaffholdDetails.tradesmanUserType}` +
            `&PJT=${scaffholdDetails.PJT}`;
        const qrResult = yield (0, exports.qrCodeGenerator)(qrFinalLink, scaffholdDetails.tradesmanUserType, scaffholdDetails.status);
        if (!qrResult.success) {
            throw new Error("QR generation failed");
        }
        let html;
        if (tag === "GREEN") {
            html = (0, templates_1.greenpdfTemplate)(Object.assign(Object.assign({}, scaffholdDetails), { qrCode: qrResult.qrCode }));
        }
        else {
            html = (0, templates_1.yellowpdfTemplate)(Object.assign(Object.assign({}, scaffholdDetails), { qrCode: qrResult.qrCode }));
        }
        const options = {
            format: "A4",
            printBackground: true,
            margin: { top: 0, right: 0, bottom: 0, left: 0 },
        };
        const file = { content: html };
        const pdfBuffer = yield html_pdf_node_1.default.generatePdf(file, options);
        return pdfBuffer;
    }
    catch (err) {
        console.error("PDF GEN ERR:", err);
        throw err;
    }
});
exports.pdfGenerator = pdfGenerator;
