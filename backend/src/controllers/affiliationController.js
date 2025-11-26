const { getDb } = require('../config/database');
const pdfService = require('../services/pdfService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
    try {
        const data = req.body;
        const db = await getDb();

        // 1. Create Profile (Simulating Auth User Creation)
        const userId = uuidv4(); // In real Supabase, this comes from auth.users

        // Check if profile exists (by CPF)
        const existingProfile = await db.get('SELECT id FROM profiles WHERE cpf = ?', [data.cpf]);
        let profileId = userId;

        if (existingProfile) {
            profileId = existingProfile.id;
            // Update existing profile logic if needed
        } else {
            await db.run(
                `INSERT INTO profiles(id, nome_completo, cpf, email, telefone, matricula_funcional, role, status_conta)
         VALUES(?, ?, ?, ?, ?, ?, 'professor', 'pendente_docs')`,
                [userId, data.nome, data.cpf, data.email, data.telefone || '', data.matricula || '']
            );
        }

        // 2. Create Filiacao Request
        const result = await db.run(
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
        const affiliations = await db.all(`
      SELECT f.id, p.nome_completo as nome, f.status, f.data_solicitacao, d.url_arquivo 
      FROM filiacoes f
      JOIN profiles p ON f.user_id = p.id
      LEFT JOIN documentos d ON f.id = d.filiacao_id AND d.tipo_documento = 'ficha_assinada'
      ORDER BY f.data_solicitacao DESC
    `);
        res.status(200).json(affiliations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveAffiliation = async (req, res) => {
    const { id } = req.params;
    try {
        const db = await getDb();

        // 1. Get the affiliation and user
        const filiacao = await db.get('SELECT user_id FROM filiacoes WHERE id = ?', [id]);
        if (!filiacao) return res.status(404).json({ error: 'Affiliation not found' });

        const user = await db.get('SELECT * FROM profiles WHERE id = ?', [filiacao.user_id]);

        // 2. Generate temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 3. Update Profile (Activate + Set Password + Force Change)
        await db.run(
            "UPDATE profiles SET status_conta = 'ativo', password_hash = ?, change_password_required = 1 WHERE id = ?",
            [hashedPassword, filiacao.user_id]
        );

        // 4. Update Filiacao
        await db.run("UPDATE filiacoes SET status = 'concluido', data_aprovacao = CURRENT_TIMESTAMP WHERE id = ?", [id]);

        // 5. Send Email
        const userEmail = user.email || `${user.cpf}@sinpro.com`;
        await emailService.sendPasswordEmail(userEmail, tempPassword);

        res.status(200).json({ message: `Affiliation approved. Password sent to ${userEmail}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
