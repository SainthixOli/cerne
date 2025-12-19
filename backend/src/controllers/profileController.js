const { getDb } = require('../config/database');

exports.getProfile = async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id; // Do middleware JWT

        const profile = await db.get(`
      SELECT p.*, f.status as status_filiacao
      FROM profiles p
      LEFT JOIN filiacoes f ON p.id = f.user_id
      WHERE p.id = ?
    `, [userId]);

        if (!profile) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }

        res.json(profile);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id;
        const { nome_completo, telefone, email, matricula_funcional } = req.body;

        await db.run(`
      UPDATE profiles 
      SET nome_completo = ?, telefone = ?, email = ?, matricula_funcional = ?
      WHERE id = ?
    `, [nome_completo, telefone, email, matricula_funcional, userId]);

        res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
};

exports.uploadPhoto = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const db = await getDb();
        const userId = req.user.id;
        const photoUrl = req.file.path; // Em app real, enviar para S3/Cloudinary e obter URL

        // Assuming we have a photo_url column. If not, we might need to add it or use a generic 'documents' table linked to profile?
        // Let's check schema. Schema doesn't have photo_url.
        // We should add it or store in documents table with type 'profile_photo'.
        // Storing in documents table is cleaner if we want to keep history, but profile_photo usually is just one.
        // Let's add photo_url to profiles table or just use documents table.
        // Let's use documents table for now to avoid schema change if possible, OR just add column.
        // Adding column is better for profile.

        // Wait, I can't change schema easily without migration script or manual SQL.
        // I already added reset_token. I can add photo_url.

        await db.run('UPDATE profiles SET photo_url = ? WHERE id = ?', [photoUrl, userId]);

        res.json({ message: 'Photo uploaded', photoUrl });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error uploading photo' });
    }
};
