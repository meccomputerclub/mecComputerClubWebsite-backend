// src/services/emailTemplates.ts

export type EmailType =
  | "invitation"
  | "rejection"
  | "passwordReset"
  | "emailVerification"
  | "status"
  | "adminMailForMemberRegistration";

interface EmailData {
  userName?: string;
  code?: string;
  link?: string;
  expiresIn?: string;
  status?: "Approved" | "Rejected";
  dashboardLink?: string;
  contactLink?: string;
  clubName?: string;
  extraMessage?: string;
  department?: string;
  batch?: string;
  session?: string;
  studentId?: string;
  contactNumber?: string;
  registrationDate?: string;
  userImageUrl?: string;
  email?: string;
}

function getStyle() {
  return `
  <style type="text/css">
      /* --- 1. FONTS & RESETS --- */
      @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Courier+Prime:wght@700&display=swap");

      body,
      table,
      td,
      a {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      table,
      td {
        mso-table-lspace: 0pt;
        mso-table-rspace: 0pt;
      }
      img {
        -ms-interpolation-mode: bicubic;
        border: 0;
        height: auto;
        line-height: 100%;
        outline: none;
        text-decoration: none;
        display: block;
      }
      table {
        border-collapse: collapse !important;
      }

      /* --- 2. BASE LAYOUT CLASSES --- */
      body {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        font-family: "Inter", Helvetica, Arial, sans-serif;
        background-color: #f3f4f6;
        color: #333333;
      }

      .preheader {
        display: none;
        font-size: 1px;
        color: #fefefe;
        line-height: 1px;
        max-height: 0px;
        max-width: 0px;
        opacity: 0;
        overflow: hidden;
      }

      .main-wrapper {
        background-color: #f3f4f6;
        width: 100%;
      }

      .main-cell {
        padding: 40px 10px;
      }

      .card-container {
        max-width: 600px;
        width: 100%;
      }

      /* --- 3. CARD COMPONENT --- */
      .card {
        background-color: #ffffff;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        overflow: hidden;
      }

      .banner-img {
        width: 100%;
        max-width: 600px;
        height: auto;
        display: block;
      }

      .content-padding {
        padding: 40px 48px;
      }

      /* --- 4. TYPOGRAPHY --- */
      .header-text {
        margin: 0 0 16px;
        font-size: 26px;
        font-weight: 700;
        color: #002e5b;
        font-family: "Inter", sans-serif;
      }

      .body-text {
        margin: 0 0 24px;
        font-size: 16px;
        line-height: 1.6;
        color: #4b5563;
      }

      /* --- 5. OTP BOX COMPONENT --- */
      .otp-container {
        background-color: #fdf8f3;
        border: 2px dashed #f58a1f;
        border-radius: 12px;
        padding: 20px 0;
        width: 100%;
        max-width: 320px;
        text-align: center;
      }

      .otp-label {
        display: block;
        font-size: 12px;
        text-transform: uppercase;
        color: #888888;
        margin-bottom: 5px;
        font-weight: 600;
      }

      .otp-value {
        font-family: "Courier Prime", "Courier New", monospace;
        font-size: 32px;
        font-weight: 700;
        letter-spacing: 8px;
        color: #002e5b;
      }

      /* --- 6. BUTTON COMPONENT --- */
      .btn-primary {
        background-color: #002e5b;
        border-radius: 8px;
        color: #ffffff;
        display: inline-block;
        font-family: "Inter", Helvetica, Arial, sans-serif;
        font-size: 16px;
        font-weight: 600;
        line-height: 54px;
        text-align: center;
        text-decoration: none;
        width: 100%;
        max-width: 260px;
        -webkit-text-size-adjust: none;
        box-shadow: 0 4px 6px rgba(0, 46, 91, 0.2);
      }

      /* --- 7. WARNING / EXPIRATION BOX --- */
      .warning-box {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: #6b7280;
        background-color: #f9fafb;
        padding: 8px 12px;
        border-radius: 6px;
        display: inline-block;
      }

      /* --- 8. FOOTER --- */
      .footer-cell {
        padding-top: 30px;
      }

      .footer-copy {
        margin: 0 0 10px;
        font-size: 14px;
        color: #9ca3af;
      }

      .footer-links-container {
        margin-top: 10px;
      }

      .footer-link {
        color: #002e5b;
        text-decoration: none;
        margin: 0 10px;
        font-size: 12px;
      }

      .footer-separator {
        color: #cccccc;
      }

      /* --- 9. MEDIA QUERIES (MOBILE) --- */
      @media screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
        }
        .content-padding {
          padding: 24px 20px !important;
        }
        .header-text {
          font-size: 24px !important;
        }
        .otp-value {
          font-size: 26px !important;
          letter-spacing: 6px !important;
        }
        .banner-img {
          border-radius: 12px 12px 0 0 !important;
        }
        .card {
          border-radius: 12px !important;
        }
      }

      /* --- 10. DARK MODE --- */
      @media (prefers-color-scheme: dark) {
        body,
        .main-wrapper {
          background-color: #121212 !important;
        }
        .card {
          background-color: #1e1e1e !important;
          border: 1px solid #333333 !important;
        }
        .header-text,
        .text-primary {
          color: #ffffff !important;
        }
        .body-text,
        .text-secondary {
          color: #b0b0b0 !important;
        }
        .otp-container {
          background-color: #2c2c2c !important;
          border: 1px solid #444444 !important;
        }
        .otp-value {
          color: #f58a1f !important;
        }
        .footer-copy {
          color: #666666 !important;
        }
        .btn-primary {
          background-color: #f58a1f !important;
          color: #002e5b !important;
        }
        .warning-box {
          background-color: #2c2c2c !important;
          color: #b0b0b0 !important;
        }
        .footer-link {
          color: #9ca3af !important;
        }
      }
    </style>`;
}

function getHeader() {
  return `<table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td width="100%">
          <img
            src="https://res.cloudinary.com/dj1sjgitq/image/upload/v1768389923/uploads/club_logo/email_banner_lxbsq9.png"
            alt="Welcome to MEC Computer Club"
            class="banner-img"
          />
        </td>
      </tr>
    </table>`;
}

function getFooter() {
  return `<tr>
    <td align="center" class="footer-cell">
      <p class="footer-copy">
        &copy; 2025 MEC Computer Club.
        <br />
        Mymensingh Engineering College
      </p>
      <div class="footer-links-container">
        <a href="https://www.meccomputerclub.org/" class="footer-link">
          Website
        </a>
        <span class="footer-separator">|</span>
        <a href="https://www.meccomputerclub.org/contact-us" class="footer-link">
          Support
        </a>
      </div>
    </td>
  </tr>`;
}

export function generateEmail(type: EmailType, data: EmailData) {
  const clubName = data.clubName || "MEC Computer Club";

  switch (type) {
    case "invitation":
      return `
      <!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Invitation Code - MEC Computer Club</title>

    ${getStyle()}
  </head>

  <body>
    <div class="preheader">
      Your MEC Computer Club invitation code is ${data.code}. Valid for 30 minutes.
    </div>

    <table border="0" cellpadding="0" cellspacing="0" class="main-wrapper">
      <tr>
        <td align="center" class="main-cell">
          <table border="0" cellpadding="0" cellspacing="0" class="card-container">
            <tr>
              <td align="center" class="card">
                ${getHeader()}

                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="content-padding">
                      <h1 class="header-text">Invitation Code for ${clubName}</h1>

                      <p class="body-text">
                        <strong>Hi ${data.userName ?? "Dear"},</strong> <br>
                       Great news! We've reviewed your application and are thrilled to welcome you to the
                        <strong>MEC Computer Club</strong> community! To make it official, we have generated an unique invitation code for you to create your account on our web portal.
                      </p>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 24px">
                            <div class="otp-container">
                              <span class="otp-label">Your Code</span>
                              <span class="otp-value">${data.code}</span>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 24px">
                            <a href="${data.link ?? "#"}" target="_blank" class="btn-primary">
                              Go to Registration Page
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <p class="warning-box">
                              ⏰ Valid for <strong>7 Days</strong> only.
                            </p>

                            <p class="body-text" style="text-align: left ; margin-top: 24px">We can't wait to see what you'll build with us!</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${getFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    case "rejection":
      return `
      <!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Update Regarding Your Application to MEC Computer Club</title>

    ${getStyle()}
  </head>

  <body>
    <div class="preheader">
      Update Regarding Your Application to MEC Computer Club
    </div>

    <table border="0" cellpadding="0" cellspacing="0" class="main-wrapper">
      <tr>
        <td align="center" class="main-cell">
          <table border="0" cellpadding="0" cellspacing="0" class="card-container">
            <tr>
              <td align="center" class="card">
                ${getHeader()}

                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="content-padding">
                      <h1 class="header-text">Update Regarding Your Application to MEC Computer Club</h1>

                      <p class="body-text">
                        <strong>Hi ${data.userName},</strong> <br>
                       Thank you for your interest in the
                        <strong>MEC Computer Club</strong> and for taking the time to apply for membership. We appreciate your enthusiasm.
                      </p>

                      <p class="body-text">
                        After careful review of all applications, we are unfortunately unable to move forward with your membership at this time. Due to the high volume of interest and limited capacity, the selection process was highly competitive.
                      </p>

                      <p class="body-text">
                        We encourage you to stay engaged with our club activities and feel free to apply again in the future. Your interest and enthusiasm are highly appreciated. 
                      </p>

                      <p class="body-text">
                      If you have any questions regarding the application process, please feel free to reach out to our administration team:
                        
                      </p>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 24px">
                            <a href="{{verification_link}}" target="_blank" class="btn-primary">
                              Contact Administration
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <p class="body-text" style="text-align: left ; margin-top: 24px">We wish you the best of luck in your future endeavors!  </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${getFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    case "passwordReset":
      return `
      <!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Reset Password - MEC Computer Club</title>

    ${getStyle()}
  </head>

  <body>
    <div class="preheader">
      Your MEC Computer Club password reset code is ${data.code}. Valid for 30 minutes.
    </div>

    <table border="0" cellpadding="0" cellspacing="0" class="main-wrapper">
      <tr>
        <td align="center" class="main-cell">
          <table border="0" cellpadding="0" cellspacing="0" class="card-container">
            <tr>
              <td align="center" class="card">
                ${getHeader()}

                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="content-padding">
                      <h1 class="header-text">Password Reset Link - MEC Computer Club</h1>

                      <p class="body-text">
                        <strong>Hi ${data.userName},</strong> <br>
                        We received a request to reset your password for your account associated with this email address. You can use the code below to reset your password.
                      </p>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 24px">
                            <div class="otp-container">
                              <span class="otp-label">Your Code</span>
                              <span class="otp-value">${data.code}</span>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <p class = "body-text">
                      Or you can click the button below to reset your password
                      </p>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 24px">
                            <a href="${data.link}" target="_blank" class="btn-primary">
                              Reset Password
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <p class="warning-box">
                              ⏰ Valid for <strong>30 minutes</strong> only.
                            </p>

                            <p class="body-text" style="text-align: left ; margin-top: 24px">If you did not request a password reset, please ignore this email.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${getFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    case "emailVerification":
      return `
      <!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Email Verification - MEC Computer Club</title>

    ${getStyle()}
  </head>

  <body>
    <div class="preheader">
      Your MEC Computer Club Email Verification code is ${data.code}. Valid for 30 minutes.
    </div>

    <table border="0" cellpadding="0" cellspacing="0" class="main-wrapper">
      <tr>
        <td align="center" class="main-cell">
          <table border="0" cellpadding="0" cellspacing="0" class="card-container">
            <tr>
              <td align="center" class="card">
                ${getHeader()}

                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="content-padding">
                      <h1 class="header-text">Email Verification Code for ${clubName}</h1>

                      <p class="body-text">
                        <strong>Hi ${data.userName},</strong> <br>
                        Thank you for registering with the <strong>MEC Computer Club</strong>. To complete your registration, please use the verification code below:
                      </p>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 24px">
                            <div class="otp-container">
                              <span class="otp-label">Your Code</span>
                              <span class="otp-value">${data.code}</span>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <p class = "body-text">
                      Or you can click the button below to complete your registration
                      </p>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 24px; color: #ffffff">
                            <a href="${data.link}" target="_blank" class="btn-primary">
                              Verify Email
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <p class="warning-box">
                              ⏰ Valid for <strong>30 minutes</strong> only.
                            </p>

                            <p class="body-text" style="text-align: left ; margin-top: 24px">If you did not request an email verification, please ignore this email.</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${getFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    case "status":
      return `
      <!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Registration Status - MEC Computer Club</title>

    ${getStyle()}
  </head>

  <body>
    <div class="preheader">
      Update Regarding Your Registration to MEC Computer Club.
    </div>

    <table border="0" cellpadding="0" cellspacing="0" class="main-wrapper">
      <tr>
        <td align="center" class="main-cell">
          <table border="0" cellpadding="0" cellspacing="0" class="card-container">
            <tr>
              <td align="center" class="card">
                ${getHeader()}

                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="content-padding">
                      <h1 class="header-text">Registration Status for ${clubName}</h1>

                      <p class="body-text">
                        <strong>Hi ${data.userName},</strong> <br>
                       We are delighted to inform you about the status of your registration with the
                        <strong>MEC Computer Club</strong>. After careful consideration, we decidede to ${
                          data.status
                        } your Registration. 
                      </p>

                      <p class="body-text">
                        Please visit the website to access your dashboard and explore the resources available to you.
                      </p>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center" style="padding-bottom: 24px">
                            <a href="https://meccomputerclub.org" target="_blank" class="btn-primary">
                              Visit MEC Computer Club
                            </a>
                          </td>
                        </tr>
                      </table>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <p class="body-text" style="text-align: left ; margin-top: 24px">Stay focused on your goals and keep up the good work! </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${getFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    case "adminMailForMemberRegistration":
      return `
      <!DOCTYPE html>
<html
  lang="en"
  xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <title>Review New Member Registration - MEC Computer Club</title>

    ${getStyle()}
  </head>

  <body>
    <div class="preheader">
      Review New Member Registration to MEC Computer Club.
    </div>

    <table border="0" cellpadding="0" cellspacing="0" class="main-wrapper">
      <tr>
        <td align="center" class="main-cell">
          <table border="0" cellpadding="0" cellspacing="0" class="card-container">
            <tr>
              <td align="center" class="card">
                ${getHeader()}

                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td class="content-padding">
                      <h1 class="header-text">Review New Member Registration</h1>

                      <p class="body-text">
                        <strong>Hi Admin,</strong> <br>
                        A new member has registered with the <strong>MEC Computer Club</strong>. Please review their application and take the necessary actions.
                      </p>

                      <div
                        style="
                          font-family: Arial, sans-serif;
                          max-width: 400px;
                          margin: 20px auto;
                          border: 1px solid #e0e0e0;
                          border-radius: 12px;
                          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                          background-color: #ffffff;
                          overflow: hidden;
                        "
                      >
                        <div
                          style="
                            background-color: #004d99;
                            color: white;
                            padding: 15px 20px;
                            text-align: center;
                            border-top-left-radius: 12px;
                            border-top-right-radius: 12px;
                          "
                        >
                          
                          <p style="margin: 5px 0 0; font-size: 18px; font-weight: bold">New Member Info</p>
                        </div>

                        <div
                          style="
                            text-align: center;
                            padding: 10px 20px;
                            display: flex;
                            align-items: center;
                          "
                        >
                          <img
                            src=${data.userImageUrl}
                            alt="Member Photo"
                            style="
                              width: 100px;
                              height: 100px;
                              border-radius: 50%;
                              border: 3px solid #004d99;
                              object-fit: cover;
                            "
                          />
                          <div style="padding-left: 16px; text-align: left">
                            <h4
                              style="
                                color: #333333;
                                font-size: 22px;
                                margin: 0px;
                                margin-bottom: 8px;
                              "
                            >
                              ${data.userName || "[Applicant's Name]"}
                            </h4>
                            <a
                              href="mailto:${data.email || "[Applicant's Email]"}"
                              style="
                                color: #004d99;
                                text-decoration: none;
                                font-size: 16px;
                                margin: 0px;
                              "
                            >
                              ${data.email || "[Applicant's Email]"}
                            </a>
                          </div>
                        </div>

                        <div style="padding: 10px 25px 20px">
                          <table style="width: 100%; border-collapse: collapse">
                            <tr>
                              <td style="padding: 8px 0; font-weight: bold; color: #555555; width: 35%">Department:</td>
                              <td style="padding: 8px 0; color: #004d99; font-weight: 600">${
                                data.department || "[Applicant's Department]"
                              }</td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-weight: bold; color: #555555">Batch:</td>
                              <td style="padding: 8px 0">
                                ${data.batch || "[Applicant's Batch]"}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-weight: bold; color: #555555">Session:</td>
                              <td style="padding: 8px 0">
                                ${data.session || "[Applicant's session]"}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-weight: bold; color: #555555">Student ID:</td>
                              <td style="padding: 8px 0">
                                ${data.studentId || "[Applicant's Student ID]"}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 8px 0; font-weight: bold; color: #555555">Contact Number:</td>
                              <td style="padding: 8px 0">
                                ${data.contactNumber || "[Applicant's Student ID]"}
                              </td>
                            </tr>
                          </table>
                        </div>

                        <div style="text-align: center; padding: 0 25px 20px">
                          <a
                            href="[Link to Review Application]"
                            target="_blank"
                            style="
                              display: inline-block;
                              padding: 12px 25px;
                              background-color: #28a745;
                              color: white;
                              text-decoration: none;
                              border-radius: 8px;
                              font-weight: bold;
                              font-size: 16px;
                              transition: background-color 0.3s;
                            "
                          >
                            Review Application
                          </a>
                        </div>

                        <div
                          style="
                            background-color: #f7f7f7;
                            padding: 10px 20px;
                            text-align: center;
                            font-size: 12px;
                            color: #888888;
                            border-bottom-left-radius: 12px;
                            border-bottom-right-radius: 12px;
                          "
                        >
                          Please review and approve the details above.
                        </div>
                      </div>

                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <p class="body-text" style="text-align: left ; margin-top: 24px">Stay Energized! Our Community is uprising! 🚀 </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${getFooter()}
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

    default:
      return `<p>Invalid email type</p>`;
  }
}

// const html1 = generateEmail("invitation", {
//   userName: "Nasir",
//   code: "734484",
//   link: "https://www.meccomputerclub.org/register",
// });

// console.log(html1);

// const html2 = generateEmail("rejection", {
//   userName: "Nasir",
//   link: "https://www.meccomputerclub.org/contact-us",
// });

// console.log(html2);

// const html3 = generateEmail("passwordReset", {
//   userName: "Nasir",
//   code: "734484",
//   link: "https://www.meccomputerclub.org/reset-password",
// });

// console.log(html3);

// const html4 = generateEmail("emailVerification", {
//   userName: "Nasir",
//   code: "734484",
//   link: "https://www.meccomputerclub.org/verify-email",
// });
// console.log(html4);

// const html5 = generateEmail("status", {
//   userName: "Nasir",
//   status: "Approved",
//   link: "https://www.meccomputerclub.org/dashboard",
// });
// console.log(html5);

// const html6 = generateEmail("adminMailForMemberRegistration", {
//   userImageUrl: "https://via.placeholder.com/100",
//   userName: "John Doe",
//   department: "Computer Science",
//   batch: "2023",
//   session: "2023-2024",
//   studentId: "123456",
//   contactNumber: "1234567890",
//   registrationDate: new Date().toLocaleDateString(),
//   link: "https://www.meccomputerclub.org/register",
// });

// console.log(html6);
