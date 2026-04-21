"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.yellowpdfTemplate = exports.greenpdfTemplate = exports.otpTemplate = exports.teamMemberAddTemplate = exports.companyAddTemplate = exports.companyStatusTemplate = void 0;
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
const greenpdfTemplate = (data) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scaffold Tag</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { 
            margin: 0;
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .striped-bar {
            background: repeating-linear-gradient(-45deg, #009B4D, #009B4D 8px, #ffffff 8px, #ffffff 16px);
        }
    </style>
</head>
<body>
    <div class="min-h-screen flex items-center justify-center p-2 sm:p-4">
        <!-- Main Card Container -->
        <div class="relative w-full max-w-[400px] aspect-[400/900]">
            
            <!-- SVG Background -->
            <svg class="absolute inset-0 w-full h-full drop-shadow-2xl" viewBox="0 0 100 200" preserveAspectRatio="none">
                <!-- Green Background Shape -->
                <path d="M 6 0 L 94 0 L 100 6 L 100 192 Q 100 200 92 200 L 8 200 Q 0 200 0 192 L 0 6 Z" fill="#009B4D" />
                <!-- Inset White Border -->
                <path d="M 8 3 L 92 3 L 97 8 L 97 190 Q 97 197 90 197 L 10 197 Q 3 197 3 190 L 3 8 Z" fill="none" stroke="white" stroke-width="0.8" />
            </svg>

            <!-- Content Layer -->
            <div class="absolute inset-0 px-6 py-6 flex flex-col h-full text-white">
                
                <!-- Header -->
                <div class="text-center flex flex-col items-center">
                    <h3 class="font-bold text-sm tracking-widest uppercase mb-3">Scaff Snapp</h3>
                    
                    <div class="bg-white w-full rounded-md py-1 px-2 flex items-center justify-center gap-3 mb-2 shadow-sm">
                        <div class="relative">
                            <div class="w-8 h-8 rounded-full border-[3px] border-[#009B4D] flex items-center justify-center">
                                <!-- Check Icon -->
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#009B4D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                            </div>
                        </div>
                        <h1 class="text-[#009B4D] text-4xl font-black tracking-wider uppercase m-0 leading-none">Released</h1>
                    </div>

                    <h2 class="font-bold text-lg tracking-wide uppercase leading-tight mt-1 text-center">
                        Scaffold Released for<br>Access
                    </h2>
                </div>

                <!-- Scaffold ID Section -->
                <div class="my-5 w-full">
                  <img src="https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/Frame+2087325397+(2).png" 
     alt="Striped Bar" class="h-3 w-full object-cover" />
                    <div class="text-center py-1">
                        <p class="text-xs font-medium opacity-90 m-0">Scaffold ID:</p>
                        <p class="text-xl font-bold tracking-wide m-0">${data.SCAFFID}</p>
                    </div>
                   <img src="https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/Frame+2087325397+(2).png" 
     alt="Striped Bar" class="h-3 w-full object-cover" />
                </div>

                <!-- Fields -->
                <div class="space-y-1 w-full">
                    <div class="mb-3 w-full">
                        <p class="text-[10px] font-medium opacity-90 mb-0.5 m-0">Project Name</p>
                        <p class="text-sm font-bold leading-tight m-0">${data.projectName}</p>
                        <div class="h-[1.5px] bg-white w-full mt-1"></div>
                    </div>
                    <div class="mb-3 w-full">
                        <p class="text-[10px] font-medium opacity-90 mb-0.5 m-0">Company Name</p>
                        <p class="text-sm font-bold leading-tight m-0">${data.companyName}</p>
                        <div class="h-[1.5px] bg-white w-full mt-1"></div>
                    </div>
                    <div class="mb-3 w-full">
                        <p class="text-[10px] font-medium opacity-90 mb-0.5 m-0">Company ID</p>
                        <p class="text-sm font-bold leading-tight m-0">${data.CMPId}</p>
                        <div class="h-[1.5px] bg-white w-full mt-1"></div>
                    </div>
                    <div class="mb-3 w-full">
                        <p class="text-[10px] font-medium opacity-90 mb-0.5 m-0">Location</p>
                        <p class="text-sm font-bold leading-tight m-0">${data.address}, California</p>
                        <div class="h-[1.5px] bg-white w-full mt-1"></div>
                    </div>
                    <div class="mb-3 w-full">
                        <p class="text-[10px] font-medium opacity-90 mb-0.5 m-0">Date of Erection</p>
                        <p class="text-sm font-bold leading-tight m-0">${data.endDate}</p>
                        <div class="h-[1.5px] bg-white w-full mt-1"></div>
                    </div>
                </div>

                <!-- Loading Rating -->
                <div class="mt-4 w-full">
                    <div class="bg-white text-[#009B4D] text-center font-bold text-sm py-0.5 mb-2">
                        Loading Rating
                    </div>
                    <div class="space-y-1.5 px-0">
                        <div class="flex items-center justify-between">
                            <div class="flex justify-between w-full pr-4">
                                <span class="text-xs font-bold">Light Duty</span>
                                <span class="text-xs font-bold">(25 LBS SQ FT)</span>
                            </div>
                            <div class="w-6 h-5 bg-white rounded-[2px]"></div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex justify-between w-full pr-4">
                                <span class="text-xs font-bold">Medium Duty</span>
                                <span class="text-xs font-bold">(25 LBS SQ FT)</span>
                            </div>
                            <div class="w-6 h-5 bg-white rounded-[2px]"></div>
                        </div>
                        <div class="flex items-center justify-between">
                            <div class="flex justify-between w-full pr-4">
                                <span class="text-xs font-bold">Heavy Duty</span>
                                <span class="text-xs font-bold">(25 LBS SQ FT)</span>
                            </div>
                            <div class="w-6 h-5 bg-white rounded-[2px]"></div>
                        </div>
                        <div class="flex items-center justify-between pt-1">
                            <span class="text-xs font-bold">See Engineering Drawing</span>
                            <div class="w-6 h-5 bg-white rounded-[2px]"></div>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div class="mt-auto w-full pt-4">
                    <div class="bg-white text-[#009B4D] text-center font-bold text-sm py-0.5 mb-3">
                        Contact Person Details
                    </div>
                    
                    <div class="flex justify-between  pb-2">
                        <div class=" flex-1 ">
                            <div class="flex items-start mt-[20px] gap-3">
                                <!-- User Icon -->
                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5">
                                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="12" cy="7" r="4"></circle>
                                </svg>
                                <div class="leading-tight">
                                    <p class="text-[9px] opacity-80 uppercase tracking-wide m-0">Name</p>
                                    <p class="font-bold text-sm m-0">${data.clientName}</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3">
                                <!-- Phone Icon -->
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mt-0.5">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <div class="leading-tight">
                                    <p class="text-[9px] opacity-80 uppercase tracking-wide m-0">Mobile Number</p>
                                    <p class="font-bold text-lg m-0">${data.clientMobile}</p>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col m-4 items-center w-[85px]">
                            <div class="w-[85px] h-[85px] bg-white p-1">
                                <!-- QR Code Image -->
                                <img src="${data.qrCode}" alt="QR Code" class="w-full h-full object-cover" />
                            </div>
                            <p class="text-[6.5px] text-center mt-1 leading-tight opacity-90 px-1 m-0">
                                Scan the QR code for more details and updates.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</body>
</html>
`;
};
exports.greenpdfTemplate = greenpdfTemplate;
const yellowpdfTemplate = (data) => {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Yellow Scaffold Tag</title>

    <style>
      :root {
        --safety-yellow: #fcee21;
        --safety-black: #000;
        --input-white: #fff;
      }

      body {
        margin: 0;
        font-family: Arial, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: #222;
      }

      .card-container {
        position: relative;
        width: 400px;
        height: 900px;
      }

      .bg-svg {
        position: absolute;
        width: 100%;
        height: 100%;
      }

      .content {
        position: absolute;
        inset: 0;
        padding: 22px 18px;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
      }

      /* Header */
      .header-title {
        text-align: center;
        font-size: 14px;
        font-weight: 800;
      }

      .caution-box {
        background: #000;
        color: #fcee21;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        padding: 6px 0;
        margin-top: 6px;
      }

      .caution-text {
        font-size: 34px;
        font-weight: 900;
      }

      .sub-header {
        text-align: center;
        font-weight: 800;
        margin: 6px 0 10px;
      }

      /* Stripes */
      .hazard-stripe {
        height: 12px;
        background: repeating-linear-gradient(
          -45deg,
          #000,
          #000 10px,
          #fcee21 10px,
          #fcee21 20px
        );
        border-top: 1px solid #000;
        border-bottom: 1px solid #000;
      }

      /* Scaffold ID */
      .scaffold-id-section {
        text-align: center;
        padding: 6px 0;
      }

      .scaffold-label {
        font-size: 10px;
        font-weight: 600;
      }

      .scaffold-value {
        font-size: 20px;
        font-weight: 900;
      }

      /* Fields */
      .field-group {
        margin-top: 8px;
      }

      .field-label {
        font-size: 10px;
        font-weight: 600;
      }

      .field-value {
        font-size: 13px;
        font-weight: 700;
        border-bottom: 1px solid #000;
        margin-bottom: 6px;
      }

      /* Section Bar */
      .section-bar {
        background: #000;
        color: #fcee21;
        text-align: center;
        font-size: 12px;
        font-weight: 800;
        padding: 3px 0;
        margin-top: 10px;
      }

      /* Checklist */
      .checklist-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 11px;
        margin: 8px 0;
        font-weight: 700;
      }

      .checklist-left {
        display: flex;
        justify-content: space-between;
        flex: 1;
        padding-right: 10px;
      }

      .check-box {
        width: 22px;
        height: 16px;
        background: #fff;
        border: 1px solid #000;
      }

      .long-input {
       width:295px;
        height: 16px;
        border: 1px solid #000;
        background: #fff;
        margin-left: 6px;
      }

      .fall-prot-row {
        display: flex;
        justify-content: space-between;
        margin-top: 6px;
        font-size: 11px;
        font-weight: 700;
      }

      .yes-no-group {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      /* Grid */
      .items-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 6px;
        margin-top: 5px;
      }

      .grid-item {
        display: flex;
        justify-content: space-between;
        font-size: 11px;
        font-weight: 700;
      }

      .grid-check {
        width: 18px;
        height: 14px;
        border: 1px solid #000;
        background: #fff;
      }

      /* Footer */
      .footer {
        margin-top: auto;
      }

      .footer-title {
        background: #000;
        color: #fcee21;
        text-align: center;
        font-size: 12px;
        font-weight: 800;
        padding: 3px 0;
        margin-top: 10px;
      }

      .footer-content {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
            margin-left: 15px;
    margin-right: 15px;
      }

      .contact-block {
        flex: 1;
      }

      .contact-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 10px;
      }

      .contact-label {
        font-size: 9px;
      }

      .contact-value {
        font-size: 13px;
        font-weight: 800;
      }

      .qr-wrapper {
        width: 85px;
        text-align: center;
      }

      .qr-box {
        width: 85px;
        height: 85px;
        background: #fff;
        padding: 3px;
      }

      .qr-box img {
        width: 100%;
        height: 100%;
      }

      .qr-text {
        font-size: 7px;
        margin-top: 3px;
        font-weight: 600;
      }
    </style>
  </head>

  <body>
    <div class="card-container">

      <svg class="bg-svg" viewBox="0 0 100 200" preserveAspectRatio="none">
        <path d="M6 0 L94 0 L100 6 L100 192 Q100 200 92 200 L8 200 Q0 200 0 192 L0 6 Z" fill="#FCEE21"/>
        <path d="M5 2 L95 2 L98 5 L98 191 Q98 198 91 198 L9 198 Q2 198 2 191 L2 5 Z"
          fill="none" stroke="#000" stroke-width="0.5"/>
      </svg>

      <div class="content">

        <!-- Header -->
        <div class="header-title">SCAFF SNAPP</div>

        <div class="caution-box">
          <img src="https://scaffholding-bucket-dev.s3.us-east-1.amazonaws.com/Group.png" width="28"/>
          <div class="caution-text">CAUTION</div>
        </div>

        <div class="sub-header">INCOMPLETE SCAFFOLD</div>

        <div class="hazard-stripe"></div>

        <!-- Scaffold -->
        <div class="scaffold-id-section">
          <div class="scaffold-label">Scaffold ID:</div>
          <div class="scaffold-value">${data.SCAFFID}</div>
        </div>

        <div class="hazard-stripe"></div>

        <!-- Fields -->
        <div class="field-group">
          <div class="field-label">Project Name</div>
          <div class="field-value">${data.projectName}</div>

          <div class="field-label">Company Name</div>
          <div class="field-value">${data.companyName}</div>

          <div class="field-label">Company ID</div>
          <div class="field-value">${data.CMPId}</div>

          <div class="field-label">Location</div>
          <div class="field-value">${data.address}</div>

          <div class="field-label">Date of Erection</div>
          <div class="field-value">${data.endDate}</div>
        </div>

        <!-- Loading -->
        <div class="section-bar">Loading Schedule</div>

        <div class="checklist-row">
          <div class="checklist-left">
            <span>Light Duty</span><span>(25 LBS SQ FT)</span>
          </div>
          <div class="check-box"></div>
        </div>

        <div class="checklist-row">
          <div class="checklist-left">
            <span>Medium Duty</span><span>(25 LBS SQ FT)</span>
          </div>
          <div class="check-box"></div>
        </div>

        <div class="checklist-row">
          <div class="checklist-left">
            <span>Heavy Duty</span><span>(25 LBS SQ FT)</span>
          </div>
          <div class="check-box"></div>
        </div>

        <div class="checklist-row">
          <span>See Engineering Drawing</span>
          <div class="check-box"></div>
        </div>

        <div class="checklist-row">
          <span>Other</span>
          <div class="long-input"></div>
          <div class="check-box"></div>
        </div>

        <div class="fall-prot-row">
          <span>Fall Protection Required</span>
          <div class="yes-no-group">
            <div class="check-box"></div> YES
            <div class="check-box"></div> NO
          </div>
        </div>

        <!-- Incomplete -->
        <div class="section-bar">Check Incomplete Items</div>

        <div class="items-grid">
          <div class="grid-item">Handrails <div class="grid-check"></div></div>
          <div class="grid-item">Platform <div class="grid-check"></div></div>
          <div class="grid-item">Mid Rails <div class="grid-check"></div></div>
          <div class="grid-item">Ladder <div class="grid-check"></div></div>
          <div class="grid-item">Toe Boards <div class="grid-check"></div></div>
        </div>

        <div class="checklist-row">
          <span>Other</span>
          <div class="long-input"></div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-title">Contact Person Details</div>

          <div class="footer-content">
            <div class="contact-block">
              <div class="contact-row">
                <div>
                  <div class="contact-label">Name</div>
                  <div class="contact-value">${data.clientName}</div>
                </div>
              </div>

              <div class="contact-row">
                <div>
                  <div class="contact-label">Mobile Number</div>
                  <div class="contact-value">${data.clientMobile}</div>
                </div>
              </div>
            </div>

            <div class="qr-wrapper">
              <div class="qr-box">
                <img src="${data.qrCode}" />
              </div>
              <div class="qr-text">
                Scan the QR code for more details and updates.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </body>
</html>out`;
};
exports.yellowpdfTemplate = yellowpdfTemplate;
