import { useState, useEffect } from 'react';
import { AppConfig, FeatureFlags } from '../types';
import { subscribeToAppConfig } from '../services/firebase/config.service';

interface UseFeatureFlagsReturn {
    config: AppConfig | null;
    flags: FeatureFlags | null;
    loading: boolean;
    maintenanceMode: boolean;
    admobEnabled: boolean;
    rewardUnlockEnabled: boolean;
}

/**
 * Real-time feature flags hook.
 */
export function useFeatureFlags(): UseFeatureFlagsReturn {
    const [config, setConfig] = useState<AppConfig | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const unsubscribe = subscribeToAppConfig((appConfig) => {
            setConfig(appConfig);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    return {
        config,
        flags: config?.featureFlags ?? null,
        loading,
        maintenanceMode: config?.maintenanceMode ?? false,
        admobEnabled: config?.admobEnabled ?? true,
        rewardUnlockEnabled: config?.rewardUnlockEnabled ?? true,
    };
}
