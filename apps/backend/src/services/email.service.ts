import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

const MAIL_ENABLED = process.env.MAIL_ENABLED === 'true';
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Create transporter ONLY if mail is enabled and creds exist
const transporter =
  MAIL_ENABLED && EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
        service: 'gmail',
        secure: true,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
        // avoid long hangs on servers that block SMTP
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      })
    : null;

if (!MAIL_ENABLED) {
  console.warn('[email] Disabled (MAIL_ENABLED != true). Skipping email setup.');
} else if (!EMAIL_USER || !EMAIL_PASS) {
  console.warn('[email] MAIL_ENABLED=true but EMAIL_USER/EMAIL_PASS missing. Email disabled.');
}

// Verify ONLY if transporter exists
if (transporter && process.env.NODE_ENV !== 'test') {
  transporter.verify((error) => {
    if (error) {
      console.error('Email service configuration error:', error);
    } else {
      console.log('Email service is ready to send messages');
    }
  });
}

// Generate a random 6-digit code
export const generate6DigitCode = (): string => {
  const range = 900000; // 900000 possible values (100000 to 999999)
  const maxAcceptable = Math.floor(0xffffffff / range) * range;

  let randomNumber: number;
  do {
    const randomBytes = crypto.randomBytes(4);
    randomNumber = randomBytes.readUInt32BE(0);
  } while (randomNumber >= maxAcceptable);

  const code = (randomNumber % range) + 100000;
  return code.toString();
};

// Send a 6-digit verification code to the user's email
export const send6DigitCode = async (email: string, code: string): Promise<boolean> => {
  // IMPORTANT: guard before try/await so TS knows transporter isn't null
  if (!transporter) {
    console.warn('[email] sendMail skipped (email disabled).');
    return false;
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: {
      name: 'MeMantra',
      address: EMAIL_USER || '',
    },
    to: email,
    subject: 'Password Reset Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px;">
                <!-- Header -->
                <tr>
                  <td align="center" style="padding: 40px 30px; background: linear-gradient(135deg, #9AA793 0%, #6D7E68 100%); border-radius: 8px 8px 0 0;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">MeMantra</h1>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">Password Reset Request</h2>
                    <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
                      We received a request to reset your password. Use the verification code below to continue:
                    </p>

                    <!-- Verification Code -->
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <div style="background-color: #f8f9fa; border: 2px dashed #E6D29C; border-radius: 8px; padding: 20px; display: inline-block;">
                            <span style="font-size: 36px; font-weight: bold; color: #9AA793; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                              ${code}
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 20px;">
                      <strong>This code will expire in 10 minutes.</strong>
                    </p>

                    <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 20px;">
                      If you didn't request a password reset, please ignore this email.
                    </p>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                    <p style="margin: 0; color: #999999; font-size: 12px; text-align: center;">
                      © ${new Date().getFullYear()} MeMantra. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #999999; font-size: 12px; text-align: center;">
                      This is an automated message, please do not reply.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
    text: `Your MeMantra password reset verification code is: ${code}\n\nThis code will expire in 10 minutes.\n`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

export const emailService = {
  send6DigitCode,
  generate6DigitCode,
};
