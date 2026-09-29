function normalizeApiUrl(value) {
    const url = (value || '/api').trim();
    if (!url) throw new Error('VITE_API_URL não pode ser vazia');
    return url.replace(/\/$/, '');
}

export const environment = Object.freeze({
    apiUrl: normalizeApiUrl(import.meta.env.VITE_API_URL),
    tenantSlug: (import.meta.env.VITE_TENANT_SLUG || '').trim()
});
