import firestore from '@react-native-firebase/firestore';
import { COLLECTIONS, APP_CONFIG_DOC_ID } from '../../constants';
import { AppConfig, FeatureFlags, ServiceResult } from '../../types';

const configRef = () =>
    firestore().collection(COLLECTIONS.APP_CONFIG).doc(APP_CONFIG_DOC_ID);

/**
 * Get app configuration.
 */
export async function getAppConfig(): Promise<ServiceResult<AppConfig>> {
    try {
        const doc = await configRef().get();
        if (!doc.exists) {
            // Create default config
            const defaultConfig: Omit<AppConfig, 'updatedAt'> & { updatedAt: FirebaseFirestoreTypes.FieldValue } = {
                maintenanceMode: false,
                admobEnabled: true,
                rewardUnlockEnabled: true,
                latestVersion: '1.0.0',
                forceUpdateVersion: '1.0.0',
                featureFlags: {
                    nmmsEnabled: false,
                    liveClassesEnabled: false,
                    parentDashboardEnabled: false,
                    aiQuestionsEnabled: false,
                },
                updatedAt: firestore.FieldValue.serverTimestamp(),
                updatedBy: 'system',
            };
            await configRef().set(defaultConfig);
            const created = await configRef().get();
            return { success: true, data: created.data() as AppConfig };
        }
        return { success: true, data: doc.data() as AppConfig };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Subscribe to app config changes (real-time).
 */
export function subscribeToAppConfig(
    callback: (config: AppConfig | null) => void,
): () => void {
    return configRef().onSnapshot(
        (doc) => {
            if (doc.exists) {
                callback(doc.data() as AppConfig);
            } else {
                callback(null);
            }
        },
        (_error) => {
            callback(null);
        },
    );
}

/**
 * Update app configuration.
 */
export async function updateAppConfig(
    updates: Partial<Omit<AppConfig, 'updatedAt'>>,
    updatedBy: string,
): Promise<ServiceResult<void>> {
    try {
        await configRef().update({
            ...updates,
            updatedBy,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

/**
 * Toggle a specific feature flag.
 */
export async function toggleFeatureFlag(
    flag: keyof FeatureFlags,
    value: boolean,
    updatedBy: string,
): Promise<ServiceResult<void>> {
    try {
        await configRef().update({
            [`featureFlags.${flag}`]: value,
            updatedBy,
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: (error as Error).message };
    }
}

// Re-export for type usage
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
export type { FirebaseFirestoreTypes };
