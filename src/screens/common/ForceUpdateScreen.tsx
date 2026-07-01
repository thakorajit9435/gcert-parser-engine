import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    StatusBar,
    Animated,
    Easing,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MobileAppConfig } from '../../services/firebase/version.check.service';

// ─── Design tokens ────────────────────────────────────────────

const C = {
    bg: '#F8F9FA',
    surface: '#FFFFFF',
    accent: '#1976D2',
    accentLight: '#E3F0FF',
    text: '#1A1A2E',
    subtext: '#555577',
    muted: '#94A3B8',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    success: '#10B981',
} as const;

// ─── Props ────────────────────────────────────────────────────

interface ForceUpdateScreenProps {
    config: MobileAppConfig;
    currentVersion: string;
    /** When false the user CAN dismiss this screen */
    isForced: boolean;
    onDismiss?: () => void;
}

// ─── ForceUpdateScreen ────────────────────────────────────────

export function ForceUpdateScreen({
    config,
    currentVersion,
    isForced,
    onDismiss,
}: ForceUpdateScreenProps): React.JSX.Element {

    // ── Animations ────────────────────────────────────────────
    const cardScale = useRef(new Animated.Value(0.88)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const rocketTranslate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Card slide-in
        Animated.parallel([
            Animated.spring(cardScale, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
                toValue: 1,
                duration: 350,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();

        // Rocket bobbing
        Animated.loop(
            Animated.sequence([
                Animated.timing(rocketTranslate, {
                    toValue: -10,
                    duration: 800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(rocketTranslate, {
                    toValue: 0,
                    duration: 800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        ).start();
    }, [cardOpacity, cardScale, rocketTranslate]);

    // ── Handlers ──────────────────────────────────────────────
    const handleUpdateNow = async () => {
        const url = config.playStoreUrl;
        console.log('[ForceUpdateScreen] Opening:', url);
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert(
                    'Cannot Open Store',
                    'Please visit the Play Store manually to update the app.',
                );
            }
        } catch {
            Alert.alert(
                'Error',
                'Could not open the Play Store. Please update the app manually.',
            );
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

            <View style={styles.container}>
                {/* Illustration */}
                <Animated.View
                    style={[
                        styles.illustrationCard,
                        { transform: [{ translateY: rocketTranslate }] },
                    ]}
                >
                    <Text style={styles.illustrationEmoji}>🚀</Text>
                </Animated.View>

                {/* Content card */}
                <Animated.View
                    style={[
                        styles.card,
                        {
                            opacity: cardOpacity,
                            transform: [{ scale: cardScale }],
                        },
                    ]}
                >
                    {/* Badge */}
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                            {isForced ? 'Required Update' : 'Update Available'}
                        </Text>
                    </View>

                    <Text style={styles.title}>New Update Available</Text>

                    <Text style={styles.message}>
                        {config.updateMessage}
                    </Text>

                    {/* Version info */}
                    <View style={styles.versionRow}>
                        <View style={styles.versionChip}>
                            <Text style={styles.versionLabel}>Current</Text>
                            <Text style={styles.versionValue}>v{currentVersion}</Text>
                        </View>
                        <Text style={styles.versionArrow}>→</Text>
                        <View style={[styles.versionChip, styles.versionChipLatest]}>
                            <Text style={[styles.versionLabel, { color: C.success }]}>Latest</Text>
                            <Text style={[styles.versionValue, { color: C.success }]}>
                                v{config.latestVersion}
                            </Text>
                        </View>
                    </View>

                    {/* Update Now button */}
                    <TouchableOpacity
                        style={styles.updateBtn}
                        onPress={handleUpdateNow}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.updateBtnIcon}>⬇️</Text>
                        <Text style={styles.updateBtnText}>Update Now</Text>
                    </TouchableOpacity>

                    {/* Later button — only when update is optional */}
                    {!isForced && onDismiss && (
                        <TouchableOpacity
                            style={styles.laterBtn}
                            onPress={onDismiss}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.laterBtnText}>Update Later</Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>

                {/* Footer note for forced update */}
                {isForced && (
                    <Text style={styles.footerNote}>
                        You must update to continue using the app.
                    </Text>
                )}
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: C.bg,
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },

    // Illustration
    illustrationCard: {
        width: 120,
        height: 120,
        borderRadius: 36,
        backgroundColor: C.accentLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        shadowColor: C.accent,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 8,
    },
    illustrationEmoji: {
        fontSize: 56,
    },

    // Card
    card: {
        width: '100%',
        backgroundColor: C.surface,
        borderRadius: 28,
        padding: 28,
        alignItems: 'center',
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 8,
    },

    // Badge
    badge: {
        backgroundColor: C.warningLight,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        marginBottom: 16,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: C.warning,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    title: {
        fontSize: 24,
        fontWeight: '800',
        color: C.text,
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    message: {
        fontSize: 14,
        color: C.subtext,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
        paddingHorizontal: 8,
    },

    // Version chips
    versionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 28,
        backgroundColor: '#F8F9FA',
        borderRadius: 16,
        padding: 16,
        width: '100%',
        justifyContent: 'center',
    },
    versionChip: {
        alignItems: 'center',
        gap: 2,
    },
    versionChipLatest: {},
    versionLabel: {
        fontSize: 11,
        color: C.muted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    versionValue: {
        fontSize: 16,
        fontWeight: '800',
        color: C.text,
    },
    versionArrow: {
        fontSize: 18,
        color: C.muted,
        marginHorizontal: 4,
    },

    // Buttons
    updateBtn: {
        flexDirection: 'row',
        backgroundColor: C.accent,
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 32,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: C.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    updateBtnIcon: {
        fontSize: 18,
    },
    updateBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.3,
    },
    laterBtn: {
        marginTop: 14,
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    laterBtnText: {
        fontSize: 14,
        color: C.muted,
        fontWeight: '600',
    },

    // Footer
    footerNote: {
        marginTop: 20,
        fontSize: 13,
        color: C.muted,
        textAlign: 'center',
        fontWeight: '500',
    },
});
