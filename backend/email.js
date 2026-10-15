const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",

    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

async function sendEmail({ to, subject, text, html }) {
    try {
        const info = await transporter.sendMail({
            from: `"Slash the Hate" <${process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html
        });

        console.log("Email sent:", info.messageId);

        return {
            success: true,
            messageId: info.messageId
        };

    } catch (error) {
        console.error("Email sending error:", error);

        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    transporter,
    sendEmail
};