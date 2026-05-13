import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    SafeAreaView,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useAuthContext } from '../../context/AuthContext';
import { TextInput } from '../../components/common/TextInput';

// ─── Types ─────────────────────────────────────────────────────

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

// ─── Design tokens ─────────────────────────────────────────────

const C = {
    primary: '#FFD54F',
    primaryDark: '#FFC107',
    secondary: '#1976D2',
    secondaryLight: '#42A5F5',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    textPrimary: '#1A1A2E',
    textSecondary: '#555577',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
    error: '#EF4444',
    shadow: 'rgba(25, 118, 210, 0.12)',
};

// ─── LoginScreen ───────────────────────────────────────────────

export function LoginScreen(): React.JSX.Element {
    const navigation = useNavigation<NavigationProp>();
    const { login } = useAuth();
    const { loginWithGoogle } = useAuthContext();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim()) {
            Alert.alert('Validation Error', 'Please enter your email address.');
            return;
        }
        if (!password) {
            Alert.alert('Validation Error', 'Please enter your password.');
            return;
        }

        setLoading(true);
        try {
            const result = await login(email.trim(), password);
            if (!result.success) {
                Alert.alert('Login Failed', result.error || 'Invalid email or password.');
            }
            // On success: RootNavigator checks emailVerified and routes to
            // VerifyEmailScreen (if not verified) or role-based home (if verified).
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            const result = await loginWithGoogle();
            if (!result.success && !result.cancelled) {
                Alert.alert('Google Sign-In Failed', result.error || 'Something went wrong. Try again.');
            }
            // On success, RootNavigator handles routing automatically
        } catch (err) {
            Alert.alert('Error', 'Something went wrong. Try again.');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={C.background} />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.headerSection}>
                        <Image
                            source={require('../../../assets/icon.png')}
                            style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 12 }}

                        // style={styles.logoCircle}
                        />
                        {/* <View style={styles.logoCircle}> */}
                        {/* <Text style={styles.logoEmoji}>🎓</Text> */}
                        {/* </View> */}
                        <Text style={styles.appName}>GyanDeep</Text>
                        <Text style={styles.tagline}>Learn. Grow. Succeed.</Text>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Welcome Back</Text>
                            <Text style={styles.cardSubtitle}>Sign in to your account</Text>
                        </View>

                        <TextInput
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Enter your password"
                            secureTextEntry
                        />

                        <TouchableOpacity
                            style={[styles.loginButton, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color={C.textPrimary} />
                            ) : (
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            )}
                        </TouchableOpacity>

                        {/* Info notice */}
                        <View style={styles.infoBox}>
                            <Text style={styles.infoIcon}>ℹ️</Text>
                            <Text style={styles.infoText}>
                                Admin accounts are created by a super admin — not through self-registration.
                            </Text>
                        </View>

                        {/* Google Sign-In */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.googleButton,
                                (loading || googleLoading) && styles.buttonDisabled,
                            ]}
                            onPress={handleGoogleLogin}
                            disabled={loading || googleLoading}
                            activeOpacity={0.85}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color="#1976D2" />
                            ) : (
                                <>
                                    <Text style={styles.googleIcon}>G</Text>
                                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>or</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        <TouchableOpacity
                            style={styles.signupLink}
                            onPress={() => navigation.navigate('Signup')}
                            disabled={loading || googleLoading}
                        >
                            <Text style={styles.signupLinkText}>
                                New student?{' '}
                                <Text style={styles.signupLinkBold}>Create Account</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: C.background,
    },
    container: {
        flex: 1,
        backgroundColor: C.background,
    },
    scrollContainer: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingVertical: 32,
        justifyContent: 'center',
    },

    // Header
    headerSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: C.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    logoEmoji: {
        fontSize: 40,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        color: C.textPrimary,
        letterSpacing: 0.5,
    },
    tagline: {
        fontSize: 14,
        color: C.textSecondary,
        marginTop: 4,
    },

    // Card
    card: {
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 24,
        shadowColor: C.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 6,
    },
    cardHeader: {
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: C.textPrimary,
    },
    cardSubtitle: {
        fontSize: 14,
        color: C.textSecondary,
        marginTop: 4,
    },

    // Login Button
    loginButton: {
        backgroundColor: C.primary,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        color: C.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Info Box
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        borderRadius: 10,
        padding: 12,
        marginTop: 16,
        alignItems: 'flex-start',
        gap: 8,
    },
    infoIcon: {
        fontSize: 14,
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        color: C.secondary,
        lineHeight: 18,
    },

    // Divider
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: C.border,
    },
    dividerText: {
        color: C.textMuted,
        fontSize: 13,
        paddingHorizontal: 12,
    },

    // Signup Link
    signupLink: {
        alignItems: 'center',
        padding: 8,
    },
    signupLinkText: {
        color: C.textSecondary,
        fontSize: 14,
    },
    signupLinkBold: {
        color: C.secondary,
        fontWeight: '700',
    },

    // Google Button
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.surface,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: C.border,
        paddingVertical: 14,
        gap: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    googleIcon: {
        fontSize: 18,
        fontWeight: '900',
        color: '#1976D2',
    },
    googleButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: C.textPrimary,
        letterSpacing: 0.3,
    },
});
