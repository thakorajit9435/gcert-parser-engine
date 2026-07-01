import React, { useEffect, useState, createContext, useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface NetworkProviderProps {
    children: React.ReactNode;
}

const NetworkContext = createContext<{ isConnected: boolean | null }>({ isConnected: true });

export const useNetworkStatus = () => useContext(NetworkContext);

/**
 * A provider component that listens to network state.
 * Shows a toast-style banner at the bottom for intermittent connectivity.
 */
export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
    const [isConnected, setIsConnected] = useState<boolean | null>(true);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected;
            setIsConnected(connected);
            if (connected === false) {
                setShowBanner(true);
            } else if (connected === true) {
                // Hide after 3 seconds when back online
                setTimeout(() => setShowBanner(false), 3000);
            }
        });

        NetInfo.fetch().then(state => {
            setIsConnected(state.isConnected);
            if (state.isConnected === false) {
                setShowBanner(true);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <NetworkContext.Provider value={{ isConnected }}>
            {children}
            {showBanner && (
                <View style={[styles.banner, isConnected ? styles.bannerOnline : styles.bannerOffline]}>
                    <Text style={styles.bannerText}>
                        {isConnected ? '🟢 ઈન્ટરનેટ કનેક્શન સ્થાપિત થયું' : '🔴 તમે ઓફલાઇન છો. કૃપા કરીને ઇન્ટરનેટ તપાસો.'}
                    </Text>
                </View>
            )}
        </NetworkContext.Provider>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        bottom: 60,
        left: 20,
        right: 20,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 9999,
    },
    bannerOnline: {
        backgroundColor: '#10B981',
    },
    bannerOffline: {
        backgroundColor: '#EF4444',
    },
    bannerText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
});
