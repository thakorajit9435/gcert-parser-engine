import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Alert, RefreshControl } from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';
import { LoadingState, Card, TextInput } from '../../components/common';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useFeatureFlags } from '../../hooks/useFeatureFlags';
import * as ConfigService from '../../services/firebase/config.service';
import { logAuditAction } from '../../services/logging/audit.service';
import { FeatureFlags } from '../../types';

export function AppConfigScreen(): React.JSX.Element {
    const { userProfile } = useAuth();
    const { config, loading: configLoading } = useFeatureFlags();
    const [saving, setSaving] = useState(false);

    // Local state for editable fields
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [admobEnabled, setAdmobEnabled] = useState(true);
    const [rewardUnlockEnabled, setRewardUnlockEnabled] = useState(true);
    const [latestVersion, setLatestVersion] = useState('');
    const [forceUpdateVersion, setForceUpdateVersion] = useState('');
    const [featureFlags, setFeatureFlags] = useState<FeatureFlags>({
        nmmsEnabled: false,
        liveClassesEnabled: false,
        parentDashboardEnabled: false,
        aiQuestionsEnabled: false,
    });

    useEffect(() => {
        if (config) {
            setMaintenanceMode(config.maintenanceMode);
            setAdmobEnabled(config.admobEnabled);
            setRewardUnlockEnabled(config.rewardUnlockEnabled);
            setLatestVersion(config.latestVersion);
            setForceUpdateVersion(config.forceUpdateVersion);
            setFeatureFlags(config.featureFlags);
        }
    }, [config]);

    const handleSave = async (): Promise<void> => {
        if (!userProfile) return;
        setSaving(true);

        const result = await ConfigService.updateAppConfig(
            {
                maintenanceMode,
                admobEnabled,
                rewardUnlockEnabled,
                latestVersion,
                forceUpdateVersion,
                featureFlags,
            },
            userProfile.uid,
        );

        if (result.success) {
            await logAuditAction({
                action: 'config_updated',
                performedBy: userProfile.uid,
                performedByName: userProfile.name,
                metadata: { maintenanceMode, admobEnabled, latestVersion },
            });
            Alert.alert('Success', 'Configuration saved successfully.');
        } else {
            Alert.alert('Error', result.error ?? 'Failed to save configuration.');
        }
        setSaving(false);
    };

    const toggleFlag = (key: keyof FeatureFlags): void => {
        setFeatureFlags(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const onRefresh = useCallback(async () => {
        // Config is real-time, so just wait
    }, []);

    if (configLoading) return <LoadingState message="Loading configuration…" />;

    const renderToggle = (
        label: string,
        value: boolean,
        onToggle: (val: boolean) => void,
        description?: string,
    ): React.JSX.Element => (
        <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>{label}</Text>
                {description ? <Text style={styles.toggleDesc}>{description}</Text> : null}
            </View>
            <Switch
                value={value}
                onValueChange={onToggle}
                trackColor={{ false: adminColors.surfaceElevated, true: `${adminColors.primary}60` }}
                thumbColor={value ? adminColors.primary : adminColors.textMuted}
            />
        </View>
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={adminColors.primary} />}
        >
            <Text style={styles.title}>⚙️ App Configuration</Text>

            {/* General Settings */}
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>General Settings</Text>
                {renderToggle('Maintenance Mode', maintenanceMode, setMaintenanceMode, 'Blocks all student access with a maintenance message')}
                {renderToggle('AdMob Enabled', admobEnabled, setAdmobEnabled, 'Show/hide all advertisements')}
                {renderToggle('Reward Unlock', rewardUnlockEnabled, setRewardUnlockEnabled, 'Allow watching ads to unlock premium content')}
            </Card>

            {/* Version Control */}
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Version Control</Text>
                <TextInput label="Latest Version" value={latestVersion} onChangeText={setLatestVersion} placeholder="1.0.0" />
                <TextInput label="Force Update Version" value={forceUpdateVersion} onChangeText={setForceUpdateVersion} placeholder="1.0.0" />
            </Card>

            {/* Feature Flags */}
            <Card style={styles.section}>
                <Text style={styles.sectionTitle}>Feature Flags</Text>
                {renderToggle('NMMS Module', featureFlags.nmmsEnabled, () => toggleFlag('nmmsEnabled'), 'Enable NMMS exam preparation module')}
                {renderToggle('Live Classes', featureFlags.liveClassesEnabled, () => toggleFlag('liveClassesEnabled'), 'Enable live class feature')}
                {renderToggle('Parent Dashboard', featureFlags.parentDashboardEnabled, () => toggleFlag('parentDashboardEnabled'), 'Enable parent monitoring dashboard')}
                {renderToggle('AI Questions', featureFlags.aiQuestionsEnabled, () => toggleFlag('aiQuestionsEnabled'), 'Enable AI-generated questions')}
            </Card>

            <Button title="Save Configuration" onPress={handleSave} loading={saving} style={styles.saveButton} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: adminColors.background },
    contentContainer: { padding: spacing.xl },
    title: { fontSize: typography.size.xxl, fontWeight: typography.weight.bold, color: adminColors.textPrimary, marginBottom: spacing.xl },
    section: { marginBottom: spacing.xl },
    sectionTitle: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold, color: adminColors.textPrimary, marginBottom: spacing.lg },
    toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: adminColors.border },
    toggleInfo: { flex: 1, marginRight: spacing.lg },
    toggleLabel: { fontSize: typography.size.md, fontWeight: typography.weight.medium, color: adminColors.textPrimary },
    toggleDesc: { fontSize: typography.size.sm, color: adminColors.textMuted, marginTop: spacing.xxs },
    saveButton: { marginTop: spacing.md, marginBottom: spacing.huge },
});
