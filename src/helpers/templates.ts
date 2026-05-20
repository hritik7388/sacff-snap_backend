// src/helpers/templates.ts
export const companyStatusTemplate = (
  companyName: string,
  cmpId: string,
  isApproved: "APPROVED" | "REJECTED"
) => {
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

              ${isApproved === "APPROVED"
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
  tempPassword: string
) => {
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

export const teamMemberAddTemplate = (
  memberName: string,
  userType: string,
  email: string,
  tempPassword: string,
  cmpId: string
) => {
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

export const otpTemplate = (name: string, otp: string) => {
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

export const newDeviceTemplate = (
  name: string,
  deviceName: string,
  deviceType: string,
  osVersion: string,
  lastLogin: string
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
  lastLogin: string
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
export const greenpdfTemplate = (data: any,) => {

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SCAFF SNAPP - Released Tag</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --tag-bg: #6adc66;
        --tag-black: #000000;
        --tag-white: #ffffff;
        --input-bg: rgba(255, 255, 255, 0.2);
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: "Inter", sans-serif;
        background-color: #d1d5db;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
      }

      .tag-container {
        width: 100%;
        max-width: 420px;
        background-color: transparent;
        border: 1px solid var(--tag-black);
        border-radius: 30px;
        position: relative;
        padding: 24px 20px 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }

      .header-title {
        text-align: center;
        font-weight: 700;
        font-size: 20px;
        letter-spacing: 0.05em;
        margin-bottom: 16px;
        color: var(--tag-black);
      }

      .status-banner {
        background-color: var(--tag-black);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 10px;
        border-radius: 4px;
        margin-bottom: 16px;
      }

      .check-circle {
        width: 40px;
        height: 40px;
        background-color: white;
        border: 3px solid black;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .check-circle svg {
        width: 20px;
        height: 20px;
        stroke: black;
        stroke-width: 4;
        fill: none;
      }

      .status-text {
        color: white;
        font-weight: 750;
        font-size: 40px;
        letter-spacing: -0.02em;
        line-height: 1;
      }

      .subheader {
        text-align: center;
        font-weight: 700;
        font-size: 24px;
        margin-bottom: 16px;
        line-height: 1.1;
        color: var(--tag-black);
      }

      .id-box {
        border: 1.5px solid var(--tag-black);
        border-radius: 2px;
        padding: 8px;
        text-align: center;
        /* margin-bottom: 50px; */
      }

      .id-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.7;
      }

      .id-value {
        font-weight: 700;
        font-size: 24px;
        letter-spacing: 0.05em;
      }

      .field {
        border-bottom: 1.5px solid var(--tag-black);
        padding-bottom: 2px;
        margin-bottom: 20px;
      }

      .field-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        display: block;
        opacity: 0.7;
      }

      .field-value {
        font-weight: 700;
        font-size: 18px;
        line-height: 1.2;
      }

      .flex-row {
        display: flex;
        gap: 16px;
      }

      .flex-1 {
        flex: 1;
      }

      .section-bar {
        background-color: var(--tag-black);
        color: white;
        text-align: center;
        font-weight: 700;
        font-size: 16px;
        padding: 6px;
        text-transform: uppercase;
        margin: 8px 0;
        border-radius: 2px;
      }

        .checklist-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 6px 0;
        font-weight: 700;
        font-size: 13px;
      }

     .check-box {
    width: 32px;
    height: 32px;
    border: 2px solid #000;
    position: relative;
    background: #fff;
}

.check-box.checked::after {
    content: "";
    position: absolute;
    left: 8px;
    top: 2px;
    width: 10px;
    height: 18px;
    border: solid #000;
    border-width: 0 3px 3px 0;
    transform: rotate(45deg);
}

      .date-section {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        margin-top: 5px;
      }

      .note-box {
        /* background-color: rgba(0, 0, 0, 0.05);
            border: 1px solid var(--tag-black);
            padding: 8px; */
        border-radius: 2px;
        font-size: 13px;
        line-height: 1.3;
        margin: 8px 0;
        display: flex;
        gap: 8px;
      }

      .note-tag {
        font-weight: 700;
      }

      .contact-section-header {
        background-color: var(--tag-black);
        color: var(--tag-bg);
        font-weight: 700;
        font-size: 14px;
        padding: 6px 16px;
        text-transform: uppercase;
        display: inline-block;
        margin-top: 12px;
        margin-bottom: 12px;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        padding-bottom: 4px;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;
      }

      .icon-circle {
        background-color: var(--tag-black);
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-circle svg {
        width: 24px;
        height: 24px;
        stroke: white;
        fill: none;
      }

      .contact-label {
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        opacity: 0.7;
      }

      .contact-value {
        font-weight: 700;
        font-size: 16px;
      }

      .qr-section-container {
        display: flex;
        flex-direction: row;
        /* align-items: center; */
        width: 100%;
      }

      .qr-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 120px;
        margin-top: 8px;
        margin-left: 18px;
      }

      .qr-code {
        background-color: white;
        padding: 6px;
        border: 1px solid var(--tag-black);
        width: 130px;
        height: 130px;
        box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
      }

      .qr-code img {
        width: 100%;
        height: 100%;
      }

      .qr-text {
        font-size: 8px;
        font-weight: 700;
        text-align: center;
        margin-top: 8px;
        line-height: 1.2;
        opacity: 0.8;
      }
    </style>
  </head>
  <body>
    <div class="tag-container">
      <h1 class="header-title">SCAFF SNAPP</h1>

      <div class="status-banner">
        <div class="check-circle">
          <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" /></svg>
        </div>
        <span class="status-text">RELEASED</span>
      </div>

      <h2 class="subheader">SCAFFOLD RELEASED FOR ACCESS</h2>

      <div class="id-box">
        <div class="id-label">Scaffold ID:</div>
        <div class="id-value">${data.SCAFFID}</div>
      </div>
      <div class="date-section">
        <span>Date</span>
        <span style="font-weight: 700">${data.createdAt}</span>
      </div>
      <div style="margin-bottom: 50px; margin-top: 50px">
        <div class="field">
          <span class="field-label">Project Name</span>
          <div class="field-value">${data.projectName}</div>
        </div>

        <div class="field">
          <span class="field-label">Company Name</span>
          <div class="field-value">${data.companyName}</div>
        </div>

        <div class="flex-row">
          <div class="field flex-1">
            <span class="field-label">Company ID</span>
            <div class="field-value">${data.CMPID}</div>
          </div>
          <div class="field flex-1">
            <span class="field-label">Project ID</span>
            <div class="field-value">${data.PJT}</div>
          </div>
        </div>

        <div class="field">
          <span class="field-label">Location</span>
          <div class="field-value">${data.address}</div>
        </div>
      </div>
<div class="section-bar">Loading Schedule</div>
${data.lightDuty ? `
<div class="checklist-item">
    <span>Light Duty (25 LBS SQ FT)</span>

 <img 
  src="https://www.svgrepo.com/show/443815/gui-form-checkbox-checked.svg"
  style="
    width:32px;
    height:32px;
    object-fit:contain;
  "
  alt="checked"
/>
</div>
` : ``}

${data.mediumDuty ? `
<div class="checklist-item">
    <span>Medium Duty (50 LBS SQ FT)</span>

  <img 
  src="https://www.svgrepo.com/show/443815/gui-form-checkbox-checked.svg"
  style="
    width:32px;
    height:32px;
    object-fit:contain;
  "
  alt="checked"
/>
</div>
` : ``}

${data.heavyDuty ? `
<div class="checklist-item">
    <span>Heavy Duty (75 LBS SQ FT)</span>

 <img 
  src="https://www.svgrepo.com/show/443815/gui-form-checkbox-checked.svg"
  style="
    width:32px;
    height:32px;
    object-fit:contain;
  "
  alt="checked"
/>
</div>
` : ``}

      <div class="note-box">
        <span class="note-tag">Note:</span>
        <span
          >Loose planking noticed on the west side platform. Marked and reported
          for immediate repair.</span
        >
      </div>

      <div class="checklist-item" style="margin-bottom: 50px">
        <span>See Engineering Drawing</span>
        <div class="check-box"></div>
      </div>

      <div class="qr-section-container">
        <div class="footer">
          <div class="section-bar section-bar-footer">
            Contact Person Details
          </div>
          <div class="footer-content">
            <div class="contact-info">
              <div class="contact-item">
                <div class="icon-circle">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div class="contact-label">Name</div>
                  <div class="contact-value">${data.clientName}</div>
                </div>
              </div>
              <div class="contact-item">
                <div class="icon-circle">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="contact-label">Mobile Number</div>
                  <div class="contact-value">${data.clientMobile}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="qr-section">
          <div class="qr-code">
            <img src="${data.qrCode}" alt="QR Code">
          </div>
          <div class="qr-text">
            Scan the QR code for more details and updates.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;
}

// export const yellowpdfTemplate = (data: any,) => {

//   return`<!doctype html>
// <html lang="en">
//   <head>
//     <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//     <title>Yellow Scaffold Tag</title>

//     <style>
//       :root {
//         --safety-yellow: #fcee21;
//         --safety-black: #000;
//         --input-white: #fff;
//       }

//       body {
//         margin: 0;
//         font-family: Arial, sans-serif;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//         min-height: 100vh;
//         background: #222;
//       }

//       .card-container {
//         position: relative;
//         width: 400px;
//         height: 900px;
//       }

//       .bg-svg {
//         position: absolute;
//         width: 100%;
//         height: 100%;
//       }

//       .content {
//         position: absolute;
//         inset: 0;
//         padding: 22px 18px;
//         display: flex;
//         flex-direction: column;
//         box-sizing: border-box;
//       }

//       /* Header */
//       .header-title {
//         text-align: center;
//         font-size: 14px;
//         font-weight: 800;
//       }

//       .caution-box {
//         background: #000;
//         color: #fcee21;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//         gap: 8px;
//         padding: 6px 0;
//         margin-top: 6px;
//       }

//       .caution-text {
//         font-size: 34px;
//         font-weight: 900;
//       }

//       .sub-header {
//         text-align: center;
//         font-weight: 800;
//         margin: 6px 0 10px;
//       }

//       /* Stripes */
//       .hazard-stripe {
//         height: 12px;
//         background: repeating-linear-gradient(
//           -45deg,
//           #000,
//           #000 10px,
//           #fcee21 10px,
//           #fcee21 20px
//         );
//         border-top: 1px solid #000;
//         border-bottom: 1px solid #000;
//       }

//       /* Scaffold ID */
//       .scaffold-id-section {
//         text-align: center;
//         padding: 6px 0;
//       }

//       .scaffold-label {
//         font-size: 10px;
//         font-weight: 600;
//       }

//       .scaffold-value {
//         font-size: 20px;
//         font-weight: 900;
//       }

//       /* Fields */
//       .field-group {
//         margin-top: 8px;
//       }

//       .field-label {
//         font-size: 10px;
//         font-weight: 600;
//       }

//       .field-value {
//         font-size: 13px;
//         font-weight: 700;
//         border-bottom: 1px solid #000;
//         margin-bottom: 6px;
//       }

//       /* Section Bar */
//       .section-bar {
//         background: #000;
//         color: #fcee21;
//         text-align: center;
//         font-size: 12px;
//         font-weight: 800;
//         padding: 3px 0;
//         margin-top: 10px;
//       }

//       /* Checklist */
//       .checklist-row {
//         display: flex;
//         justify-content: space-between;
//         align-items: center;
//         font-size: 11px;
//         margin: 8px 0;
//         font-weight: 700;
//       }

//       .checklist-left {
//         display: flex;
//         justify-content: space-between;
//         flex: 1;
//         padding-right: 10px;
//       }

//       .check-box {
//         width: 22px;
//         height: 16px;
//         background: #fff;
//         border: 1px solid #000;
//       }

//       .long-input {
//        width:295px;
//         height: 16px;
//         border: 1px solid #000;
//         background: #fff;
//         margin-left: 6px;
//       }

//       .fall-prot-row {
//         display: flex;
//         justify-content: space-between;
//         margin-top: 6px;
//         font-size: 11px;
//         font-weight: 700;
//       }

//       .yes-no-group {
//         display: flex;
//         align-items: center;
//         gap: 5px;
//       }

//       /* Grid */
//       .items-grid {
//         display: grid;
//         grid-template-columns: 1fr 1fr 1fr;
//         gap: 6px;
//         margin-top: 5px;
//       }

//       .grid-item {
//         display: flex;
//         justify-content: space-between;
//         font-size: 11px;
//         font-weight: 700;
//       }

//       .grid-check {
//         width: 18px;
//         height: 14px;
//         border: 1px solid #000;
//         background: #fff;
//       }

//       /* Footer */
//       .footer {
//         margin-top: auto;
//       }

//       .footer-title {
//         background: #000;
//         color: #fcee21;
//         text-align: center;
//         font-size: 12px;
//         font-weight: 800;
//         padding: 3px 0;
//         margin-top: 10px;
//       }

//       .footer-content {
//         display: flex;
//         justify-content: space-between;
//         margin-top: 12px;
//             margin-left: 15px;
//     margin-right: 15px;
//       }

//       .contact-block {
//         flex: 1;
//       }

//       .contact-row {
//         display: flex;
//         align-items: center;
//         gap: 8px;
//         margin-bottom: 10px;
//       }

//       .contact-label {
//         font-size: 9px;
//       }

//       .contact-value {
//         font-size: 13px;
//         font-weight: 800;
//       }

//       .qr-wrapper {
//         width: 85px;
//         text-align: center;
//       }

//       .qr-box {
//         width: 85px;
//         height: 85px;
//         background: #fff;
//         padding: 3px;
//       }

//       .qr-box img {
//         width: 100%;
//         height: 100%;
//       }

//       .qr-text {
//         font-size: 7px;
//         margin-top: 3px;
//         font-weight: 600;
//       }
//     </style>
//   </head>

//   <body>
//     <div class="card-container">

//       <svg class="bg-svg" viewBox="0 0 100 200" preserveAspectRatio="none">
//         <path d="M6 0 L94 0 L100 6 L100 192 Q100 200 92 200 L8 200 Q0 200 0 192 L0 6 Z" fill="#FCEE21"/>
//         <path d="M5 2 L95 2 L98 5 L98 191 Q98 198 91 198 L9 198 Q2 198 2 191 L2 5 Z"
//           fill="none" stroke="#000" stroke-width="0.5"/>
//       </svg>

//       <div class="content">

//         <!-- Header -->
//         <div class="header-title">SCAFF SNAPP</div>

//         <div class="caution-box">
//           <img src="https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/Group.png" width="28"/>
//           <div class="caution-text">CAUTION</div>
//         </div>

//         <div class="sub-header">INCOMPLETE SCAFFOLD</div>

//         <div class="hazard-stripe"></div>

//         <!-- Scaffold -->
//         <div class="scaffold-id-section">
//           <div class="scaffold-label">Scaffold ID:</div>
//           <div class="scaffold-value">${data.SCAFFID}</div>
//         </div>

//         <div class="hazard-stripe"></div>

//         <!-- Fields -->
//         <div class="field-group">
//           <div class="field-label">Project Name</div>
//           <div class="field-value">${data.projectName}</div>

//           <div class="field-label">Company Name</div>
//           <div class="field-value">${data.companyName}</div>

//           <div class="field-label">Company ID</div>
//           <div class="field-value">${data.CMPId}</div>

//           <div class="field-label">Location</div>
//           <div class="field-value">${data.address}</div>

//           <div class="field-label">Date of Erection</div>
//           <div class="field-value">${data.endDate}</div>
//         </div>

//         <!-- Loading -->
//         <div class="section-bar">Loading Schedule</div>

//         <div class="checklist-row">
//           <div class="checklist-left">
//             <span>Light Duty</span><span>(25 LBS SQ FT)</span>
//           </div>
//           <div class="check-box"></div>
//         </div>

//         <div class="checklist-row">
//           <div class="checklist-left">
//             <span>Medium Duty</span><span>(25 LBS SQ FT)</span>
//           </div>
//           <div class="check-box"></div>
//         </div>

//         <div class="checklist-row">
//           <div class="checklist-left">
//             <span>Heavy Duty</span><span>(25 LBS SQ FT)</span>
//           </div>
//           <div class="check-box"></div>
//         </div>

//         <div class="checklist-row">
//           <span>See Engineering Drawing</span>
//           <div class="check-box"></div>
//         </div>

//         <div class="checklist-row">
//           <span>Other</span>
//           <div class="long-input"></div>
//           <div class="check-box"></div>
//         </div>

//         <div class="fall-prot-row">
//           <span>Fall Protection Required</span>
//           <div class="yes-no-group">
//             <div class="check-box"></div> YES
//             <div class="check-box"></div> NO
//           </div>
//         </div>

//         <!-- Incomplete -->
//         <div class="section-bar">Check Incomplete Items</div>

//         <div class="items-grid">
//           <div class="grid-item">Handrails <div class="grid-check"></div></div>
//           <div class="grid-item">Platform <div class="grid-check"></div></div>
//           <div class="grid-item">Mid Rails <div class="grid-check"></div></div>
//           <div class="grid-item">Ladder <div class="grid-check"></div></div>
//           <div class="grid-item">Toe Boards <div class="grid-check"></div></div>
//         </div>

//         <div class="checklist-row">
//           <span>Other</span>
//           <div class="long-input"></div>
//         </div>

//         <!-- Footer -->
//         <div class="footer">
//           <div class="footer-title">Contact Person Details</div>

//           <div class="footer-content">
//             <div class="contact-block">
//               <div class="contact-row">
//                 <div>
//                   <div class="contact-label">Name</div>
//                   <div class="contact-value">${data.clientName}</div>
//                 </div>
//               </div>

//               <div class="contact-row">
//                 <div>
//                   <div class="contact-label">Mobile Number</div>
//                   <div class="contact-value">${data.clientMobile}</div>
//                 </div>
//               </div>
//             </div>

//             <div class="qr-wrapper">
//               <div class="qr-box">
//                 <img src="${data.qrCode}" />
//               </div>
//               <div class="qr-text">
//                 Scan the QR code for more details and updates.
//               </div>
//             </div>
//           </div>
//         </div>

//       </div>
//     </div>
//   </body>
// </html>out`;
// }


export const yellowpdfTemplate = (data: any,) => {

  return `
  <!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>SCAFF SNAPP - Yellow Scaffold Tag</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --safety-yellow: #fcee21;
        --safety-black: #000;
        --input-white: rgba(255, 255, 255, 0.4);
        --note-bg: rgba(219, 234, 254, 0.6);
        --note-border: #60a5fa;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: "Inter", sans-serif;
        background-color: #d1d5db;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 20px;
      }

      .tag-container {
        width: 100%;
        max-width: 420px;
        background-color: transparent;
        border: 1px solid var(--safety-black);
        border-radius: 30px;
        position: relative;
        padding: 24px 20px 16px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }

      /* Decorative Corners */
      .tag-container::before,
      .tag-container::after {
        content: "";
        position: absolute;
        width: 30px;
        height: 30px;
        border-style: solid;
        border-color: rgba(0, 0, 0, 0.1);
        pointer-events: none;
      }

      .tag-container::before {
        top: 0;
        left: 0;
        border-width: 1px 0 0 1px;
        border-top-left-radius: 30px;
      }

      .tag-container::after {
        top: 0;
        right: 0;
        border-width: 1px 1px 0 0;
        border-top-right-radius: 30px;
      }

      .header-title {
        text-align: center;
        font-weight: 700;
        font-size: 20px;
        letter-spacing: 0.05em;
        margin-bottom: 12px;
      }

      .caution-banner {
        background-color: var(--safety-black);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 2px;
        margin-bottom: 12px;
      }

      .caution-icon {
        width: 36px;
        height: 36px;
        fill: black;
      }

      .caution-text {
        font-weight: 750;
        font-size: 36px;
        letter-spacing: -0.02em;
      }

      .subheader {
        text-align: center;
        font-weight: 700;
        font-size: 24px;
        margin-bottom: 12px;
      }

      .id-box {
        border: 1.5px solid var(--safety-black);
        border-radius: 2px;
        padding: 8px;
        text-align: center;
        margin-bottom: 5px;
      }

      .id-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .id-value {
        font-weight: 700;
        font-size: 24px;
      }

      .field {
        border-bottom: 1.5px solid var(--safety-black);
        padding-bottom: 2px;
        margin-bottom: 12px;
      }

      .field-label {
        font-size: 10px;
        font-weight: 700;
        display: block;
      }

      .field-value {
        font-weight: 700;
        font-size: 15px;
        line-height: 1.2;
      }

      .flex-row {
        display: flex;
        gap: 16px;
      }

      .flex-1 {
        flex: 1;
      }

      .section-bar {
        background-color: var(--safety-black);
        color: white;
        text-align: center;
        font-weight: 700;
        font-size: 16px;
        padding: 6px;
        text-transform: uppercase;
        margin: 8px 0;
      }

      /* .section-bar-footer {
            width: 65%;
        } */

      .checklist-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 6px 0;
        font-weight: 700;
        font-size: 13px;
      }

      .date-section {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 6px;
        font-size: 10px;
        margin-bottom: 8px;
      }

.check-box {
    width: 32px;
    height: 32px;
    border: 2px solid #000;
    position: relative;
    background: #fff;
}

.check-box.checked::after {
    content: "";
    position: absolute;
    left: 8px;
    top: 2px;
    width: 10px;
    height: 18px;
    border: solid #000;
    border-width: 0 3px 3px 0;
    transform: rotate(45deg);
}

      .check-box.small {
        width: 24px;
        height: 24px;
      }

      .note-box {
        /* background-color: var(--note-bg); */
        /* border: 1px solid var(--note-border); */
        /* padding: 8px; */
        border-radius: 2px;
        font-size: 13px;
        line-height: 1.3;
        margin: 8px 0;
        display: flex;
        gap: 8px;
      }

      .note-tag {
        font-weight: 700;
      }

      .input-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin: 8px 0;
      }

      .input-line {
        flex: 1;
        border-bottom: 1px solid var(--safety-black);
        height: 20px;
      }

      .yes-no {
        display: flex;
        gap: 16px;
      }

      .yes-no-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 800;
      }

      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-top: 10px;
      }

      .grid-item {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
      }

      .footer {
        margin-top: 12px;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        padding: 8px 0 4px;
      }

      .contact-item {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }

      .icon-circle {
        background-color: var(--safety-black);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .icon-circle svg {
        width: 18px;
        height: 18px;
        stroke: white;
      }

      .contact-label {
        font-size: 9px;
        font-weight: 700;
        opacity: 0.7;
      }

      .contact-value {
        font-weight: 700;
        font-size: 14px;
      }

      .qr-section-container {
        display: flex;
        flex-direction: row;
        /* align-items: center; */
        width: 100%;
      }

      .qr-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 120px;
        margin-top: 20px;
        margin-left: 18px;
      }

      .qr-code {
        background-color: white;
        padding: 6px;
        border: 1px solid var(--tag-black);
        width: 120px;
        height: 120px;
        box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.1);
      }

      .qr-code img {
        width: 100%;
        height: 100%;
      }

      .qr-text {
        font-size: 8px;
        font-weight: 700;
        text-align: center;
        margin-top: 8px;
        line-height: 1.2;
        opacity: 0.8;
      }
    </style>
  </head>

  <body>
    <div class="tag-container" id="tag">
      <h1 class="header-title">SCAFF SNAPP</h1>

      <div class="caution-banner">
        <svg
          class="caution-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path
            d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
          />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
        <span class="caution-text">CAUTION</span>
      </div>

      <h2 class="subheader">INCOMPLETE SCAFFOLD</h2>

      <div class="id-box">
        <div class="id-label">Scaffold ID:</div>

        <div class="id-value">${data.SCAFFID}</div>
      </div>
      <div class="date-section">
        <span>Date</span>
        <span style="font-weight: 700">${data.createdAt}</span>
      </div>
      <div class="field">
        <span class="field-label">Project Name</span>
        <div class="field-value">${data.projectName}</div>
      </div>

      <div class="field">
        <span class="field-label">Company Name</span>
        <div class="field-value">${data.companyName}</div>
      </div>

      <div class="flex-row">
        <div class="field flex-1">
          <span class="field-label">Company ID</span>
          <div class="field-value">${data.CMPID}</div>
        </div>
        <div class="field flex-1">
          <span class="field-label">Project ID</span>
          <div class="field-value">${data.PJT}</div>
        </div>
      </div>

      <div class="field">
        <span class="field-label">Location</span>
        <div class="field-value">${data.address}</div>
      </div>

<div class="section-bar">Loading Schedule</div>
${data.lightDuty ? `
<div class="checklist-item">
    <span>Light Duty (25 LBS SQ FT)</span>

 <img 
  src="https://www.svgrepo.com/show/443815/gui-form-checkbox-checked.svg"
  style="
    width:32px;
    height:32px;
    object-fit:contain;
  "
  alt="checked"
/>
</div>
` : ``}

${data.mediumDuty ? `
<div class="checklist-item">
    <span>Medium Duty (50 LBS SQ FT)</span>

  <img 
  src="https://www.svgrepo.com/show/443815/gui-form-checkbox-checked.svg"
  style="
    width:32px;
    height:32px;
    object-fit:contain;
  "
  alt="checked"
/>
</div>
` : ``}

${data.heavyDuty ? `
<div class="checklist-item">
    <span>Heavy Duty (75 LBS SQ FT)</span>

 <img 
  src="https://www.svgrepo.com/show/443815/gui-form-checkbox-checked.svg"
  style="
    width:32px;
    height:32px;
    object-fit:contain;
  "
  alt="checked"
/>
</div>
` : ``}
      <div class="note-box">
        <span class="note-tag">Note:</span>
        <span
          >Loose planking noticed on the west side platform. Marked and reported
          for immediate repair.</span
        >
      </div>

      <div class="checklist-item">
        <span>See Engineering Drawing</span>
        <div class="check-box"></div>
      </div>

      <div class="input-row">
        <span style="font-weight: 700; font-size: 13px">Other</span>
        <div class="input-line"></div>
        <div class="check-box"></div>
      </div>

      <div class="checklist-item" style="padding-top: 4px">
        <span>Fall Protection Required</span>
        <div class="yes-no">
          <div class="yes-no-item">
            <div class="check-box small"></div>
            YES
          </div>
          <div class="yes-no-item">
            <div
              class="check-box small"
              style="background-color: rgba(255, 255, 255, 0.8)"
            ></div>
            NO
          </div>
        </div>
      </div>

      <div class="section-bar">Check Incomplete Items</div>

      <div class="grid-3">
        <div class="grid-item">
          <div class="check-box small"></div>
          <span>Handrails</span>
        </div>
        <div class="grid-item">
          <div class="check-box small"></div>
          <span>Platform</span>
        </div>
        <div class="grid-item">
          <div class="check-box small"></div>
          <span>Mid Rails</span>
        </div>
        <div class="grid-item">
          <div class="check-box small"></div>
          <span>Ladder</span>
        </div>
        <div class="grid-item">
          <div class="check-box small"></div>
          <span>Toe Boards</span>
        </div>
      </div>

      <div class="input-row">
        <span style="font-weight: 700; font-size: 11px">Other</span>
        <div class="input-line"></div>
      </div>

      <div class="qr-section-container">
        <div class="footer">
          <div class="section-bar section-bar-footer">
            Contact Person Details
          </div>
          <div class="footer-content">
            <div class="contact-info">
              <div class="contact-item">
                <div class="icon-circle">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <div class="contact-label">Name</div>
                  <div class="contact-value">${data.clientName}</div>
                </div>
              </div>
              <div class="contact-item">
                <div class="icon-circle">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path
                      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l2.27-2.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
                    />
                  </svg>
                </div>
                <div>
                  <div class="contact-label">Mobile Number</div>
                  <div class="contact-value">${data.clientMobile}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="qr-section">
          <div class="qr-code">
            <img src="${data.qrCode}" alt="QR Code">
          </div>
          <div class="qr-text">
            Scan the QR code for more details and updates.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
`;
}
