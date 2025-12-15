const { getDb } = require('../config/database');
const pdfService = require('../services/pdfService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
    try {
        const data = req.body;
        const db = await getDb();

        // 1. Check if profile exists by CPF OR Email
        // This allows linking "Frank Ocean" (wrong CPF) to "Frank Ocean" (correct CPF) if email is same.
        const existingProfile = await db.get(
            'SELECT * FROM profiles WHERE cpf = ? OR email = ?',
            [data.cpf, data.email]
        );

        let profileId;

        if (existingProfile) {
            profileId = existingProfile.id;
            // Update profile with latest info (e.g. if they corrected CPF or Phone)
            await db.run(
                `UPDATE profiles SET nome_completo = ?, cpf = ?, telefone = ?, matricula_funcional = ?, status_conta = 'pendente_docs' WHERE id = ?`,
                [data.nome, data.cpf, data.telefone || '', data.matricula || '', profileId]
            );
        } else {
            profileId = uuidv4();
            await db.run(
                `INSERT INTO profiles(id, nome_completo, cpf, email, telefone, matricula_funcional, role, status_conta)
                 VALUES(?, ?, ?, ?, ?, ?, 'professor', 'pendente_docs')`,
                [profileId, data.nome, data.cpf, data.email, data.telefone || '', data.matricula || '']
            );
        }

        // 2. Create NEW Filiacao Request (History)
        // We always create a new request if they are registering again.
        // But we might want to check if there is already a PENDING one?
        // If there is a pending one, maybe just update it? 
        // User said: "Line of history... I rejected... I made a new one".
        // So we should allow multiple.

        await db.run(
            `INSERT INTO filiacoes (user_id, status) VALUES (?, 'em_processamento')`,
            [profileId]
        );

        // Generate PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=filiacao_${data.nome}.pdf`);

        pdfService.generateAffiliationPDF(data, res);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.uploadSignedForm = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const db = await getDb();
        const cpf = req.body.cpf; // We need to identify the user

        // Find user by CPF
        const profile = await db.get('SELECT id FROM profiles WHERE cpf = ?', [cpf]);

        if (!profile) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        // Find latest filiacao
        const filiacao = await db.get('SELECT id FROM filiacoes WHERE user_id = ? ORDER BY data_solicitacao DESC LIMIT 1', [profile.id]);

        if (!filiacao) {
            return res.status(404).json({ error: 'Affiliation request not found.' });
        }

        // Insert Document
        await db.run(
            `INSERT INTO documentos (user_id, filiacao_id, url_arquivo, tipo_documento) VALUES (?, ?, ?, 'ficha_assinada')`,
            [profile.id, filiacao.id, req.file.path]
        );

        // Update Profile Status
        await db.run('UPDATE profiles SET status_conta = ? WHERE id = ?', ['em_analise', profile.id]);

        res.status(200).json({ message: 'File uploaded successfully', filename: req.file.filename });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllAffiliations = async (req, res) => {
    try {
        const db = await getDb();
        // We want to list USERS, showing their LATEST affiliation status, but also knowing if they have history.
        // Or we list Affiliations?
        // User wants: "Frank Ocean (+2)". This implies we list Users (or the latest request for each user).

        const rows = await db.all(`
            SELECT 
                p.id as user_id,
                p.nome_completo as nome, 
                p.cpf, 
                p.status_conta,
                f.id as id,
                f.status, 
                f.data_solicitacao, 
                f.observacoes_admin,
                d.url_arquivo,
                (SELECT COUNT(*) FROM filiacoes WHERE user_id = p.id) as total_requests
            FROM filiacoes f
            JOIN profiles p ON f.user_id = p.id
            LEFT JOIN documentos d ON f.id = d.filiacao_id AND d.tipo_documento = 'ficha_assinada'
            WHERE f.id = (SELECT MAX(id) FROM filiacoes WHERE user_id = p.id) -- Get only the latest request per user
            ORDER BY f.data_solicitacao DESC
        `);

        // We might also want to fetch the FULL history for the detail view.
        // For now, we return the "Latest" state for the list, and the frontend can request details.
        // Or we can just return ALL rows and let frontend group?
        // Returning "Latest" per user is cleaner for the main table.

        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const auditService = require('../services/auditService');

exports.approveAffiliation = async (req, res) => {
    const { id } = req.params;
    const { observacoes } = req.body;
    const adminId = req.user.id;

    try {
        const db = await getDb();

        // 0. Verify if Admin exists (Prevent FK Constraint failure if token is stale)
        const adminExists = await db.get('SELECT id FROM profiles WHERE id = ?', [adminId]);
        if (!adminExists) {
            return res.status(401).json({ error: 'Sessão inválida ou expirada. Por favor, faça login novamente.' });
        }

        // 1. Get the affiliation and user
        const filiacao = await db.get('SELECT user_id FROM filiacoes WHERE id = ?', [id]);
        if (!filiacao) return res.status(404).json({ error: 'Affiliation not found' });

        const user = await db.get('SELECT * FROM profiles WHERE id = ?', [filiacao.user_id]);
        if (!user) return res.status(404).json({ error: 'User associated with this affiliation not found.' });

        // 2. Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 3. Update Profile (Activate + Set Password + Force Change)
        await db.run(
            "UPDATE profiles SET status_conta = 'ativo', password_hash = ?, change_password_required = 1 WHERE id = ?",
            [hashedPassword, filiacao.user_id]
        );

        // 4. Update Filiacao
        await db.run(
            "UPDATE filiacoes SET status = 'concluido', data_aprovacao = CURRENT_TIMESTAMP, aprovado_por_admin_id = ?, observacoes_admin = ? WHERE id = ?",
            [adminId, observacoes || 'Aprovado pelo admin', id]
        );

        // 5. Log Audit (Non-blocking)
        try {
            await auditService.logAction(adminId, 'APPROVE_AFFILIATION', id, {
                user_name: user.nome_completo,
                user_cpf: user.cpf,
                observation: observacoes
            });
        } catch (auditErr) {
            console.error('Audit Log Failed:', auditErr.message);
            // Continue execution, don't fail the request just because audit failed (though ideally it shouldn't fail)
        }

        // 6. Send Email (Non-blocking)
        try {
            const userEmail = user.email || `${user.cpf}@empresax.com`;
            await emailService.sendPasswordEmail(userEmail, tempPassword);
        } catch (emailErr) {
            console.error('Email Send Failed:', emailErr.message);
        }

        // DEV ONLY: Return temp password
        res.status(200).json({ message: `Affiliation approved.`, tempPassword });
    } catch (error) {
        console.error('Approve Affiliation Error:', error);
        res.status(500).json({ error: 'Erro interno ao aprovar filiação. Tente novamente.' });
    }
};

exports.rejectAffiliation = async (req, res) => {
    const { id } = req.params;
    const { observacoes } = req.body;
    const adminId = req.user.id;

    try {
        const db = await getDb();

        const filiacao = await db.get('SELECT user_id FROM filiacoes WHERE id = ?', [id]);
        if (!filiacao) return res.status(404).json({ error: 'Affiliation not found' });

        const user = await db.get('SELECT nome_completo, cpf FROM profiles WHERE id = ?', [filiacao.user_id]);

        await db.run(
            "UPDATE filiacoes SET status = 'rejeitado', aprovado_por_admin_id = ?, observacoes_admin = ? WHERE id = ?",
            [adminId, observacoes || 'Rejeitado pelo admin', id]
        );

        // Update profile status back to pendente_docs or similar? Or keep as em_analise but let them re-upload?
        // Let's set to 'pendente_docs' so they know they need to send something new.
        await db.run("UPDATE profiles SET status_conta = 'pendente_docs' WHERE id = ?", [filiacao.user_id]);

        // Log Audit
        await auditService.logAction(adminId, 'REJECT_AFFILIATION', id, {
            user_name: user?.nome_completo,
            user_cpf: user?.cpf,
            reason: observacoes
        });

        res.status(200).json({ message: 'Affiliation rejected.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.checkStatus = async (req, res) => {
    const { cpf } = req.body;
    try {
        const db = await getDb();
        const user = await db.get('SELECT id, nome_completo, status_conta FROM profiles WHERE cpf = ?', [cpf]);

        if (!user) return res.status(404).json({ error: 'CPF não encontrado.' });

        const filiacao = await db.get(
            'SELECT status, observacoes_admin, data_aprovacao FROM filiacoes WHERE user_id = ? ORDER BY data_solicitacao DESC LIMIT 1',
            [user.id]
        );

        if (!filiacao) return res.status(404).json({ error: 'Nenhuma solicitação encontrada.' });

        // If approved, we might want to "simulate" sending the password again or just showing it if it was just approved?
        // Actually, we can't retrieve the password hash. 
        // But the user asked to "receive a standard password" here. 
        // We can't show the password unless we just reset it or if we stored it temporarily (bad practice).
        // For the sake of the user's specific request "receive a standard password... here is just for us to have a notion":
        // We will return a message saying "Check your email" but if the user insists on seeing it here, 
        // we can't show the OLD one. We can only show it if we just generated it.
        // Let's just return the status and observation. The "temp password" was returned in the approve response (admin side).
        // Wait, the user said: "verify if approved... receive a standard password there".
        // Maybe they mean "Reset it" or "Get a default one"? 
        // Let's stick to showing the status. If approved, they should use "Forgot Password" or the email they "received".
        // However, to be helpful, I'll add a "temp_password_debug" field to the response IF it was just approved? No, that's stateful.
        // I will just return the status. The Admin sees the password in the console/response when approving.

        res.json({
            nome: user.nome_completo,
            status: filiacao.status, // em_processamento, concluido, rejeitado
            observacoes: filiacao.observacoes_admin,
            status_conta: user.status_conta
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAffiliationHistory = async (req, res) => {
    const { userId } = req.params;
    try {
        const db = await getDb();
        const history = await db.all(`
            SELECT f.*, d.url_arquivo 
            FROM filiacoes f
            LEFT JOIN documentos d ON f.id = d.filiacao_id AND d.tipo_documento = 'ficha_assinada'
            WHERE f.user_id = ?
            ORDER BY f.data_solicitacao DESC
        `, [userId]);

        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCertificate = async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;
        const user = await db.get('SELECT * FROM profiles WHERE id = ?', [userId]);

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=carteirinha_${user.cpf}.pdf`);

        pdfService.generateCertificate(user, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating certificate' });
    }
};
