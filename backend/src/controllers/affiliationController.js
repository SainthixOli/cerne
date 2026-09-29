const pdfService = require('../services/pdfService');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const knex = require('../config/connection');
const storage = require('../services/localStorage');
const uploadGrant = require('../services/uploadGrant');
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
const { sendError } = require('../utils/apiResponse');
const affiliationRepository = require('../repositories/affiliationRepository');

exports.register = async (req, res) => {
    try {
        const data = {
            ...req.body,
            cpf: req.body?.cpf?.replace(/\D/g, ''),
            email: req.body?.email?.trim().toLowerCase()
        };
        if (!/^\d{11}$/.test(data.cpf || '') || !data.email) {
            return res.status(400).json({ error: 'CPF e email são obrigatórios.' });
        }
        const tenantId = req.tenantId;
        const result = await knex.transaction(async (trx) => {
            const matchingProfiles = await trx('profiles')
                .where('tenant_id', tenantId)
                .andWhere((builder) => builder
                    .whereRaw("REPLACE(REPLACE(cpf, '.', ''), '-', '') = ?", [data.cpf])
                    .orWhereRaw('LOWER(email) = ?', [data.email]));
            if (matchingProfiles.length > 1) {
                const error = new Error('Cadastro ambíguo neste tenant.');
                error.statusCode = 409;
                throw error;
            }
            const existingProfile = matchingProfiles[0];
            if (existingProfile && (existingProfile.cpf.replace(/\D/g, '') !== data.cpf ||
                existingProfile.email?.toLowerCase() !== data.email || existingProfile.status_conta === 'ativo')) {
                const error = new Error('Cadastro já existente ou dados divergentes neste tenant.');
                error.statusCode = 409;
                throw error;
            }

            const profileId = existingProfile?.id || uuidv4();
            const profile = {
                nome_completo: data.nome,
                cpf: data.cpf,
                email: data.email,
                telefone: data.telefone || '',
                matricula_funcional: data.matricula || '',
                rg: data.rg || '',
                orgao_emissor: data.orgao_emissor || '',
                nacionalidade: data.nacionalidade || '',
                estado_civil: data.estado_civil || '',
                cep: data.cep || '',
                endereco: data.endereco || '',
                numero: data.numero || '',
                complemento: data.complemento || '',
                bairro: data.bairro || '',
                cidade: data.cidade || '',
                uf: data.uf || '',
                status_conta: 'pendente_docs',
                tenant_id: tenantId
            };
            if (existingProfile) await trx('profiles').where({ id: profileId, tenant_id: tenantId }).update(profile);
            else await trx('profiles').insert({ id: profileId, role: 'professor', ...profile });

            const protocol = `#${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
            const inserted = await trx('filiacoes').insert({
                user_id: profileId,
                status: 'em_processamento',
                protocolo: protocol,
                status_atendimento: 'aberto',
                tenant_id: tenantId
            }, ['id']);
            const affiliationId = typeof inserted[0] === 'object' ? inserted[0].id : inserted[0];
            const uploadToken = await uploadGrant.issue(trx, affiliationId, tenantId);
            return { uploadToken };
        });

        const uploadToken = result.uploadToken;
        res.setHeader('X-Upload-Token', uploadToken);
        res.setHeader('Cache-Control', 'no-store');

        // Gerar PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=filiacao_${data.nome}.pdf`);

        pdfService.generateAffiliationPDF(data, res, tenantId);

    } catch (error) {
        if (error.statusCode === 409) return res.status(409).json({ error: error.message });
        console.error(error);
        return sendError(res, 500, undefined, 'REGISTRATION_FAILED');
    }
};

exports.uploadSignedForm = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' });
    try {
        const grant = req.uploadGrant;
        const now = new Date().toISOString();
        const documentId = await knex.transaction(async (trx) => {
            const consumed = await trx('affiliation_upload_tokens')
                .where({ token_hash: grant.tokenHash, filiacao_id: grant.affiliationId, tenant_id: req.tenantId })
                .whereNull('used_at').where('expires_at', '>', now)
                .update({ used_at: now });
            if (consumed !== 1) {
                const error = new Error('Invalid upload grant');
                error.invalidGrant = true;
                throw error;
            }
            const affiliation = await trx('filiacoes as f')
                .join('profiles as p', 'p.id', 'f.user_id')
                .select('f.id', 'f.user_id')
                .where('f.id', grant.affiliationId)
                .where('f.tenant_id', req.tenantId)
                .where('p.tenant_id', req.tenantId)
                .where('f.user_id', grant.userId)
                .where('f.status', 'em_processamento')
                .first();
            if (!affiliation) {
                const error = new Error('Invalid affiliation');
                error.invalidGrant = true;
                throw error;
            }
            const [{ id }] = await trx('documentos').insert({
                user_id: grant.userId,
                filiacao_id: grant.affiliationId,
                url_arquivo: req.file.storageKey,
                tipo_documento: 'ficha_assinada',
                tenant_id: req.tenantId
            }).returning('id');
            await trx('profiles').where({ id: grant.userId, tenant_id: req.tenantId })
                .update({ status_conta: 'em_analise' });
            return id;
        });

        return res.status(200).json({ message: 'File uploaded successfully', documentId });
    } catch (error) {
        await storage.remove(req.file.storageKey).catch(() => {});
        if (error.invalidGrant) return res.status(403).json({ error: 'Autorização de upload inválida' });
        return res.status(500).json({ error: 'Erro ao salvar documento' });
    }
};

exports.getAllAffiliations = async (req, res) => {
    try {
        const rows = await affiliationRepository.listLatestByTenant(req.tenantId);

        res.status(200).json(rows);
    } catch (error) {
        return sendError(res, 500, undefined, 'AFFILIATION_LIST_FAILED');
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
        return sendError(res, 500, undefined, 'AFFILIATION_REJECTION_FAILED');
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
        return sendError(res, 500, undefined, 'AFFILIATION_ASSIGNMENT_FAILED');
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
        return sendError(res, 500, undefined, 'TRANSFER_REQUEST_FAILED');
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
        return sendError(res, 500, undefined, 'TRANSFER_DENIAL_FAILED');
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
        return sendError(res, 500, undefined, 'AFFILIATION_TRANSFER_FAILED');
    }
};

exports.checkStatus = async (req, res) => {
    const { cpf } = req.body;
    try {
        const payload = await checkStatusByCpf(cpf, req.tenantId);
        res.json(payload);
    } catch (error) {
        if (error instanceof QueryServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        console.error(error);
        return sendError(res, 500, undefined, 'AFFILIATION_STATUS_FAILED');
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
        return sendError(res, 500, undefined, 'AFFILIATION_HISTORY_FAILED');
    }
};

exports.getCertificate = async (req, res) => {
    try {
        const userId = req.user.id;
        const tenantId = req.tenantId;
        const user = await affiliationRepository.getUserById(userId, tenantId);

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=carteirinha.pdf');

        pdfService.generateCertificate(user, res);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error generating certificate' });
    }
};

exports.getChatMessages = async (req, res) => {
    const { id } = req.params; // id da filiação

    try {
        const messages = await getChatMessagesService({
            affiliationId: id,
            reqUser: req.user,
            tenantId: req.tenantId
        });
        res.json(messages);
    } catch (error) {
        if (error instanceof ChatServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return sendError(res, 500, undefined, 'CHAT_READ_FAILED');
    }
};

exports.sendChatMessage = async (req, res) => {
    const { id } = req.params; // id da filiação
    const { message } = req.body;

    try {
        await sendChatMessageService({
            affiliationId: id,
            message,
            reqUser: req.user,
            tenantId: req.tenantId
        });

        res.json({ message: 'Message sent' });
    } catch (error) {
        if (error instanceof ChatServiceError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        return sendError(res, 500, undefined, 'CHAT_SEND_FAILED');
    }
};

// --- Desfiliação / Reativação ---

exports.requestDisaffiliation = async (req, res) => {
    try {
        const userId = req.user.id;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

        const lastAffiliation = await affiliationRepository.getLatestAffiliationByUserId(userId, tenantId);

        if (!lastAffiliation) return res.status(404).json({ error: 'Afiliação não encontrada' });

        await affiliationRepository.updateAffiliationStatus(lastAffiliation.id, tenantId,
            'solicitando_desfiliacao', 'em_andamento');

        await auditService.logAction(userId, 'REQUEST_DISAFFILIATION', lastAffiliation.id,
            { reason: 'Solicitado pelo usuário' }, tenantId);

        res.json({ message: 'Solicitação de desfiliação enviada.' });
    } catch (error) {
        return sendError(res, 500, undefined, 'DISAFFILIATION_REQUEST_FAILED');
    }
};

exports.approveDisaffiliation = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        await knex.transaction(async (trx) => {
            const affiliation = await trx('filiacoes').select('user_id')
                .where({ id, tenant_id: tenantId }).first();
            if (!affiliation) throw new ServiceError('Affiliation not found', 404);
            await trx('filiacoes').where({ id, tenant_id: tenantId })
                .update({ status: 'desfiliado', status_atendimento: 'concluido' });
            await trx('profiles').where({ id: affiliation.user_id, tenant_id: tenantId })
                .update({ status_conta: 'inativo' });
        });

        await auditService.logAction(req.user.id, 'APPROVE_DISAFFILIATION', id, {}, tenantId);
        res.json({ message: 'Desfiliação concluída.' });
    } catch (error) {
        return sendError(res, 500, undefined, 'DISAFFILIATION_APPROVAL_FAILED');
    }
};

exports.requestReactivation = async (req, res) => {
    try {
        const userId = req.user.id;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const affiliation = await affiliationRepository.getLatestAffiliationByUserId(userId, tenantId);
        if (!affiliation) return res.status(404).json({ error: 'Registro não encontrado' });

        await affiliationRepository.updateAffiliationStatus(affiliation.id, tenantId,
            'solicitando_reativacao', 'em_andamento');

        await auditService.logAction(userId, 'REQUEST_REACTIVATION', affiliation.id, {}, tenantId);
        res.json({ message: 'Solicitação de reativação enviada.' });
    } catch (error) {
        return sendError(res, 500, undefined, 'REACTIVATION_REQUEST_FAILED');
    }
};

exports.approveReactivation = async (req, res) => {
    try {
        const { id } = req.params;
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        await knex.transaction(async (trx) => {
            const affiliation = await trx('filiacoes').select('user_id')
                .where({ id, tenant_id: tenantId }).first();
            if (!affiliation) throw new ServiceError('Affiliation not found', 404);
            await trx('filiacoes').where({ id, tenant_id: tenantId })
                .update({ status: 'concluido', status_atendimento: 'concluido' });
            await trx('profiles').where({ id: affiliation.user_id, tenant_id: tenantId })
                .update({ status_conta: 'ativo' });
        });

        await auditService.logAction(req.user.id, 'APPROVE_REACTIVATION', id, {}, tenantId);
        res.json({ message: 'Conta reativada com sucesso.' });
    } catch (error) {
        return sendError(res, 500, undefined, 'REACTIVATION_APPROVAL_FAILED');
    }
};
