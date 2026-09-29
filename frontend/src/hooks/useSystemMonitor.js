import { useEffect, useState } from 'react';
import api from '../api';

export function useSystemMonitor() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [healthLogs, setHealthLogs] = useState([]);

    useEffect(() => {
        let active = true;

        const fetchStats = async () => {
            try {
                const response = await api.get('/system/stats', { silent: true });
                if (active) setStats(response.data);
            } catch {
                if (active) setStats(null);
            } finally {
                if (active) setLoading(false);
            }
        };

        const checkReadiness = async () => {
            const startedAt = Date.now();
            let log;
            try {
                const response = await api.get('/health/ready', { silent: true });
                log = {
                    time: new Date().toLocaleTimeString(),
                    status: response.data.status,
                    latency: `${Date.now() - startedAt}ms`,
                    uptime: '-',
                    type: 'success'
                };
            } catch {
                log = {
                    time: new Date().toLocaleTimeString(),
                    status: 'DOWN',
                    latency: '-',
                    uptime: '-',
                    type: 'error'
                };
            }
            if (active) setHealthLogs((current) => [log, ...current].slice(0, 50));
        };

        fetchStats();
        checkReadiness();
        const statsInterval = window.setInterval(fetchStats, 30_000);
        const healthInterval = window.setInterval(checkReadiness, 5_000);
        return () => {
            active = false;
            window.clearInterval(statsInterval);
            window.clearInterval(healthInterval);
        };
    }, []);

    return { stats, loading, healthLogs };
}
