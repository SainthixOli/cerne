import { QueryClient } from '@tanstack/react-query';
import { canRetryRequest } from '../services/apiErrors';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: canRetryRequest,
            refetchOnWindowFocus: false
        },
        mutations: { retry: false }
    }
});
