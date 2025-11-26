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
