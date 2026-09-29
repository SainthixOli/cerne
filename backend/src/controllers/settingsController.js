const settingsRepository = require('../repositories/settingsRepository');

exports.getSettings = async (req, res) => {
    try {
        const settings = await settingsRepository.list(req.tenantId);

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
        await settingsRepository.upsert(key, value, req.tenantId);

        res.json({ message: 'Configuração atualizada com sucesso.', key, value });
    } catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({ error: 'Erro ao atualizar configuração.' });
    }
};
