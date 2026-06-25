// src/helpers/utils.ts
import nodemailer from "nodemailer";
import QRCode from "qrcode";;
import puppeteer from "puppeteer";
import htmlPdf from "html-pdf-node";
import { yellowpdfTemplate, greenpdfTemplate } from "../helpers/templates";
export const mailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,          // smtp.gmail.com
  port: Number(process.env.EMAIL_PORT),  // 587
  secure: false, // Gmail requires false for port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

import jwt from "jsonwebtoken";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];
const allowedDocumentTypes = ["application/pdf"];

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});
import admin from "firebase-admin";
import firebaseAdminConfig from "../config/firebaseAdminConfig";
import { CustomError } from "../types/customError";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseAdminConfig as admin.ServiceAccount),
  });
}

export const extractS3Key = (image: string) => {
  if (!image) return null;

  // Agar URL hai to key nikalo
  if (image.startsWith('http')) {
    const url = new URL(image);
    return url.pathname.substring(1); // remove leading /
  }

  // Already key hai
  return image;
};

export const generatePresignedUrl = async (filename: string, contentType: string) => {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/\s+/g, "_");

  let folder = "";
  if (allowedImageTypes.includes(contentType)) folder = "profile_image";
  else if (allowedDocumentTypes.includes(contentType)) folder = "user_verification_docs";
  else throw new Error("Unsupported file type");

  const key = `${timestamp}-${sanitizedFilename}`;

  const putObjectCommand = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(s3Client, putObjectCommand, { expiresIn: 3600 });
  return { url, key };
};

export const generateReadUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return url;
};

export interface JWTPayload {
  login_id: string;
  id: string;
  uuid: string;
  user_type: string;
}

export const generateToken = (payload: JWTPayload, expiresIn: string = "30d"): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn } as jwt.SignOptions);
};

export const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
  return { otp, expiresAt };
};

export const generateCompanyId = () => {
  const num = Math.floor(100000 + Math.random() * 900000); // 1000–9999
  return `CMP-${num}`;

}
export const generateProjectId = () => {
  const num = Math.floor(100000 + Math.random() * 900000); // 1000–9999
  return `PJT-${num}`;

}

export const generateJobId = () => {
  const num = Math.floor(100000 + Math.random() * 900000); // 1000–9999
  return `JOB-${num}`;

}

export const scaffHoldIdGenerator = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `SCF-${num}`;
}

export const projectIdGenerator = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `PJT-${num}`;
}

export const reqscaffHoldIdGenerator = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `REQ-${num}`;
}

export const pushNotificationDelhi = async (
  deviceToken: string,
  title: string,
  body: string
) => {
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
    const response = await admin.messaging().send(message);
    return response;

  } catch (error: any) {
    if (error.code === "messaging/registration-token-not-registered") {
      return { success: false, reason: "Invalid or expired token" };
    }

    console.error("❌ FCM Error:", error);
    throw new Error(`Push notification failed: ${error.message}`);
  }
};

export const sendMail = async (
  to: string,
  subject: string,
  htmlBody: string
) => {
  const mail = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: htmlBody,
  };

  try {
    const response = await mailTransporter.sendMail(mail);

    return {
      success: true,
      message: "Email sent successfully",
      messageId: response.messageId,
    };

  } catch (error: any) {
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
};

export const qrCodeGenerator = async (text: string, userType: string, status: string | undefined) => {
  try {
    const qr = await QRCode.toDataURL(text, {
      errorCorrectionLevel: "H",
      scale: 6,
    });

    return {
      success: true,
      qrCode: qr,
      url: text,
    };
  } catch (error) {
    console.error("QR Error:", error);
    return {
      success: false,
      message: "QR code generation failed",
    };
  }
};

export const imageGenerator = async (
  scaffholdDetails: any
): Promise<Buffer> => {

  try {

    const tag = scaffholdDetails.tag?.toUpperCase();

    if (!tag || tag === "RED") {
      throw new CustomError(
        "Image generation not allowed for untagged or RED scaffold."
      );
    }

    // ======================================================
    // QR URL
    // ======================================================

    const BASE_URL =
      "https://scaff-snap.onelink.me/1Cvw/uwq12rs8";

    const qrFinalLink =
      `${BASE_URL}?scaffId=${scaffholdDetails.id}` +
      `&userType=${scaffholdDetails.tradesmanUserType}` +
      `&PJT=${scaffholdDetails.PJT}+&requestId=${scaffholdDetails.id}`;

    const qrResult = await qrCodeGenerator(
      qrFinalLink,
      scaffholdDetails.tradesmanUserType,
      scaffholdDetails.status,
    );

    if (!qrResult.success) {
      throw new Error("QR generation failed");
    }

    // ======================================================
    // HTML TEMPLATE
    // ======================================================

    let html: string;

    if (tag === "GREEN") {

      html = greenpdfTemplate({
        ...scaffholdDetails,
        qrCode: qrResult.qrCode,
      });

    } else {

      html = yellowpdfTemplate({
        ...scaffholdDetails,
        qrCode: qrResult.qrCode,
      });
    }

    // ======================================================
    // PUPPETEER
    // ======================================================

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();

    // 80mm ≈ 302px
    await page.setViewport({
      width: 540,
      height: 100,
      deviceScaleFactor: 3,
    });

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // ======================================================
    // SCREENSHOT
    // ======================================================

    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
    });

    await browser.close();

    return Buffer.from(
      screenshotBuffer as Uint8Array
    );

  } catch (err) {

    console.error("❌ IMAGE GEN ERR:", err);

    throw err;
  }
};