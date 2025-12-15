const { getDb } = require('../config/database');
const path = require('path');
const fs = require('fs');

exports.serveDocument = async (req, res) => {
    const { filename } = req.params;

    // Security: Prevent directory traversal
    const safeFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../../uploads', safeFilename);

    try {
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Documento não encontrado' });
        }

        // TODO: Add permission check here (is user admin or owner?)
        // For now, assuming the route is protected by auth middleware (to be added)

        res.sendFile(filePath);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar documento' });
    }
};

exports.getMyDocuments = async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;

        const documents = await db.all(`
      SELECT d.id, d.tipo_documento, d.url_arquivo, d.data_upload
      FROM documentos d
      JOIN filiacoes f ON d.filiacao_id = f.id
      WHERE f.user_id = ?
    `, [userId]);

        res.json(documents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar documentos' });
    }
};

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const db = await getDb();
        const userId = req.user.id;
        const filePath = req.file.path;

        // Find filiacao id (optional, but good to link if exists)
        const filiacao = await db.get('SELECT id FROM filiacoes WHERE user_id = ? ORDER BY data_solicitacao DESC LIMIT 1', [userId]);
        const filiacaoId = filiacao ? filiacao.id : null;

        await db.run(
            `INSERT INTO documentos (user_id, filiacao_id, url_arquivo, tipo_documento) VALUES (?, ?, ?, 'outro')`,
            [userId, filiacaoId, filePath]
        );

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

        // In a real app, we might store this path in a 'settings' table
        // For now, we assume it's saved in uploads/ with a specific name or just use the file provided

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
