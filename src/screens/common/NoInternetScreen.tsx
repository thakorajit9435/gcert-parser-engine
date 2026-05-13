import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { adminColors, typography } from '../../theme';

interface NoInternetScreenProps {
    onRetry: () => void;
}

export function NoInternetScreen({ onRetry }: NoInternetScreenProps): React.JSX.Element {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={adminColors.background} />
            <View style={styles.container}>
                <View style={styles.iconContainer}>
                    <Ionicons name="wifi-outline" size={80} color={adminColors.textMuted} />
                    <View style={styles.crossBadge}>
                        <Ionicons name="close" size={24} color="#fff" />
                    </View>
                </View>

                <Text style={styles.title}>No Internet Connection</Text>
                <Text style={styles.subtitle}>
                    Please check your connection and try again.
                    Your learning experience requires an active network.
                </Text>

                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={onRetry}
                    activeOpacity={0.8}
                >
                    <Ionicons name="refresh-outline" size={20} color="#fff" style={styles.retryIcon} />
                    <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: adminColors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 5,
        position: 'relative',
    },
    crossBadge: {
        position: 'absolute',
        bottom: 10,
        right: 10,
        backgroundColor: adminColors.error || '#EF4444',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: adminColors.background,
    },
    title: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    retryButton: {
        flexDirection: 'row',
        backgroundColor: adminColors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: adminColors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    retryIcon: {
        marginRight: 8,
    },
    retryText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#fff',
    },
});
