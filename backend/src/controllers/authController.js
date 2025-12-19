const { getDb } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');

const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key';

exports.login = async (req, res) => {
    try {
        const { cpf, password } = req.body;
        const db = await getDb();

        const user = await db.get('SELECT * FROM profiles WHERE cpf = ?', [cpf]);

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.password_hash) {
            return res.status(401).json({ error: 'Conta ainda não aprovada ou sem senha definida.' });
        }

        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, name: user.nome_completo },
            SECRET_KEY,
            { expiresIn: '1d' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.nome_completo,
                role: user.role,
                changePasswordRequired: !!user.change_password_required
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { userId, newPassword } = req.body;
        const db = await getDb();

        // Em uma aplicação real, deveríamos verificar a senha antiga também ou usar o token JWT para identificar o usuário
        // Por simplicidade aqui, assumimos que o usuário está autenticado e passando seu ID (ou extraímos do middleware de token)

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.run(
            "UPDATE profiles SET password_hash = ?, change_password_required = 0 WHERE id = ?",
            [hashedPassword, userId]
        );

        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { cpf } = req.body;
        const db = await getDb();

        const user = await db.get('SELECT * FROM profiles WHERE cpf = ?', [cpf]);
        if (!user) {
            // Segurança: não revelar se o usuário existe
            return res.json({ message: 'Se o CPF estiver cadastrado, você receberá um email.' });
        }

        // Gerar Token de Redefinição
        const resetToken = uuidv4();
        const expires = new Date(Date.now() + 3600000); // 1 hora

        await db.run(
            'UPDATE profiles SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
            [resetToken, expires.toISOString(), user.id]
        );

        // Enviar Email
        const userEmail = user.email || `${user.cpf}@empresax.com`; // Fallback se não houver email
        await emailService.sendResetPasswordEmail(userEmail, resetToken);

        res.json({ message: 'Se o CPF estiver cadastrado, você receberá um email.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const db = await getDb();

        const user = await db.get(
            'SELECT * FROM profiles WHERE reset_token = ? AND reset_token_expires > ?',
            [token, new Date().toISOString()]
        );

        if (!user) {
            return res.status(400).json({ error: 'Token inválido ou expirado.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.run(
            'UPDATE profiles SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, change_password_required = 0 WHERE id = ?',
            [hashedPassword, user.id]
        );

        res.json({ message: 'Senha redefinida com sucesso! Agora você pode fazer login.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
};
