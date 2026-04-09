import express, { RequestHandler, ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes';
import { requestLogger, errorLogger } from './middleware/logger.middleware';
import { requestPerformanceMonitor } from './middleware/performance.middleware';

export const createApp = () => {
  const app = express();

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:'],
        },
      },
    }),
  );

  // CORS configuration
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:19006'],
      credentials: true,
    }),
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
  });

  app.use('/api/', limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  if (process.env.NODE_ENV === 'development') {
    app.use(requestLogger);
  }

  if ((process.env.MONITORING_ENABLED || 'true').toLowerCase() !== 'false') {
    app.use(requestPerformanceMonitor);
  }

  // Health check endpoint (Render checks "/" by default)
  const healthResponse: RequestHandler = (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  };
  app.get('/', healthResponse);
  app.get('/health', healthResponse);

  // Privacy Policy (public HTML page)
  app.get('/privacy-policy', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeMantra - Privacy Policy</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.7; }
    .header { background: #7BA5B5; padding: 40px 20px; text-align: center; color: #fff; }
    .header h1 { font-size: 28px; margin-bottom: 4px; }
    .header p { opacity: 0.85; font-size: 14px; }
    .container { max-width: 800px; margin: 30px auto; padding: 30px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h2 { color: #7BA5B5; margin: 28px 0 12px; font-size: 20px; }
    h2:first-child { margin-top: 0; }
    p, li { font-size: 15px; margin-bottom: 10px; }
    ul { padding-left: 24px; margin-bottom: 14px; }
    .footer { text-align: center; padding: 20px; font-size: 13px; color: #888; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MeMantra</h1>
    <p>Privacy Policy</p>
  </div>
  <div class="container">
    <p><strong>Effective Date:</strong> April 7, 2026</p>
    <p>MeMantra ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our mobile application.</p>

    <h2>1. Information We Collect</h2>
    <p><strong>Account Information:</strong> When you create an account, we collect your username, email address, and password. Your password is securely hashed and never stored in plain text.</p>
    <p><strong>User-Generated Content:</strong> We store journal entries, chat conversations with our AI assistant, mantra likes, collections, and ratings that you create within the app.</p>
    <p><strong>Usage Data:</strong> We collect information about how you interact with the app, including category preferences, engagement metrics, and app usage patterns to personalize your experience.</p>
    <p><strong>Device Information:</strong> If you enable push notifications, we collect your device push token to deliver reminders and notifications.</p>

    <h2>2. How We Use Your Information</h2>
    <ul>
      <li>To create and manage your account</li>
      <li>To personalize mantra recommendations based on your preferences and interactions</li>
      <li>To provide AI-powered chat support and guidance</li>
      <li>To store and display your journal entries privately</li>
      <li>To send push notification reminders (if enabled)</li>
      <li>To improve app functionality and user experience</li>
    </ul>

    <h2>3. Data Storage and Security</h2>
    <p>Your data is stored on secure servers hosted by Render. We use industry-standard security measures including:</p>
    <ul>
      <li>Encrypted data transmission (HTTPS/TLS)</li>
      <li>Secure password hashing (bcrypt)</li>
      <li>JWT-based authentication tokens</li>
      <li>Rate limiting to prevent abuse</li>
    </ul>

    <h2>4. Third-Party Services</h2>
    <p>We use the following third-party services:</p>
    <ul>
      <li><strong>OpenAI:</strong> To power the AI chat assistant. Chat messages are sent to OpenAI's API for processing. Please refer to <a href="https://openai.com/privacy" style="color:#7BA5B5">OpenAI's Privacy Policy</a> for their data handling practices.</li>
      <li><strong>Expo Push Notifications:</strong> To deliver push notifications to your device.</li>
      <li><strong>MongoDB Atlas:</strong> For secure database hosting.</li>
    </ul>

    <h2>5. Data Sharing</h2>
    <p>We do <strong>not</strong> sell, trade, or rent your personal information to third parties. Your data is only shared with third-party services as described above, solely for the purpose of providing app functionality.</p>

    <h2>6. Your Rights</h2>
    <p>You have the right to:</p>
    <ul>
      <li>Access your personal data through the app</li>
      <li>Update your email or password at any time</li>
      <li>Delete your journal entries and chat history</li>
      <li>Request account deletion by contacting us</li>
      <li>Opt out of push notifications through your device settings</li>
    </ul>

    <h2>7. Children's Privacy</h2>
    <p>MeMantra is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will take steps to delete that information.</p>

    <h2>8. Data Retention</h2>
    <p>We retain your data for as long as your account is active. If you request account deletion, we will remove your personal data within 30 days, except where retention is required by law.</p>

    <h2>9. Changes to This Policy</h2>
    <p>We may update this Privacy Policy from time to time. We will notify users of significant changes through the app or via email. Continued use of the app after changes constitutes acceptance of the updated policy.</p>

    <h2>10. Contact Us</h2>
    <p>If you have questions or concerns about this Privacy Policy, please contact us at:</p>
    <p><strong>Email:</strong> jamie@whereithrive.ca</p>
  </div>
  <div class="footer">&copy; 2026 MeMantra. All rights reserved.</div>
</body>
</html>`);
  });

  // Terms of Use / EULA (public HTML page)
  app.get('/terms-of-use', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeMantra - Terms of Use</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.7; }
    .header { background: #7BA5B5; padding: 40px 20px; text-align: center; color: #fff; }
    .header h1 { font-size: 28px; margin-bottom: 4px; }
    .header p { opacity: 0.85; font-size: 14px; }
    .container { max-width: 800px; margin: 30px auto; padding: 30px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h2 { color: #7BA5B5; margin: 28px 0 12px; font-size: 20px; }
    h2:first-child { margin-top: 0; }
    p, li { font-size: 15px; margin-bottom: 10px; }
    ul { padding-left: 24px; margin-bottom: 14px; }
    .footer { text-align: center; padding: 20px; font-size: 13px; color: #888; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MeMantra</h1>
    <p>Terms of Use</p>
  </div>
  <div class="container">
    <p><strong>Effective Date:</strong> April 8, 2026</p>
    <p>By using MeMantra ("the App"), you agree to the following Terms of Use. If you do not agree, please do not use the App.</p>

    <h2>1. Acceptance of Terms</h2>
    <p>By creating an account or using MeMantra, you confirm that you are at least 13 years old and agree to be bound by these Terms of Use, our <a href="/privacy-policy" style="color:#7BA5B5">Privacy Policy</a>, and all applicable laws and regulations.</p>

    <h2>2. User-Generated Content</h2>
    <p>MeMantra includes an AI-powered chat assistant. You understand that:</p>
    <ul>
      <li>AI responses are generated by OpenAI and are not professional medical, psychological, or legal advice.</li>
      <li>You are solely responsible for the content you submit through the App, including chat messages, journal entries, and any shared mantras.</li>
      <li>All user-submitted content is processed by OpenAI's content filtering systems to help detect and prevent harmful content.</li>
    </ul>

    <h2>3. Zero-Tolerance Content Policy</h2>
    <p>MeMantra enforces a <strong>zero-tolerance policy</strong> for objectionable content. You may not use the App to:</p>
    <ul>
      <li>Harass, bully, threaten, or abuse other users</li>
      <li>Post or transmit sexually explicit, violent, or hateful content</li>
      <li>Promote self-harm, substance abuse, or illegal activities</li>
      <li>Impersonate other individuals or misrepresent your identity</li>
      <li>Distribute spam, malware, or engage in phishing</li>
    </ul>
    <p>Violations of this policy will result in immediate action, up to and including permanent account termination.</p>

    <h2>4. Content Filtering and Moderation</h2>
    <p>All AI-generated content in MeMantra is processed through OpenAI's safety and content filtering systems. While we strive to prevent harmful outputs, no automated system is perfect. If you encounter objectionable content, please report it immediately using the in-app reporting feature.</p>

    <h2>5. Reporting Objectionable Content</h2>
    <p>If you encounter content that violates these terms, you can:</p>
    <ul>
      <li><strong>Report a message:</strong> Long-press any message in a conversation and select "Report" to flag it for review.</li>
      <li><strong>Delete a conversation:</strong> Use the delete option in the conversation screen to remove an entire conversation.</li>
      <li><strong>Contact us directly:</strong> Email <a href="mailto:jamie@whereithrive.ca" style="color:#7BA5B5">jamie@whereithrive.ca</a> with details of the issue.</li>
    </ul>
    <p>All reports are reviewed and acted upon within 24 hours.</p>

    <h2>6. Blocking and Conversation Management</h2>
    <p>You can delete any conversation at any time. Deleting a conversation permanently removes all messages in that conversation from your account.</p>

    <h2>7. Account Termination</h2>
    <p>We reserve the right to suspend or permanently terminate any account that violates these Terms of Use, with or without prior notice. Grounds for termination include but are not limited to:</p>
    <ul>
      <li>Posting objectionable or illegal content</li>
      <li>Repeated violations of community standards</li>
      <li>Abuse of the reporting system</li>
      <li>Any activity that threatens the safety of other users</li>
    </ul>

    <h2>8. Disclaimer of Warranties</h2>
    <p>MeMantra is provided "as is" without warranties of any kind. The AI chat feature is not a substitute for professional advice. We do not guarantee the accuracy, completeness, or usefulness of any AI-generated content.</p>

    <h2>9. Limitation of Liability</h2>
    <p>To the fullest extent permitted by law, MeMantra and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App.</p>

    <h2>10. Changes to These Terms</h2>
    <p>We may update these Terms of Use from time to time. Continued use of the App after changes constitutes acceptance of the updated terms. We will notify users of significant changes through the App.</p>

    <h2>11. Contact Us</h2>
    <p>If you have questions about these Terms of Use, please contact us at:</p>
    <p><strong>Email:</strong> <a href="mailto:jamie@whereithrive.ca" style="color:#7BA5B5">jamie@whereithrive.ca</a></p>
  </div>
  <div class="footer">&copy; 2026 MeMantra. All rights reserved.</div>
</body>
</html>`);
  });

  // Account Deletion Request (public HTML page)
  app.get('/delete-account', (_req, res) => {
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MeMantra - Delete Account</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #333; line-height: 1.7; }
    .header { background: #7BA5B5; padding: 40px 20px; text-align: center; color: #fff; }
    .header h1 { font-size: 28px; margin-bottom: 4px; }
    .header p { opacity: 0.85; font-size: 14px; }
    .container { max-width: 800px; margin: 30px auto; padding: 30px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h2 { color: #7BA5B5; margin: 24px 0 12px; font-size: 20px; }
    h2:first-child { margin-top: 0; }
    p, li { font-size: 15px; margin-bottom: 10px; }
    ul { padding-left: 24px; margin-bottom: 14px; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0; }
    .warning strong { color: #856404; }
    .email-link { color: #7BA5B5; font-weight: bold; text-decoration: none; }
    .email-link:hover { text-decoration: underline; }
    .steps { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .steps ol { padding-left: 24px; }
    .steps li { margin-bottom: 8px; }
    .footer { text-align: center; padding: 20px; font-size: 13px; color: #888; }
  </style>
</head>
<body>
  <div class="header">
    <h1>MeMantra</h1>
    <p>Account Deletion Request</p>
  </div>
  <div class="container">
    <h2>Request Account Deletion</h2>
    <p>We're sorry to see you go. If you'd like to delete your MeMantra account and all associated data, please follow the steps below.</p>

    <div class="steps">
      <h2>How to Request Deletion</h2>
      <ol>
        <li>Send an email to <a href="mailto:jamie@whereithrive.ca?subject=MeMantra%20Account%20Deletion%20Request" class="email-link">jamie@whereithrive.ca</a></li>
        <li>Use the subject line: <strong>"MeMantra Account Deletion Request"</strong></li>
        <li>Include the <strong>email address</strong> associated with your MeMantra account</li>
        <li>We will process your request within <strong>30 days</strong></li>
      </ol>
    </div>

    <h2>What Data Will Be Deleted</h2>
    <p>Upon account deletion, the following data will be permanently removed:</p>
    <ul>
      <li>Your account information (username, email, password)</li>
      <li>Journal entries</li>
      <li>Chat conversation history</li>
      <li>Mantra likes, collections, and ratings</li>
      <li>Notification preferences and push tokens</li>
      <li>Category preferences and engagement data</li>
    </ul>

    <div class="warning">
      <strong>Please note:</strong> Account deletion is permanent and cannot be undone. All your data will be permanently removed from our servers and cannot be recovered.
    </div>

    <h2>Contact</h2>
    <p>If you have any questions about the deletion process, please contact us at <a href="mailto:jamie@whereithrive.ca" class="email-link">jamie@whereithrive.ca</a>.</p>
  </div>
  <div class="footer">&copy; 2026 MeMantra. All rights reserved.</div>
</body>
</html>`);
  });

  // API routes
  app.use('/api', apiRoutes);
  app.get('/api/v1/hello', (_req, res) => {
    res.json({ message: 'Hello from MeMantra API!' });
  });

  // 404 handler
  const notFoundHandler: RequestHandler = (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.path}`,
    });
  };

  app.use(notFoundHandler);

  app.use(errorLogger);

  // Error handler
  const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
  };

  app.use(errorHandler);

  return app;
};
