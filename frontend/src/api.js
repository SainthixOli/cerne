import axios from 'axios';
import { loadingService } from './services/loadingService';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
    // Only show loading if not silent
    if (!config.silent) {
        loadingService.start();
    }
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    loadingService.stop();
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => {
        // Only stop if it started (simplification: stop is safe to call even if not started usually, but safe to just call it)
        loadingService.stop();
        return response;
    },
    (error) => {
        loadingService.stop();
        return Promise.reject(error);
    }
);

export default api;
