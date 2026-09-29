import { useContext } from 'react';
import { LoadingContext } from '../contexts/loadingState';

export function useLoading() {
    return useContext(LoadingContext);
}
