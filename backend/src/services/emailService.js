const nodemailer = require('nodemailer');

// Create a transporter (Using Ethereal for testing or just console logging if fails)
// In production, use real credentials from .env
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'ethereal_user',
        pass: 'ethereal_pass'
    }
});

exports.sendPasswordEmail = async (email, password) => {
    console.log(`[EMAIL MOCK] Sending email to ${email}`);
    console.log(`[EMAIL MOCK] Subject: Sua senha de acesso - Sinpro Luziânia`);
    console.log(`[EMAIL MOCK] Body: Sua senha provisória é: ${password}`);

    // In a real scenario, we would actually send it
    // await transporter.sendMail(...)
    return true;
};
