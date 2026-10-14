"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unusualActivityTemplate = exports.newDeviceTemplate = exports.otpTemplate = exports.teamMemberAddTemplate = exports.companyAddTemplate = exports.companyStatusTemplate = void 0;
// src/helpers/templates.ts
const companyStatusTemplate = (companyName, cmpId, isApproved) => {
    const LOGO_URL = "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";
    return `
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Company ${isApproved} Mail</title>

  <style>
    img { max-width: 100%; height: auto; }
  </style>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">

          <tr><td style="height:6px;background:#16a34a;"></td></tr>

          <tr>
            <td align="center" style="padding:25px;background:#f9fafb;">
              <img src="${LOGO_URL}" alt="Scaff Logo" style="width:130px;" />

              <h2 style="margin:0;color:#111827;font-size:24px;font-weight:bold;">
                Company ${isApproved === "APPROVED" ? "Approval" : "Rejection"} Mail
              </h2>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 25px 35px;">
              <p style="font-size:16px;">Dear <strong>${companyName}</strong>,</p>

              <p style="font-size:15px;color:#444;line-height:1.6;">
                ${isApproved === "APPROVED"
        ? `
                  We’re pleased to inform you that your company registration has been 
                  <strong style="color:#16a34a;">APPROVED</strong> by our review team.`
        : `
                  We regret to inform you that your company registration has been 
                  <strong style="color:#dc2626;">REJECTED</strong> after review.`}
              </p>

              <h3 style="margin:20px 0 12px;color:#111827;font-size:20px;">Company Details</h3>

              <p><strong>Company Name:</strong> ${companyName}</p>
              <p><strong>Company CMPID:</strong> ${cmpId}</p>

              <p><strong>Approval:</strong>
                <span style="
                  color:${isApproved === "APPROVED" ? "#16a34a" : "#dc2626"};
                  font-weight:bold;
                  background:${isApproved === "APPROVED" ? "#dcfce7" : "#fee2e2"};
                  padding:6px 14px;
                  border-radius:6px;">
                  ${isApproved}
                </span>
              </p>

              ${isApproved === "APPROVED"
        ? `<p>You can now log in and access your company dashboard.</p>`
        : `<p>For more details or to reapply, please contact our support team.</p>`}

              <p style="margin-top:30px;font-size:15px;color:#111;">
                Best regards,<br><strong>The Scaff Admin Team</strong>
              </p>

              <p style="font-size:13px;color:#6b7280;margin-top:20px;">
                © ${new Date().getFullYear()} Scaff Platform. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
exports.companyStatusTemplate = companyStatusTemplate;
const companyAddTemplate = (memberName, userType, email, tempPassword) => {
    const LOGO_URL = "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";
    return `
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Welcome to the ScaffSnapp!</title>

  <style>
    img { max-width: 100%; height: auto; }
  </style>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">

          <tr><td style="height:6px;background:#3b82f6;"></td></tr>

          <tr>
            <td align="center" style="padding:25px;background:#f9fafb;">
              <img src="${LOGO_URL}" alt="Scaff Logo" style="width:130px;" />

              <h2 style="margin:0;color:#111827;font-size:24px;font-weight:bold;">
                Welcome to the ScaffSnapp!
              </h2>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 25px 35px;">
              <p style="font-size:16px;">
                Hello <strong>${memberName}</strong>,
              </p>

              <p style="font-size:15px;color:#444;line-height:1.6;">
                You have been successfully added as a team member. Below are your account details:
              </p>

              <h3 style="margin:20px 0 12px;color:#111827;font-size:20px;">
                Account Details
              </h3>

              <p><strong>Name:</strong> ${memberName}</p>
              <p><strong>Role:</strong> ${userType}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${tempPassword}</p>

              <p style="margin:20px 0 10px;">
                You can now log into your account and start using the platform.
              </p>

              <p style="font-size:15px;margin-top:30px;color:#111;">
                Best regards,<br/><strong>The ScaffSnapp Admin Team</strong>
              </p>

              <p style="font-size:13px;color:#6b7280;margin-top:20px;">
                © ${new Date().getFullYear()} ScaffSnapp Platform. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
exports.companyAddTemplate = companyAddTemplate;
const teamMemberAddTemplate = (memberName, userType, email, tempPassword, cmpId) => {
    const LOGO_URL = "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";
    return `
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Welcome to ScaffSnapp!</title>

  <style>
    img { max-width: 100%; height: auto; }
  </style>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">

          <tr><td style="height:6px;background:#3b82f6;"></td></tr>

          <tr>
            <td align="center" style="padding:25px;background:#f9fafb;">
              <img src="${LOGO_URL}" alt="Scaff Logo" style="width:130px;" />

              <h2 style="margin:0;color:#111827;font-size:24px;font-weight:bold;">
                Welcome to ScaffSnapp!
              </h2>
            </td>
          </tr>

          <tr>
            <td style="padding:30px 25px 35px;">
              <p style="font-size:16px;">
                Hello <strong>${memberName}</strong>,
              </p>

              <p style="font-size:15px;color:#444;line-height:1.6;">
                You have been successfully added as a team member. Below are your account details:
              </p>

              <h3 style="margin:20px 0 12px;color:#111827;font-size:20px;">
                Account Details
              </h3>

              <p><strong>Company ID (CMP):</strong> ${cmpId}</p>
              <p><strong>Name:</strong> ${memberName}</p>
              <p><strong>Role:</strong> ${userType}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${tempPassword}</p>

              <p style="margin:20px 0 10px;">
                You can now log in to your account and start using the platform.
              </p>

              <p style="font-size:15px;margin-top:30px;color:#111;">
                Best regards,<br/><strong>The Scaff Admin Team</strong>
              </p>

              <p style="font-size:13px;color:#6b7280;margin-top:20px;">
                © ${new Date().getFullYear()} Scaff Platform. All rights reserved.
              </p>

            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
exports.teamMemberAddTemplate = teamMemberAddTemplate;
const otpTemplate = (name, otp) => {
    const LOGO_URL = "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";
    return `<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Your OTP Code – Scaff Snap</title>

  <style>
    img { max-width: 100%; height: auto; }
  </style>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">

          <tr><td style="height:6px;background:#3b82f6;"></td></tr>

          <tr>
            <td align="center" style="padding:25px;background:#f9fafb;">
              <img src="${LOGO_URL}" alt="Scaff Logo" style="width:130px;" />

              <h2 style="margin:0;color:#111827;font-size:24px;font-weight:bold;">
                OTP Verification
              </h2>

              <p style="font-size:15px;color:#555;margin-top:8px;">
                Hello <strong>${name}</strong>, use the OTP below to verify your account.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:40px 25px;">
              
              <h1 style="
                font-size:48px;
                letter-spacing:8px;
                font-weight:bold;
                color:#2563eb;
                margin:0;
                background:#eef2ff;
                padding:18px 30px;
                border-radius:12px;
                display:inline-block;
              ">
                ${otp}
              </h1>

              <p style="font-size:15px;color:#444;margin-top:25px;line-height:1.6;">
                This OTP is valid for <strong>3 minutes</strong>.<br/>
                Please do not share it with anyone.
              </p>

              <p style="font-size:14px;color:#6b7280;margin-top:35px;">
                If you didn’t request this, please ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px;background:#f9fafb;">
              <p style="font-size:13px;color:#6b7280;">
                © ${new Date().getFullYear()} Scaff Platform. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
exports.otpTemplate = otpTemplate;
const newDeviceTemplate = (name, deviceName, deviceType, osVersion, lastLogin) => {
    const LOGO_URL = "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";
    return `<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>New Device Login – Scaff Snap</title>

  <style>
    img { max-width: 100%; height: auto; }
  </style>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">

          <!-- Top Border -->
          <tr><td style="height:6px;background:#ef4444;"></td></tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:25px;background:#f9fafb;">
              <img src="${LOGO_URL}" alt="Scaff Logo" style="width:130px;" />

              <h2 style="margin:0;color:#111827;font-size:24px;font-weight:bold;">
                New Device Login Detected
              </h2>

              <p style="font-size:15px;color:#555;margin-top:8px;">
                Hello <strong>${name}</strong>, we noticed a login from a new device.
              </p>
            </td>
          </tr>

          <!-- Device Info -->
          <tr>
            <td align="center" style="padding:30px 25px;">
              
              <table width="100%" style="max-width:400px;text-align:left;">
                <tr>
                  <td style="padding:8px 0;font-weight:bold;">Device Name:</td>
                  <td style="padding:8px 0;">${deviceName || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:bold;">Device Type:</td>
                  <td style="padding:8px 0;">${deviceType || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:bold;">OS Version:</td>
                  <td style="padding:8px 0;">${osVersion || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:bold;">Login Time:</td>
                  <td style="padding:8px 0;">${lastLogin}</td>
                </tr>
              </table>

              <p style="font-size:15px;color:#444;margin-top:25px;line-height:1.6;">
                If this was you, you can safely ignore this email.<br/>
                If you don’t recognize this activity, please secure your account immediately.
              </p>

              <p style="font-size:14px;color:#6b7280;margin-top:25px;">
                Tip: Change your password if you suspect unauthorized access.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px;background:#f9fafb;">
              <p style="font-size:13px;color:#6b7280;">
                © ${new Date().getFullYear()} Scaff Platform. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
exports.newDeviceTemplate = newDeviceTemplate;
const unusualActivityTemplate = (name, deviceName, deviceType, osVersion, lastLogin) => {
    const LOGO_URL = "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";
    return `<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width" />
  <title>Unusual Activity Alert – Scaff Snap</title>

  <style>
    img { max-width: 100%; height: auto; }
  </style>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;">
    <tr>
      <td align="center" style="padding: 20px;">
        <table width="100%" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">

          <!-- 🔴 Top Alert Border -->
          <tr><td style="height:6px;background:#dc2626;"></td></tr>

          <!-- Header -->
          <tr>
            <td align="center" style="padding:25px;background:#fef2f2;">
              <img src="${LOGO_URL}" alt="Scaff Logo" style="width:130px;" />

              <h2 style="margin:0;color:#991b1b;font-size:24px;font-weight:bold;">
                ⚠️ Unusual Activity Detected
              </h2>

              <p style="font-size:15px;color:#7f1d1d;margin-top:8px;">
                Hello <strong>${name}</strong>, we detected suspicious activity on your account.
              </p>
            </td>
          </tr>

          <!-- Activity Details -->
          <tr>
            <td align="center" style="padding:30px 25px;">
              
              <table width="100%" style="max-width:400px;text-align:left;">
                <tr>
                  <td style="padding:8px 0;font-weight:bold;">Device Name:</td>
                  <td style="padding:8px 0;">${deviceName || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:bold;">Device Type:</td>
                  <td style="padding:8px 0;">${deviceType || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:bold;">OS Version:</td>
                  <td style="padding:8px 0;">${osVersion || "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;font-weight:bold;">Detected Time:</td>
                  <td style="padding:8px 0;">${lastLogin}</td>
                </tr>
              </table>

              <!-- 🚨 Warning Message -->
              <p style="font-size:15px;color:#7f1d1d;margin-top:25px;line-height:1.6;font-weight:bold;">
                If this wasn’t you, your account may be at risk.
              </p>

              <p style="font-size:14px;color:#444;margin-top:15px;">
                Please take immediate action:
              </p>

              <ul style="text-align:left;max-width:400px;margin:15px auto;color:#444;font-size:14px;line-height:1.6;">
                <li>Change your account password immediately</li>
                <li>Review your recent activity</li>
                <li>Log out from all devices</li>
              </ul>

              <p style="font-size:14px;color:#6b7280;margin-top:25px;">
                If this was you, you can safely ignore this alert.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px;background:#f9fafb;">
              <p style="font-size:13px;color:#6b7280;">
                © ${new Date().getFullYear()} Scaff Platform. All rights reserved.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
exports.unusualActivityTemplate = unusualActivityTemplate;
