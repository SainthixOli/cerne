const { getDb } = require('../config/database');
const pdfService = require('../services/pdfService');
const { v4: uuidv4 } = require('uuid');
const { approveAffiliation: approveAffiliationService, rejectAffiliation: rejectAffiliationService, ServiceError } = require('../services/affiliationReviewService');
const {
    assumeAffiliation: assumeAffiliationService,
    requestTransfer: requestTransferService,
    denyTransferRequest: denyTransferRequestService,
    transferAffiliation: transferAffiliationService,
    TransferServiceError
} = require('../services/affiliationTransferService');
const { checkStatusByCpf, getAffiliationHistory: getAffiliationHistoryService, QueryServiceError } = require('../services/affiliationQueryService');
const { getChatMessages: getChatMessagesService, sendChatMessage: sendChatMessageService, ChatServiceError } = require('../services/affiliationChatService');

exports.register = async (req, res) => {
    try {
        const data = req.body;
        const db = await getDb();
        const tenantId = 1;  // ✅ NOVO: Default tenant para endpoints públicos

        // 1. Verificar se o perfil existe por CPF OU Email
        // Isso permite vincular "Frank Ocean" (CPF errado) a "Frank Ocean" (CPF correto) se o email for o mesmo.
        const existingProfile = await db.get(
            'SELECT * FROM profiles WHERE cpf = ? OR email = ? AND tenant_id = ?',
            [data.cpf, data.email, tenantId]
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
                WHERE id = ? AND tenant_id = ?`,
                [
                    data.nome, data.cpf, data.telefone || '', data.matricula || '',
                    data.rg || '', data.orgao_emissor || '', data.nacionalidade || '', data.estado_civil || '',
                    data.cep || '', data.endereco || '', data.numero || '', data.complemento || '',
                    data.bairro || '', data.cidade || '', data.uf || '',
                    profileId, tenantId
                ]
            );
        } else {
            profileId = uuidv4();
            await db.run(
                `INSERT INTO profiles(
                    id, nome_completo, cpf, email, telefone, matricula_funcional, 
                    rg, orgao_emissor, nacionalidade, estado_civil,
                    cep, endereco, numero, complemento, bairro, cidade, uf,
                    role, status_conta, tenant_id
                ) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'professor', 'pendente_docs', ?)`,
                [
                    profileId, data.nome, data.cpf, data.email, data.telefone || '', data.matricula || '',
                    data.rg || '', data.orgao_emissor || '', data.nacionalidade || '', data.estado_civil || '',
                    data.cep || '', data.endereco || '', data.numero || '', data.complemento || '',
                    data.bairro || '', data.cidade || '', data.uf || '', tenantId
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
            `INSERT INTO filiacoes (user_id, status, protocolo, status_atendimento, tenant_id) VALUES (?, 'em_processamento', ?, 'aberto', ?)`,
            [profileId, protocol, tenantId]
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
        const tenantId = 1;  // ✅ NOVO: Default tenant para endpoints públicos

        // Encontrar usuário por CPF
        const profile = await db.get('SELECT id FROM profiles WHERE cpf = ? AND tenant_id = ?', [cpf, tenantId]);

        if (!profile) {
            return res.status(404).json({ error: 'User not found. Please register first.' });
        }

        // Encontrar última filiação
        const filiacao = await db.get('SELECT id FROM filiacoes WHERE user_id = ? AND tenant_id = ? ORDER BY data_solicitacao DESC LIMIT 1', [profile.id, tenantId]);

        if (!filiacao) {
            return res.status(404).json({ error: 'Affiliation request not found.' });
        }

        // Inserir Documento
        await db.run(
            `INSERT INTO documentos (user_id, filiacao_id, url_arquivo, tipo_documento, tenant_id) VALUES (?, ?, ?, 'ficha_assinada', ?)`,
            [profile.id, filiacao.id, req.file.path, tenantId]
        );

        // Atualizar Status do Perfil
        await db.run('UPDATE profiles SET status_conta = ? WHERE id = ? AND tenant_id = ?', ['em_analise', profile.id, tenantId]);

        res.status(200).json({ message: 'File uploaded successfully', filename: req.file.filename });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAllAffiliations = async (req, res) => {
    try {
        const db = await getDb();
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
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
                (SELECT COUNT(*) FROM filiacoes WHERE user_id = p.id AND tenant_id = ?) as total_requests
            FROM filiacoes f
            JOIN profiles p ON f.user_id = p.id AND p.tenant_id = ?
            LEFT JOIN documentos d ON f.id = d.filiacao_id AND d.tipo_documento = 'ficha_assinada' AND d.tenant_id = ?
            WHERE f.tenant_id = ? AND f.id = (SELECT MAX(id) FROM filiacoes WHERE user_id = p.id AND tenant_id = ?)
            ORDER BY f.data_solicitacao DESC
        `, [tenantId, tenantId, tenantId, tenantId, tenantId]);

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
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        await approveAffiliationService({
            affiliationId: id,
            adminId,
            observacoes,
            tenantId  // ✅ NOVO: passar tenantId
        });

        res.status(200).json({ message: 'Affiliation approved.' });
    } catch (error) {
        if (error instanceof ServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error('Approve Affiliation Error:', error);
        res.status(500).json({ error: 'Erro interno ao aprovar filiação. Tente novamente.' });
    }
};

exports.rejectAffiliation = async (req, res) => {
    const { id } = req.params;
    const { observacoes } = req.body;
    const adminId = req.user.id;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        await rejectAffiliationService({
            affiliationId: id,
            adminId,
            observacoes,
            tenantId  // ✅ NOVO: passar tenantId
        });

        res.status(200).json({ message: 'Affiliation rejected.' });
    } catch (error) {
        if (error instanceof ServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.assumeAffiliation = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        const result = await assumeAffiliationService({
            affiliationId: id,
            adminId,
            tenantId,  // ✅ NOVO: passar tenantId
            adminName: req.user.nome
        });

        if (result.alreadyAssigned) {
            return res.status(200).json({ message: 'Você já assumiu este protocolo.', protocol: result.protocol });
        }

        res.json({ message: 'Protocolo assumido com sucesso.', protocol: result.protocol });

    } catch (error) {
        if (error instanceof TransferServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.requestTransfer = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.id; // The requestor
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        await requestTransferService({ affiliationId: id, adminId, tenantId });  // ✅ NOVO: passar tenantId

        res.json({ message: 'Solicitação de transferência enviada ao Super Admin.' });
    } catch (error) {
        if (error instanceof TransferServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.denyTransferRequest = async (req, res) => {
    const { id } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        await denyTransferRequestService({
            affiliationId: id,
            requesterId,
            requesterRole,
            tenantId  // ✅ NOVO: passar tenantId
        });

        res.json({ message: 'Solicitação de transferência negada.' });
    } catch (error) {
        if (error instanceof TransferServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.transferAffiliation = async (req, res) => {
    const { id } = req.params;
    const { targetAdminId } = req.body;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        const result = await transferAffiliationService({
            affiliationId: id,
            targetAdminId,
            requesterId,
            requesterRole,
            tenantId  // ✅ NOVO: passar tenantId
        });

        res.json({ message: `Atendimento transferido para ${result.targetAdminName}.` });

    } catch (error) {
        if (error instanceof TransferServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.checkStatus = async (req, res) => {
    const { cpf } = req.body;
    try {
        const payload = await checkStatusByCpf(cpf);
        res.json(payload);
    } catch (error) {
        if (error instanceof QueryServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getAffiliationHistory = async (req, res) => {
    const { userId } = req.params;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
    try {
        const history = await getAffiliationHistoryService(userId, tenantId);  // ✅ NOVO: passar tenantId
        res.json(history);
    } catch (error) {
        if (error instanceof QueryServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.getCertificate = async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const user = await db.get('SELECT * FROM profiles WHERE id = ? AND tenant_id = ?', [userId, tenantId]);

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
        const messages = await getChatMessagesService({
            affiliationId: id,
            cpfHeader,
            reqUser: req.user,
            tenantId: req.user?.tenantId  // ✅ NOVO: passar tenantId se autenticado
        });
        res.json(messages);
    } catch (error) {
        if (error instanceof ChatServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

exports.sendChatMessage = async (req, res) => {
    const { id } = req.params; // id da filiação
    const { message } = req.body;
    const cpfHeader = req.headers['x-cpf'];

    try {
        await sendChatMessageService({
            affiliationId: id,
            message,
            cpfHeader,
            reqUser: req.user,
            tenantId: req.user?.tenantId  // ✅ NOVO: passar tenantId se autenticado
        });

        res.json({ message: 'Message sent' });
    } catch (error) {
        if (error instanceof ChatServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

// --- Desfiliação / Reativação ---

exports.requestDisaffiliation = async (req, res) => {
    try {
        const userId = req.user.id;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

        const db = await getDb();
        // Buscar afiliação ativa
        const lastAffiliation = await db.get('SELECT * FROM filiacoes WHERE user_id = ? AND tenant_id = ? ORDER BY id DESC LIMIT 1', [userId, tenantId]);

        if (!lastAffiliation) return res.status(404).json({ error: 'Afiliação não encontrada' });

        await db.run('UPDATE filiacoes SET status = ?, status_atendimento = ? WHERE id = ? AND tenant_id = ?',
            ['solicitando_desfiliacao', 'em_andamento', lastAffiliation.id, tenantId]);

        await auditService.logAction(userId, 'REQUEST_DISAFFILIATION', lastAffiliation.id, { reason: 'Solicitado pelo usuário' });

        res.json({ message: 'Solicitação de desfiliação enviada.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveDisaffiliation = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const db = await getDb();

        await db.run(`
            UPDATE filiacoes 
            SET status = 'desfiliado', status_atendimento = 'concluido' 
            WHERE id = ? AND tenant_id = ?
        `, [id, tenantId]);

        const affiliation = await db.get('SELECT user_id FROM filiacoes WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (affiliation) {
            await db.run("UPDATE profiles SET status_conta = 'inativo' WHERE id = ? AND tenant_id = ?", [affiliation.user_id, tenantId]);
        }

        await auditService.logAction(req.user.id, 'APPROVE_DISAFFILIATION', id, {});
        res.json({ message: 'Desfiliação concluída.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.requestReactivation = async (req, res) => {
    try {
        const userId = req.user.id;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const db = await getDb();

        const affiliation = await db.get('SELECT * FROM filiacoes WHERE user_id = ? AND tenant_id = ? ORDER BY id DESC LIMIT 1', [userId, tenantId]);
        if (!affiliation) return res.status(404).json({ error: 'Registro não encontrado' });

        await db.run(`
            UPDATE filiacoes 
            SET status = 'solicitando_reativacao', status_atendimento = 'em_andamento' 
            WHERE id = ? AND tenant_id = ?
        `, [affiliation.id, tenantId]);

        await auditService.logAction(userId, 'REQUEST_REACTIVATION', affiliation.id, {});
        res.json({ message: 'Solicitação de reativação enviada.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.approveReactivation = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const db = await getDb();

        await db.run(`
            UPDATE filiacoes 
            SET status = 'concluido', status_atendimento = 'concluido' 
            WHERE id = ? AND tenant_id = ?
        `, [id, tenantId]);

        const affiliation = await db.get('SELECT user_id FROM filiacoes WHERE id = ? AND tenant_id = ?', [id, tenantId]);
        if (affiliation) {
            await db.run("UPDATE profiles SET status_conta = 'ativo' WHERE id = ? AND tenant_id = ?", [affiliation.user_id, tenantId]);
        }

        await auditService.logAction(req.user.id, 'APPROVE_REACTIVATION', id, {});
        res.json({ message: 'Conta reativada com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
