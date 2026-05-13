import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { NoInternetScreen } from '../../screens/common/NoInternetScreen';

interface NetworkProviderProps {
    children: React.ReactNode;
}

/**
 * A wrapper component that listens to network state.
 * If the device goes offline, it directly displays the NoInternetScreen
 * overlaying/replacing the normal app flow safely until connection is restored.
 */
export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);

    useEffect(() => {
        // Subscribe to network state updates
        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });

        // Initial check
        NetInfo.fetch().then(state => {
            setIsConnected(state.isConnected);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const handleRetry = () => {
        NetInfo.fetch().then(state => {
            setIsConnected(state.isConnected);
        });
    };

    // Show NoInternetScreen if explicitly offline.
    // We treat null as "loading / unknown" and gracefully let children mount.
    if (isConnected === false) {
        return <NoInternetScreen onRetry={handleRetry} />;
    }

    return <>{children}</>;
};
