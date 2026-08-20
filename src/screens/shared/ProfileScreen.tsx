import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    StatusBar,
    Modal,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { getTotalUserCount, getAdminCount } from '../../services/firebase/users.service';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',

    // Role badge colors
    badgeStudent: '#1976D2',       // blue
    badgeContentAdmin: '#F59E0B',  // orange
    badgeSuperAdmin: '#EF4444',    // red
};

// ─── Role Badge ────────────────────────────────────────────────

interface RoleBadgeProps {
    role: string;
}

function RoleBadge({ role }: RoleBadgeProps): React.JSX.Element {
    const config = {
        student: { label: 'Student', color: C.badgeStudent, emoji: '🎓' },
        content_admin: { label: 'Content Admin', color: C.badgeContentAdmin, emoji: '📋' },
        super_admin: { label: 'Super Admin', color: C.badgeSuperAdmin, emoji: '👑' },
    }[role] ?? { label: role, color: C.textMuted, emoji: '👤' };

    return (
        <View style={[styles.roleBadge, { backgroundColor: config.color + '18' }]}>
            <Text style={styles.roleBadgeEmoji}>{config.emoji}</Text>
            <Text style={[styles.roleBadgeText, { color: config.color }]}>{config.label}</Text>
        </View>
    );
}

// ─── PremiumBadge ──────────────────────────────────────────────

function PremiumBadge({ active }: { active: boolean }): React.JSX.Element {
    return (
        <View style={[styles.premiumBadge, active ? styles.premiumActive : styles.premiumInactive]}>
            <Text style={styles.premiumEmoji}>{active ? '💎' : '🔓'}</Text>
            <Text style={[styles.premiumText, { color: active ? '#7C3AED' : C.textMuted }]}>
                {active ? 'Premium Member' : 'Free Account'}
            </Text>
        </View>
    );
}

// ─── InfoRow ───────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }): React.JSX.Element {
    return (
        <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>{icon}</Text>
            </View>
            <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>{label}</Text>
                <Text style={styles.infoValue}>{value}</Text>
            </View>
        </View>
    );
}

// ─── NavRow ────────────────────────────────────────────────────

function NavRow({
    icon,
    label,
    onPress,
    destructive,
}: {
    icon: string;
    label: string;
    onPress: () => void;
    destructive?: boolean;
}): React.JSX.Element {
    return (
        <TouchableOpacity
            style={styles.navRow}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={[styles.infoIconBox, destructive && { backgroundColor: '#FEE2E2' }]}>
                <Text style={styles.infoIcon}>{icon}</Text>
            </View>
            <Text style={[styles.navRowLabel, destructive && { color: C.error }]}>{label}</Text>
            <Text style={[styles.navRowChevron, destructive && { color: C.error }]}>›</Text>
        </TouchableOpacity>
    );
}

// ─── StatCard ─────────────────────────────────────────────────

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number | string; color: string }): React.JSX.Element {
    return (
        <View style={[styles.statCard, { borderTopColor: color }]}>
            <Text style={styles.statIcon}>{icon}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

// ─── Delete Account Modal ─────────────────────────────────────

function DeleteAccountModal({
    visible,
    onCancel,
    onConfirm,
    isDeleting,
}: {
    visible: boolean;
    onCancel: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}): React.JSX.Element {
    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalIcon}>⚠️</Text>
                    <Text style={styles.modalTitle}>Delete Account</Text>
                    <Text style={styles.modalBody}>
                        This will permanently delete your account and all associated data.{'\n\n'}
                        This action <Text style={{ fontWeight: '700', color: C.error }}>cannot be undone</Text>.
                    </Text>
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={styles.modalCancelBtn}
                            onPress={onCancel}
                            disabled={isDeleting}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modalDeleteBtn, isDeleting && { opacity: 0.6 }]}
                            onPress={onConfirm}
                            disabled={isDeleting}
                            activeOpacity={0.8}
                        >
                            {isDeleting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.modalDeleteText}>Delete</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// ─── Government & Textbook Disclaimer Modal ───────────────────

function DisclaimerModal({
    visible,
    onClose,
}: {
    visible: boolean;
    onClose: () => void;
}): React.JSX.Element {
    return (
        <Modal
            transparent
            animationType="fade"
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalCard, { maxWidth: 420 }]}>
                    <Text style={styles.modalIcon}>🏛️</Text>
                    <Text style={styles.modalTitle}>સરકારી અસ્વીકરણ (Disclaimer)</Text>
                    
                    <ScrollView style={{ maxHeight: 260, marginVertical: 10 }} showsVerticalScrollIndicator={false}>
                        <Text style={[styles.modalBody, { textAlign: 'left', fontSize: 13, lineHeight: 19, color: '#334155' }]}>
                            <Text style={{ fontWeight: '700', color: '#1e293b' }}>૧. બિન-સરકારી એકમ (Non-Affiliation):</Text>{'\n'}
                            આ એપ્લિકેશન (GyanDeep) એક સ્વતંત્ર શૈક્ષણિક પ્લેટફોર્મ છે. તે ગુજરાત સરકાર કે ગુજરાત રાજ્ય શાળા પાઠ્યપુસ્તક મંડળ (GSSTB) સાથે સંલગ્ન કે અધિકૃત નથી.{'\n\n'}
                            <Text style={{ fontWeight: '700', color: '#1e293b' }}>૨. પાઠ્યપુસ્તકોનો સત્તાવાર સ્ત્રોત:</Text>{'\n'}
                            તમામ શાળા પાઠ્યપુસ્તકો જાહેર શિક્ષણ હેતુ માટે GSSTB ની અધિકૃત વેબસાઇટ પરથી મેળવેલા છે:{'\n'}
                        </Text>
                        <TouchableOpacity
                            style={{ backgroundColor: '#eff6ff', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#bfdbfe', marginBottom: 10 }}
                            onPress={() => Linking.openURL('https://gsstb.gujarat.gov.in/')}
                        >
                            <Text style={{ color: '#1d4ed8', fontWeight: '700', fontSize: 12, textAlign: 'center' }}>
                                👉 https://gsstb.gujarat.gov.in/
                            </Text>
                        </TouchableOpacity>
                        <Text style={[styles.modalBody, { textAlign: 'left', fontSize: 13, lineHeight: 19, color: '#334155' }]}>
                            <Text style={{ fontWeight: '700', color: '#1e293b' }}>૩. ૧૦૦% મફત વાંચન:</Text>{'\n'}
                            વિદ્યાર્થીઓ તમામ સરકારી પાઠ્યપુસ્તકો કોઈપણ ફી વગર સંપૂર્ણપણે મફત વાંચી શકે છે.
                        </Text>
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.modalCancelBtn, { backgroundColor: '#1d4ed8', marginTop: 6 }]}
                        onPress={onClose}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.modalCancelText, { color: '#FFFFFF', fontWeight: '700' }]}>સમજાઈ ગયું (Close)</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ─── ProfileScreen ────────────────────────────────────────────

export function ProfileScreen(): React.JSX.Element {
    const { userData, role, logout } = useAuth();
    const navigation = useNavigation();
    const { t, i18n } = useTranslation();
    const [loggingOut, setLoggingOut] = useState(false);

    // Disclaimer modal state
    const [showDisclaimerModal, setShowDisclaimerModal] = useState(false);

    // Delete account state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Stats for super_admin
    const [totalUsers, setTotalUsers] = useState<number | null>(null);
    const [adminCount, setAdminCount] = useState<number | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);

    useEffect(() => {
        if (role === 'super_admin') {
            setStatsLoading(true);
            Promise.all([getTotalUserCount(), getAdminCount()]).then(([users, admins]) => {
                setTotalUsers(users);
                setAdminCount(admins);
                setStatsLoading(false);
            });
        }
    }, [role]);

    // ── Logout ────────────────────────────────────────────────
    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    setLoggingOut(true);
                    await logout();
                    setLoggingOut(false);
                },
            },
        ]);
    };

    // ── Delete Account ────────────────────────────────────────
    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            const user = auth().currentUser;
            if (!user) throw new Error('No authenticated user found.');

            // Delete Firestore document first
            await firestore().collection('users').doc(user.uid).delete();

            // Then delete the Firebase Auth account
            await user.delete();

            // logout() clears local state / context
            await logout();
        } catch (error: any) {
            setIsDeleting(false);
            setShowDeleteModal(false);

            // Firebase requires recent login for deletion — prompt re-auth
            if (error?.code === 'auth/requires-recent-login') {
                Alert.alert(
                    'Re-authentication Required',
                    'For security, please sign out and sign in again before deleting your account.',
                    [{ text: 'OK' }],
                );
            } else {
                Alert.alert('Error', error?.message || 'Failed to delete account. Please try again.');
            }
        }
    };

    // ── Guard ─────────────────────────────────────────────────
    if (!userData) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <ActivityIndicator style={styles.centered} color={C.secondary} />
            </SafeAreaView>
        );
    }

    // ── Avatar initials ───────────────────────────────────────
    const initials = userData.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={C.background} />

            {/* Delete Confirmation Modal */}
            <DeleteAccountModal
                visible={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteAccount}
                isDeleting={isDeleting}
            />

            {/* Government & GSSTB Disclaimer Modal */}
            <DisclaimerModal
                visible={showDisclaimerModal}
                onClose={() => setShowDisclaimerModal(false)}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Avatar + Name */}
                <View style={styles.heroSection}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarInitials}>{initials}</Text>
                    </View>
                    <Text style={styles.heroName}>{userData.name}</Text>
                    <Text style={styles.heroEmail}>{userData.email}</Text>
                    <RoleBadge role={userData.role} />
                </View>

                {/* ── STUDENT SECTION ──────────────────────────── */}
                {role === 'student' && (
                    <>
                        <PremiumBadge active={userData.premium || userData.isPremium || false} />

                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Account Info</Text>
                            <InfoRow icon="📚" label="Standard" value={userData.standard !== null ? `Standard ${userData.standard}` : '—'} />
                            <InfoRow icon="✉️" label="Email" value={userData.email} />
                        </View>

                        <TouchableOpacity
                            style={styles.card}
                            activeOpacity={0.7}
                            onPress={() => (navigation as any).navigate('BookmarkList')}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                    <View style={styles.infoIconBox}>
                                        <Text style={styles.infoIcon}>🔖</Text>
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: C.textPrimary }}>My Bookmarks</Text>
                                </View>
                                <Text style={{ fontSize: 20, color: C.textMuted }}>›</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.pointsCard}>
                            <Text style={styles.pointsLabel}>🏆 Total Points</Text>
                            <Text style={styles.pointsValue}>{userData.points.toLocaleString()}</Text>
                            <Text style={styles.pointsHint}>Keep learning to earn more points!</Text>
                        </View>

                        {/* ── Legal & Account Links ─────────────── */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Legal & Account</Text>
                            <NavRow
                                icon="🏛️"
                                label="અસ્વીકરણ (Disclaimer & Source)"
                                onPress={() => setShowDisclaimerModal(true)}
                            />
                            <NavRow
                                icon="🔒"
                                label="Privacy Policy"
                                onPress={() => {
                                    console.log('[ProfileScreen] Navigating to PrivacyPolicy');
                                    (navigation as any).navigate('PrivacyPolicy');
                                }}
                            />
                            <NavRow
                                icon="📄"
                                label="Terms & Conditions"
                                onPress={() => {
                                    console.log('[ProfileScreen] Navigating to TermsConditions');
                                    (navigation as any).navigate('TermsConditions');
                                }}
                            />
                            <NavRow
                                icon="🛡️"
                                label="Privacy & Data Info"
                                onPress={() => {
                                    console.log('[ProfileScreen] Navigating to PrivacyInfo');
                                    (navigation as any).navigate('PrivacyInfo');
                                }}
                            />
                            <NavRow
                                icon="🗑️"
                                label="Delete Account"
                                onPress={() => {
                                    console.log('[ProfileScreen] Opening Delete Account modal');
                                    setShowDeleteModal(true);
                                }}
                                destructive
                            />
                        </View>
                    </>
                )}

                {/* ── CONTENT ADMIN SECTION ────────────────────── */}
                {role === 'content_admin' && (
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Account Info</Text>
                        <InfoRow icon="✉️" label="Email" value={userData.email} />
                        <InfoRow icon="🔑" label="Access Level" value="Content Management" />
                        <InfoRow icon="📋" label="Capabilities" value="Subjects, Chapters, Quizzes, Notifications" />
                    </View>
                )}

                {/* ── SUPER ADMIN SECTION ──────────────────────── */}
                {role === 'super_admin' && (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Account Info</Text>
                            <InfoRow icon="✉️" label="Email" value={userData.email} />
                            <InfoRow icon="🔑" label="Access Level" value="Full System Access" />
                        </View>

                        {/* Stats */}
                        <View style={styles.statsContainer}>
                            {statsLoading ? (
                                <ActivityIndicator color={C.secondary} />
                            ) : (
                                <>
                                    <StatCard
                                        icon="👥"
                                        label="Total Users"
                                        value={totalUsers ?? 0}
                                        color={C.secondary}
                                    />
                                    <StatCard
                                        icon="🛡️"
                                        label="Total Admins"
                                        value={adminCount ?? 0}
                                        color={C.badgeSuperAdmin}
                                    />
                                </>
                            )}
                        </View>

                        {/* Create Admin Button */}
                        <TouchableOpacity
                            style={styles.createAdminButton}
                            onPress={() => (navigation as any).navigate('CreateAdmin')}
                            activeOpacity={0.85}
                        >
                            <Text style={styles.createAdminIcon}>➕</Text>
                            <Text style={styles.createAdminText}>Create Admin Account</Text>
                        </TouchableOpacity>
                    </>
                )}

                {/* ── SETTINGS SECTION (all roles) ─────────────── */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('common.settings') || 'Settings'}</Text>
                    <View style={styles.languageRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                            <View style={styles.infoIconBox}>
                                <Text style={styles.infoIcon}>🌐</Text>
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>{t('common.language') || 'Language'}</Text>
                                <Text style={styles.infoValue}>{i18n.language === 'gu' ? 'Gujarati' : 'English'}</Text>
                            </View>
                        </View>
                        <View style={styles.languageToggles}>
                            <TouchableOpacity
                                style={[styles.langBtn, i18n.language === 'gu' && styles.langBtnActive]}
                                onPress={() => i18n.changeLanguage('gu')}
                            >
                                <Text style={[styles.langBtnText, i18n.language === 'gu' && styles.langBtnTextActive]}>GU</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.langBtn, i18n.language === 'en' && styles.langBtnActive]}
                                onPress={() => i18n.changeLanguage('en')}
                            >
                                <Text style={[styles.langBtnText, i18n.language === 'en' && styles.langBtnTextActive]}>EN</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.logoutButton, loggingOut && styles.buttonDisabled]}
                    onPress={handleLogout}
                    disabled={loggingOut}
                    activeOpacity={0.85}
                >
                    {loggingOut ? (
                        <ActivityIndicator color={C.error} />
                    ) : (
                        <>
                            <Text style={styles.logoutIcon}>→</Text>
                            <Text style={styles.logoutText}>Sign Out</Text>
                        </>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: C.background },
    centered: { flex: 1, alignSelf: 'center' },
    scrollContent: { padding: 16, paddingBottom: 40 },

    // Hero
    heroSection: { alignItems: 'center', paddingVertical: 24 },
    avatar: {
        width: 84,
        height: 84,
        borderRadius: 42,
        backgroundColor: C.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        shadowColor: C.secondary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    avatarInitials: { fontSize: 30, fontWeight: '700', color: '#fff' },
    heroName: { fontSize: 22, fontWeight: '700', color: C.textPrimary, marginBottom: 4 },
    heroEmail: { fontSize: 14, color: C.textSecondary, marginBottom: 12 },

    // Role Badge
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 6,
        gap: 6,
    },
    roleBadgeEmoji: { fontSize: 14 },
    roleBadgeText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },

    // Premium Badge
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        gap: 10,
    },
    premiumActive: { backgroundColor: '#F3E8FF' },
    premiumInactive: { backgroundColor: '#F1F5F9' },
    premiumEmoji: { fontSize: 20 },
    premiumText: { fontSize: 15, fontWeight: '600' },

    // Card
    card: {
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 20,
        marginBottom: 12,
        shadowColor: 'rgba(0,0,0,0.06)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: C.textPrimary,
        marginBottom: 16,
    },

    // InfoRow
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    infoIconBox: {
        width: 36,
        height: 36,
        backgroundColor: '#F1F5F9',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoIcon: { fontSize: 16 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: C.textMuted, marginBottom: 2 },
    infoValue: { fontSize: 15, fontWeight: '600', color: C.textPrimary },

    // NavRow
    navRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        gap: 12,
    },
    navRowLabel: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
        color: C.textPrimary,
    },
    navRowChevron: {
        fontSize: 20,
        color: C.textMuted,
    },

    // Points
    pointsCard: {
        backgroundColor: C.primary,
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    pointsLabel: { fontSize: 14, fontWeight: '600', color: '#5D4037', marginBottom: 8 },
    pointsValue: { fontSize: 40, fontWeight: '800', color: '#3E2723' },
    pointsHint: { fontSize: 12, color: '#6D4C41', marginTop: 6 },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    statCard: {
        flex: 1,
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        borderTopWidth: 3,
        shadowColor: 'rgba(0,0,0,0.05)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
    },
    statIcon: { fontSize: 24, marginBottom: 6 },
    statValue: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 12, color: C.textMuted, marginTop: 2, textAlign: 'center' },

    // Create Admin
    createAdminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: C.secondary,
        borderRadius: 16,
        paddingVertical: 14,
        marginBottom: 12,
        gap: 8,
        shadowColor: C.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    createAdminIcon: { fontSize: 16, color: '#fff' },
    createAdminText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },

    // Logout
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: C.error,
        borderRadius: 16,
        paddingVertical: 14,
        marginTop: 8,
        gap: 8,
    },
    buttonDisabled: { opacity: 0.7 },
    logoutIcon: { fontSize: 18, color: C.error },
    logoutText: { fontSize: 15, fontWeight: '700', color: C.error, letterSpacing: 0.3 },

    // Language
    languageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    languageToggles: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        borderRadius: 8,
        padding: 4,
    },
    langBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    langBtnActive: {
        backgroundColor: C.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    langBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: C.textMuted,
    },
    langBtnTextActive: {
        color: C.secondary,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        backgroundColor: C.surface,
        borderRadius: 24,
        padding: 28,
        width: '100%',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 30,
        elevation: 20,
    },
    modalIcon: { fontSize: 44, marginBottom: 12 },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: C.textPrimary,
        marginBottom: 12,
    },
    modalBody: {
        fontSize: 14,
        color: C.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalCancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: '700',
        color: C.textSecondary,
    },
    modalDeleteBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: C.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalDeleteText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
