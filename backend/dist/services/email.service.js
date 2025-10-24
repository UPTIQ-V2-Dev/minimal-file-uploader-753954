import config from "../config/config.js";
import nodemailer from 'nodemailer';
// Create transport only in production, use test transport in development
const transport = config.env === 'production' ? nodemailer.createTransport(config.email.smtp) : null;
/**
 * Send an email
 * @param {string} to
 * @param {string} subject
 * @param {string} text
 * @returns {Promise}
 */
const sendEmail = async (to, subject, text) => {
    // In development, just log the email instead of sending
    if (config.env === 'development' || config.env === 'dev') {
        console.log(`[EMAIL] Would send email to: ${to}`);
        console.log(`[EMAIL] Subject: ${subject}`);
        console.log(`[EMAIL] Content: ${text}`);
        return;
    }
    if (!transport) {
        throw new Error('Email transport not configured');
    }
    const msg = { from: config.email.from, to, subject, text };
    await transport.sendMail(msg);
};
/**
 * Send reset password email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendResetPasswordEmail = async (to, token) => {
    const subject = 'Reset password';
    // replace this url with the link to the reset password page of your front-end app
    const resetPasswordUrl = `http://link-to-app/reset-password?token=${token}`;
    const text = `Dear user,
To reset your password, click on this link: ${resetPasswordUrl}
If you did not request any password resets, then ignore this email.`;
    await sendEmail(to, subject, text);
};
/**
 * Send verification email
 * @param {string} to
 * @param {string} token
 * @returns {Promise}
 */
const sendVerificationEmail = async (to, token) => {
    const subject = 'Email Verification';
    // replace this url with the link to the email verification page of your front-end app
    const verificationEmailUrl = `http://link-to-app/verify-email?token=${token}`;
    const text = `Dear user,
To verify your email, click on this link: ${verificationEmailUrl}`;
    await sendEmail(to, subject, text);
};
export default {
    transport,
    sendEmail,
    sendResetPasswordEmail,
    sendVerificationEmail
};
