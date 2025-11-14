// import Configs  from "../config/awsSesConfig";
// import {SendEmailCommand} from "@aws-sdk/client-ses";
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

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(firebaseAdminConfig as admin.ServiceAccount),
  });
}

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

export const generateJobId = () => {
  const num = Math.floor(100000 + Math.random() * 900000); // 1000–9999
  return `JOB-${num}`;

}

export const scaffHoldIdGenerator = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `SCF-${num}`;
}

export const reqscaffHoldIdGenerator = () => {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `REQ-${num}`;
}


// export const sendMailTeamMember = async (
//   toEmail: string,
//   password: string,
//   userType: string,
//   cmpId: string
// ): Promise<string> => {
//   const fromEmail = process.env.EMAIL_FROM;
//   if (!fromEmail) throw new Error("EMAIL_FROM is not defined in environment variables");

//   const subject = "Your Team Member Account Created";
//   const currentYear = new Date().getFullYear();
//   const companyName = "Scaff Platform";
//   const status = "Approved";

//   const bodyHtml = `
//    <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <title>Company Approval Notification</title>
//     <style>
//       @media only screen and (max-width: 600px) {
//         .email-container {
//           width: 100% !important;
//           margin: 0 !important;
//           border-radius: 0 !important;
//         }
//         .email-body {
//           padding: 20px 15px !important;
//         }
//         .company-card {
//           padding: 15px !important;
//         }
//         h2 {
//           font-size: 20px !important;
//         }
//         h3 {
//           font-size: 16px !important;
//         }
//         p {
//           font-size: 14px !important;
//         }
//       }
//     </style>
//   </head>

//   <body
//     style="
//       margin: 0;
//       padding: 0;
//       background-color: #f4f6f8;
//       font-family: Arial, sans-serif;
//       color: #333;
//       height: 100vh;
//       display: flex;
//       justify-content: center;
//       align-items: center;
//     "
//   >
//     <table
//       role="presentation"
//       width="100%"
//       height="100%"
//       cellpadding="0"
//       cellspacing="0"
//       style="background-color: #f4f6f8; border-collapse: collapse; margin: 0; padding: 0;"
//     >
//       <tr>
//         <td align="center" valign="middle" style="padding: 20px;">
//           <table
//             class="email-container"
//             role="presentation"
//             width="100%"
//             cellpadding="0"
//             cellspacing="0"
//             style="
//               max-width: 600px;
//               width: 100%;
//               background-color: #ffffff;
//               border-radius: 12px;
//               overflow: hidden;
//               box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
//               margin: 0 auto;
//             "
//           >
//             <tr>
//               <td style="background-color: #16a34a; height: 6px; line-height: 6px; font-size: 0;"></td>
//             </tr>

//             <tr>
//               <td style="background: linear-gradient(90deg, #e9ecef, #f9fafb); text-align: center; padding: 25px 20px 20px;">
//                 <img
//                   src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg"
//                   alt="Scaff Logo"
//                   style="width: 130px; max-width: 60%; margin-bottom: 10px;"
//                 />
//                 <h2 style="color: #111827; margin: 10px 0 0; font-size: 22px; letter-spacing: 0.5px;">
//                   Team Member Account Created
//                 </h2>
//               </td>
//             </tr>

//             <tr>
//               <td class="email-body" style="padding: 30px 25px 35px;">
//                 <p style="font-size: 16px; line-height: 1.6; margin: 0 0 15px;">
//                   Dear <strong>${userType}</strong>,
//                 </p>
//                 <p style="font-size: 15px; line-height: 1.6; color: #444; margin: 0 0 20px;">
//                   Your team member account has been successfully created under Company ID <strong>${cmpId}</strong>.
//                 </p>

//                 <table
//                   class="company-card"
//                   role="presentation"
//                   width="100%"
//                   cellpadding="0"
//                   cellspacing="0"
//                   style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px 20px; margin: 20px 0;"
//                 >
//                   <tr>
//                     <td>
//                       <h3 style="margin: 0 0 10px; font-size: 18px; color: #111827;">Login Credentials</h3>
//                       <p style="margin: 8px 0; font-size: 15px;"><strong>Email:</strong> ${toEmail}</p>
//                       <p style="margin: 8px 0; font-size: 15px;"><strong>Password:</strong> ${password}</p>
//                       <p style="margin: 8px 0; font-size: 15px;"><strong>User Type:</strong> ${userType}</p>
//                       <p style="margin: 8px 0; font-size: 15px;"><strong>Company CMPID:</strong> ${cmpId}</p>
//                       <p style="margin: 8px 0; font-size: 15px;">
//                         <strong>Status:</strong>
//                         <span style="color: #16a34a; font-weight: bold; background: #dcfce7; padding: 6px 14px; border-radius: 6px; display: inline-block;">
//                           ${status.toUpperCase()}
//                         </span>
//                       </p>
//                     </td>
//                   </tr>
//                 </table>

//                 <p style="font-size: 15px; line-height: 1.6; margin: 15px 0;">
//                   You can now log in to the platform and start using your account.
//                 </p>
//                 <p style="font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
//                   For security reasons, please change your password after logging in.
//                 </p>

//                 <p style="font-size: 15px; margin-top: 30px; color: #111;">
//                   Best regards,<br />
//                   <strong>The Scaff Admin Team</strong>
//                 </p>
//               </td>
//             </tr>

//             <tr>
//               <td style="background-color: #16a34a; height: 6px; line-height: 6px; font-size: 0;"></td>
//             </tr>

//             <tr>
//               <td style="background-color: #f3f4f6; text-align: center; padding: 15px;">
//                 <p style="font-size: 13px; color: #6b7280; margin: 0;">
//                   © ${currentYear} Scaff Platform. All rights reserved.
//                 </p>
//               </td>
//             </tr>
//           </table>
//         </td>
//       </tr>
//     </table>
//   </body>
// </html>
//   `;

//   const params = {
//     Destination: { ToAddresses: [toEmail] },
//     Message: {
//       Body: { Html: { Charset: "UTF-8", Data: bodyHtml } },
//       Subject: { Charset: "UTF-8", Data: subject },
//     },
//     Source: fromEmail,
//   };

//   try {
//     const command = new SendEmailCommand(params);
//     const check = await Configs.send(command);
//     console.log("sendc==============> ", check);
//     return `Email sent successfully to ${toEmail}`;
//   } catch (err) {
//     console.error("Error sending team member email:", err);
//     throw new Error("Failed to send team member email");
//   }
// };



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