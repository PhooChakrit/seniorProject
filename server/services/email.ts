import nodemailer from 'nodemailer';

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@crispr-plant.local';
const FROM_NAME = process.env.FROM_NAME || 'CRISPR-PLANT v2';

// Create transporter (lazy initialization)
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!SMTP_USER || !SMTP_PASS) {
    console.warn('Email disabled: SMTP credentials not configured');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

export interface JobNotificationData {
  jobId: string;
  species: string;
  status: 'completed' | 'failed';
  createdAt: Date;
  completedAt: Date;
  error?: string;
  resultUrl?: string;
}

/**
 * Send job completion notification email
 */
export async function sendJobCompletionEmail(
  email: string,
  data: JobNotificationData
): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    console.log(`Email notification skipped (not configured): ${data.jobId}`);
    return false;
  }

  const subject =
    data.status === 'completed'
      ? `✅ CRISPR Analysis Complete - ${data.jobId}`
      : `❌ CRISPR Analysis Failed - ${data.jobId}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .status-success { color: #059669; }
    .status-failed { color: #dc2626; }
    .btn { display: inline-block; padding: 12px 24px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>CRISPR-PLANT v2</h1>
    </div>
    <div class="content">
      <h2 class="${data.status === 'completed' ? 'status-success' : 'status-failed'}">
        ${data.status === 'completed' ? '✅ Analysis Completed' : '❌ Analysis Failed'}
      </h2>
      
      <p><strong>Job ID:</strong> ${data.jobId}</p>
      <p><strong>Species:</strong> ${data.species}</p>
      <p><strong>Started:</strong> ${data.createdAt.toLocaleString()}</p>
      <p><strong>Finished:</strong> ${data.completedAt.toLocaleString()}</p>
      
      ${data.status === 'completed' ? `
        <p>Your CRISPR spacer analysis has completed successfully!</p>
        ${data.resultUrl ? `<p><a href="${data.resultUrl}" class="btn">View Results</a></p>` : ''}
      ` : `
        <p>Unfortunately, your analysis encountered an error:</p>
        <p style="background: #fee2e2; padding: 10px; border-radius: 4px;">
          ${data.error || 'Unknown error'}
        </p>
      `}
    </div>
    <div class="footer">
      <p>Thai Rice Genome - Faculty of Science, Chulalongkorn University</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `;

  try {
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: email,
      subject,
      html: htmlBody,
    });

    console.log(`Email notification sent: ${email} for job ${data.jobId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    return false;
  }
}

/**
 * Verify email configuration is working
 */
export async function verifyEmailConfig(): Promise<boolean> {
  const transport = getTransporter();

  if (!transport) {
    return false;
  }

  try {
    await transport.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}
