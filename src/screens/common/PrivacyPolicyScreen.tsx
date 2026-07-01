import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminColors, typography } from '../../theme';

export function PrivacyPolicyScreen(): React.JSX.Element {
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={adminColors.background} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <Text style={styles.header}>Privacy Policy</Text>
                    <Text style={styles.lastUpdated}>Last updated: {new Date().toLocaleDateString()}</Text>

                    <Text style={styles.sectionTitle}>1. Introduction</Text>
                    <Text style={styles.paragraph}>
                        Welcome to our application. We respect your privacy and are committed to protecting your personal data.
                        This privacy policy will inform you as to how we look after your personal data when you visit our application
                        and tell you about your privacy rights and how the law protects you.
                    </Text>

                    <Text style={styles.sectionTitle}>2. The data we collect about you</Text>
                    <Text style={styles.paragraph}>
                        We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                        {'\n'}• Identity Data: includes first name, last name, username or similar identifier.
                        {'\n'}• Contact Data: includes email address and telephone numbers.
                        {'\n'}• Technical Data: includes internet protocol (IP) address, your login data, browser type and version.
                    </Text>

                    <Text style={styles.sectionTitle}>3. How we use your personal data</Text>
                    <Text style={styles.paragraph}>
                        We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:
                        {'\n'}• Where we need to perform the contract we are about to enter into or have entered into with you.
                        {'\n'}• Where it is necessary for our legitimate interests (or those of a third party) and your interests and fundamental rights do not override those interests.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Data security</Text>
                    <Text style={styles.paragraph}>
                        We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used or accessed in an unauthorised way, altered or disclosed.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Contact Details</Text>
                    <Text style={styles.paragraph}>
                        If you have any questions about this privacy policy or our privacy practices, please contact us.
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
