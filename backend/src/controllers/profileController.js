const authRepository = require('../repositories/authRepository');
const auditService = require('../services/auditService');
const storage = require('../services/localStorage');

const EDITABLE_FIELDS = ['nome_completo', 'telefone', 'email', 'matricula_funcional'];

exports.getProfile = async (req, res) => {
    try {
        const profile = await authRepository.findByIdWithAffiliation(req.user.id, req.user.profileTenantId);
        if (!profile) return res.status(404).json({ error: 'Perfil não encontrado' });
        const { password_hash, reset_token, reset_token_expires, ...visible } = profile;
        visible.photo_url = profile.photo_url ? '/api/profile/photo' : null;
        return res.json(visible);
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
};

exports.updateProfile = async (req, res) => {
    if (!req.body || Object.keys(req.body).some((key) => !EDITABLE_FIELDS.includes(key))) {
        return res.status(400).json({ error: 'Campo não permitido para alteração' });
    }
    if (Object.keys(req.body).length === 0) return res.status(400).json({ error: 'Nenhuma alteração enviada' });
    try {
        const changes = Object.fromEntries(EDITABLE_FIELDS
            .filter((field) => Object.hasOwn(req.body, field))
            .map((field) => [field, req.body[field]]));
        const updated = await authRepository.updateProfile(req.user.id, changes, req.user.profileTenantId);
        if (updated !== 1) return res.status(404).json({ error: 'Perfil não encontrado' });
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            await auditService.logAction(req.user.id, 'UPDATE_PROFILE', req.user.id,
                { changedFields: Object.keys(changes) }, req.user.profileTenantId);
        }
        return res.json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
        return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
};

exports.servePhoto = async (req, res) => {
    try {
        const profile = await authRepository.findById(req.user.id, req.user.profileTenantId);
        if (!profile?.photo_url) return res.status(404).json({ error: 'Foto não encontrada' });
        const object = await storage.read(profile.photo_url);
        if (!['image/jpeg', 'image/png'].includes(object.mimeType)) {
            return res.status(404).json({ error: 'Foto não encontrada' });
        }
        res.type(object.mimeType);
        res.set('Cache-Control', 'private, no-store');
        res.set('Content-Disposition', 'inline');
        return res.send(object.buffer);
    } catch (error) {
        return res.status(404).json({ error: 'Foto não encontrada' });
    }
};

exports.uploadPhoto = async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Arquivo obrigatório' });
    let persisted = false;
    try {
        const old = await authRepository.findById(req.user.id, req.user.profileTenantId);
        if (!old) {
            await storage.remove(req.file.storageKey);
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }
        const updated = await authRepository.updateProfile(req.user.id,
            { photo_url: req.file.storageKey }, req.user.profileTenantId);
        if (updated !== 1) {
            await storage.remove(req.file.storageKey);
            return res.status(404).json({ error: 'Perfil não encontrado' });
        }
        persisted = true;
        if (old.photo_url && old.photo_url !== req.file.storageKey) {
            await storage.remove(old.photo_url).catch(() => {});
        }
        return res.json({ message: 'Foto atualizada', photoUrl: '/api/profile/photo' });
    } catch (error) {
        if (!persisted) await storage.remove(req.file.storageKey).catch(() => {});
        return res.status(500).json({ error: 'Erro ao salvar foto' });
    }
};
