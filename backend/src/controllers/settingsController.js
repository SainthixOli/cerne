const { getDb } = require('../config/database');

exports.getSettings = async (req, res) => {
    try {
        const db = await getDb();
        const settings = await db.all('SELECT * FROM system_settings');

        // Convert array to object key-value for easier frontend usage
        const formattedSettings = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        res.json(formattedSettings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Erro ao buscar configurações.' });
    }
};

exports.updateSetting = async (req, res) => {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
        return res.status(400).json({ error: 'Valor da configuração é obrigatório.' });
    }

    try {
        const db = await getDb();
        await db.run(
            'INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP',
            [key, value, value]
        );

        res.json({ message: 'Configuração atualizada com sucesso.', key, value });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Erro ao atualizar configuração.' });
    }
};
