import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadingService } from '../services/loadingService';
import ProceduralLoader from '../components/ProceduralLoader';

const LoadingContext = createContext();

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
            {isLoading && <ProceduralLoader />}
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);
