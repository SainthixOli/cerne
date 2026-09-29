import React, { useEffect, useState } from 'react';
import { loadingService } from '../services/loadingService';
import OrbitLoader from '../components/OrbitLoader';
import { LoadingContext } from './loadingState';

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const unsubscribe = loadingService.subscribe((state) => {
            setIsLoading(state);
        });
        return unsubscribe;
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading }}>
            {isLoading && <OrbitLoader />}
            {children}
        </LoadingContext.Provider>
    );
};
