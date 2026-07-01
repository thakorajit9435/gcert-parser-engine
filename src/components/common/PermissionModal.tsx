import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { studentColors, typography, spacing, borderRadius } from '../../theme';

interface PermissionModalProps {
    visible: boolean;
    title: string;
    description: string;
    icon?: string;
    onClose: () => void;
    onAllow: () => void;
}

export function PermissionModal({
    visible,
    title,
    description,
    icon = '📁',
    onClose,
    onAllow,
}: PermissionModalProps): React.JSX.Element {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <Text style={styles.icon}>{icon}</Text>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>બંધ કરો</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.allowButton} onPress={onAllow}>
                            <Text style={styles.allowButtonText}>પરવાનગી આપો</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    container: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
    icon: {
        fontSize: 48,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    description: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: typography.lineHeight.md,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    cancelButton: {
        flex: 1,
        marginRight: spacing.sm,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        borderWidth: 1,
        borderColor: studentColors.border,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: studentColors.textSecondary,
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
    },
    allowButton: {
        flex: 1,
        marginLeft: spacing.sm,
        paddingVertical: spacing.md,
        backgroundColor: studentColors.primary,
        borderRadius: borderRadius.md,
        alignItems: 'center',
    },
    allowButtonText: {
        color: studentColors.textOnPrimary || '#3E2723',
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
    },
});
