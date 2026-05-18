const { getDb } = require('../config/database');
const path = require('path');
const fs = require('fs');

exports.serveDocument = async (req, res) => {
    const { filename } = req.params;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    // Segurança: Prevenir travessia de diretório
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../../uploads', safeFilename);

    try {
        // Verificar se o arquivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        const db = await getDb();

        // SECURITY FIX: Verificação de propriedade robusta
        const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
        
        if (!isAdmin) {
            // Usuários comuns: Verificação rigorosa de propriedade
            const document = await db.get(
                'SELECT user_id FROM documentos WHERE LOWER(url_arquivo) LIKE LOWER(?) AND tenant_id = ? LIMIT 1',
                [`%${safeFilename}`, tenantId]
            );

            if (!document) {
                return res.status(404).json({ error: 'Documento não encontrado' });
            }

            // Verificação explícita de propriedade
            if (document.user_id !== req.user.id) {
                return res.status(403).json({ 
                    error: 'Acesso negado: este documento não é seu',
                    code: 'FORBIDDEN_DOCUMENT_ACCESS'
                });
            }
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar documento' });
    }
};

exports.getMyDocuments = async (req, res) => {
    try {
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const db = await getDb();
        const userId = req.user.id;

        const documents = await db.all(`
      SELECT d.id, d.tipo_documento, d.url_arquivo, d.data_upload
      FROM documentos d
      JOIN filiacoes f ON d.filiacao_id = f.id AND f.tenant_id = ?
      WHERE f.user_id = ? AND d.tenant_id = ?
    `, [tenantId, userId, tenantId]);

        res.json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar documentos' });
    }
};

const auditService = require('../services/auditService');

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const db = await getDb();
        const userId = req.user.id;
        const filePath = req.file.path;

        // Encontrar ID da filiação (opcional, mas bom vincular se existir)
        const filiacao = await db.get('SELECT id FROM filiacoes WHERE user_id = ? AND tenant_id = ? ORDER BY data_solicitacao DESC LIMIT 1', [userId, tenantId]);
        const filiacaoId = filiacao ? filiacao.id : null;

        await db.run(
            `INSERT INTO documentos (user_id, filiacao_id, url_arquivo, tipo_documento, tenant_id) VALUES (?, ?, ?, 'outro', ?)`,
            [userId, filiacaoId, filePath, tenantId]
        );

        // Audit Log
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            await auditService.logAction(userId, 'UPLOAD_DOCUMENT', filiacaoId || userId, { filename: req.file.filename, type: 'outro' }, tenantId);
        }

        res.json({ message: 'Document uploaded', filename: req.file.filename });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading document' });
    }
};
exports.uploadTemplate = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Em uma aplicação real, poderíamos armazenar este caminho em uma tabela de 'configurações'
        // Por enquanto, assumimos que está salvo em uploads/ com um nome específico ou apenas usamos o arquivo fornecido

        res.json({
            message: 'Template uploaded successfully',
            filename: req.file.filename,
            originalName: req.file.originalname
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload template' });
    }
};
