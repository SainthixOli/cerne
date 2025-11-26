const { getDb } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

        // In a real app, we should verify the old password too, or use the JWT token to identify the user
        // For simplicity here, we assume the user is authenticated and passing their ID (or we extract from token middleware)

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
            // Security: don't reveal if user exists
            return res.json({ message: 'Se o CPF estiver cadastrado, você receberá um email.' });
        }

        // Mock sending email
        console.log(`[EMAIL MOCK] Enviando email de recuperação para usuário ${user.id} (${user.nome_completo})`);

        // In a real app, generate a token, save to DB, send link.
        // Here we just simulate success.

        res.json({ message: 'Se o CPF estiver cadastrado, você receberá um email.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
};
