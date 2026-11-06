"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certifictae = exports.yellowpdfTemplate = exports.greenpdfTemplate = exports.unusualActivityTemplate = exports.newDeviceTemplate = exports.otpTemplate = exports.teamMemberAddTemplate = exports.companyAddTemplate = exports.companyStatusTemplate = void 0;
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
const greenpdfTemplate = (data) => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SCAFFSNAPP - Complete Scaffold Released Tag</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;0,800;1,700;1,800&family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <style>
        :root {
            --safety-black: #000000;
            --input-peach: #FCE4D6;
            --brand-orange: #E85A24;
            --brand-dark: #292929;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Tinos', 'Times New Roman', Times, Georgia, serif;
            background-color: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 24px 16px;
            color: var(--safety-black);
        }

        .tag-container {
            width: 100%;
            max-width: 480px;
            background-color: #ffffff;
            border: 2px solid var(--safety-black);
            padding: 24px 18px 26px;

        }

        /* ---------- Top Header ---------- */
        .top-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            margin-bottom: 6px;
            padding-bottom: 2px;
        }

        .brand-section {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .brand-logo {
            font-family: 'Open Sans', sans-serif;
            font-size: 38px;
            font-weight: 800;
            font-style: italic;
            line-height: 1;
            display: flex;
            align-items: baseline;
            letter-spacing: -0.03em;
        }

        .brand-scaff {
            color: var(--brand-orange);
        }

        .brand-snapp {
            color: var(--brand-dark);
        }

        .brand-tm {
            font-size: 11px;
            font-style: normal;
            font-weight: 700;
            color: #666;
            margin-left: 2px;
            vertical-align: super;
        }

        .brand-underline {
            width: 100%;
            height: 1.5px;
            background: linear-gradient(to right, var(--brand-orange) 50%, #888 50%);
            margin-top: 3px;
            margin-bottom: 3px;
        }

        .brand-motto {
            font-family: 'Open Sans', sans-serif;
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.16em;
            color: #444;
            text-transform: uppercase;
        }

        /* Diagonal slash divider */
        .header-divider-svg {
            width: 48px;
            height: 52px;
            flex-shrink: 0;
        }

        .header-title-section {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .header-title {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.04em;
            line-height: 1.05;
        }

        .header-subtitle {
            font-size: 11.5px;
            font-weight: 700;
            margin-top: 2px;
            letter-spacing: 0.01em;
        }

        /* ---------- Black Banner ---------- */
        .complete-banner {
            background-color: var(--safety-black);
            color: #ffffff;
            text-align: center;
            font-size: 21px;
            font-weight: 700;
            letter-spacing: 0.02em;
            padding: 3px 8px;
            margin-bottom: 2px;
        }

        /* ---------- Table Structure ---------- */
        .scaffold-table {
            border: 2px solid var(--safety-black);
            display: flex;
            flex-direction: column;
        }

        .table-row {
            display: flex;
            border-bottom: 2px solid var(--safety-black);
        }

        .table-row:last-child {
            border-bottom: none;
        }

        .cell {
            padding: 10px 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            border-right: 2px solid var(--safety-black);
        }

        .cell:last-child {
            border-right: none;
        }

        .cell-header {
            font-size: 13.5px;
            font-weight: 700;
            background-color: #ffffff;
            padding: 8px 4px;
        }

        .cell-peach {
            background-color: var(--input-peach);
            font-weight: 700;
        }

        .cell-white {
            background-color: #ffffff;
            font-weight: 700;
        }

        .col-id {
            flex: 1.25;
        }

        .col-date {
            flex: 1.05;
        }

        .col-load {
            flex: 1.15;
            line-height: 1.2;
        }

        .val-id {
            font-size: 18px;
            font-weight: 700;
        }

        .val-date {
            font-size: 18px;
            font-weight: 700;
        }

        .val-load {
            font-size: 12px;
            font-weight: 700;
            line-height: 1.25;
        }

        /* Project row */
        .project-label {
            width: 140px;
            flex-shrink: 0;
            font-size: 14.5px;
            font-weight: 700;
            background-color: #ffffff;
            justify-content: center;
        }

        .project-val {
            flex: 1;
            font-size: 17px;
            font-weight: 700;
            background-color: var(--input-peach);
            justify-content: center;
        }

        /* Company row */
        .company-label {
            width: 140px;
            flex-shrink: 0;
            font-size: 14.5px;
            font-weight: 700;
            background-color: #ffffff;
            justify-content: center;
        }

        .company-val {
            flex: 1.35;
            font-size: 16px;
            font-weight: 700;
            background-color: var(--input-peach);
            justify-content: center;
        }

        .proj-no-header {
            width: 58px;
            flex-shrink: 0;
            font-size: 10.5px;
            font-weight: 700;
            line-height: 1.15;
            background-color: #ffffff;
            border-right: 1.5px solid var(--safety-black);
            justify-content: center;
            flex-direction: column;
            padding: 2px 3px;
        }

        .proj-no-val {
            width: 78px;
            flex-shrink: 0;
            font-size: 10px;
            font-weight: 700;
            line-height: 1.15;
            background-color: #ffffff;
            justify-content: center;
            flex-direction: column;
            padding: 2px 3px;
            border-right: none;
        }

        /* Location Row */
        .location-container {
            display: flex;
            margin-top: 0px;
            margin-bottom: 10px;
        }

        .location-label {
            border: 2px solid var(--safety-black);
            padding: 2px 14px;
            font-size: 14px;
            font-weight: 700;
            background-color: #ffffff;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 95px;
        }

        .location-val {
            flex: 1;
            background-color: var(--input-peach);
            padding: 3px 10px;
            font-size: 14.5px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        /* Heavy separator bar */
        .heavy-bar {
            height: 5px;
            background-color: var(--safety-black);
            margin: 6px 0;
        }

        /* Safety checklist */
        .checklist-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2px 4px;
            margin-bottom: 6px;
        }

        .checklist-title {
            font-size: 15.5px;
            font-weight: 700;
        }

        .checklist-label {
            font-size: 14.5px;
            font-weight: 700;
            margin-left: 10px;
        }

        .checklist-val-box {
            background-color: var(--input-peach);
            padding: 2px 18px;
            font-size: 15px;
            font-weight: 700;
            margin-left: 10px;
            text-align: center;
        }

        /* Note box */
        .note-box {
            border: 2px solid var(--safety-black);
            display: flex;
            min-height: 108px;
            margin-bottom: 9px;
        }

        .note-label-cell {
            padding: 6px 8px;
            font-size: 15px;
            font-weight: 700;
            background-color: #ffffff;
            border-right: 2px solid var(--safety-black);
            width: 60px;
            flex-shrink: 0;
        }

        .note-content-cell {
            flex: 1;
            background-color: var(--input-peach);
            padding: 6px 12px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            text-align: center;
        }

        .note-content-text {
            font-size: 15px;
            font-weight: 700;
            line-height: 1.35;
        }

        /* Heavy separator bar below note */
        .heavy-bar-footer {
            height: 6px;
            background-color: var(--safety-black);
            margin: 6px 0 10px 0;
        }

        /* Footer section */
        .footer-section {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        .footer-left {
            flex: 1.15;
            display: flex;
            flex-direction: column;
        }

        .contact-details-heading {
            text-align: center;
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 3px;
        }

        .contact-box {
            border: 2px solid var(--safety-black);
            background-color: #ffffff;
        }

        .contact-row-label {
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 6px 1px 6px;
            text-align: left;
        }

        .contact-row-val {
            background-color: var(--input-peach);
            border-top: 1.5px solid var(--safety-black);
            border-bottom: 1.5px solid var(--safety-black);
            font-size: 15px;
            font-weight: 700;
            text-align: center;
            padding: 3px 6px;
        }

        .contact-channel-space {
            height: 14px;
            background-color: #ffffff;
        }

        .contact-osha-text {
            font-family: 'Open Sans', sans-serif;
            font-size: 7.5px;
            font-weight: 600;
            padding: 2px 6px 3px 6px;
            border-top: 1px solid var(--safety-black);
            color: #111;
            line-height: 1.1;
        }

        .footer-website-link {
            font-size: 11px;
            color: #0b57d0;
            text-decoration: underline;
            margin-top: 5px;
            display: inline-block;
        }

        .footer-right {
            flex: 0.95;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-left: 4px;
        }

        .qr-image-wrapper {
            width: 148px;
            height: 148px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .qr-image {
            width: 100%;
            height: 100%;
            display: block;
        }

        .qr-subtext {
            font-size: 13.5px;
            font-weight: 700;
            text-align: center;
            margin-top: 4px;
        }

        @media print {
            body {
                background: none !important;
                padding: 0 !important;
            }
            .tag-container {
                box-shadow: none !important;
                border: 2px solid #000 !important;
            }
        }
    </style>
</head>

<body>

    <div class="tag-container" id="scaffold-tag">

        <!-- Top Header -->
        <div class="top-header">
            <div class="brand-section">
                <div class="brand-logo">
                    <span class="brand-scaff">Scaff</span><span class="brand-snapp">Snapp</span><span class="brand-tm">&#8482;</span>
                </div>
                <div class="brand-underline"></div>
                <div class="brand-motto">NUMQUAM IMPARATUS</div>
            </div>

            <!-- Angled diagonal divider slash -->
            <svg class="header-divider-svg" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="8" y1="54" x2="40" y2="4" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
            </svg>

            <div class="header-title-section">
                <div class="header-title">SCAFFOLD</div>
                <div class="header-title">RELEASED</div>
                <div class="header-subtitle">Ready For Use</div>
            </div>
        </div>

        <!-- Black Banner -->
        <div class="complete-banner">
            Complete Scaffold
        </div>

        <!-- Scaffold ID, Date, Load Rating Table -->
        <div class="scaffold-table">
            <div class="table-row">
                <div class="cell cell-header col-id">Scaffold ID</div>
                <div class="cell cell-header col-date">Date</div>
                <div class="cell cell-header col-load">Load Rating</div>
            </div>
            <div class="table-row">
                <div class="cell cell-peach col-id val-id">${data.SCAFFID}</div>
                <div class="cell cell-peach col-date val-date">${new Date(data.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })}</div>
                <div class="cell cell-peach col-load val-load">
    ${data.lightDuty
        ? `
        <div>Light Duty</div>
        <div>25 lbs. per sq.ft.</div>
    `
        : ""}

    ${data.mediumDuty
        ? `
        <div>Medium Duty</div>
        <div>50 lbs. per sq.ft.</div>
    `
        : ""}

    ${data.heavyDuty
        ? `
        <div>Heavy Duty</div>
        <div>75 lbs. per sq.ft.</div>
    `
        : ""}
</div>
            </div>
            <div class="table-row">
                <div class="cell cell-white project-label">Project Name</div>
                <div class="cell cell-peach project-val">${data.projectName}</div>
            </div>
            <div class="table-row">
                <div class="cell cell-white company-label">Company Name</div>
                <div class="cell cell-peach company-val">${data.companyName}</div>
                <div class="cell proj-no-header">
                    <div>Project</div>
                    <div>No.</div>
                </div>
                <div class="cell proj-no-val"> 
                    <div>${data.PJT}</div>
                </div>
            </div>
        </div>

        <!-- Location Row -->
        <div class="location-container">
            <div class="location-label">Location</div>
            <div class="location-val">${data.address}</div>
        </div>

        <!-- Heavy bar -->
        <div class="heavy-bar"></div>

        <!-- Safety Checklist -->
        <div class="checklist-row">
            <span class="checklist-title">Safety Checklist</span>
            <span class="checklist-label">Fall Protection Required</span>
             <span class="checklist-val-box">
        ${data.fallProtection ? "Yes" : "No"}
    </span>
        </div>

        <!-- Note Box -->
        <div class="note-box">
            <div class="note-label-cell">Note:</div>
            <div class="note-content-cell">
                <p class="note-content-text">${data.note}</p>
            </div>
        </div>

        <!-- Heavy bar above footer -->
        <div class="heavy-bar-footer"></div>

        <!-- Footer: Contacts + QR -->
        <div class="footer-section">
            <div class="footer-left">
                <div class="contact-details-heading">Contact Details</div>
                <div class="contact-box">
                    <div class="contact-row-label">Competent Person</div>
                    <div class="contact-row-val">${data.clientName}</div>

                    <div class="contact-row-label">PHONE</div>
                    <div class="contact-row-val">${data.clientMobile}</div>

                    <div class="contact-row-label">Radio Channel</div>
                    <div class="contact-channel-space"></div>

                    <div class="contact-osha-text">Compliant with OSHA 29 CFR 1926.451 & ANSI A10.8.</div>
                </div>
                <a href="https://www.scaffsnapp.com" target="_blank" rel="noopener noreferrer" class="footer-website-link">www.scaffsnapp.com</a>
            </div>

            <div class="footer-right">
                <div class="qr-image-wrapper">
                    <!-- Standard high-resolution QR code representation for the scaffold ID record -->
                    <img class="qr-image" src="${data.qrCode}" alt="QR Code for SCF-BR549">
                </div>
                <div class="qr-subtext">Scan for full record</div>
            </div>
        </div>

    </div>

</body>
</html>

`;
};
exports.greenpdfTemplate = greenpdfTemplate;
const checkedIcon = `
<img
  src="https://img.magnific.com/premium-vector/checkbox-icon-set-check-box-tick-mark-vector-symbol-black-filled-outlined-style-square-bullet-approved-mark-sign_268104-1403.jpg?semt=ais_hybrid&w=740&q=80"
  style="width:25px;height:25px;object-fit:contain"
  alt="checked"
/>
`;
const yellowpdfTemplate = (data) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SCAFFSNAPP - Caution Incomplete Scaffold Tag</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,700;0,800;1,700;1,800&family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
    <style>
        :root {
            --safety-black: #000000;
            --input-peach: #FCE4D6;
            --brand-orange: #E85A24;
            --brand-dark: #292929;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Tinos', 'Times New Roman', Times, Georgia, serif;
            background-color: transparent;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 24px 16px;
            color: var(--safety-black);
        }

        .tag-container {
           width: 100%;
            max-width: 488px;
            background-color: #ffffff;
            border: 2px solid var(--safety-black);
            padding: 24px 18px 26px;
        }

        /* ---------- Top Header ---------- */
        .top-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            margin-bottom: 6px;
            padding-bottom: 2px;
        }

        .brand-section {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .brand-logo {
            font-family: 'Open Sans', sans-serif;
            font-size: 38px;
            font-weight: 800;
            font-style: italic;
            line-height: 1;
            display: flex;
            align-items: baseline;
            letter-spacing: -0.03em;
        }

        .brand-scaff {
            color: var(--brand-orange);
        }

        .brand-snapp {
            color: var(--brand-dark);
        }

        .brand-tm {
            font-size: 11px;
            font-style: normal;
            font-weight: 700;
            color: #666;
            margin-left: 2px;
            vertical-align: super;
        }

        .brand-underline {
            width: 100%;
            height: 1.5px;
            background: linear-gradient(to right, var(--brand-orange) 50%, #888 50%);
            margin-top: 3px;
            margin-bottom: 3px;
        }

        .brand-motto {
            font-family: 'Open Sans', sans-serif;
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 0.16em;
            color: #444;
            text-transform: uppercase;
        }

        /* Diagonal slash divider */
        .header-divider-svg {
            width: 48px;
            height: 52px;
            flex-shrink: 0;
        }

        .header-title-section {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
        }

        .header-title {
            font-size: 20px;
            font-weight: 700;
            letter-spacing: 0.04em;
            line-height: 1.05;
        }

        .header-subtitle {
            font-size: 10.5px;
            font-weight: 700;
            margin-top: 2px;
            letter-spacing: 0.01em;
            white-space: nowrap;
        }

        /* ---------- Caution Banner ---------- */
        .caution-banner {
            background-color: var(--safety-black);
            color: #ffffff;
            text-align: center;
            font-size: 21px;
            font-weight: 700;
            letter-spacing: 0.02em;
            padding: 3px 8px;
            margin-bottom: 2px;
        }

        /* ---------- Table Structure ---------- */
        .scaffold-table {
            border: 2px solid var(--safety-black);
            display: flex;
            flex-direction: column;
        }

        .table-row {
            display: flex;
            border-bottom: 2px solid var(--safety-black);
        }

        .table-row:last-child {
            border-bottom: none;
        }
            

        .cell {
            padding: 10px 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            border-right: 2px solid var(--safety-black); 
        }

        .cell:last-child {
            border-right: none;
        }

        .cell-header {
            font-size: 13.5px;
            font-weight: 700;
            background-color: #ffffff;
            padding: 1px 4px;
        }

        .cell-peach {
            background-color: var(--input-peach);
            font-weight: 700;
        }

        .cell-white {
            background-color: #ffffff;
            font-weight: 700;
        }

        .col-id {
            flex: 1.25;
        }

        .col-date {
            flex: 1.05;
        }

        .col-load {
            flex: 1.15;
            line-height: 1.2;
        }

        .val-id {
            font-size: 18px;
            font-weight: 700;
        }

        .val-date {
            font-size: 18px;
            font-weight: 700;
        }

        .val-load {
            font-size: 12px;
            font-weight: 700;
            line-height: 1.25;
        }

        /* Project row */
        .project-label {
            width: 140px;
            flex-shrink: 0;
            font-size: 14.5px;
            font-weight: 700;
            background-color: #ffffff;
            justify-content: center;
        }

        .project-val {
            flex: 1;
            font-size: 17px;
            font-weight: 700;
            background-color: var(--input-peach);
            justify-content: center;
        }

        /* Company row */
        .company-label {
            width: 140px;
            flex-shrink: 0;
            font-size: 14.5px;
            font-weight: 700;
            background-color: #ffffff;
            justify-content: center;
        }

        .company-val {
            flex: 1.35;
            font-size: 16px;
            font-weight: 700;
            background-color: var(--input-peach);
            justify-content: center;
        }

        .proj-no-header {
            width: 58px;
            flex-shrink: 0;
            font-size: 10.5px;
            font-weight: 700;
            line-height: 1.15;
            background-color: #ffffff;
            border-right: 1.5px solid var(--safety-black);
            justify-content: center;
            flex-direction: column;
            padding: 2px 3px;
        }

        .proj-no-val {
            width: 78px;
            flex-shrink: 0;
            font-size: 10px;
            font-weight: 700;
            line-height: 1.15;
            background-color: #ffffff;
            justify-content: center;
            flex-direction: column;
            padding: 2px 3px;
            border-right: none;
        }

        /* Location Row */
        .location-container {
            display: flex;
            margin-top: 6px;
            margin-bottom: 6px;
        }

        .location-label {
            border: 2px solid var(--safety-black);
            padding: 2px 14px;
            font-size: 14px;
            font-weight: 700;
            background-color: #ffffff;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 95px;
        }

        .location-val {
            flex: 1;
            background-color: var(--input-peach);
            padding: 3px 10px;
            font-size: 14.5px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }

        /* Heavy separator bar */
        .heavy-bar {
            height: 5px;
            background-color: var(--safety-black);
            margin: 6px 0;
        }

        /* Safety checklist */
        .checklist-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2px 4px;
            margin-bottom: 6px;
        }

        .checklist-title {
            font-size: 15.5px;
            font-weight: 700;
        }

        .checklist-label {
            font-size: 14.5px;
            font-weight: 700;
            margin-left: 10px;
        }

        .checklist-val-box {
            background-color: var(--input-peach);
            padding: 2px 18px;
            font-size: 15px;
            font-weight: 700;
            margin-left: 10px;
            text-align: center;
            min-width: 44px;
        }

        /* Incomplete Items & Note Area Side by Side */
        .incomplete-note-row {
            display: flex;
            gap: 8px;
            align-items: stretch;
            margin-bottom: 6px;
        }

        .incomplete-items-col {
            flex: 0.95;
            display: flex;
            flex-direction: column;
        }

        .incomplete-heading {
            font-size: 14.5px;
            font-weight: 700;
            margin-bottom: 3px;
        }

        .incomplete-items-box {
            background-color: var(--input-peach);
            padding: 6px 8px;
            display: flex;
            flex-direction: column;
            gap: 5px;
            flex: 1;
            justify-content: center;
        }

        .incomplete-item {
            display: flex;
            align-items: center;
            gap: 7px;
            font-size: 14px;
            font-weight: 700;
            line-height: 1.2;
        }

        .black-checkbox {
            width: 17px;
            height: 17px;
            background-color: var(--safety-black);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .black-checkbox svg {
            width: 13px;
            height: 13px;
            stroke: #ffffff;
            stroke-width: 3;
            fill: none;
        }

        .note-box {
            flex: 1.05;
            border: 2px solid var(--safety-black);
            display: flex;
            min-height: 125px;
        }

        .note-label-cell {
            padding: 6px 6px;
            font-size: 14.5px;
            font-weight: 700;
            background-color: #ffffff;
            border-right: 2px solid var(--safety-black);
            width: 50px;
            flex-shrink: 0;
        }

        .note-content-cell {
            flex: 1;
            background-color: var(--input-peach);
            padding: 10px 8px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
        }

        .note-content-text {
            font-size: 14.5px;
            font-weight: 700;
            line-height: 1.35;
        }

        /* Heavy separator bar below note */
        .heavy-bar-footer {
            height: 6px;
            background-color: var(--safety-black);
            margin: 6px 0 10px 0;
        }

        /* Footer section */
        .footer-section {
            display: flex;
            gap: 12px;
            align-items: flex-start;
        }

        .footer-left {
            flex: 1.15;
            display: flex;
            flex-direction: column;
        }

        .contact-details-heading {
            text-align: center;
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 3px;
        }

        .contact-box {
            border: 2px solid var(--safety-black);
            background-color: #ffffff;
        }

        .contact-row-label {
            font-size: 10.5px;
            font-weight: 700;
            padding: 2px 6px 1px 6px;
            text-align: left;
        }

        .contact-row-val {
            background-color: var(--input-peach);
            border-top: 1.5px solid var(--safety-black);
            border-bottom: 1.5px solid var(--safety-black);
            font-size: 15px;
            font-weight: 700;
            text-align: center;
            padding: 3px 6px;
        }

        .contact-channel-space {
            height: 14px;
            background-color: #ffffff;
        }

        .contact-osha-text {
            font-family: 'Open Sans', sans-serif;
            font-size: 7.5px;
            font-weight: 600;
            padding: 2px 6px 3px 6px;
            border-top: 1px solid var(--safety-black);
            color: #111;
            line-height: 1.1;
        }

        .footer-website-link {
            font-size: 11px;
            color: #0b57d0;
            text-decoration: underline;
            margin-top: 5px;
            display: inline-block;
        }

        .footer-right {
            flex: 0.95;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-left: 4px;
        }

        .qr-image-wrapper {
            width: 148px;
            height: 148px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .qr-image {
            width: 100%;
            height: 100%;
            display: block;
        }

        .qr-subtext {
            font-size: 13.5px;
            font-weight: 700;
            text-align: center;
            margin-top: 4px;
        }

        @media print {
            body {
                background: none !important;
                padding: 0 !important;
            }
            .tag-container {
                box-shadow: none !important;
                border: 2px solid #000 !important;
            }
        }
    </style>
</head>

<body>

    <div class="tag-container" id="scaffold-tag">

        <!-- Top Header -->
        <div class="top-header">
            <div class="brand-section">
                <div class="brand-logo">
                    <span class="brand-scaff">Scaff</span><span class="brand-snapp">Snapp</span><span class="brand-tm">&#8482;</span>
                </div>
                <div class="brand-underline"></div>
                <div class="brand-motto">NUMQUAM IMPARATUS</div>
            </div>

            <!-- Angled diagonal divider slash -->
            <svg class="header-divider-svg" viewBox="0 0 48 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="8" y1="54" x2="40" y2="4" stroke="#000000" stroke-width="2.5" stroke-linecap="round" />
            </svg>

            <div class="header-title-section">
                <div class="header-title">INCOMPLETE</div>
                <div class="header-title">SCAFFOLD</div>
                <div class="header-subtitle">Authorized Personnel Only</div>
            </div>
        </div>

        <!-- Caution Banner -->
        <div class="caution-banner">
            Caution Incomplete Scaffold
        </div>

        <!-- Scaffold ID, Date, Load Rating Table -->
        <div class="scaffold-table">
            <div class="table-row">
                <div class="cell cell-header col-id">Scaffold ID</div>
                <div class="cell cell-header col-date">Date</div>
                <div class="cell cell-header col-load">Load Rating</div>
            </div>
            <div class="table-row">
                <div class="cell cell-peach col-id val-id">${data.SCAFFID}</div>
                <div class="cell cell-peach col-date val-date">${new Date(data.createdAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })}</div>
              <div class="cell cell-peach col-load val-load">
    ${data.lightDuty
        ? `
        <div>Light Duty</div>
        <div>25 lbs. per sq.ft.</div>
    `
        : ""}

    ${data.mediumDuty
        ? `
        <div>Medium Duty</div>
        <div>50 lbs. per sq.ft.</div>
    `
        : ""}

    ${data.heavyDuty
        ? `
        <div>Heavy Duty</div>
        <div>75 lbs. per sq.ft.</div>
    `
        : ""}
</div>
            </div>
            <div class="table-row">
                <div class="cell cell-white project-label">Project Name</div>
                <div class="cell cell-peach project-val">${data.projectName}</div>
            </div>
            <div class="table-row">
                <div class="cell cell-white company-label">Company Name</div>
                <div class="cell cell-peach company-val">${data.companyName}</div>
                <div class="cell proj-no-header">
                    <div>Project</div>
                    <div>No.</div>
                </div>
                <div class="cell proj-no-val"> 
                    <div>${data.PJT}</div>
                </div>
            </div>
        </div>

        <!-- Location Row -->
        <div class="location-container">
            <div class="location-label">Location</div>
            <div class="location-val">${data.address}</div>
        </div>

        <!-- Heavy bar -->
        <div class="heavy-bar"></div>

        <!-- Safety Checklist -->
        <div class="checklist-row">
            <span class="checklist-title">Safety Checklist</span>
            <span class="checklist-label">Fall Protection Required</span>
              <span class="checklist-val-box">
        ${data.fallProtection ? "Yes" : "No"}
    </span>
        </div>

        <!-- Incomplete Items & Note Area Side by Side -->
        <div class="incomplete-note-row">
            <!-- Left: Incomplete Items list with checkboxes -->
            <div class="incomplete-items-col">
                <div class="incomplete-heading">Incomplete Items</div>
              <div class="incomplete-items-box">

            <div class="incomplete-item">
                <div class="black-checkbox">
                    ${data.handRail ? checkedIcon : ""}
                </div>
                <span>Hand Rails</span>
            </div>

            <div class="incomplete-item">
                <div class="black-checkbox">
                    ${data.midRail ? checkedIcon : ""}
                </div>
                <span>Mid Rails</span>
            </div>

            <div class="incomplete-item">
                <div class="black-checkbox">
                    ${data.platform ? checkedIcon : ""}
                </div>
                <span>Decking</span>
            </div>

            <div class="incomplete-item">
                <div class="black-checkbox">
                    ${data.ladder ? checkedIcon : ""}
                </div>
                <span>Ladder</span>
            </div>

            <div class="incomplete-item">
                <div class="black-checkbox">
                    ${data.toeBoard ? checkedIcon : ""}
                </div>
                <span>Other head knockers</span>
            </div>

        </div>
            </div>

            <!-- Right: Note Box -->
            <div class="note-box">
                <div class="note-label-cell">Note</div>
                <div class="note-content-cell">
                    <p class="note-content-text">${data.note}</p>
                </div>
            </div>
        </div>

        <!-- Heavy bar above footer -->
        <div class="heavy-bar-footer"></div>

        <!-- Footer: Contacts + QR -->
        <div class="footer-section">
            <div class="footer-left">
                <div class="contact-details-heading">Contact Details</div>
                <div class="contact-box">
                    <div class="contact-row-label">Competent Person</div>
                    <div class="contact-row-val">${data.clientName}</div>

                    <div class="contact-row-label">PHONE</div>
                    <div class="contact-row-val">${data.clientMobile}</div>

                    <div class="contact-row-label">Radio Channel</div>
                    <div class="contact-channel-space"></div>

                    <div class="contact-osha-text">Compliant with OSHA 29 CFR 1926.451 & ANSI A10.8.</div>
                </div>
                <a href="https://www.scaffsnapp.com" target="_blank" rel="noopener noreferrer" class="footer-website-link">www.scaffsnapp.com</a>
            </div>

            <div class="footer-right">
                <div class="qr-image-wrapper">
                    <!-- High-resolution QR code for SCF-BR549 record -->
                    <img class="qr-image" src="${data.qrCode}" alt="QR Code for SCF-BR549">
                </div>
                <div class="qr-subtext">Scan for full record</div>
            </div>
        </div>

    </div>

</body>
</html>
`;
};
exports.yellowpdfTemplate = yellowpdfTemplate;
const certifictae = (data) => {
    var _a;
    const tradesmanName = String((_a = data.tradesmanName) !== null && _a !== void 0 ? _a : "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ScaffSnapp Safety Academy - Certificate of Completion</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800;1,900&family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    /* Reset & Base */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --primary-navy: #0c2340;
      --secondary-navy: #103362;
      --accent-orange: #f59e0b;
      --accent-orange-dark: #d97706;
      --border-blue: #0284c7;
      --frame-blue: #0ea5e9;
      --light-blue-bg: #dce7f3;
      --card-border: #94a3b8;
      --text-dark: #0f172a;
      --text-muted: #64748b;
      --text-body: #334155;
    }

    body {
      background-color: #f1f5f9;
      font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: var(--text-dark);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 24px;
      -webkit-font-smoothing: antialiased;
    }

    /* A4 Certificate Container */
    .certificate-page {
      width: 794px;
      min-height: 1123px;
      height: 1123px;
      background: #ffffff;
      position: relative;
      padding: 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      border: none;
      border-top: 3px solid var(--border-blue);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
      box-sizing: border-box;
    }

    /* Top Caution Stripe Bar */
    .hazard-stripe-top {
      width: 100%;
      height: 18px;
      margin: 0;
      margin-top: 0;
      margin-left: 0;
      margin-right: 0;
      background: repeating-linear-gradient(
        -45deg,
        #0c2340,
        #0c2340 12px,
        #ffffff 12px,
        #ffffff 24px
      );
      border-bottom: 2px solid #0c2340;
      margin-bottom: 14px;
    }

    /* Certificate Header */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 4px 24px 10px 24px;
    }

    /* Logo Styling */
    .brand-logo {
      display: flex;
      flex-direction: column;
    }

    .brand-logo .scaff-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 26px;
      line-height: 0.95;
      color: #ea580c;
      letter-spacing: -0.5px;
      position: relative;
      display: inline-block;
    }

    .brand-logo .scaff-title::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -3px;
      width: 82px;
      height: 3px;
      background-color: #0c2340;
    }

    .brand-logo .snapp-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 26px;
      line-height: 1.1;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 4px;
      margin-top: 5px;
    }

    .brand-logo .tagline {
      font-family: 'Montserrat', sans-serif;
      font-size: 8.5px;
      font-weight: 700;
      letter-spacing: 0.8px;
      color: #334155;
      margin-top: 10px;
      text-transform: uppercase;
    }

    /* Safety Academy Right Header */
    .academy-heading {
      text-align: right;
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 27px;
      line-height: 1.05;
      color: var(--primary-navy);
      letter-spacing: 0.5px;
    }

    /* Title Block */
    .title-block {
      text-align: center;
      margin-top: 6px;
      margin-bottom: 14px;
    }

    .certificate-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 34px;
      color: var(--primary-navy);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }

    .certificate-subtitle {
      font-size: 15px;
      font-weight: 600;
      color: #475569;
      letter-spacing: 0.2px;
    }

    /* Protocol Ribbon Bar with Slanted Stripes */
    .protocol-bar-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 10px 0 16px 0;
    }

    .slanted-stripes {
      display: flex;
      gap: 5px;
    }

    .slanted-stripes span {
      display: inline-block;
      width: 7px;
      height: 22px;
      background-color: var(--primary-navy);
      transform: skewX(-26deg);
    }

    .protocol-ribbon {
      background-color: var(--primary-navy);
      color: #ffffff;
      padding: 7px 28px;
      transform: skewX(-14deg);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12);
    }

    .protocol-ribbon-text {
      display: inline-block;
      transform: skewX(14deg);
      font-family: 'Montserrat', sans-serif;
      font-size: 13.5px;
      font-weight: 800;
      font-style: italic;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      white-space: nowrap;
    }

    /* Awarded To Section */
    .awardee-section {
      text-align: center;
      margin-bottom: 18px;
    }

    .awarded-to-label {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16px;
      font-style: normal;
      color: #334155;
      margin-bottom: 6px;
      letter-spacing: 0.3px;
    }

    .awardee-name {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 38px;
      font-weight: 700;
      color: var(--primary-navy);
      text-transform: uppercase;
      letter-spacing: 3px;
      line-height: 1.1;
    }

    /* Metadata Grid Box */
    .metadata-table-box {
      border: 1.5px solid var(--card-border);
      border-radius: 12px;
      background: #ffffff;
      margin: 0 24px 18px 24px;
      overflow: hidden;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .grid-cell {
      padding: 12px 16px;
      border-bottom: 1px solid #cbd5e1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .grid-cell.left-col {
      border-right: 1px solid #cbd5e1;
    }

    .grid-cell:nth-last-child(-n+2) {
      border-bottom: none;
    }

    .meta-label {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 3px;
    }

    .meta-value {
      font-size: 15.5px;
      font-weight: 700;
      color: var(--text-dark);
      line-height: 1.25;
    }

    .grid-cell.disclaimer-cell {
      grid-row: span 2;
      border-bottom: none;
      padding: 14px 18px;
    }

    .disclaimer-statement {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-body);
      line-height: 1.4;
    }

    .disclaimer-statement .heading-line {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-dark);
      margin-bottom: 4px;
    }

    /* Competencies Box */
    .competencies-container {
      margin: 0 24px 14px 24px;
      border-radius: 10px;
      overflow: hidden;
      border: 1.5px solid #94a3b8;
    }

    .competencies-header {
      background-color: var(--primary-navy);
      color: #ffffff;
      padding: 10px 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .header-badge-icon {
      width: 20px;
      height: 20px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .header-badge-icon svg {
      width: 12px;
      height: 12px;
      stroke: #ffffff;
      stroke-width: 3;
      fill: none;
    }

    .competencies-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 1px;
      text-transform: uppercase;
    }

    .competencies-list {
      background-color: var(--light-blue-bg);
      display: flex;
      flex-direction: column;
    }

    .competency-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 11px 18px;
      border-bottom: 1px solid #cbd5e1;
    }

    .competency-item:last-child {
      border-bottom: none;
    }

    .item-check-icon {
      width: 22px;
      height: 22px;
      border: 2px solid var(--primary-navy);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: transparent;
    }

    .item-check-icon svg {
      width: 13px;
      height: 13px;
      stroke: var(--primary-navy);
      stroke-width: 3;
      fill: none;
    }

    .competency-text {
      font-size: 13px;
      font-weight: 700;
      color: var(--primary-navy);
      line-height: 1.35;
    }

    /* Small Disclaimer Paragraph */
    .fine-print-disclaimer {
      text-align: center;
      font-size: 10.5px;
      line-height: 1.45;
      color: #475569;
      margin: 4px 28px 14px 28px;
      padding: 0 10px;
    }

    .fine-print-disclaimer strong {
      color: #0f172a;
      font-weight: 700;
    }

    /* Footer Card */
    .footer-panel {
      border: none;
      border-top: 1.5px solid var(--card-border);
      border-bottom: 3px solid var(--border-blue);
      border-radius: 0;
      background: #ffffff;
      margin: auto 0 0 0;
      width: 100%;
      padding: 16px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-sizing: border-box;
    }

    .footer-logo-block {
      display: flex;
      flex-direction: column;
    }

    .footer-logo-block .scaff-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 800;
      font-size: 18px;
      line-height: 0.95;
      color: #ea580c;
      position: relative;
      display: inline-block;
    }

    .footer-logo-block .scaff-title::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 58px;
      height: 2.5px;
      background-color: #0c2340;
    }

    .footer-logo-block .snapp-title {
      font-family: 'Montserrat', sans-serif;
      font-weight: 900;
      font-size: 18px;
      color: #0f172a;
      text-decoration: underline;
      text-decoration-thickness: 1.5px;
      text-underline-offset: 3px;
      margin-top: 4px;
    }

    .footer-logo-block .tagline {
      font-family: 'Montserrat', sans-serif;
      font-size: 6.5px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: #334155;
      margin-top: 6px;
      line-height: 1.25;
      text-transform: uppercase;
    }

    .operator-block {
      font-size: 10.5px;
      line-height: 1.4;
      color: var(--text-muted);
    }

    .operator-block .operator-label {
      font-size: 9.5px;
      color: #64748b;
    }

    .operator-block .operator-name {
      font-weight: 700;
      color: #0f172a;
    }

    .operator-block .operator-web {
      color: #334155;
      font-weight: 500;
    }

    /* Yellow Shield Security Badge */
    .shield-badge-container {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .shield-badge {
      width: 54px;
      height: 64px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
    }

    /* QR Code & Verification Info */
    .verify-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .verify-text {
      text-align: right;
    }

    .verify-title {
      font-family: 'Montserrat', sans-serif;
      font-size: 10px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .verify-desc {
      font-size: 9px;
      color: #475569;
      line-height: 1.35;
      margin-top: 2px;
    }

    .qr-container {
      width: 68px;
      height: 68px;
      padding: 4px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .qr-container svg {
      width: 100%;
      height: 100%;
    }

    /* Print Styles */
    @media print {
      body {
        background: transparent;
        padding: 0;
        margin: 0;
      }
      .certificate-page {
        box-shadow: none;
        border: 2px solid var(--border-blue);
        margin: 0 auto;
        page-break-after: avoid;
        page-break-inside: avoid;
      }
      @page {
        size: A4 portrait;
        margin: 0;
      }
    }
  </style>
</head>
<body>

  <!-- Single Standalone A4 Certificate Component -->
  <div class="certificate-page">
    
    <!-- Top Hazard Caution Strip -->
    <div class="hazard-stripe-top"></div>

    <!-- Header: Logo & Safety Academy -->
    <header class="header-section">
      <div class="brand-logo">
        <span class="scaff-title">Scaff</span>
        <span class="snapp-title">Snapp</span>
        <span class="tagline">Scaffolding Management—From Planning to Closeout</span>
      </div>
      <div class="academy-heading">
        SAFETY<br />ACADEMY
      </div>
    </header>

    <!-- Certificate Title & Subtitle -->
    <div class="title-block">
      <h1 class="certificate-title">CERTIFICATE OF COMPLETION</h1>
      <p class="certificate-subtitle">Personal Fall Protection Equipment (PFPE) — Visual Inspection</p>
    </div>

    <!-- Ribbon with Hazard Stripes -->
    <div class="protocol-bar-wrapper">
      <div class="slanted-stripes">
        <span></span><span></span><span></span><span></span>
      </div>
      <div class="protocol-ribbon">
        <span class="protocol-ribbon-text">USER AWARENESS &amp; PRE-USE FIELD CHECK PROTOCOLS</span>
      </div>
      <div class="slanted-stripes">
        <span></span><span></span><span></span><span></span>
      </div>
    </div>

    <!-- Awarded to Recipient -->
    <div class="awardee-section">
      <div class="awarded-to-label">Awarded to</div>
    <div class="awardee-name">
    ${tradesmanName}
  </div>
    </div>

    <!-- 2-Column Metadata Grid -->
    <div class="metadata-table-box">
      <!-- Left: Tradesman Email -->
      <div class="grid-cell left-col">
        <span class="meta-label">Tradesman Email:</span>
        <span class="meta-value">${data.email}</span>
      </div>
      <!-- Right: Status -->
      <div class="grid-cell">
        <span class="meta-label">Status:</span>
        <span class="meta-value">Awareness Training Completed</span>
      </div>

      <!-- Left: Certificate ID -->
      <div class="grid-cell left-col">
        <span class="meta-label">Certificate ID:</span>
        <span class="meta-value">BR-549</span>
      </div>
      <!-- Right: Instructional Awareness Disclaimer (spans 2 rows) -->
      <div class="grid-cell disclaimer-cell">
        <div class="disclaimer-statement">
          <div class="heading-line">Instructional Awareness Overview—</div>
          Does not confer regulatory or competent person status under OSHA/ANSI standards.
        </div>
      </div>

      <!-- Left: Completion Date -->
      <div class="grid-cell left-col">
        <span class="meta-label">Completion Date:</span>
        <span class="meta-value">October 7, 2026</span>
      </div>
    </div>

    <!-- Core Competencies Mastered Box -->
    <div class="competencies-container">
      <div class="competencies-header">
        <div class="header-badge-icon">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <span class="competencies-title">CORE FRAMEWORK COMPETENCIES MASTERED:</span>
      </div>
      <div class="competencies-list">
        <div class="competency-item">
          <div class="item-check-icon">
            <svg viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span class="competency-text">The 3-Point Pre-Use Bucket Test (Webbing, Fit-Check, Labeled &amp; Date Check, Indicator Audit)</span>
        </div>
        <div class="competency-item">
          <div class="item-check-icon">
            <svg viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span class="competency-text">Distinguishing User Operational Scope vs. Competent Person Boundaries</span>
        </div>
        <div class="competency-item">
          <div class="item-check-icon">
            <svg viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <span class="competency-text">Enforcing the Universal Site Mandate: “If it looks wrong, don’t dip in.”</span>
        </div>
      </div>
    </div>

    <!-- Fine Print Disclaimer -->
    <p class="fine-print-disclaimer">
      This certificate records successful completion of an informational awareness exercise. <strong>ScaffSnapp</strong> does not issue formal regulatory field certifications. The user and employer remain fully responsible for conducting inspections in accordance with manufacturer instructions and OSHA/ANSI requirements. The form, fit, and condition of PFPE on site may be.
    </p>

    <!-- Footer Information Bar -->
    <footer class="footer-panel">
      <!-- Mini Logo -->
      <div class="footer-logo-block">
        <span class="scaff-title">Scaff</span>
        <span class="snapp-title">Snapp</span>
        <span class="tagline">SCAFFOLDING MANAGEMENT—<br />FROM PLANNING TO CLOSEOUT</span>
      </div>

      <!-- Operated by -->
      <div class="operator-block">
        <div class="operator-label">Operated by:</div>
        <div class="operator-name">ScaffSnapp Safety Academy</div>
        <div class="operator-web">scaffsnapp.com</div>
      </div>

      <!-- Verified Security Shield Icon -->
      <div class="shield-badge-container">
        <svg class="shield-badge" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
          <!-- Shield Outer Contour with Heavy Black Border and Gold Yellow Fill -->
          <path d="M50 4 C78 4, 94 18, 94 48 C94 82, 68 106, 50 116 C32 106, 6 82, 6 48 C6 18, 22 4, 50 4 Z" 
                fill="#f59e0b" 
                stroke="#000000" 
                stroke-width="7" 
                stroke-linejoin="round" />
          <!-- Inner Black Checkmark -->
          <path d="M30 58 L45 74 L73 40" 
                fill="none" 
                stroke="#000000" 
                stroke-width="9" 
                stroke-linecap="round" 
                stroke-linejoin="round" />
        </svg>
      </div>

      <!-- Verification Info & QR Code -->
      <div class="verify-section">
        <div class="verify-text">
          <div class="verify-title">VERIFY TRADESMAN PROFILE</div>
          <div class="verify-desc">
            Scan to access live credentials and<br />
            training history &rsaquo;
          </div>
        </div>
        <!-- QR Code SVG with Brand Icon in Center -->
        <div class="qr-container">
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <!-- Top-Left Finder Pattern -->
            <rect x="5" y="5" width="26" height="26" rx="3" fill="#000000" />
            <rect x="9" y="9" width="18" height="18" rx="2" fill="#ffffff" />
            <rect x="13" y="13" width="10" height="10" rx="1.5" fill="#000000" />

            <!-- Top-Right Finder Pattern -->
            <rect x="69" y="5" width="26" height="26" rx="3" fill="#000000" />
            <rect x="73" y="9" width="18" height="18" rx="2" fill="#ffffff" />
            <rect x="77" y="13" width="10" height="10" rx="1.5" fill="#000000" />

            <!-- Bottom-Left Finder Pattern -->
            <rect x="5" y="69" width="26" height="26" rx="3" fill="#000000" />
            <rect x="9" y="73" width="18" height="18" rx="2" fill="#ffffff" />
            <rect x="13" y="77" width="10" height="10" rx="1.5" fill="#000000" />

            <!-- QR Data Modules Matrix -->
            <!-- Row 1-6 alignment & data -->
            <rect x="36" y="8" width="5" height="5" fill="#000000" />
            <rect x="47" y="8" width="5" height="5" fill="#000000" />
            <rect x="58" y="8" width="5" height="5" fill="#000000" />
            <rect x="41" y="16" width="5" height="5" fill="#000000" />
            <rect x="53" y="16" width="5" height="5" fill="#000000" />
            <rect x="36" y="24" width="5" height="5" fill="#000000" />
            <rect x="47" y="24" width="5" height="5" fill="#000000" />
            <rect x="58" y="24" width="5" height="5" fill="#000000" />

            <!-- Timing horizontal & vertical -->
            <rect x="8" y="37" width="5" height="5" fill="#000000" />
            <rect x="18" y="37" width="5" height="5" fill="#000000" />
            <rect x="28" y="37" width="5" height="5" fill="#000000" />
            <rect x="38" y="37" width="5" height="5" fill="#000000" />
            <rect x="68" y="37" width="5" height="5" fill="#000000" />
            <rect x="78" y="37" width="5" height="5" fill="#000000" />
            <rect x="88" y="37" width="5" height="5" fill="#000000" />

            <!-- Lower data modules -->
            <rect x="36" y="48" width="5" height="5" fill="#000000" />
            <rect x="58" y="48" width="5" height="5" fill="#000000" />
            <rect x="68" y="48" width="5" height="5" fill="#000000" />
            <rect x="83" y="48" width="5" height="5" fill="#000000" />
            
            <rect x="36" y="58" width="5" height="5" fill="#000000" />
            <rect x="47" y="58" width="5" height="5" fill="#000000" />
            <rect x="73" y="58" width="5" height="5" fill="#000000" />
            <rect x="88" y="58" width="5" height="5" fill="#000000" />

            <rect x="36" y="70" width="5" height="5" fill="#000000" />
            <rect x="47" y="70" width="5" height="5" fill="#000000" />
            <rect x="58" y="70" width="5" height="5" fill="#000000" />
            <rect x="68" y="70" width="5" height="5" fill="#000000" />
            <rect x="78" y="70" width="5" height="5" fill="#000000" />

            <rect x="42" y="80" width="5" height="5" fill="#000000" />
            <rect x="53" y="80" width="5" height="5" fill="#000000" />
            <rect x="63" y="80" width="5" height="5" fill="#000000" />
            <rect x="83" y="80" width="5" height="5" fill="#000000" />

            <rect x="36" y="90" width="5" height="5" fill="#000000" />
            <rect x="53" y="90" width="5" height="5" fill="#000000" />
            <rect x="73" y="90" width="5" height="5" fill="#000000" />
            <rect x="88" y="90" width="5" height="5" fill="#000000" />

            <!-- Center Brand Badge in QR -->
            <rect x="39" y="39" width="22" height="22" rx="4" fill="#f59e0b" stroke="#ffffff" stroke-width="2" />
            <text x="50" y="55" font-family="'Montserrat', sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">S</text>
          </svg>
        </div>
      </div>
    </footer>

  </div>

</body>
</html>
`;
};
exports.certifictae = certifictae;
