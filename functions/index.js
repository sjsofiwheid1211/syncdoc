const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Gmail 계정 설정 — Firebase 환경변수로 주입
// 배포 전: firebase functions:config:set gmail.user="your@gmail.com" gmail.pass="앱비밀번호"
const gmailUser = functions.config().gmail?.user || process.env.GMAIL_USER;
const gmailPass = functions.config().gmail?.pass || process.env.GMAIL_PASS;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailUser,
    pass: gmailPass,
  },
});

exports.sendShareEmail = functions
  .region("us-central1")
  .https.onRequest(async (req, res) => {
    // CORS
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { to, senderName, senderEmail, docTitle, docUrl, roleLabel, message } = req.body;

    if (!to || !docUrl) {
      res.status(400).json({ error: "to, docUrl 필드가 필요합니다." });
      return;
    }

    const displayName  = senderName  || "누군가";
    const displayEmail = senderEmail ? `(${senderEmail})` : "";
    const title        = docTitle    || "제목 없는 문서";
    const role         = roleLabel   || "편집자";
    const actionVerb   = role === "뷰어" ? "열람하도록" : "수정하도록";
    const senderInitial = displayName.slice(0, 2);

    // Avatar color based on email hash
    const colors = ["#1a73e8","#34a853","#ea4335","#fbbc04","#9c27b0","#00897b","#e91e63","#ff5722"];
    let h = 0;
    for (const c of (senderEmail || displayName)) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
    const avatarBg = colors[Math.abs(h) % colors.length];

    const msgBlock = message
      ? `<tr><td style="padding:0 40px 24px;">
           <p style="margin:0;font-size:14px;color:#444;font-style:italic;">"${message}"</p>
         </td></tr>`
      : "";

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${displayName}님이 문서를 공유함</title>
</head>
<body style="margin:0;padding:0;background:#f1f3f4;font-family:'Google Sans',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f4;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:8px;overflow:hidden;
                    box-shadow:0 1px 4px rgba(0,0,0,0.15);max-width:600px;width:100%;">

        <!-- Header bar -->
        <tr>
          <td style="background:#ffffff;padding:24px 40px 0;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:10px;">
                  <svg width="20" height="26" viewBox="0 0 20 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0H2C.9 0 0 .9 0 2v22c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8l-8-8z" fill="#4285f4"/>
                    <path d="M12 0v8h8L12 0z" fill="#a8c7fa"/>
                    <path d="M4 18h12v1.5H4V18zm0-3h12v1.5H4V15zm0-3h8v1.5H4V12z" fill="white"/>
                  </svg>
                </td>
                <td style="font-size:18px;font-weight:500;color:#202124;">Nick's Docs</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Title -->
        <tr>
          <td style="padding:28px 40px 8px;">
            <h1 style="margin:0;font-size:26px;font-weight:400;color:#202124;line-height:1.3;">
              ${displayName}님이 문서 1개를 공유함
            </h1>
          </td>
        </tr>

        <!-- Sender info -->
        <tr>
          <td style="padding:16px 40px 20px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:12px;vertical-align:top;">
                  <div style="width:44px;height:44px;border-radius:50%;
                              background:${avatarBg};color:white;
                              font-size:15px;font-weight:700;
                              display:flex;align-items:center;justify-content:center;
                              text-align:center;line-height:44px;">
                    ${senderInitial}
                  </div>
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0;font-size:14px;color:#202124;">
                    <strong>${displayName}${displayEmail}</strong>님이 다음 문서를
                    <strong>${actionVerb}</strong> 나를 초대했습니다.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Optional message -->
        ${msgBlock}

        <!-- Doc card -->
        <tr>
          <td style="padding:0 40px 28px;">
            <a href="${docUrl}" style="text-decoration:none;" target="_blank">
              <table cellpadding="0" cellspacing="0" width="100%"
                     style="border:1px solid #e0e0e0;border-radius:8px;overflow:hidden;">
                <!-- Doc card header -->
                <tr>
                  <td style="padding:14px 16px;border-bottom:1px solid #f1f3f4;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:8px;">
                          <svg width="18" height="22" viewBox="0 0 20 26" fill="none">
                            <path d="M12 0H2C.9 0 0 .9 0 2v22c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8l-8-8z" fill="#4285f4"/>
                            <path d="M12 0v8h8L12 0z" fill="#a8c7fa"/>
                          </svg>
                        </td>
                        <td style="font-size:14px;color:#202124;font-weight:500;">
                          ${title}
                        </td>
                        <td style="padding-left:8px;">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="#9aa0a6">
                            <path d="M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z"/>
                          </svg>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Doc preview area -->
                <tr>
                  <td style="background:#fafafa;height:160px;padding:20px 16px;">
                    <p style="margin:0;font-size:13px;color:#9aa0a6;">문서 미리보기</p>
                  </td>
                </tr>
                <!-- Last modified -->
                <tr>
                  <td style="padding:12px 16px;border-top:1px solid #f1f3f4;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:6px;">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="#9aa0a6">
                            <path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3zm-1 5v5.41l3.3 3.29 1.41-1.41L13 11.59V8h-1z"/>
                          </svg>
                        </td>
                        <td style="font-size:12px;color:#9aa0a6;">마지막으로 수정한 날짜: 방금</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>

        <!-- Open button -->
        <tr>
          <td style="padding:0 40px 36px;">
            <a href="${docUrl}" target="_blank"
               style="display:inline-block;background:#1a73e8;color:white;
                      font-size:14px;font-weight:500;padding:10px 28px;
                      border-radius:20px;text-decoration:none;">
              열기
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;border-top:1px solid #e0e0e0;">
            <p style="margin:0;font-size:12px;color:#9aa0a6;">
              Nick's Docs · nick-s-docs.web.app
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: `"Nick's Docs (문서 공유)" <${gmailUser}>`,
      to: to,
      subject: `${displayName}님이 "${title}" 문서를 공유했습니다`,
      html: html,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log("Email sent to:", to);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error("Email error:", err);
      res.status(500).json({ error: err.message });
    }
  });
