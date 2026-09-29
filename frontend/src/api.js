import axios from 'axios';
import { loadingService } from './services/loadingService';
import { environment } from './config/environment';
import { normalizeApiError } from './services/apiErrors';
import { notifyForbidden, notifyUnauthorized } from './services/sessionEvents';

const api = axios.create({
    baseURL: environment.apiUrl,
    withCredentials: true,
    timeout: 15000,
});

api.interceptors.request.use((config) => {
    if (!config.silent) {
        config.tracksGlobalLoading = true;
        loadingService.start();
    }
    if (environment.tenantSlug) config.headers['X-Tenant-Slug'] = environment.tenantSlug;
    return config;
}, (error) => {
    if (error.config?.tracksGlobalLoading) loadingService.stop();
    return Promise.reject(normalizeApiError(error));
});

api.interceptors.response.use(
    (response) => {
        if (response.config.tracksGlobalLoading) loadingService.stop();
        return response;
    },
    (error) => {
        if (error.config?.tracksGlobalLoading) loadingService.stop();
        const normalized = normalizeApiError(error);
        if (!error.config?.skipAuthHandling) {
            if (normalized.status === 401) notifyUnauthorized();
            if (normalized.status === 403) notifyForbidden(normalized);
        }
        return Promise.reject(normalized);
    }
);

export default api;
