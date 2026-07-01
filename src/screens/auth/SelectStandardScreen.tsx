import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    FlatList,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import { useAuthContext } from '../../context/AuthContext';

// ─── Constants ──────────────────────────────────────────────────

const STANDARDS = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Standard ${i + 1}`,
}));

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
    shadow: 'rgba(25, 118, 210, 0.12)',
};

// ─── SelectStandardScreen ──────────────────────────────────────

/**
 * Shown when an authenticated student has standard = null.
 * Typically reached after Google Sign-In for the first time.
 * On selection, updates Firestore and the AuthContext userData —
 * RootNavigator then automatically routes to StudentTabs.
 */
export function SelectStandardScreen(): React.JSX.Element {
    const { user, userData } = useAuthContext();
    const [selected, setSelected] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const handleConfirm = async () => {
        if (!selected) {
            Alert.alert('Select Standard', 'Please select your standard to continue.');
            return;
        }
        if (!user?.uid) return;

        setSaving(true);
        try {
            await firestore()
                .collection('users')
                .doc(user.uid)
                .update({ standard: selected, lastActiveAt: firestore.FieldValue.serverTimestamp() });
            // The real-time Firestore listener in AuthContext (subscribeToUser) will
            // automatically update userData.standard → RootNavigator re-renders to StudentTabs.
        } catch (err) {
            Alert.alert('Error', 'Failed to save your standard. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={C.background} />

            <View style={styles.container}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoEmoji}>🎓</Text>
                    </View>
                    <Text style={styles.title}>One Last Step</Text>
                    <Text style={styles.subtitle}>
                        Select your standard to personalise your learning experience.
                    </Text>
                </View>

                {/* Standard Grid */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Select Your Standard</Text>
                    <FlatList
                        data={STANDARDS}
                        keyExtractor={(item) => String(item.value)}
                        numColumns={3}
                        scrollEnabled={false}
                        contentContainerStyle={styles.grid}
                        renderItem={({ item }) => {
                            const isSelected = item.value === selected;
                            return (
                                <TouchableOpacity
                                    style={[styles.standardItem, isSelected && styles.standardItemSelected]}
                                    onPress={() => setSelected(item.value)}
                                    activeOpacity={0.75}
                                    disabled={saving}
                                >
                                    <Text style={[styles.standardNumber, isSelected && styles.standardNumberSelected]}>
                                        {item.value}
                                    </Text>
                                    <Text style={[styles.standardLabel, isSelected && styles.standardLabelSelected]}>
                                        Std
                                    </Text>
                                </TouchableOpacity>
                            );
                        }}
                    />

                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            (!selected || saving) && styles.confirmButtonDisabled,
                        ]}
                        onPress={handleConfirm}
                        disabled={!selected || saving}
                        activeOpacity={0.85}
                    >
                        {saving ? (
                            <ActivityIndicator color={C.textPrimary} />
                        ) : (
                            <Text style={styles.confirmButtonText}>
                                Continue with Standard {selected ?? '—'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Welcome message */}
                {userData?.name ? (
                    <Text style={styles.welcomeNote}>
                        Welcome, {userData.name}! 👋
                    </Text>
                ) : null}
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
        paddingTop: 32,
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
        marginBottom: 16,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    logoEmoji: {
        fontSize: 40,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        color: C.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: C.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        paddingHorizontal: 16,
    },

    // Card
    card: {
        backgroundColor: C.surface,
        borderRadius: 24,
        padding: 24,
        shadowColor: C.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
        shadowRadius: 24,
        elevation: 6,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: C.textPrimary,
        marginBottom: 20,
        textAlign: 'center',
    },

    // Grid
    grid: {
        paddingBottom: 8,
    },
    standardItem: {
        flex: 1,
        margin: 6,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: C.border,
        paddingVertical: 14,
        alignItems: 'center',
        backgroundColor: C.surface,
    },
    standardItemSelected: {
        backgroundColor: C.primary,
        borderColor: C.primaryDark,
    },
    standardNumber: {
        fontSize: 22,
        fontWeight: '800',
        color: C.textPrimary,
    },
    standardNumberSelected: {
        color: C.textPrimary,
    },
    standardLabel: {
        fontSize: 10,
        color: C.textMuted,
        fontWeight: '500',
        marginTop: 2,
    },
    standardLabelSelected: {
        color: C.textPrimary,
    },

    // Confirm button
    confirmButton: {
        backgroundColor: C.primary,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: C.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 6,
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmButtonText: {
        color: C.textPrimary,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.4,
    },

    // Welcome note
    welcomeNote: {
        textAlign: 'center',
        color: C.textSecondary,
        fontSize: 14,
        marginTop: 20,
    },
});
