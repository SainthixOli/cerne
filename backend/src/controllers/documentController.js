const storage = require('../services/localStorage');
const auditService = require('../services/auditService');
const documentRepository = require('../repositories/documentRepository');

exports.serveDocument = async (req, res, next) => {
    const id = Number(req.params.documentId);
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(404).json({ error: 'Documento não encontrado' });

    try {
        const document = await documentRepository.findForAccess(id, req.tenantId);
        if (!document) return res.status(404).json({ error: 'Documento não encontrado' });

        const owner = document.user_id === req.user.id;
        const adminForAffiliation = req.user.role === 'admin' && document.authorized_affiliation_id != null &&
            (document.responsavel_admin_id == null || document.responsavel_admin_id === req.user.id);
        const tenantSuperAdmin = req.user.role === 'super_admin';
        if (!owner && !adminForAffiliation && !tenantSuperAdmin) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        let object;
        try {
            object = await storage.read(document.url_arquivo);
        } catch (_) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }
        const extension = object.mimeType === 'application/pdf' ? '.pdf' :
            object.mimeType === 'image/png' ? '.png' : '.jpg';
        res.set('Cache-Control', 'private, no-store');
        res.type(object.mimeType);
        res.set('Content-Disposition', `attachment; filename="documento${extension}"`);
        return res.send(object.buffer);
    } catch (error) {
        return next(error);
    }
};

exports.getMyDocuments = async (req, res, next) => {
    try {
        const documents = await documentRepository.listForUser(req.user.id, req.tenantId);
        return res.json(documents);
    } catch (error) {
        return next(error);
    }
};

exports.uploadDocument = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' });
    let persisted = false;
    try {
        const affiliation = await documentRepository.latestAffiliationForUser(req.user.id, req.tenantId);
        const documentId = await documentRepository.create({
            userId: req.user.id,
            affiliationId: affiliation?.id || null,
            storageKey: req.file.storageKey,
            type: 'outro',
            tenantId: req.tenantId
        });
        persisted = true;
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            await auditService.logAction(req.user.id, 'UPLOAD_DOCUMENT', affiliation?.id || req.user.id,
                { documentId, type: 'outro' }, req.tenantId);
        }
        return res.json({ message: 'Document uploaded', id: documentId });
    } catch (error) {
        if (!persisted) await storage.remove(req.file.storageKey).catch(() => {});
        return res.status(500).json({ error: 'Erro ao salvar documento' });
    }
};

exports.uploadTemplate = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' });
    try {
        const documentId = await documentRepository.create({
            userId: req.user.id,
            storageKey: req.file.storageKey,
            type: 'template',
            tenantId: req.tenantId
        });
        return res.json({ message: 'Template uploaded successfully', id: documentId });
    } catch (error) {
        await storage.remove(req.file.storageKey).catch(() => {});
        return res.status(500).json({ error: 'Erro ao salvar template' });
    }
};
