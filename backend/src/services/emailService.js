const nodemailer = require('nodemailer');

let transporter;

function mailer() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_FROM) {
        throw Object.assign(new Error('Provedor de email não configurado'), { code: 'EMAIL_PROVIDER_UNAVAILABLE' });
    }
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: process.env.SMTP_SECURE === 'true',
            auth: process.env.SMTP_USER ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            } : undefined
        });
    }
    return transporter;
}

async function send({ to, subject, text }) {
    return mailer().sendMail({ from: process.env.SMTP_FROM, to, subject, text });
}

exports.sendPasswordEmail = async (recipient, temporaryPassword) => send({
    to: recipient,
    subject: 'Acesso ao Cerne aprovado',
    text: `Seu cadastro foi aprovado. Use a senha temporária abaixo e altere-a no primeiro acesso:\n\n${temporaryPassword}`
});

exports.sendResetPasswordEmail = async (recipient, resetToken) => {
    if (!process.env.FRONTEND_PUBLIC_URL) {
        throw Object.assign(new Error('URL pública do frontend não configurada'), { code: 'FRONTEND_URL_UNAVAILABLE' });
    }
    const resetUrl = new URL('/reset-password', process.env.FRONTEND_PUBLIC_URL);
    resetUrl.searchParams.set('token', resetToken);
    return send({
        to: recipient,
        subject: 'Redefinição de senha do Cerne',
        text: `Use o link abaixo para redefinir sua senha. O link expira em uma hora:\n\n${resetUrl.toString()}`
    });
};
