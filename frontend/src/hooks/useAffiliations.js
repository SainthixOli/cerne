import { useQuery } from '@tanstack/react-query';
import api from '../api';

export function useAffiliations() {
    const query = useQuery({
        queryKey: ['affiliations'],
        queryFn: async () => {
            const response = await api.get('/affiliations');
            return response.data;
        }
    });

    return {
        affiliations: query.data || [],
        loading: query.isPending,
        refreshAffiliations: query.refetch
    };
}
