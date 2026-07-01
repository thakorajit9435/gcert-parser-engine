import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '../../context/AuthContext';

// ─── Design Tokens ─────────────────────────────────────────────

const C = {
    primary: '#FFD54F',
    primaryDark: '#FFC107',
    secondary: '#1976D2',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    textPrimary: '#1A1A2E',
    textSecondary: '#555577',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    success: '#10B981',
    error: '#EF4444',
    shadow: 'rgba(25, 118, 210, 0.12)',
};

// ─── VerifyEmailScreen ─────────────────────────────────────────

/**
 * Shown when an authenticated user has not yet verified their email.
 * Rendered by RootNavigator when isEmailVerified === false.
 *
 * Buttons:
 *  - "I've Verified"  → reload user, if verified RootNavigator routes automatically
 *  - "Resend Email"   → sends a new verification link
 *  - "Logout"         → signs out, returns to LoginScreen
 */
export function VerifyEmailScreen(): React.JSX.Element {
    const { user, logout, sendVerificationEmail, checkEmailVerification } = useAuthContext();

    const [checkingVerification, setCheckingVerification] = useState(false);
    const [resending, setResending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(false);

    // ── Handlers ─────────────────────────────────────────────────

    const handleCheckVerification = async () => {
        setCheckingVerification(true);
        try {
            const result = await checkEmailVerification();
            if (result.verified) {
                // isEmailVerified is now true in AuthContext →
                // RootNavigator re-renders automatically — no manual navigation needed
            } else if (result.error) {
                Alert.alert('Error', result.error || 'Something went wrong. Try again.');
            } else {
                Alert.alert(
                    'Email not verified yet',
                    'Please check your inbox and click the verification link.',
                    [{ text: 'OK' }],
                );
            }
        } catch {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setCheckingVerification(false);
        }
    };

    const handleResend = async () => {
        if (resendCooldown) return;

        setResending(true);
        try {
            const result = await sendVerificationEmail();
            if (result.success) {
                // Prevent spam resends for 30 seconds
                setResendCooldown(true);
                setTimeout(() => setResendCooldown(false), 30000);
                Alert.alert(
                    'Email Sent ✅',
                    'A new verification link has been sent to your inbox.\n\nPlease check your spam folder too.',
                );
            } else {
                Alert.alert(
                    'Failed to Resend',
                    result.error || 'Something went wrong. Try again in a moment.',
                );
            }
        } catch {
            Alert.alert('Error', 'Something went wrong. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        // RootNavigator re-renders to AuthStack automatically
    };

    // ─── Render ──────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={C.background} />

            <View style={styles.container}>
                {/* Card */}
                <View style={styles.card}>
                    {/* Icon + Heading */}
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconEmoji}>📧</Text>
                    </View>

                    <Text style={styles.title}>Verify Your Email</Text>

                    <Text style={styles.subtitle}>
                        We have sent a verification link to your email:
                    </Text>
                    <Text style={styles.emailText} numberOfLines={1}>
                        {user?.email ?? 'your email address'}
                    </Text>

                    {/* Instruction Checklist Box */}
                    <View style={styles.instructionsContainer}>
                        <View style={styles.instructionRow}>
                            <Text style={styles.instructionBullet}>📥</Text>
                            <Text style={styles.instructionText}>
                                <Text style={styles.boldText}>Check Inbox first:</Text> Open the verification email and click the link.
                            </Text>
                        </View>
                        <View style={styles.instructionRow}>
                            <Text style={styles.instructionBullet}>⚠️</Text>
                            <Text style={styles.instructionText}>
                                <Text style={styles.boldText}>Check Spam/Junk folder:</Text> If the email is not in your Inbox, check your Spam folder.
                            </Text>
                        </View>
                        <View style={styles.instructionRow}>
                            <Text style={styles.instructionBullet}>⭐</Text>
                            <Text style={styles.instructionText}>
                                <Text style={styles.boldText}>Mark as "Not Spam":</Text> Doing this ensures future notification emails are delivered directly to your Inbox.
                            </Text>
                        </View>
                    </View>

                    {/* I've Verified */}
                    <TouchableOpacity
                        style={[styles.primaryButton, checkingVerification && styles.buttonDisabled]}
                        onPress={handleCheckVerification}
                        disabled={checkingVerification || resending}
                        activeOpacity={0.85}
                    >
                        {checkingVerification ? (
                            <ActivityIndicator color={C.textPrimary} />
                        ) : (
                            <>
                                <Text style={styles.primaryButtonIcon}>✅</Text>
                                <Text style={styles.primaryButtonText}>I Have Verified</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Resend Email */}
                    <TouchableOpacity
                        style={[
                            styles.secondaryButton,
                            (resending || resendCooldown) && styles.buttonDisabled,
                        ]}
                        onPress={handleResend}
                        disabled={resending || resendCooldown || checkingVerification}
                        activeOpacity={0.85}
                    >
                        {resending ? (
                            <ActivityIndicator color={C.secondary} size="small" />
                        ) : (
                            <>
                                <Text style={styles.secondaryButtonIcon}>🔄</Text>
                                <Text style={styles.secondaryButtonText}>
                                    {resendCooldown ? 'Email Sent (wait 30s)' : 'Resend Email'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Logout link */}
                <TouchableOpacity
                    style={styles.logoutLink}
                    onPress={handleLogout}
                    disabled={checkingVerification || resending}
                >
                    <Text style={styles.logoutText}>🚪 Logout</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: C.background,
    },
    container: {
        flex: 1,
        paddingHorizontal: 20,
        justifyContent: 'center',
        paddingBottom: 24,
    },

    // Card
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        shadowColor: C.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 6,
    },

    // Icon
    iconCircle: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#BFDBFE',
    },
    iconEmoji: {
        fontSize: 40,
    },

    // Text
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: C.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: C.textSecondary,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 15,
        fontWeight: '700',
        color: C.secondary,
        marginTop: 4,
        marginBottom: 12,
        textAlign: 'center',
        maxWidth: 260,
    },
    instruction: {
        fontSize: 13,
        color: C.textMuted,
        textAlign: 'center',
        lineHeight: 20,
    },

    // Divider
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: C.border,
        marginVertical: 20,
    },

    // Primary Button — "I've Verified"
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.primary,
        borderRadius: 16,
        paddingVertical: 15,
        width: '100%',
        gap: 8,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 5,
        marginBottom: 12,
    },
    primaryButtonIcon: {
        fontSize: 16,
    },
    primaryButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: C.textPrimary,
        letterSpacing: 0.3,
    },

    // Secondary Button — "Resend Email"
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: C.border,
        paddingVertical: 13,
        width: '100%',
        gap: 8,
    },
    secondaryButtonIcon: {
        fontSize: 15,
    },
    secondaryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.secondary,
        letterSpacing: 0.2,
    },

    buttonDisabled: {
        opacity: 0.55,
    },

    // Info box
    infoBox: {
        marginTop: 20,
        paddingHorizontal: 4,
    },
    infoText: {
        fontSize: 12,
        color: C.textMuted,
        textAlign: 'center',
        lineHeight: 18,
    },

    // Logout link
    logoutLink: {
        marginTop: 16,
        alignItems: 'center',
        padding: 8,
    },
    logoutText: {
        fontSize: 13,
        color: C.textMuted,
    },
    instructionsContainer: {
        width: '100%',
        backgroundColor: '#F1F5F9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        gap: 12,
    },
    instructionRow: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    instructionBullet: {
        fontSize: 16,
        marginTop: 2,
    },
    instructionText: {
        flex: 1,
        fontSize: 13,
        color: C.textSecondary,
        lineHeight: 18,
    },
    boldText: {
        fontWeight: '700',
        color: C.textPrimary,
    },
});
