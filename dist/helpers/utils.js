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
exports.imageGenerator = exports.qrCodeGenerator = exports.sendMail = exports.pushNotificationDelhi = exports.reqscaffHoldIdGenerator = exports.projectIdGenerator = exports.scaffHoldIdGenerator = exports.generateJobId = exports.generateProjectId = exports.generateCompanyId = exports.generateOTP = exports.generateToken = exports.generateReadUrl = exports.generatePresignedUrl = exports.extractS3Key = exports.mailTransporter = void 0;
// src/helpers/utils.ts
const nodemailer_1 = __importDefault(require("nodemailer"));
const qrcode_1 = __importDefault(require("qrcode"));
const puppeteer_1 = __importDefault(require("puppeteer"));
// import { yellowpdfTemplate, greenpdfTemplate } from "../helpers/templates";
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
    if (image.startsWith("http")) {
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
    const url = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, putObjectCommand, {
        expiresIn: 3600,
    });
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
// export const imageGenerator = async (
//   scaffholdDetails: any,
// ): Promise<Buffer> => {
//   try {
//     const tag = scaffholdDetails.tag?.toUpperCase();
//     if (!tag || tag === "RED") {
//       throw new CustomError(
//         "Image generation not allowed for untagged or RED scaffold.",
//       );
//     }
//     // <<<<<<<<======================================================>>>>>>>>
//     // QR URL
//     // <<<<<<<<======================================================>>>>>>>>
//     const BASE_URL = "https://scaff-snap.onelink.me/1Cvw/uwq12rs8";
//     const qrFinalLink =
//       `${BASE_URL}?scaffId=${scaffholdDetails.id}` +
//       `&userType=${scaffholdDetails.tradesmanUserType}` +
//       `&PJT=${scaffholdDetails.PJT}+&requestId=${scaffholdDetails.id}`;
//     const qrResult = await qrCodeGenerator(
//       qrFinalLink,
//       scaffholdDetails.tradesmanUserType,
//       scaffholdDetails.status,
//     );
//     if (!qrResult.success) {
//       throw new Error("QR generation failed");
//     }
//     // ======================================================
//     // HTML TEMPLATE
//     // ======================================================
//     let html: string;
//     if (tag === "GREEN") {
//       html = greenpdfTemplate({
//         ...scaffholdDetails,
//         qrCode: qrResult.qrCode,
//       });
//     } else {
//       html = yellowpdfTemplate({
//         ...scaffholdDetails,
//         qrCode: qrResult.qrCode,
//       });
//     }
//     // ======================================================
//     // PUPPETEER
//     // ======================================================
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//     const page = await browser.newPage();
//     // 80mm ≈ 302px
//     await page.setViewport({
//       width: 610,
//       height: 100,
//       deviceScaleFactor: 3,
//     });
//     await page.setContent(html, {
//       waitUntil: "networkidle0",
//     });
//     // ======================================================
//     // SCREENSHOT
//     // ======================================================
//     const screenshotBuffer = await page.screenshot({
//       type: "png",
//       fullPage: true,
//     });
//     await browser.close();
//     return Buffer.from(screenshotBuffer as Uint8Array);
//   } catch (err) {
//     console.error("❌ IMAGE GEN ERR:", err);
//     throw err;
//   }
// };
const sharp_1 = __importDefault(require("sharp"));
const imageGenerator = (scaffholdDetails) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tag = (_a = scaffholdDetails.tag) === null || _a === void 0 ? void 0 : _a.toUpperCase();
        if (!tag || tag === "RED") {
            throw new customError_1.CustomError("Image generation not allowed for untagged or RED scaffold.");
        }
        // ======================================================
        // QR URL
        // ======================================================
        const BASE_URL = "https://scaff-snap.onelink.me/1Cvw/uwq12rs8";
        const qrFinalLink = `${BASE_URL}?scaffId=${scaffholdDetails.id}` +
            `&userType=${scaffholdDetails.tradesmanUserType}` +
            `&PJT=${scaffholdDetails.PJT}+&requestId=${scaffholdDetails.id}`;
        const qrResult = yield (0, exports.qrCodeGenerator)(qrFinalLink, scaffholdDetails.tradesmanUserType, scaffholdDetails.status);
        if (!qrResult.success) {
            throw new Error("QR generation failed");
        }
        // ======================================================
        // HTML TEMPLATE
        // ======================================================
        let html;
        // if (tag === "GREEN") {
        //   html = greenpdfTemplate({
        //     ...scaffholdDetails,
        //     qrCode: qrResult.qrCode,
        //   });
        // } else {
        //   html = yellowpdfTemplate({
        //     ...scaffholdDetails,
        //     qrCode: qrResult.qrCode,
        //   });
        // }
        // ======================================================
        // PUPPETEER — render normally, no scaling/clipping tricks
        // ======================================================
        const RENDER_WIDTH = 610; // matches your template's design width
        const browser = yield puppeteer_1.default.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
        const page = yield browser.newPage();
        // Give it plenty of height room; the element screenshot
        // below only captures the actual rendered content, so a
        // generous viewport height here is harmless.
        yield page.setViewport({
            width: RENDER_WIDTH,
            height: 1200,
            deviceScaleFactor: 3,
        });
        // await page.setContent(html, {
        //   waitUntil: "networkidle0",
        // });
        // Screenshot ONLY the #tag element, exactly as it renders.
        // No transform, no clip guessing — this always matches the
        // element's true size, so no black bars / cut-off content.
        const tagElement = yield page.$("#tag");
        if (!tagElement) {
            throw new Error("Could not find #tag element to screenshot");
        }
        const rawBuffer = (yield tagElement.screenshot({
            type: "png",
        }));
        yield browser.close();
        // ======================================================
        // NORMALIZE ASPECT RATIO (post-process, not DOM-based)
        // ======================================================
        // Physical label is 4in x 6in => width/height ratio = 2/3.
        // We pad the rendered image (white background) onto a
        // canvas of that ratio so every tag color produces an
        // image with the SAME aspect ratio for printing — without
        // ever touching the page layout.
        const LABEL_ASPECT_RATIO = 4 / 6; // width / height
        const meta = yield (0, sharp_1.default)(rawBuffer).metadata();
        const contentWidth = meta.width;
        const contentHeight = meta.height;
        // Decide target canvas: keep the rendered width, extend
        // height (or vice versa) to hit the label ratio, whichever
        // requires only ADDING space (never cropping content).
        let canvasWidth;
        let canvasHeight;
        const contentRatio = contentWidth / contentHeight;
        if (contentRatio > LABEL_ASPECT_RATIO) {
            // Content is "wider" than the label ratio -> keep width,
            // grow height to fit the ratio.
            canvasWidth = contentWidth;
            canvasHeight = Math.round(contentWidth / LABEL_ASPECT_RATIO);
        }
        else {
            // Content is "taller/narrower" than the label ratio -> keep
            // height, grow width to fit the ratio.
            canvasHeight = contentHeight;
            canvasWidth = Math.round(contentHeight * LABEL_ASPECT_RATIO);
        }
        const finalBuffer = yield (0, sharp_1.default)({
            create: {
                width: canvasWidth,
                height: canvasHeight,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
        })
            .composite([
            {
                input: rawBuffer,
                top: 0,
                left: 0, // top-left aligned; change to center if preferred
            },
        ])
            .png()
            .toBuffer();
        return finalBuffer;
    }
    catch (err) {
        console.error("❌ IMAGE GEN ERR:", err);
        throw err;
    }
});
exports.imageGenerator = imageGenerator;
