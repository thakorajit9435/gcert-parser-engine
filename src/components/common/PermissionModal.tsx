import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { spacing } from '../../theme';

interface PermissionModalProps {
    visible: boolean;
    title?: string;
    description?: string;
    icon?: string;
    onClose: () => void;
    onAllow: () => void;
    allowText?: string;
    cancelText?: string;
}

export function PermissionModal({
    visible,
    title = 'ફાઇલ્સ અને મીડિયા પરવાનગી (Permission Required)',
    description,
    icon = '📁',
    onClose,
    onAllow,
    allowText = 'પરવાનગી આપો',
    cancelText = 'હમણાં નહીં',
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
                    <View style={styles.iconCircle}>
                        <Text style={styles.icon}>{icon}</Text>
                    </View>

                    <Text style={styles.title}>{title}</Text>

                    {description ? (
                        <Text style={styles.description}>{description}</Text>
                    ) : (
                        <View style={styles.bulletsContainer}>
                            <View style={styles.bulletRow}>
                                <Text style={styles.bulletIcon}>📖</Text>
                                <Text style={styles.bulletText}>
                                    <Text style={styles.boldText}>ડિજિટલ પુસ્તકો:</Text> પાઠ્યપુસ્તકો અને પ્રકરણો ઝડપી વાંચવા તથા ઑફલાઇન સેવ કરવા માટે.
                                </Text>
                            </View>
                            <View style={styles.bulletRow}>
                                <Text style={styles.bulletIcon}>📷</Text>
                                <Text style={styles.bulletText}>
                                    <Text style={styles.boldText}>ફોટો / હોમવર્ક:</Text> AI ચેટ ટ્યુટરમાં પ્રશ્નનો ફોટો જોડીને ડાઉટ સોલ્વ કરવા માટે.
                                </Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.allowButton}
                            onPress={onAllow}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.allowButtonText}>{allowText}</Text>
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
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 340,
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
    },
    iconCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: '#eff6ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#bfdbfe',
    },
    icon: {
        fontSize: 32,
    },
    title: {
        fontSize: 16.5,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 14,
        textAlign: 'center',
        lineHeight: 22,
    },
    description: {
        fontSize: 13.5,
        color: '#475569',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    bulletsContainer: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        gap: 10,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    bulletIcon: {
        fontSize: 18,
        marginTop: 1,
    },
    bulletText: {
        flex: 1,
        fontSize: 12.5,
        color: '#334155',
        lineHeight: 18,
    },
    boldText: {
        fontWeight: '700',
        color: '#0f172a',
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        gap: 10,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    cancelButtonText: {
        color: '#64748b',
        fontSize: 13.5,
        fontWeight: '600',
    },
    allowButton: {
        flex: 1.2,
        paddingVertical: 12,
        backgroundColor: '#2563eb',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 2,
    },
    allowButtonText: {
        color: '#FFFFFF',
        fontSize: 13.5,
        fontWeight: '700',
    },
});
