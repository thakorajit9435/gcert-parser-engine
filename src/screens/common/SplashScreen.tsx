import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    StatusBar,
} from 'react-native';
// import { useTranslation } from 'react-i18next';

// ─── Brand palette used only inside the splash ───────────────
// Background is always #FFD54F regardless of admin/student theme.
const BRAND = {
    bg: '#FFD54F',
    card: '#FFF8E1',
    text: '#3E2723',
    subtext: '#6D4C41',
    accent: '#1976D2',
    loaderTrack: 'rgba(62,39,35,0.15)',
    loaderFill: '#3E2723',
} as const;

// ─── SplashScreen ────────────────────────────────────────────

interface SplashScreenProps {
    /** Optional hint shown below the loader, e.g. "Checking internet…" */
    statusText?: string;
}

export function SplashScreen({ statusText }: SplashScreenProps): React.JSX.Element {
    // const { t } = useTranslation();

    // ── Animations ────────────────────────────────────────────
    const logoScale = useRef(new Animated.Value(0.6)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const nameOpacity = useRef(new Animated.Value(0)).current;
    const nameTranslate = useRef(new Animated.Value(20)).current;
    const loaderProgress = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Logo pop-in
        Animated.parallel([
            Animated.spring(logoScale, {
                toValue: 1,
                tension: 120,
                friction: 7,
                useNativeDriver: true,
            }),
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 400,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();

        // App name slide-up after logo
        Animated.sequence([
            Animated.delay(300),
            Animated.parallel([
                Animated.timing(nameOpacity, {
                    toValue: 1,
                    duration: 350,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(nameTranslate, {
                    toValue: 0,
                    duration: 350,
                    easing: Easing.out(Easing.back(1.5)),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        // Indeterminate loader animation (loops)
        Animated.loop(
            Animated.sequence([
                Animated.timing(loaderProgress, {
                    toValue: 1,
                    duration: 900,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false, // width animation
                }),
                Animated.timing(loaderProgress, {
                    toValue: 0,
                    duration: 600,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                }),
            ]),
        ).start();
    }, [logoOpacity, logoScale, loaderProgress, nameOpacity, nameTranslate]);

    const loaderWidthInterpolation = loaderProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['10%', '85%'],
    });

    return (
        <View style={styles.container}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={BRAND.bg}
                translucent={false}
            />

            {/* Logo card */}
            <Animated.View
                style={[
                    styles.logoCard,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <Animated.Image
                    source={require('../../../assets/icon.png')}
                    style={styles.logoImage}
                />
            </Animated.View>
            {/* App name */}
            <Animated.View
                style={{
                    opacity: nameOpacity,
                    transform: [{ translateY: nameTranslate }],
                    alignItems: 'center',
                }}
            >
                <Text style={styles.appName}>
                    {'GyanDeep App'}
                </Text>
                <Text style={styles.tagline}>
                    Your learning companion
                </Text>
            </Animated.View>

            {/* Loader bar */}
            <View style={styles.loaderTrack}>
                <Animated.View
                    style={[styles.loaderFill, { width: loaderWidthInterpolation }]}
                />
            </View>

            {/* Status text */}
            {!!statusText && (
                <Text style={styles.statusText}>{statusText}</Text>
            )}

            {/* Version watermark */}
            <Text style={styles.version}>v1.0.0</Text>
        </View>
    );
}

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BRAND.bg,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },

    // Logo
    logoCard: {
        width: 120,
        height: 120,
        borderRadius: 36,
        backgroundColor: BRAND.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
        shadowColor: '#3E2723',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 12,
    },
    logoEmoji: {
        fontSize: 60,
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 36,
        resizeMode: 'contain',
        // opacity નહીં — parent View સંભાળે છે
    },

    // Text
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: BRAND.text,
        letterSpacing: 0.5,
        marginBottom: 6,
        textAlign: 'center',
    },
    tagline: {
        fontSize: 14,
        fontWeight: '500',
        color: BRAND.subtext,
        letterSpacing: 0.3,
        marginBottom: 48,
    },

    // Loader
    loaderTrack: {
        width: '70%',
        height: 6,
        borderRadius: 3,
        backgroundColor: BRAND.loaderTrack,
        overflow: 'hidden',
    },
    loaderFill: {
        height: 6,
        borderRadius: 3,
        backgroundColor: BRAND.loaderFill,
    },

    // Status
    statusText: {
        marginTop: 16,
        fontSize: 13,
        color: BRAND.subtext,
        fontWeight: '500',
    },

    // Version watermark
    version: {
        position: 'absolute',
        bottom: 32,
        fontSize: 12,
        color: BRAND.subtext,
        fontWeight: '500',
        opacity: 0.7,
    },
});
