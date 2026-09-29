import { useEffect, useState } from 'react';
import api from '../api';

export default function usePrivatePhoto(hasPhoto, refreshKey = 0) {
    const [url, setUrl] = useState(null);

    useEffect(() => {
        if (!hasPhoto) {
            return undefined;
        }
        let active = true;
        let objectUrl = null;
        api.get('/profile/photo', { responseType: 'blob', silent: true })
            .then((response) => {
                if (!active) return;
                objectUrl = URL.createObjectURL(response.data);
                setUrl(objectUrl);
            })
            .catch(() => { if (active) setUrl(null); });
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [hasPhoto, refreshKey]);

    return hasPhoto ? url : null;
}
