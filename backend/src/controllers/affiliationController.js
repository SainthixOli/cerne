const { getDb } = require('../config/database');
const pdfService = require('../services/pdfService');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const emailService = require('../services/emailService');

exports.register = async (req, res) => {
    try {
        const data = req.body;
        const db = await getDb();

        // 1. Verificar se o perfil existe por CPF OU Email
        // Isso permite vincular "Frank Ocean" (CPF errado) a "Frank Ocean" (CPF correto) se o email for o mesmo.
        const existingProfile = await db.get(
            'SELECT * FROM profiles WHERE cpf = ? OR email = ?',
            [data.cpf, data.email]
        );

        let profileId;

        if (existingProfile) {
            profileId = existingProfile.id;
            // Atualizar perfil com informações completas
            await db.run(
                `UPDATE profiles SET 
                    nome_completo = ?, cpf = ?, telefone = ?, matricula_funcional = ?,
                    rg = ?, orgao_emissor = ?, nacionalidade = ?, estado_civil = ?,
                    cep = ?, endereco = ?, numero = ?, complemento = ?, bairro = ?, cidade = ?, uf = ?,
                    status_conta = 'pendente_docs' 
                WHERE id = ?`,
                [
                    data.nome, data.cpf, data.telefone || '', data.matricula || '',
                    data.rg || '', data.orgao_emissor || '', data.nacionalidade || '', data.estado_civil || '',
                    data.cep || '', data.endereco || '', data.numero || '', data.complemento || '',
                    data.bairro || '', data.cidade || '', data.uf || '',
                    profileId
                ]
            );
        } else {
            profileId = uuidv4();
            await db.run(
                `INSERT INTO profiles(
                    id, nome_completo, cpf, email, telefone, matricula_funcional, 
                    rg, orgao_emissor, nacionalidade, estado_civil,
                    cep, endereco, numero, complemento, bairro, cidade, uf,
                    role, status_conta
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'professor', 'pendente_docs')`,
                [
                    profileId, data.nome, data.cpf, data.email, data.telefone || '', data.matricula || '',
                    data.rg || '', data.orgao_emissor || '', data.nacionalidade || '', data.estado_civil || '',
                    data.cep || '', data.endereco || '', data.numero || '', data.complemento || '',
                    data.bairro || '', data.cidade || '', data.uf || ''
                ]
            );
        }

        // 2. Criar NOVA Solicitação de Filiação (Histórico)
        // Sempre criamos uma nova solicitação se eles estiverem se registrando novamente.
        // Mas talvez devêssemos verificar se já existe uma PENDENTE?
        // Se houver uma pendente, talvez apenas atualizá-la?
        // Usuário disse: "Linha do histórico... eu rejeitei... eu fiz um novo".
        // Então devemos permitir múltiplos.

        // Generate Protocol (Simple 8-char alphanumeric, uppercase)
        const protocol = '#' + Math.random().toString(36).substring(2, 10).toUpperCase();

        await db.run(
            `INSERT INTO filiacoes (user_id, status, protocolo, status_atendimento) VALUES (?, 'em_processamento', ?, 'aberto')`,
            [profileId, protocol]
        );

        // Gerar PDF
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
        const cpf = req.body.cpf; // Precisamos identificar o usuário

        // Encontrar usuário por CPF
        const profile = await db.get('SELECT id FROM profiles WHERE cpf = ?', [cpf]);

        if (!profile) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        // Encontrar última filiação
        const filiacao = await db.get('SELECT id FROM filiacoes WHERE user_id = ? ORDER BY data_solicitacao DESC LIMIT 1', [profile.id]);

        if (!filiacao) {
            return res.status(404).json({ error: 'Affiliation request not found.' });
        }

        // Inserir Documento
        await db.run(
            `INSERT INTO documentos (user_id, filiacao_id, url_arquivo, tipo_documento) VALUES (?, ?, ?, 'ficha_assinada')`,
            [profile.id, filiacao.id, req.file.path]
        );

        // Atualizar Status do Perfil
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
        // Queremos listar USUÁRIOS, mostrando seu status de filiação mais recente, mas também sabendo se têm histórico.
        // Ou listamos Filiações?
        // Usuário quer: "Frank Ocean (+2)". Isso implica que listamos Usuários (ou a solicitação mais recente de cada um).

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
                f.protocolo,
                f.responsavel_admin_id,
                f.status_atendimento,
                f.transfer_status,
                d.url_arquivo,
                (SELECT COUNT(*) FROM filiacoes WHERE user_id = p.id) as total_requests
            FROM filiacoes f
            JOIN profiles p ON f.user_id = p.id
            LEFT JOIN documentos d ON f.id = d.filiacao_id AND d.tipo_documento = 'ficha_assinada'
            WHERE f.id = (SELECT MAX(id) FROM filiacoes WHERE user_id = p.id) -- Obter apenas a solicitação mais recente por usuário
            ORDER BY f.data_solicitacao DESC
        `);

        // Também podemos querer buscar o histórico COMPLETO para a visualização de detalhes.
        // Por enquanto, retornamos o estado "Mais Recente" para a lista, e o frontend pode solicitar detalhes.
        // Retornar "Mais Recente" por usuário é mais limpo para a tabela principal.

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

        // 0. Verificar se o Admin existe (Prevenir falha de restrição FK se o token estiver obsoleto)
        const adminExists = await db.get('SELECT id FROM profiles WHERE id = ?', [adminId]);
        if (!adminExists) {
            return res.status(401).json({ error: 'Sessão inválida ou expirada. Por favor, faça login novamente.' });
        }

        // 1. Obter a filiação e o usuário
        const filiacao = await db.get('SELECT user_id FROM filiacoes WHERE id = ?', [id]);
        if (!filiacao) return res.status(404).json({ error: 'Affiliation not found' });

        const user = await db.get('SELECT * FROM profiles WHERE id = ?', [filiacao.user_id]);
        if (!user) return res.status(404).json({ error: 'User associated with this affiliation not found.' });

        // 2. Gerar senha temporária
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        // 3. Atualizar Perfil (Ativar + Definir Senha + Forçar Troca)
        await db.run(
            "UPDATE profiles SET status_conta = 'ativo', password_hash = ?, change_password_required = 1 WHERE id = ?",
            [hashedPassword, filiacao.user_id]
        );

        // 4. Atualizar Filiação
        await db.run(
            "UPDATE filiacoes SET status = 'concluido', data_aprovacao = CURRENT_TIMESTAMP, aprovado_por_admin_id = ?, observacoes_admin = ? WHERE id = ?",
            [adminId, observacoes || 'Aprovado pelo admin', id]
        );

        // 5. Registrar Auditoria (Não bloqueante)
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

        // 6. Enviar Email (Não bloqueante)
        try {
            const userEmail = user.email || `${user.cpf}@empresax.com`;
            await emailService.sendPasswordEmail(userEmail, tempPassword);
        } catch (emailErr) {
            console.error('Email Send Failed:', emailErr.message);
        }

        // 7. DELETAR Chat de Filiação (Requisito: Chat temporário deve sumir ao aprovar)
        await db.run('DELETE FROM filiation_chat WHERE filiacao_id = ?', [id]);

        // APENAS DEV: Retornar senha temporária
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

        // Atualizar status do perfil de volta para pendente_docs ou similar? Ou manter como em_analise mas deixá-los re-enviar?
        // Vamos definir para 'pendente_docs' para que saibam que precisam enviar algo novo.
        await db.run("UPDATE profiles SET status_conta = 'pendente_docs' WHERE id = ?", [filiacao.user_id]);

        // Registrar Auditoria
        await auditService.logAction(adminId, 'REJECT_AFFILIATION', id, {
            user_name: user?.nome_completo,
            user_cpf: user?.cpf,
            reason: observacoes
        });

        // Mensagem automática no Chat
        await db.run(`
            INSERT INTO filiation_chat (filiacao_id, sender_id, message)
            VALUES (?, ?, ?)
        `, [id, adminId, 'Sua solicitação foi atualizada para "Rejeitado". Olá, estou à disposição para ajudar a corrigir as pendências.']);

        res.status(200).json({ message: 'Affiliation rejected.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.assumeAffiliation = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;

    try {
        const db = await getDb();

        // Check if already assumed
        const current = await db.get('SELECT responsavel_admin_id, protocolo FROM filiacoes WHERE id = ?', [id]);
        if (!current) return res.status(404).json({ error: 'Affiliation not found' });

        if (current.responsavel_admin_id && current.responsavel_admin_id !== adminId) {
            // Check if Super Admin? For now, just block.
            return res.status(400).json({ error: 'Este protocolo já está sendo atendido por outro administrador.' });
        }

        if (current.responsavel_admin_id === adminId) {
            return res.status(200).json({ message: 'Você já assumiu este protocolo.', protocol: current.protocolo });
        }

        // Assume
        await db.run(
            `UPDATE filiacoes SET responsavel_admin_id = ?, status_atendimento = 'em_andamento' WHERE id = ?`,
            [adminId, id]
        );

        // Notify in chat
        await db.run(`
            INSERT INTO filiation_chat (filiacao_id, sender_id, message)
            VALUES (?, ?, ?)
        `, [id, adminId, `Olá, eu sou o administrador ${req.user.nome} e assumi seu protocolo ${current.protocolo}. Como posso ajudar?`]);

        res.json({ message: 'Protocolo assumido com sucesso.', protocol: current.protocolo });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.requestTransfer = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id; // The requestor

    try {
        const db = await getDb();
        const filiacao = await db.get('SELECT responsavel_admin_id FROM filiacoes WHERE id = ?', [id]);

        if (!filiacao) return res.status(404).json({ error: 'Filiation not found' });
        if (filiacao.responsavel_admin_id !== adminId) return res.status(403).json({ error: 'Você não é o responsável por este protocolo.' });

        await db.run(
            `UPDATE filiacoes SET transfer_status = 'pending' WHERE id = ?`,
            [id]
        );

        res.json({ message: 'Solicitação de transferência enviada ao Super Admin.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.denyTransferRequest = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    if (requesterRole !== 'super_admin') {
        return res.status(403).json({ error: 'Apenas Super Admins podem gerenciar transferências.' });
    }

    try {
        const db = await getDb();
        const filiacao = await db.get('SELECT responsavel_admin_id FROM filiacoes WHERE id = ?', [id]);

        if (!filiacao) return res.status(404).json({ error: 'Filiação não encontrada.' });

        await db.run(
            `UPDATE filiacoes SET transfer_status = NULL WHERE id = ?`,
            [id]
        );

        await db.run(`
            INSERT INTO filiation_chat (filiacao_id, sender_id, message)
            VALUES (?, ?, ?)
        `, [id, requesterId, `Solicitação de transferência negada.`]);

        res.json({ message: 'Solicitação de transferência negada.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.transferAffiliation = async (req, res) => {
    const { id } = req.params;
    const { targetAdminId } = req.body;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    try {
        if (requesterRole !== 'super_admin') {
            return res.status(403).json({ error: 'Apenas Super Admins podem transferir atendimentos.' });
        }

        const db = await getDb();

        // Check affiliation
        const current = await db.get('SELECT responsavel_admin_id, protocolo FROM filiacoes WHERE id = ?', [id]);

        if (!current) return res.status(404).json({ error: 'Filiação não encontrada.' });

        // Check target admin
        const targetAdmin = await db.get('SELECT id, nome_completo, email FROM profiles WHERE id = ?', [targetAdminId]);
        if (!targetAdmin) return res.status(404).json({ error: 'Admin de destino não encontrado.' });

        // Update (Clear transfer_status if it was set)
        await db.run(
            `UPDATE filiacoes SET responsavel_admin_id = ?, status_atendimento = 'em_andamento', transfer_status = NULL WHERE id = ?`,
            [targetAdminId, id]
        );

        // Notify in Chat
        await db.run(`
            INSERT INTO filiation_chat (filiacao_id, sender_id, message)
            VALUES (?, ?, ?)
        `, [id, requesterId, `Atendimento transferido para o administrador ${targetAdmin.nome_completo}.`]);

        // Audit
        await auditService.logAction(requesterId, 'TRANSFER_AFFILIATION', id, {
            from: current.responsavel_admin_id,
            to: targetAdminId,
            to_name: targetAdmin.nome_completo
        });

        res.json({ message: `Atendimento transferido para ${targetAdmin.nome_completo}.` });

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

        // Update query to fetch protocol info and responsible admin
        const filiacao = await db.get(`
            SELECT 
                f.id, f.status, f.observacoes_admin, f.data_aprovacao, f.protocolo, f.status_atendimento,
                p_admin.nome_completo as responsavel_nome
            FROM filiacoes f
            LEFT JOIN profiles p_admin ON f.responsavel_admin_id = p_admin.id
            WHERE f.user_id = ? 
            ORDER BY f.data_solicitacao DESC 
            LIMIT 1
        `, [user.id]);

        if (!filiacao) return res.status(404).json({ error: 'Nenhuma solicitação encontrada.' });

        // Check for messages
        const messageCount = await db.get(
            'SELECT COUNT(*) as count FROM filiation_chat WHERE filiacao_id = ?',
            [filiacao.id]
        );

        res.json({
            id: filiacao.id,
            nome: user.nome_completo,
            status: filiacao.status, // em_processamento, concluido, rejeitado
            observacoes: filiacao.observacoes_admin,
            status_conta: user.status_conta,
            message_count: messageCount?.count || 0,
            protocolo: filiacao.protocolo || 'Pendente',
            responsavel: filiacao.responsavel_nome || null,
            status_atendimento: filiacao.status_atendimento
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

exports.getChatMessages = async (req, res) => {
    const { id } = req.params; // id da filiação
    const cpfHeader = req.headers['x-cpf'];

    try {
        const db = await getDb();

        const filiacao = await db.get(`
            SELECT f.user_id, p.cpf 
            FROM filiacoes f 
            JOIN profiles p ON f.user_id = p.id 
            WHERE f.id = ?
        `, [id]);

        if (!filiacao) return res.status(404).json({ error: 'Filiation not found' });

        const isPublicAccess = cpfHeader && filiacao.cpf.replace(/\D/g, '') === cpfHeader.replace(/\D/g, '');
        const isAuthAccess = req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.id === filiacao.user_id);

        if (!isPublicAccess && !isAuthAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Auto-clean para Rejeitados (7 dias de expiração)
        if (filiacao.status === 'rejeitado') {
            await db.run(`DELETE FROM filiation_chat WHERE filiacao_id = ? AND created_at < date('now', '-7 days')`, [id]);
        }

        const messages = await db.all(`
            SELECT c.*, p.nome_completo as sender_name, p.role as sender_role
            FROM filiation_chat c
            JOIN profiles p ON c.sender_id = p.id
            WHERE c.filiacao_id = ?
            ORDER BY c.created_at ASC
        `, [id]);

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const { hasProfanity } = require('../utils/profanity');

exports.sendChatMessage = async (req, res) => {
    const { id } = req.params; // id da filiação
    const { message } = req.body;
    const cpfHeader = req.headers['x-cpf'];

    console.log(`[ChatDebug] Sending message to ${id}. Content: ${message}. CPF Header: ${cpfHeader}, User ID: ${req.user?.id}`);

    // Filtro de Palavras (Simples)
    if (hasProfanity(message)) {
        return res.status(400).json({ error: 'Mensagem inadequada. Por favor, atente-se às regras do chat.' });
    }

    // Se acesso público (CPF), precisamos encontrar o ID do usuário para definir como remetente
    // Se acesso autenticado (Token), usamos req.user.id

    try {
        const db = await getDb();

        const filiacao = await db.get(`
            SELECT f.user_id, p.cpf 
            FROM filiacoes f 
            JOIN profiles p ON f.user_id = p.id 
            WHERE f.id = ?
        `, [id]);

        if (!filiacao) return res.status(404).json({ error: 'Filiation not found' });

        let senderId;

        if (cpfHeader && filiacao.cpf.replace(/\D/g, '') === cpfHeader.replace(/\D/g, '')) {
            senderId = filiacao.user_id; // O próprio usuário
        } else if (req.user && (req.user.role === 'admin' || req.user.role === 'super_admin' || req.user.id === filiacao.user_id)) {
            senderId = req.user.id;
        } else {
            return res.status(403).json({ error: 'Access denied' });
        }

        await db.run(`
            INSERT INTO filiation_chat (filiacao_id, sender_id, message)
            VALUES (?, ?, ?)
        `, [id, senderId, message]);

        res.json({ message: 'Message sent' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
