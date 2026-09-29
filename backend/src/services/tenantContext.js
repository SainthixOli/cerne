const authRepository = require('../repositories/authRepository');
const tenantRepository = require('../repositories/tenantRepository');

class TenantContextError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}

const active = (tenant) => tenant && tenant.status === 'ATIVO';

async function requireActiveTenantBySlug(slug) {
    if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(slug)) {
        throw new TenantContextError('Tenant explícito obrigatório', 400);
    }
    const tenant = await tenantRepository.findBySlug(slug);
    if (!tenant) throw new TenantContextError('Tenant não encontrado', 404);
    if (!active(tenant)) throw new TenantContextError('Tenant indisponível', 403);
    return tenant;
}

async function hasTenantAccess(profile, tenantId) {
    if (profile.tenant_id === tenantId) return true;
    if (profile.role !== 'super_admin') return false;
    return tenantRepository.hasSuperAdminLink(profile.id, tenantId);
}

async function hasActiveHomeTenant(profile, selectedTenantId) {
    if (!Number.isInteger(profile.tenant_id) || profile.tenant_id <= 0) return false;
    if (profile.tenant_id === selectedTenantId) return true;
    const homeTenant = await tenantRepository.findById(profile.tenant_id);
    return active(homeTenant);
}

async function findAccountByCpfInTenant(cpf, tenantId) {
    if (typeof cpf !== 'string' || !/^\d{11}$/.test(cpf.replace(/\D/g, ''))) {
        throw new TenantContextError('CPF inválido', 400);
    }
    const profiles = await authRepository.findCandidatesByCpf(cpf.replace(/\D/g, ''), tenantId);

    const candidates = new Map();
    for (const profile of profiles) {
        if (profile.tenant_id === tenantId ||
            (profile.role === 'super_admin' && profile.linked_tenant_id === tenantId)) {
            candidates.set(profile.id, profile);
        }
    }
    if (candidates.size > 1) throw new TenantContextError('Vínculo de tenant ambíguo', 409);
    const profile = candidates.values().next().value || null;
    if (profile && !(await hasActiveHomeTenant(profile, tenantId))) {
        throw new TenantContextError('Tenant indisponível', 403);
    }
    return profile;
}

async function validateAuthenticatedAccount(claims) {
    if (!claims || !claims.id || !Number.isInteger(claims.tenantId) || claims.tenantId <= 0) {
        throw new TenantContextError('Credenciais inválidas', 401);
    }
    const tenant = await tenantRepository.findById(claims.tenantId);
    if (!active(tenant)) throw new TenantContextError('Credenciais inválidas', 401);
    const profile = await tenantRepository.findProfileById(claims.id, claims.tenantId);
    if (!profile || profile.status_conta !== 'ativo' || profile.role !== claims.role ||
        !(await hasActiveHomeTenant(profile, claims.tenantId)) ||
        !(await hasTenantAccess(profile, claims.tenantId))) {
        throw new TenantContextError('Credenciais inválidas', 401);
    }
    return {
        id: profile.id,
        role: profile.role,
        tenantId: claims.tenantId,
        profileTenantId: profile.tenant_id,
        name: profile.nome_completo,
        status: profile.status_conta,
        changePasswordRequired: !!profile.change_password_required
    };
}

module.exports = {
    TenantContextError,
    requireActiveTenantBySlug,
    findAccountByCpfInTenant,
    validateAuthenticatedAccount,
    hasTenantAccess
};
