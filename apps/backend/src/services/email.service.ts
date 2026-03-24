import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

// Configure Gmail SMTP transporter (port 587 + STARTTLS for cloud compatibility)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
});

// Shared email template
function buildEmailHtml(options: {
  heading: string;
  bodyText: string;
  code: string;
  expiryNote: string;
  disclaimer: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.heading}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td align="center" style="padding: 40px 30px; background: linear-gradient(135deg, #9AA793 0%, #6D7E68 100%); border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">MeMantra</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 20px 0; color: #333333; font-size: 24px;">${options.heading}</h2>
                  <p style="margin: 0 0 20px 0; color: #666666; font-size: 16px; line-height: 24px;">
                    ${options.bodyText}
                  </p>
                  <!-- Verification Code -->
                  <table role="presentation" style="width: 100%; margin: 30px 0;">
                    <tr>
                      <td align="center">
                        <div style="background-color: #f8f9fa; border: 2px dashed #E6D29C; border-radius: 8px; padding: 20px; display: inline-block;">
                          <span style="font-size: 36px; font-weight: bold; color: #9AA793; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                            ${options.code}
                          </span>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 20px;">
                    <strong>${options.expiryNote}</strong>
                  </p>
                  <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 20px;">
                    ${options.disclaimer}
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
  `;
}

// Verify transporter configuration
if (process.env.NODE_ENV !== 'test' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter.verify((error: Error | null) => {
    if (error) {
      console.error('Email service configuration error:', error);
    } else {
      console.log('Email service is ready to send messages');
    }
  });
} else if (process.env.NODE_ENV !== 'test') {
  console.warn('Email credentials not configured. Password reset emails will not be sent.');
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
  try {
    const mailOptions = {
      from: {
        name: 'MeMantra',
        address: process.env.EMAIL_USER || '',
      },
      to: email,
      subject: 'Password Reset Verification Code',
      html: buildEmailHtml({
        heading: 'Password Reset Request',
        bodyText:
          'We received a request to reset your password. Use the verification code below to continue:',
        code,
        expiryNote: 'This code will expire in 10 minutes.',
        disclaimer:
          "If you didn't request a password reset, please ignore this email or contact support if you have concerns.",
      }),
      text: `Your MeMantra password reset verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request a password reset, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send a 6-digit signup verification code to the user's email
export const sendSignupVerificationCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const mailOptions = {
      from: {
        name: 'MeMantra',
        address: process.env.EMAIL_USER || '',
      },
      to: email,
      subject: 'Verify your MeMantra email',
      html: buildEmailHtml({
        heading: 'Verify your email address',
        bodyText:
          'Welcome to MeMantra! Please use the verification code below to confirm your email address and complete your registration:',
        code,
        expiryNote: 'This code will expire in 10 minutes.',
        disclaimer: 'If you did not create a MeMantra account, please ignore this email.',
      }),
      text: `Your MeMantra email verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you did not create a MeMantra account, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);
    const safeEmail = email.replace(/[\r\n]/g, '');
    console.log(`Signup verification code sent successfully to ${safeEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending signup verification email:', error);
    return false;
  }
};

export const emailService = {
  send6DigitCode,
  generate6DigitCode,
  sendSignupVerificationCode,
};
