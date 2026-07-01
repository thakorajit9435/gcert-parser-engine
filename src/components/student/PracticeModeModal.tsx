import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal as RNModal } from 'react-native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';

interface PracticeModeModalProps {
    visible: boolean;
    onClose: () => void;
    availableCounts: number[];
    onSelectCount: (count: number) => void;
    title?: string;
}

export function PracticeModeModal({
    visible,
    onClose,
    availableCounts,
    onSelectCount,
    title = 'પ્રેક્ટિસ માટે પ્રશ્નોની સંખ્યા પસંદ કરો',
}: PracticeModeModalProps): React.JSX.Element {
    if (!visible) {return <></>;}

    return (
        <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
                    <View style={styles.handle} />

                    <Text style={styles.title}>{title}</Text>

                    {availableCounts.length === 0 ? (
                        <Text style={styles.emptyText}>કોઈ વિકલ્પ ઉપલબ્ધ નથી.</Text>
                    ) : (
                        <View style={styles.optionsGrid}>
                            {availableCounts.map(count => (
                                <TouchableOpacity
                                    key={count}
                                    style={styles.optionBtn}
                                    onPress={() => onSelectCount(count)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.optionCircle}>
                                        <Text style={styles.optionText}>{count}</Text>
                                    </View>
                                    <Text style={styles.optionSub}>MCQs</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                        <Text style={styles.cancelBtnText}>રદ કરો</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    bottomSheet: {
        backgroundColor: studentColors.surface,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.xl,
        paddingBottom: spacing.xxl,
        ...shadows.lg,
    },
    handle: {
        width: 40,
        height: 4,
        backgroundColor: studentColors.border,
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: spacing.md,
        marginBottom: spacing.xl,
    },
    optionBtn: {
        alignItems: 'center',
        width: 80,
    },
    optionCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: studentColors.primaryLight + '30',
        borderWidth: 2,
        borderColor: studentColors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    optionText: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.primary,
    },
    optionSub: {
        fontSize: typography.size.xs,
        color: studentColors.textSecondary,
        fontWeight: typography.weight.medium,
    },
    emptyText: {
        textAlign: 'center',
        color: studentColors.textMuted,
        marginBottom: spacing.xl,
    },
    cancelBtn: {
        paddingVertical: spacing.md,
        alignItems: 'center',
        backgroundColor: studentColors.background,
        borderRadius: borderRadius.md,
    },
    cancelBtnText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textSecondary,
    },
});
