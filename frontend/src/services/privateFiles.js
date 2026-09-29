import api from '../api';

export async function openProtectedFile(endpoint) {
    const response = await api.get(endpoint, { responseType: 'blob' });
    const objectUrl = URL.createObjectURL(response.data);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
}
