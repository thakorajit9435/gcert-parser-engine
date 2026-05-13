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
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { TextInput } from '../../components/common/TextInput';


// ─── Design Tokens ─────────────────────────────────────────────

const C = {
    primary: '#FFD54F',
    secondary: '#1976D2',
    background: '#F8F9FA',
    surface: '#FFFFFF',
    textPrimary: '#1A1A2E',
    textSecondary: '#555577',
    textMuted: '#94A3B8',
    border: '#E2E8F0',

    // Role colors
    contentAdminColor: '#F59E0B',   // orange
    superAdminColor: '#EF4444',     // red
};

type AdminRole = 'content_admin' | 'super_admin';

interface RoleOption {
    value: AdminRole;
    label: string;
    description: string;
    color: string;
    emoji: string;
}

const ROLE_OPTIONS: RoleOption[] = [
    {
        value: 'content_admin',
        label: 'Content Admin',
        description: 'Can manage educational content (subjects, chapters, quizzes)',
        color: C.contentAdminColor,
        emoji: '📋',
    },
    {
        value: 'super_admin',
        label: 'Super Admin',
        description: 'Full access including user management and admin creation',
        color: C.superAdminColor,
        emoji: '👑',
    },
];

// ─── RoleDropdown ──────────────────────────────────────────────

interface RoleDropdownProps {
    value: AdminRole | null;
    onSelect: (role: AdminRole) => void;
    disabled?: boolean;
}

function RoleDropdown({ value, onSelect, disabled }: RoleDropdownProps): React.JSX.Element {
    const [visible, setVisible] = useState(false);
    const selected = ROLE_OPTIONS.find((r) => r.value === value);

    return (
        <>
            <View style={styles.fieldContainer}>
                <Text style={styles.fieldLabel}>Admin Role</Text>
                <TouchableOpacity
                    style={[styles.dropdownButton, disabled && styles.disabled]}
                    onPress={() => !disabled && setVisible(true)}
                    activeOpacity={0.7}
                >
                    {selected ? (
                        <View style={styles.selectedRole}>
                            <Text style={styles.selectedRoleEmoji}>{selected.emoji}</Text>
                            <Text style={[styles.selectedRoleLabel, { color: selected.color }]}>
                                {selected.label}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.dropdownPlaceholder}>Select Role</Text>
                    )}
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
                            <Text style={styles.modalTitle}>Select Admin Role</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Text style={styles.modalClose}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {ROLE_OPTIONS.map((option) => (
                            <TouchableOpacity
                                key={option.value}
                                style={[
                                    styles.roleOption,
                                    option.value === value && styles.roleOptionSelected,
                                ]}
                                onPress={() => {
                                    onSelect(option.value);
                                    setVisible(false);
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.roleIconBox, { backgroundColor: option.color + '20' }]}>
                                    <Text style={styles.roleEmoji}>{option.emoji}</Text>
                                </View>
                                <View style={styles.roleTextBox}>
                                    <Text style={[styles.roleLabel, { color: option.color }]}>
                                        {option.label}
                                    </Text>
                                    <Text style={styles.roleDescription}>{option.description}</Text>
                                </View>
                                {option.value === value && (
                                    <Text style={[styles.roleCheck, { color: option.color }]}>✓</Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

// ─── CreateAdminScreen ─────────────────────────────────────────

export function CreateAdminScreen(): React.JSX.Element {
    const navigation = useNavigation();
    const { createAdmin, userData } = useAuth();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<AdminRole | null>(null);
    const [loading, setLoading] = useState(false);

    // Security guard — this screen should only be reachable by super_admin
    // but we double-check here for defence-in-depth
    if (userData?.role !== 'super_admin') {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.accessDenied}>
                    <Text style={styles.accessDeniedEmoji}>🔒</Text>
                    <Text style={styles.accessDeniedTitle}>Access Denied</Text>
                    <Text style={styles.accessDeniedText}>
                        Only Super Admins can access this screen.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    const validate = (): string | null => {
        if (!name.trim()) return 'Please enter the admin\'s full name.';
        if (!email.trim() || !email.includes('@')) return 'Please enter a valid email address.';
        if (password.length < 8) return 'Password must be at least 8 characters for admin accounts.';
        if (!role) return 'Please select an admin role.';
        return null;
    };

    const handleCreate = async () => {
        const error = validate();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        Alert.alert(
            'Confirm Admin Creation',
            `Create a new ${role === 'super_admin' ? 'Super Admin' : 'Content Admin'} account for ${name.trim()}?\n\nThis action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Create',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const result = await createAdmin(
                                email.trim(),
                                password,
                                name.trim(),
                                role!,
                            );
                            if (result.success) {
                                Alert.alert(
                                    'Success ✓',
                                    `Admin account created for ${name.trim()}.\n\nRole: ${role === 'super_admin' ? 'Super Admin' : 'Content Admin'}`,
                                    [
                                        {
                                            text: 'OK',
                                            onPress: () => {
                                                setName('');
                                                setEmail('');
                                                setPassword('');
                                                setRole(null);
                                            },
                                        },
                                    ],
                                );
                            } else {
                                Alert.alert('Failed', result.error || 'Could not create admin account.');
                            }
                        } catch (err) {
                            Alert.alert('Error', (err as Error).message);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={C.background} />

            {/* Navbar */}
            <View style={styles.navbar}>
                <TouchableOpacity onPress={() => (navigation as any).goBack()} style={styles.backButton}>
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.navTitle}>Create Admin Account</Text>
                <View style={styles.navRight} />
            </View>

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Warning Banner */}
                    <View style={styles.warningBanner}>
                        <Text style={styles.warningIcon}>⚠️</Text>
                        <View style={styles.warningText}>
                            <Text style={styles.warningTitle}>Super Admin Action</Text>
                            <Text style={styles.warningBody}>
                                Admin accounts have elevated privileges. The new admin will receive an email to set up their account.
                            </Text>
                        </View>
                    </View>

                    {/* Form Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>New Admin Details</Text>

                        <TextInput
                            label="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter admin's full name"
                            autoCapitalize="words"
                        />

                        <TextInput
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="Enter admin's email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <TextInput
                            label="Temporary Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Minimum 8 characters"
                            secureTextEntry
                        />

                        <RoleDropdown
                            value={role}
                            onSelect={setRole}
                            disabled={loading}
                        />

                        {/* Role Preview Badge */}
                        {role && (
                            <View
                                style={[
                                    styles.roleBadgePreview,
                                    { backgroundColor: (role === 'super_admin' ? C.superAdminColor : C.contentAdminColor) + '15' },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.roleBadgePreviewText,
                                        { color: role === 'super_admin' ? C.superAdminColor : C.contentAdminColor },
                                    ]}
                                >
                                    {role === 'super_admin' ? '👑 Super Admin' : '📋 Content Admin'}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.createButton, loading && styles.buttonDisabled]}
                            onPress={handleCreate}
                            disabled={loading}
                            activeOpacity={0.85}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.createButtonText}>Create Admin Account</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: C.background },
    flex: { flex: 1 },

    // Navbar
    navbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: C.surface,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
    },
    backButton: { padding: 4, marginRight: 8 },
    backIcon: { fontSize: 28, color: C.secondary, fontWeight: '300', lineHeight: 32 },
    navTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: C.textPrimary },
    navRight: { width: 32 },

    // Access Denied
    accessDenied: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    accessDeniedEmoji: { fontSize: 56, marginBottom: 16 },
    accessDeniedTitle: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 8 },
    accessDeniedText: { fontSize: 15, color: C.textSecondary, textAlign: 'center' },

    // Warning Banner
    warningBanner: {
        flexDirection: 'row',
        backgroundColor: '#FFFBEB',
        borderRadius: 14,
        padding: 14,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#FDE68A',
        gap: 10,
        alignItems: 'flex-start',
    },
    warningIcon: { fontSize: 18, marginTop: 1 },
    warningText: { flex: 1 },
    warningTitle: { fontSize: 14, fontWeight: '700', color: '#92400E', marginBottom: 2 },
    warningBody: { fontSize: 13, color: '#78350F', lineHeight: 18 },

    // Card
    card: {
        backgroundColor: C.surface,
        borderRadius: 24,
        padding: 24,
        shadowColor: 'rgba(0,0,0,0.08)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 4,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: C.textPrimary,
        marginBottom: 20,
    },

    // Scroll
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },

    // Dropdown
    fieldContainer: { marginBottom: 16 },
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
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        backgroundColor: C.surface,
    },
    selectedRole: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    selectedRoleEmoji: { fontSize: 18 },
    selectedRoleLabel: { fontSize: 15, fontWeight: '600' },
    dropdownPlaceholder: { fontSize: 15, color: C.textMuted },
    dropdownArrow: { fontSize: 16, color: C.textMuted },
    disabled: { opacity: 0.6 },

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
        borderRadius: 24,
        width: '100%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 32,
        elevation: 16,
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
    modalTitle: { fontSize: 17, fontWeight: '700', color: C.textPrimary },
    modalClose: { fontSize: 18, color: C.textMuted, padding: 4 },

    // Role Options
    roleOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    roleOptionSelected: { backgroundColor: '#F8FAFF' },
    roleIconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    roleEmoji: { fontSize: 22 },
    roleTextBox: { flex: 1 },
    roleLabel: { fontSize: 15, fontWeight: '700' },
    roleDescription: { fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 16 },
    roleCheck: { fontSize: 18, fontWeight: '700' },

    // Role Preview
    roleBadgePreview: {
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        alignItems: 'center',
        marginBottom: 8,
    },
    roleBadgePreviewText: { fontSize: 15, fontWeight: '700' },

    // Create Button
    createButton: {
        backgroundColor: C.secondary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 24,
        shadowColor: C.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 6,
    },
    buttonDisabled: { opacity: 0.7 },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
