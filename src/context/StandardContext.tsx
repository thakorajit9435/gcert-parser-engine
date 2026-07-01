import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from './AuthContext';
import { logAnalyticsEvent } from '../services/analytics';

// ─── Types ─────────────────────────────────────────────────────

interface StandardContextType {
    selectedStandard: string;
    setSelectedStandard: (standard: string) => void;
    standardLabel: string;
}

// ─── Context ───────────────────────────────────────────────────

const StandardContext = createContext<StandardContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────

interface StandardProviderProps {
    children: ReactNode;
}

export function StandardProvider({ children }: StandardProviderProps): React.JSX.Element {
    const { userProfile } = useAuthContext();
    const defaultStandard = String(userProfile?.standard ?? 1);
    const [selectedStandard, setSelectedStandard] = useState<string>(defaultStandard);

    // Sync default whenever user profile loads/changes (only if nothing is explicitly saved)
    useEffect(() => {
        const loadStandard = async () => {
            if (!userProfile) return;
            try {
                const docId = `selected_standard_${userProfile.uid}`;
                const saved = await AsyncStorage.getItem(docId);
                if (saved) {
                    setSelectedStandard(saved);
                } else if (userProfile?.standard) {
                    setSelectedStandard(String(userProfile.standard));
                }
            } catch (error) {
                console.error('Failed to load standard', error);
                if (userProfile?.standard) {
                    setSelectedStandard(String(userProfile.standard));
                }
            }
        };
        loadStandard();
    }, [userProfile]);

    const handleSetSelectedStandard = async (standard: string) => {
        setSelectedStandard(standard);
        logAnalyticsEvent('standard_change', { standard: Number(standard) || 1 });
        if (userProfile?.uid) {
            try {
                const docId = `selected_standard_${userProfile.uid}`;
                await AsyncStorage.setItem(docId, standard);
            } catch (error) {
                console.error('Failed to save standard', error);
            }
        }
    };

    const standardLabel = `Dhoran ${selectedStandard}`;

    return (
        <StandardContext.Provider value={{ selectedStandard, setSelectedStandard: handleSetSelectedStandard, standardLabel }}>
            {children}
        </StandardContext.Provider>
    );
}

// ─── Hook ──────────────────────────────────────────────────────

export function useStandardContext(): StandardContextType {
    const context = useContext(StandardContext);
    if (!context) {
        throw new Error('useStandardContext must be used within a StandardProvider');
    }
    return context;
}
