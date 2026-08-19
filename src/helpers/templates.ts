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
    <title>SCAFFSNAPP - Released Tag</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <style>
        :root {
            --safety-black: #000;
            --input-white: rgba(255, 255, 255, 0.4);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Open Sans', sans-serif;
            background-color: #D1D5DB;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            color: var(--safety-black);
        }

        .tag-container {
            width: 100%;
            max-width: 560px;
            background-color: #fff;
            position: relative;
            padding: 24px 24px 18px; 
        }

        /* ---------- Top header row ---------- */
        .top-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-bottom: 14px;
        }

        .brand {
            font-weight: 700;
            font-size: 28px;
            letter-spacing: -0.02em;
        }

        .brand-sub {
            font-weight: 700;
            font-size: 17px;
            letter-spacing: 0.01em;
            text-align: center;
            line-height: 1.25;
            max-width: 230px;
        }

        /* ---------- Status banner ---------- */
        .status-banner {
            background-color: var(--safety-black);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            padding: 6px;
            margin-bottom: 16px;
        }

        .status-icon {
            width: 30px;
            height: 30px;
        }

        .status-text {
            font-weight: 800;
            font-size: 30px;
            letter-spacing: 0.02em;
        }

        /* ---------- ID + Date box ---------- */
        .id-date-box {
            display: flex;
            border: 2px solid var(--safety-black);
            margin-bottom: 18px;
        }

        .id-part {
            flex: 1.6;
            padding: 10px 10px 0px 10px;
            border-right: 2px solid var(--safety-black);
        }

        .date-part {
            flex: 1;
            padding: 10px 10px 0px 10px;
        }

        .small-label {
           font-size: 16px;
            font-weight: 500;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .big-value {
            font-weight: 700;
            font-size: 24px;
        }

        .date-value {
            font-weight: 700;
            font-size: 20px;
        }

        /* ---------- Fields ---------- */
        .field {
            display: flex;
            align-items: flex-end;
            margin-bottom: 16px;
        }

        .field-label {
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            width: 110px;
            flex-shrink: 0;
            margin-right: 10px;
            padding-bottom: 2px;
        }

        .field-value {
            flex: 1;
            border-bottom: 1.5px solid var(--safety-black);
            font-weight: 700;
            font-size: 18px;
            line-height: 1.2;
            padding-bottom: 2px;
        }

        .flex-row {
            display: flex;
            gap: 24px;
        }

        .flex-1 {
            flex: 1;
        }

        /* ---------- Section heading (plain bold) ---------- */
        .section-heading {
            font-weight: 700;
            font-size: 16px;
            margin: 6px 0 10px;
        }

        /* ---------- Loading Rating box ---------- */
        .loading-rating-box {
            border: 2px solid var(--safety-black);
            padding: 6px 16px;
            font-size: 19px;
            font-weight: 600;
            margin-bottom: 18px;
        }

        .loading-rating-box strong {
            font-weight: 800;
        }

        /* ---------- Note ---------- */
        .note-text {
            font-weight: 700;
            font-size: 16px;
            line-height: 1.4;
            margin-bottom: 22px;
        }

        /* ---------- Footer (contacts + QR) ---------- */
        .footer {
            display: flex;
            /* border-top: 1.5px solid var(--safety-black); */
            padding-top: 16px;
        }

        .footer-left {
            flex: 1.3;
            display: flex;
            flex-direction: column;
            /* justify-content: center; */
            gap: 20px;
            padding-right: 20px;
            border-right: 1.5px solid var(--safety-black);
        }

        .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .icon-circle {
            background-color: var(--safety-black);
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .icon-circle svg {
            width: 18px;
            height: 18px;
            stroke: #fff;
        }

        .contact-label {
            font-size: 13px;
            font-weight: 500;
        }

        .contact-value {
            font-weight: 700;
            font-size: 17px;
        }

        .footer-right {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding-left: 20px;
        }

        .qr-code {
            width: 100%;
            max-width: 160px;
        }

        .qr-code img {
            width: 100%;
            display: block;
        }

        .qr-text {
            font-size: 12px;
            font-weight: 500;
            text-align: center;
            margin-top: 10px;
            line-height: 1.3;
        }

        .note-row {
            display: flex;
            gap: 8px;
            font-size: 15px;
            line-height: 1.35;
        }
        .note-tag {
            font-weight: 700;
            white-space: nowrap;
        }

        .note-text {
            font-weight: 700;
        }
    </style>
</head>

<body>

    <div class="tag-container" id="tag">

        <!-- Top header -->
        <div class="top-header">
            <h1 class="brand">SCAFFSNAPP</h1>
            <span class="brand-sub">SCAFFOLD RELEASED FOR ACCESS</span>
        </div>

        <!-- Status banner -->
        <div class="status-banner">
            <svg class="status-icon" viewBox="0 0 24 24" fill="#fff" stroke="#000" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" fill="#fff" stroke="#fff" />
                <path d="m8.5 12.5 2.5 2.5 5-5.5" stroke="#000" fill="none" />
            </svg>
            <span class="status-text">RELEASED</span>
        </div>

        <!-- ID + Date -->
        <div class="id-date-box">
            <div class="id-part">
                <div class="small-label">Scaffold ID :</div>
                <div class="big-value">${data.SCAFFID}</div>
            </div>
            <div class="date-part">
                <div class="small-label" style="margin-left: 26px;">Date :</div>
                <div class="date-value" style="text-align: center; margin-top: 10px;">${new Date(
                  data.createdAt,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}</div>
            </div>
        </div>

        <!-- Fields -->
        <div class="field">
            <span class="field-label">Project Name:</span>
            <div class="field-value">${data.projectName}</div>
        </div>

        <div class="field">
            <span class="field-label">Company Name:</span>
            <div class="field-value">${data.companyName}</div>
        </div>

        <div class="flex-row">
            <div class="field flex-1">
                <span class="field-label">Company ID:</span>
                <div class="field-value">${data.CMPID}</div>
            </div>
            <div class="field flex-1">
                <span class="field-label"style="margin-right: 0; width: 88px;">Project ID:</span>
                <div class="field-value">${data.PJT}</div>
            </div>
        </div>

        <div class="field">
            <span class="field-label">Location:</span>
            <div class="field-value">${data.address}</div>
        </div>

        <!-- Loading Rating -->
        <h3 class="section-heading">Loading Rating</h3>
        <div class="loading-rating-box">
                   ${
                     data.lightDuty
                       ? `
<div class="loading-box">
  <div class="load-left">
    <span>Light Duty</span>
    <span style="font-size:20px;font-weight:650;">(25 LBS SQ FT)</span>
  </div>

 
</div>
`
                       : ""
                   }

${
  data.mediumDuty
    ? `
<div class="loading-box">
  <div class="load-left">
    <span>Medium Duty</span>
    <span style="font-size:20px;font-weight:650;">(50 LBS SQ FT)</span>
  </div>

 
</div>
`
    : ""
}

${
  data.heavyDuty
    ? `
<div class="loading-box">
  <div class="load-left">
    <span>Heavy Duty</span>
    <span style="font-size:20px;font-weight:650;">(75 LBS SQ FT)</span>
  </div>

   
</div>
`
    : ""
}
        </div>

        <!-- Note -->
                <div class="note-row">
                    <span class="note-tag">Note:</span>
                    <p class="note-text">${data.note}.</p>
                </div>

        <!-- Footer: contacts + QR -->
        <div class="footer">
            <div class="footer-left">
                <div class="contact-item">
                    <div class="icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                    </div>
                    <div>
                        <div class="contact-label">Contact Person Name</div>
                        <div class="contact-value">${data.clientName}</div>
                    </div>
                </div>
                <div class="contact-item">
                    <div class="icon-circle">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                            stroke-linecap="round" stroke-linejoin="round">
                            <path
                                d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                    </div>
                    <div>
                        <div class="contact-label">Mobile Number</div>
                        <div class="contact-value">${data.clientMobile}</div>
                    </div>
                </div>
            </div>

            <div class="footer-right">
                   <div class="qr-code">
                 <img src="${data.qrCode}" 
                        alt="QR Code">
          </div>
                <div class="qr-text">
                    Scan the QR code for more details<br>and updates.
                </div>
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
  style="width:45px;height:45px;object-fit:contain"
  alt="checked"
/>
`;
export const yellowpdfTemplate = (data: any) => {
  return `
  <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SCAFFSNAPP - Incomplete Scaffold Tag</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700;800&display=swap"
        rel="stylesheet">
    <style>
        :root {
            --safety-black: #000;
            --input-white: rgba(255, 255, 255, 0.4);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Open Sans', sans-serif;
            background-color: #D1D5DB;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            color: var(--safety-black);
        }

        .tag-container {
            width: 100%;
            max-width: 570px;
            background-color: #fff;
            position: relative;
            padding: 24px 24px 18px;  
        }

        /* ---------- Top header row ---------- */
        .top-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
        }

        .brand {
            font-weight: 700;
            font-size: 28px;
            letter-spacing: -0.02em;
        }

        .brand-sub {
            font-weight: 700;
            font-size: 20px;
            /* letter-spacing: 0.01em; */
        }

        /* ---------- Caution banner ---------- */
        .caution-banner {
            background-color: var(--safety-black);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            padding: 6px;
            margin-bottom: 16px;
        }

        .caution-icon {
            width: 30px;
            height: 30px;
            stroke: #fff;
        }

        .caution-text {
            font-weight: 800;
            font-size: 30px;
            letter-spacing: 0.02em;
        }

        /* ---------- ID + Date box ---------- */
        .id-date-box {
            display: flex;
            border: 2px solid var(--safety-black);
            margin-bottom: 18px;
        }

        .id-part {
            flex: 1.6;
            padding: 10px 10px 0px 10px;
            border-right: 2px solid var(--safety-black);
        }

        .date-part {
            flex: 1;
            padding: 10px 10px 0px 10px;

        }

        .small-label {
            font-size: 16px;
            font-weight: 500;
            text-transform: uppercase;
            margin-bottom: 2px;
        }

        .big-value {
            font-weight: 700;
            font-size: 28px;
        }

        .date-value {
            font-weight: 700;
            font-size: 20px;
        }

        /* ---------- Fields ---------- */
        .field {
            display: flex;
            align-items: flex-end;
            margin-bottom: 16px;
        }

        .field-label {
            font-size: 14px;
            font-weight: 500;
            white-space: nowrap;
            width: 110px;
            flex-shrink: 0;
            margin-right: 10px;
            padding-bottom: 2px;
        }

        .field-value {
            flex: 1;
            border-bottom: 1.5px solid var(--safety-black);
            font-weight: 700;
            font-size: 18px;
            line-height: 1.2;
            padding-bottom: 2px;
        }

        .flex-row {
            display: flex;
            gap: 24px;
        }

        .flex-1 {
            flex: 1;
        }

        /* ---------- Section heading (plain bold) ---------- */
        .section-heading {
            font-weight: 700;
            font-size: 16px;
            margin: 6px 0 10px;
        }

        /* ---------- Loading Schedule box ---------- */
        .loading-box {
            display: flex;
            border: 2px solid var(--safety-black);
            margin-bottom: 22px;
        }

        .load-left {
            flex: 0.6;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: 5px 12px;
            border-right: 2px solid var(--safety-black);
            font-size: 16px;
            line-height: 1.4;
        }

        .load-left strong {
            font-weight: 800;
        }

        .load-right {
            flex: 1.3;
            display: flex;
            /* align-items: center; */
            gap: 18px;
            padding: 5px 16px;
        }

        .fpr-title {
            font-weight: 500;
            font-size: 16px;
        }

        .fpr-options {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .fpr-option {
            display: flex;
            align-items: center;
            gap: 16px;
            font-weight: 700;
            font-size: 16px;
        }

        .fpr-option .lbl {
            width: 34px;
        }

        /* ---------- Checkboxes ---------- */
        .check-box {
            width: 20px;
            height: 20px;
            border: 2px solid var(--safety-black);
            background-color: var(--input-white);
            flex-shrink: 0;
        }

        /* ---------- Check incomplete + QR ---------- */
        .content-row {
            display: flex;
            gap: 12px;
        }

        .content-left {
            flex: 1.5;
        }

        .grid-items {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px 20px;
            margin-bottom: 16px;
        }

        .grid-item {
            display: flex;
            align-items: center;
            gap: 14px;
            font-size: 16px;
            font-weight: 700;
        }

        .grid-item span {
            min-width: 90px;
        }

        .note-row {
            display: flex;
            gap: 8px;
            font-size: 15px;
            line-height: 1.35;
        }

        .note-tag {
            font-weight: 700;
            white-space: nowrap;
        }

        .note-text {
            font-weight: 700;
        }

        /* ---------- QR ---------- */
        .qr-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            border-left: 1.5px solid var(--safety-black);
            padding-left: 20px;
        }

        .qr-code {
            width: 100%;
            max-width: 180px;
        }

        .qr-code img {
            width: 100%;
            display: block;
        }

        .qr-text {
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            margin-top: 10px;
            line-height: 1.3;
        }

        /* ---------- Footer ---------- */
        .footer {
            border-top: 1.5px solid var(--safety-black);
            border-bottom: 1.5px solid var(--safety-black);
            margin-top: 18px;
            padding: 14px 0;
            display: flex;
            justify-content: space-between;
            gap: 0;
        }

        .contact-item {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
        }

        .contact-item:first-child {
            border-right: 1.5px solid var(--safety-black);
        }

        .icon-circle {
            background-color: var(--safety-black);
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .icon-circle svg {
            width: 18px;
            height: 18px;
            stroke: #fff;
        }

        .contact-label {
            font-size: 13px;
            font-weight: 500;
        }

        .contact-value {
            font-weight: 700;
            font-size: 15px;
        }
    </style>
</head>

<body>

    <div class="tag-container" id="tag">

        <!-- Top header -->
        <div class="top-header">
            <h1 class="brand">SCAFFSNAPP</h1>
            <span class="brand-sub">INCOMPLETE SCAFFOLD</span>
        </div>

        <!-- Caution banner -->
        <div class="caution-banner">
            <svg class="caution-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
            </svg>
            <span class="caution-text">CAUTION</span>
        </div>

        <!-- ID + Date -->
        <div class="id-date-box">
            <div class="id-part">
                <div class="small-label">Scaffold ID :</div>
                <div class="big-value">${data.SCAFFID}</div>
            </div>
            <div class="date-part" >
                <div class="small-label" style="margin-left: 26px;">Date :</div>
                <div class="date-value" style="text-align: center; margin-top: 10px;"> ${new Date(
                  data.createdAt,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}</div>
            </div>
        </div>

        <!-- Fields -->
        <div class="field">
            <span class="field-label">Project Name:</span>
            <div class="field-value">${data.projectName}</div>
        </div>

        <div class="field">
            <span class="field-label">Company Name:</span>
            <div class="field-value">${data.companyName}</div>
        </div>

        <div class="flex-row">
            <div class="field flex-1">
                <span class="field-label">Company ID:</span>
                <div class="field-value">${data.CMPID}</div>
            </div>
            <div class="field flex-1">
                <span class="field-label"style="margin-right: 0; width: 88px;">Project ID:</span>
                <div class="field-value" >${data.PJT}</div>
            </div>
        </div>

        <div class="field">
            <span class="field-label">Location:</span>
            <div class="field-value">${data.address}</div>
        </div>

        <!-- Loading Schedule -->
        <h3 class="section-heading">Loading Schedule</h3>
        ${
          data.lightDuty
            ? `
<div class="loading-box">
  <div class="load-left">
    <span>Light Duty</span>
    <span style="font-size:20px;font-weight:650;">(25 LBS SQ FT)</span>
  </div>

  <div class="load-right">
    <div class="fpr-title">Fall Protection Required:</div>
    <div class="fpr-options">
      <div class="fpr-option">
        <span class="lbl">YES</span>
        ${data.fallProtection ? checkedIcon : `<div class="check-box"></div>`}
      </div>

      <div class="fpr-option">
        <span class="lbl">NO</span>
        ${!data.fallProtection ? checkedIcon : `<div class="check-box"></div>`}
      </div>
    </div>
  </div>
</div>
`
            : ""
        }

${
  data.mediumDuty
    ? `
<div class="loading-box">
  <div class="load-left">
    <span>Medium Duty</span>
    <span style="font-size:20px;font-weight:650;">(50 LBS SQ FT)</span>
  </div>

  <div class="load-right">
    <div class="fpr-title">Fall Protection Required:</div>
    <div class="fpr-options">
      <div class="fpr-option">
        <span class="lbl">YES</span>
        ${data.fallProtection ? checkedIcon : `<div class="check-box"></div>`}
      </div>

      <div class="fpr-option">
        <span class="lbl">NO</span>
        ${!data.fallProtection ? checkedIcon : `<div class="check-box"></div>`}
      </div>
    </div>
  </div>
</div>
`
    : ""
}

${
  data.heavyDuty
    ? `
<div class="loading-box">
  <div class="load-left">
    <span>Heavy Duty</span>
    <span style="font-size:20px;font-weight:650;">(75 LBS SQ FT)</span>
  </div>

  <div class="load-right">
    <div class="fpr-title">Fall Protection Required:</div>
    <div class="fpr-options">
      <div class="fpr-option">
        <span class="lbl">YES</span>
        ${data.fallProtection ? checkedIcon : `<div class="check-box"></div>`}
      </div>

      <div class="fpr-option">
        <span class="lbl">NO</span>
        ${!data.fallProtection ? checkedIcon : `<div class="check-box"></div>`}
      </div>
    </div>
  </div>
</div>
`
    : ""
}

        <!-- Check Incomplete Items + QR -->
        <div class="content-row">
   <div class="content-left">
    <h3 class="section-heading" style="margin-top: 0;">Check Incomplete Items</h3>

    ${
      data.handRail ||
      data.platform ||
      data.midRail ||
      data.ladder ||
      data.toeBoard ||
      data.note
        ? `
      <div class="grid-items">
          <div class="grid-item">
              <span>Handrails</span>
              ${data.handRail ? checkedIcon : `<div class="check-box"></div>`}
          </div>

          <div class="grid-item">
              <span>Platform</span>
              ${data.platform ? checkedIcon : `<div class="check-box"></div>`}
          </div>

          <div class="grid-item">
              <span>Mid Rails</span>
              ${data.midRail ? checkedIcon : `<div class="check-box"></div>`}
          </div>

          <div class="grid-item">
              <span>Ladder</span>
              ${data.ladder ? checkedIcon : `<div class="check-box"></div>`}
          </div>

          <div class="grid-item">
              <span>Toe Boards</span>
              ${data.toeBoard ? checkedIcon : `<div class="check-box"></div>`}
          </div>
      </div>

      <div class="note-row">
          <span class="note-tag">Note:</span>
          <p class="note-text">${data.note}</p>
      </div>
      `
        : ``
    }
</div>

            <div class="qr-section">
                <div class="qr-code">
                 <img src="${data.qrCode}" 
                        alt="QR Code">
          </div>
                <div class="qr-text">
                    Scan the QR code for more<br>details and updates.
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="contact-item">
                <div class="icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </div>
                <div>
                    <div class="contact-label">Contact Person Name</div>
                    <div class="contact-value">${data.clientName}</div>
                </div>
            </div>
            <div class="contact-item">
                <div class="icon-circle">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                        stroke-linecap="round" stroke-linejoin="round">
                        <path
                            d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                </div>
                <div>
                    <div class="contact-label">Mobile Number</div>
                    <div class="contact-value">${data.clientMobile}</div>
                </div>
            </div>
        </div>

    </div>
</body>

</html>

`;
};
