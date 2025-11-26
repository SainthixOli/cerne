const { getDb } = require('../config/database');

exports.getProfile = async (req, res) => {
    try {
        const db = await getDb();
        const userId = req.user.id; // From JWT middleware

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
