import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';

export function PrivacyInfoScreen(): React.JSX.Element {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={studentColors.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.header}>Privacy & Data Protection</Text>
                    <Text style={styles.subtitle}>Understand how we secure your learning journey data.</Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>📋 What Data We Collect</Text>
                    <Text style={styles.paragraph}>
                        • Profile Details: Name, email address, and standard/grade to personalize your dashboard.{'\n'}
                        • Activity Metrics: Quiz attempts, points (XP), reading history, streaks, and page bookmarks to track your study progress.{'\n'}
                        • System Diagnostics: Basic device model and crash reports to maintain app performance.
                    </Text>

                    <Text style={styles.sectionTitle}>🔒 Why We Collect It</Text>
                    <Text style={styles.paragraph}>
                        We process this information to offer standard-wise learning modules, display ranks on top performer leaderboards, and notify you of upcoming lessons/updates. We do not sell or monetize your private data.
                    </Text>

                    <Text style={styles.sectionTitle}>🛡️ Your Data Rights</Text>
                    <Text style={styles.paragraph}>
                        You retain full control over your personal data. You can access your stats anytime via the Profile screen. You also have the right to request deletion of all your personal profile details, bookmarks, and quiz attempts immediately.
                    </Text>

                    <Text style={styles.sectionTitle}>🗑️ Account Deletion</Text>
                    <Text style={styles.paragraph}>
                        You can request deletion directly in your Profile screen. Confirming deletion will permanently erase your authentication details, progress metrics, and points from our servers.
                    </Text>

                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.backButtonText}>Got It, Go Back</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: spacing.huge,
    },
    card: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    header: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
        marginBottom: spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: studentColors.border,
        marginVertical: spacing.md,
    },
    sectionTitle: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginTop: spacing.lg,
        marginBottom: spacing.xs,
    },
    paragraph: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        lineHeight: typography.lineHeight.md,
        marginBottom: spacing.sm,
    },
    backButton: {
        backgroundColor: studentColors.secondary,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        marginTop: spacing.xxl,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
    },
});
