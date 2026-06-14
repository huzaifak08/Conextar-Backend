import axios from "axios";

/**
 * Dispatches an automated verification OTP code to a user's email inbox using Brevo API
 */
export const sendVerificationCode = async (
  to: string,
  code: string,
  purpose: "registration" | "password_reset",
): Promise<boolean> => {
  try {
    const isReset = purpose === "password_reset";
    const subject = isReset
      ? "Reset Your Conextar Password"
      : "Verify Your Conextar Account";

    const apiKey = process.env.EMAIL_API_KEY;
    const senderEmail = process.env.EMAIL_FROM;

    if (!apiKey || !senderEmail) {
      throw new Error(
        "Missing email infrastructure keys inside environment configurations.",
      );
    }

    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 550px; margin: 30px auto; padding: 30px; border: 1px solid #eef2f5; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 25px;">
          <h2 style="color: #005f73; font-size: 26px; font-weight: 700; margin: 0;">Conextar</h2>
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 25px;" />
        <p style="font-size: 15px; color: #334155;">Hello,</p>
        <p style="font-size: 15px; color: #334155;">Please use the secure authorization code below to complete your ${isReset ? "password recovery" : "account registration"}:</p>
        
        <div style="text-align: center; margin: 35px 0;">
          <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 6px; color: #005f73; background-color: #f0fdfa; padding: 12px 30px; border-radius: 8px; border: 1px solid #ccfbf1; display: inline-block;">
            ${code}
          </span>
        </div>
        
        <p style="font-size: 13px; color: #64748b;">This code is valid for exactly 15 minutes. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: "Conextar Team", email: senderEmail },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    return response.status === 201 || response.status === 200;
  } catch (error: any) {
    console.error(
      "❌ [MAILER] Pipeline error:",
      error.response?.data || error.message,
    );
    return false;
  }
};
