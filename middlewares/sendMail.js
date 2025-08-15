import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const sendMail = async (email, subject, text, html = null) => {
    // 1. Validate inputs
    if (!email || !subject || (!text && !html)) {
        throw new Error('Missing required email parameters');
    }

    // 2. Configure authentication method based on environment
    const authMethod = process.env.EMAIL_AUTH_METHOD || 'app-password'; // 'app-password' or 'oauth2'

    // 3. Create transporter with selected auth method
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: authMethod === 'oauth2' ? {
            type: 'OAuth2',
            user: process.env.EMAIL_USERNAME,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
            accessToken: process.env.OAUTH_ACCESS_TOKEN
        } : {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            rejectUnauthorized: process.env.NODE_ENV === 'production',
            minVersion: 'TLSv1.2'
        }
    });

    // 4. Configure mail options
    const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
        to: email,
        subject: subject.trim(),
        text: text?.trim(),
        html: html?.trim() || text?.trim(),
        priority: 'high'
    };

    // 5. Send email with enhanced error handling
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${email}`, {
            messageId: info.messageId,
            subject,
            timestamp: new Date().toISOString()
        });
        
        return {
            success: true,
            messageId: info.messageId,
            accepted: info.accepted,
            rejected: info.rejected
        };
    } catch (error) {
        console.error(`Email failed to ${email}`, {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        throw new Error(
            process.env.NODE_ENV === 'development' 
                ? `Email failed: ${error.message}`
                : 'Failed to send email. Please try again later.'
        );
    }
};

export default sendMail;