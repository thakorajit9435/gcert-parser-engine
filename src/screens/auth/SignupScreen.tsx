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
    Modal,
    FlatList,
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

type NavigationProp = StackNavigationProp<AuthStackParamList, 'Signup'>;

// ─── Constants ─────────────────────────────────────────────────

const STANDARDS = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Standard ${i + 1}`,
}));

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
    success: '#10B981',
    shadow: 'rgba(25, 118, 210, 0.12)',
};

// ─── StandardDropdown ─────────────────────────────────────────

interface StandardDropdownProps {
    value: number | null;
    onSelect: (value: number) => void;
    disabled?: boolean;
}

function StandardDropdown({ value, onSelect, disabled }: StandardDropdownProps): React.JSX.Element {
    const [visible, setVisible] = useState(false);
    const selectedLabel = value ? `Standard ${value}` : 'Select Standard (1–12)';

    return (
        <>
            <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Standard</Text>
                <TouchableOpacity
                    style={[styles.dropdownButton, !value && styles.dropdownPlaceholder, disabled && styles.disabledInput]}
                    onPress={() => !disabled && setVisible(true)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.dropdownText, !value && styles.dropdownPlaceholderText]}>
                        {selectedLabel}
                    </Text>
                    <Text style={styles.dropdownArrow}>▾</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalCard}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Standard</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={STANDARDS}
                            keyExtractor={(item) => String(item.value)}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        item.value === value && styles.modalItemSelected,
                                    ]}
                                    onPress={() => {
                                        onSelect(item.value);
                                        setVisible(false);
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.modalItemText,
                                            item.value === value && styles.modalItemTextSelected,
                                        ]}
                                    >
                                        {item.label}
                                    </Text>
                                    {item.value === value && (
                                        <Text style={styles.modalItemCheck}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                            showsVerticalScrollIndicator={false}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

// ─── SignupScreen ──────────────────────────────────────────────

export function SignupScreen(): React.JSX.Element {
    const navigation = useNavigation<NavigationProp>();
    const { signupStudent } = useAuth();
    const { loginWithGoogle } = useAuthContext();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [standard, setStandard] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const validate = (): string | null => {
        if (!name.trim()) return 'Please enter your full name.';
        if (!email.trim() || !email.includes('@')) return 'Please enter a valid email address.';
        if (password.length < 6) return 'Password must be at least 6 characters.';
        if (!standard) return 'Please select your standard (1–12).';
        return null;
    };

    const handleSignup = async () => {
        const error = validate();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setLoading(true);
        try {
            const result = await signupStudent(email.trim(), password, name.trim(), standard!);
            if (!result.success) {
                Alert.alert('Signup Failed', result.error || 'An error occurred during signup.');
            } else {
                // Account created — inform the user that a verification email was sent.
                // RootNavigator will automatically route to VerifyEmailScreen.
                Alert.alert(
                    '📧 Check Your Email',
                    `A verification link has been sent to ${email.trim()}.\n\nPlease verify your email to access the app.`,
                    [{ text: 'OK' }],
                );
            }
        } catch (err) {
            Alert.alert('Error', (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = async () => {
        setGoogleLoading(true);
        try {
            const result = await loginWithGoogle();
            if (!result.success && !result.cancelled) {
                Alert.alert('Google Sign-In Failed', result.error || 'Something went wrong. Try again.');
            }
            // On success, RootNavigator routes to SelectStandard or StudentTabs
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
                        />
                        {/* <View style={styles.logoCircle}>
                            <Text style={styles.logoEmoji}>🎓</Text>
                        </View> */}
                        <Text style={styles.appName}>GyanDeep</Text>
                        <Text style={styles.tagline}>Your learning journey begins here</Text>
                    </View>

                    {/* Card */}
                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>Create Account</Text>
                            <Text style={styles.cardSubtitle}>Join as a Student</Text>
                        </View>

                        <TextInput
                            label="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                            autoCapitalize="words"
                        />

                        <TextInput
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter your email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TextInput
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Minimum 6 characters"
                            secureTextEntry
                        />

                        <StandardDropdown
                            value={standard}
                            onSelect={setStandard}
                            disabled={loading}
                        />

                        <TouchableOpacity
                            style={[styles.signupButton, loading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={loading || googleLoading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color={C.textPrimary} />
                            ) : (
                                <Text style={styles.signupButtonText}>Create Account</Text>
                            )}
                        </TouchableOpacity>

                        {/* Google Sign-Up */}
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
                            onPress={handleGoogleSignup}
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
                            style={styles.loginLink}
                            onPress={() => navigation.navigate('Login')}
                            disabled={loading || googleLoading}
                        >
                            <Text style={styles.loginLinkText}>
                                Already have an account?{' '}
                                <Text style={styles.loginLinkBold}>Log in</Text>
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
        paddingVertical: 24,
    },

    // Header
    headerSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    logoCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
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
        fontSize: 36,
    },
    appName: {
        fontSize: 26,
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

    // Dropdown
    fieldContainer: {
        marginBottom: 16,
    },
    fieldLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: C.textSecondary,
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    dropdownButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        borderColor: C.border,
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: C.surface,
    },
    dropdownPlaceholder: {
        borderColor: C.border,
    },
    dropdownText: {
        fontSize: 15,
        color: C.textPrimary,
        fontWeight: '500',
    },
    dropdownPlaceholderText: {
        color: C.textMuted,
        fontWeight: '400',
    },
    dropdownArrow: {
        fontSize: 16,
        color: C.textMuted,
    },
    disabledInput: {
        opacity: 0.6,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: C.surface,
        borderRadius: 16,
        width: '100%',
        maxHeight: 440,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 16,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: C.textPrimary,
    },
    modalClose: {
        fontSize: 18,
        color: C.textMuted,
        padding: 4,
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    modalItemSelected: {
        backgroundColor: '#EFF6FF',
    },
    modalItemText: {
        fontSize: 15,
        color: C.textPrimary,
        fontWeight: '500',
    },
    modalItemTextSelected: {
        color: C.secondary,
        fontWeight: '600',
    },
    modalItemCheck: {
        fontSize: 16,
        color: C.secondary,
        fontWeight: '700',
    },

    // Signup Button
    signupButton: {
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
    signupButtonText: {
        color: C.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
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

    // Login Link
    loginLink: {
        alignItems: 'center',
        padding: 8,
    },
    loginLinkText: {
        color: C.textSecondary,
        fontSize: 14,
    },
    loginLinkBold: {
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
