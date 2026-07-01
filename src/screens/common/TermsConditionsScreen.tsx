import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminColors, typography } from '../../theme';

export function TermsConditionsScreen(): React.JSX.Element {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={adminColors.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.header}>Terms & Conditions</Text>
                    <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

                    <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
                    <Text style={styles.paragraph}>
                        By accessing or using our application, you agree to be bound by these Terms and Conditions and our Privacy Policy.
                        If you disagree with any part of the terms then you may not access the service.
                    </Text>

                    <Text style={styles.sectionTitle}>2. Intellectual Property Rights</Text>
                    <Text style={styles.paragraph}>
                        Other than the content you own, under these Terms, we and/or our licensors own all the intellectual property rights and materials contained in this Application.
                        You are granted limited license only for purposes of viewing the material contained on this Application.
                    </Text>

                    <Text style={styles.sectionTitle}>3. Restrictions</Text>
                    <Text style={styles.paragraph}>
                        You are specifically restricted from all of the following:
                        {'\n'}• Publishing any Application material in any other media.
                        {'\n'}• Selling, sublicensing and/or otherwise commercializing any Application material.
                        {'\n'}• Publicly performing and/or showing any Application material.
                        {'\n'}• Using this Application in any way that is or may be damaging to this Application or its users.
                    </Text>

                    <Text style={styles.sectionTitle}>4. User Content</Text>
                    <Text style={styles.paragraph}>
                        In these Terms and Conditions, "Your Content" shall mean any audio, video text, images or other material you choose to display on this Application.
                        By displaying Your Content, you grant us a non-exclusive, worldwide irrevocable, sub licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Disclaimer</Text>
                    <Text style={styles.paragraph}>
                        This Application is provided "as is," with all faults, and we express no representations or warranties, of any kind related to this Application or the materials contained on this Application.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: adminColors.background,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: adminColors.surface,
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
    },
    header: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: 8,
    },
    lastUpdated: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        lineHeight: 24,
        marginBottom: 12,
    },
});
