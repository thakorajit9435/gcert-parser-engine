import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { adminColors, typography, spacing } from '../../theme';
import { Button } from '../../components/common';
import { useAuth } from '../../hooks/useAuth';

/**
 * Shown when user's isBlocked === true.
 */
export function BlockedScreen(): React.JSX.Element {
    const { signOut } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.icon}>🚫</Text>
            <Text style={styles.title}>Account Blocked</Text>
            <Text style={styles.message}>
                Your account has been blocked by an administrator.{'\n'}
                Please contact support for assistance.
            </Text>
            <Text style={styles.messageGu}>
                તમારું ખાતું એડમિન દ્વારા બ્લોક કરવામાં આવ્યું છે.{'\n'}
                કૃપા કરીને સહાય માટે સંપર્ક કરો.
            </Text>
            <Button title="Sign Out" variant="secondary" onPress={signOut} style={styles.button} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: adminColors.background,
        padding: spacing.xxl,
    },
    icon: { fontSize: 64, marginBottom: spacing.xl },
    title: {
        fontSize: typography.size.heading,
        fontWeight: typography.weight.bold,
        color: adminColors.accentRed,
        marginBottom: spacing.md,
    },
    message: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        textAlign: 'center',
        lineHeight: typography.lineHeight.xl,
        marginBottom: spacing.md,
    },
    messageGu: {
        fontSize: typography.size.md,
        color: adminColors.textMuted,
        textAlign: 'center',
        lineHeight: typography.lineHeight.xl,
        marginBottom: spacing.xxl,
    },
    button: { minWidth: 160 },
});
