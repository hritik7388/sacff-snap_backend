// src/helpers/templates.ts
export const companyStatusTemplate = (
  companyName: string,
  cmpId: string,
  isApproved: "APPROVED" | "REJECTED",
) => {
  const LOGO_URL =
    "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";

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
                ${
                  isApproved === "APPROVED"
                    ? `
                  We’re pleased to inform you that your company registration has been 
                  <strong style="color:#16a34a;">APPROVED</strong> by our review team.`
                    : `
                  We regret to inform you that your company registration has been 
                  <strong style="color:#dc2626;">REJECTED</strong> after review.`
                }
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

              ${
                isApproved === "APPROVED"
                  ? `<p>You can now log in and access your company dashboard.</p>`
                  : `<p>For more details or to reapply, please contact our support team.</p>`
              }

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

export const companyAddTemplate = (
  memberName: string,
  userType: string,
  email: string,
  tempPassword: string,
) => {
  const LOGO_URL =
    "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";

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

export const teamMemberAddTemplate = (
  memberName: string,
  userType: string,
  email: string,
  tempPassword: string,
  cmpId: string,
) => {
  const LOGO_URL =
    "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";

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

export const otpTemplate = (name: string, otp: string) => {
  const LOGO_URL =
    "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";

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

export const newDeviceTemplate = (
  name: string,
  deviceName: string,
  deviceType: string,
  osVersion: string,
  lastLogin: string,
) => {
  const LOGO_URL =
    "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";

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

export const unusualActivityTemplate = (
  name: string,
  deviceName: string,
  deviceType: string,
  osVersion: string,
  lastLogin: string,
) => {
  const LOGO_URL =
    "https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/notification/Scaff+svg+(1).png";

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
export const greenpdfTemplate = (data: any) => {
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
            margin-top: 10px;
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
            min-height: 120px;
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
                <div class="cell cell-peach col-date val-date">${new Date(
                  data.createdAt,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}</div>
                <div class="cell cell-peach col-load val-load">
    ${data.lightDuty ? `
        <div>Light Duty</div>
        <div>25 lbs. per sq.ft.</div>
    ` : ""}

    ${data.mediumDuty ? `
        <div>Medium Duty</div>
        <div>50 lbs. per sq.ft.</div>
    ` : ""}

    ${data.heavyDuty ? `
        <div>Heavy Duty</div>
        <div>75 lbs. per sq.ft.</div>
    ` : ""}
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

const checkedIcon = `
<img
  src="https://img.magnific.com/premium-vector/checkbox-icon-set-check-box-tick-mark-vector-symbol-black-filled-outlined-style-square-bullet-approved-mark-sign_268104-1403.jpg?semt=ais_hybrid&w=740&q=80"
  style="width:25px;height:25px;object-fit:contain"
  alt="checked"
/>
`;
export const yellowpdfTemplate = (data: any) => {
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
                <div class="cell cell-peach col-date val-date">${new Date(
                  data.createdAt,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}</div>
              <div class="cell cell-peach col-load val-load">
    ${data.lightDuty ? `
        <div>Light Duty</div>
        <div>25 lbs. per sq.ft.</div>
    ` : ""}

    ${data.mediumDuty ? `
        <div>Medium Duty</div>
        <div>50 lbs. per sq.ft.</div>
    ` : ""}

    ${data.heavyDuty ? `
        <div>Heavy Duty</div>
        <div>75 lbs. per sq.ft.</div>
    ` : ""}
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
