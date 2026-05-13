import React from 'react';
import {
    Modal as RNModal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ScrollView,
} from 'react-native';
import { adminColors, typography, spacing, borderRadius } from '../../theme';

interface ModalProps {
    visible: boolean;
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

export function Modal({ visible, title, onClose, children }: ModalProps): React.JSX.Element {
    return (
        <RNModal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={styles.title}>{title}</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Text style={styles.closeText}>✕</Text>
                                </TouchableOpacity>
                            </View>
                            <ScrollView
                                style={styles.body}
                                keyboardShouldPersistTaps="handled"
                                showsVerticalScrollIndicator={false}
                            >
                                {children}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </RNModal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: adminColors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
    },
    content: {
        backgroundColor: adminColors.surface,
        borderRadius: borderRadius.xl,
        width: '100%',
        maxWidth: 500,
        maxHeight: '85%',
        borderWidth: 1,
        borderColor: adminColors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: adminColors.border,
    },
    title: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        flex: 1,
    },
    closeButton: {
        padding: spacing.sm,
    },
    closeText: {
        fontSize: typography.size.xl,
        color: adminColors.textSecondary,
    },
    body: {
        padding: spacing.xl,
    },
});
