import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { studentColors, typography, spacing, borderRadius } from '../../theme';
import { AppNotification } from '../../types';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

function getTypeEmoji(targetType: string): string {
    switch (targetType) {
        case 'all': return '📢';
        case 'standard': return '🎓';
        case 'individual': return '👤';
        case 'premium': return '💎';
        default: return '🔔';
    }
}

function formatFullDateTime(timestamp: FirebaseFirestoreTypes.Timestamp | null | undefined): string {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate();
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return '';
    }
}

export function NotificationDetailScreen({ route }: { route: any }): React.JSX.Element {
    const { notification } = route.params as { notification: AppNotification };

    return (
        <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.safeArea}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Header Section */}
                <View style={styles.headerSection}>
                    <View style={styles.iconCircle}>
                        <Text style={styles.iconEmoji}>{getTypeEmoji(notification.targetType)}</Text>
                    </View>
                    <Text style={styles.typeLabel}>
                        {notification.targetType === 'all' ? 'General Announcement'
                            : notification.targetType === 'standard' ? `Class Announcement (Std ${(notification as any).targetStandard ?? ''})`
                                : notification.targetType === 'individual' ? 'Personal Message'
                                    : 'Notification'}
                    </Text>
                    <Text style={styles.timeLabel}>
                        {formatFullDateTime(notification.createdAt)}
                    </Text>
                </View>

                {/* Content Card */}
                <View style={styles.card}>
                    <Text style={styles.title}>{notification.title}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.message}>{notification.message}</Text>
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
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: studentColors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        borderWidth: 1.5,
        borderColor: studentColors.border,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    iconEmoji: {
        fontSize: 36,
    },
    typeLabel: {
        fontSize: typography.size.sm,
        fontWeight: typography.weight.bold,
        color: studentColors.secondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: spacing.xs,
    },
    timeLabel: {
        fontSize: typography.size.xs,
        color: studentColors.textSecondary,
    },
    card: {
        width: '100%',
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: studentColors.border,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 16,
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        lineHeight: 28,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: studentColors.border,
        marginVertical: spacing.lg,
    },
    message: {
        fontSize: typography.size.md,
        color: studentColors.textPrimary,
        lineHeight: 24,
    },
});
