import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { adminColors, typography, spacing } from '../../theme';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
}

/**
 * Confirmation dialog for destructive/important actions.
 */
export function ConfirmDialog({
    visible,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    onConfirm,
    onCancel,
    loading = false,
}: ConfirmDialogProps): React.JSX.Element {
    return (
        <Modal visible={visible} title={title} onClose={onCancel}>
            <View>
                <Text style={styles.message}>{message}</Text>
                <View style={styles.actions}>
                    <Button
                        title={cancelLabel}
                        variant="secondary"
                        onPress={onCancel}
                        style={styles.button}
                    />
                    <Button
                        title={confirmLabel}
                        variant={variant === 'danger' ? 'danger' : 'primary'}
                        onPress={onConfirm}
                        loading={loading}
                        style={styles.button}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    message: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        lineHeight: typography.lineHeight.lg,
        marginBottom: spacing.xxl,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.md,
    },
    button: {
        minWidth: 100,
    },
});
