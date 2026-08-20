import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Linking } from 'react-native';
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

                    {/* Government & Textbook Disclaimer */}
                    <View style={styles.disclaimerBox}>
                        <Text style={styles.disclaimerTitle}>⚠️ GOVERNMENT ENTITY & SOURCE DISCLAIMER</Text>
                        <Text style={styles.disclaimerText}>
                            • <Text style={styles.bold}>Independent App:</Text> This app is an independent educational tool and is <Text style={styles.bold}>NOT affiliated with or endorsed by</Text> the Gujarat State School Textbook Board (GSSTB) or the Government of Gujarat.
                        </Text>
                        <Text style={styles.disclaimerText}>
                            • <Text style={styles.bold}>Source of Information:</Text> School textbooks are publicly available from Gujarat State School Textbook Board (GSSTB):
                        </Text>
                        <TouchableOpacity
                            style={styles.sourceBtn}
                            onPress={() => Linking.openURL('https://gsstb.gujarat.gov.in/')}
                        >
                            <Text style={styles.sourceBtnText}>👉 https://gsstb.gujarat.gov.in/</Text>
                        </TouchableOpacity>
                        <Text style={styles.disclaimerText}>
                            • <Text style={styles.bold}>Free Educational Access:</Text> All standard curriculum textbooks remain freely accessible to all registered students without requiring any subscription.
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>1. Introduction</Text>
                    <Text style={styles.paragraph}>
                        Welcome to GyanDeep. We respect your privacy and are committed to protecting your personal information.
                        This privacy policy explains how we collect and safeguard your data when using our educational learning application.
                    </Text>

                    <Text style={styles.sectionTitle}>2. The Data We Collect</Text>
                    <Text style={styles.paragraph}>
                        We only collect essential data required for educational progress tracking:
                        {'\n'}• Account Profile: Name, email address, standard/grade.
                        {'\n'}• Learning Progress: Completed chapters, bookmarks, quiz scores, reading time.
                        {'\n'}• Anonymous Analytics: Crash logs and app performance to improve user experience.
                    </Text>

                    <Text style={styles.sectionTitle}>3. How We Use Your Data</Text>
                    <Text style={styles.paragraph}>
                        Your data is solely used to personalize your learning journey, provide AI tutoring assistance, and maintain your bookmark & quiz records. We never sell student data to third parties.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Data Security & Child Safety</Text>
                    <Text style={styles.paragraph}>
                        We implement secure cloud infrastructure with encryption to prevent unauthorized data access. The app complies with student privacy and child safety standards.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Contact Details</Text>
                    <Text style={styles.paragraph}>
                        If you have any questions or data deletion requests, please contact our support team.
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
        padding: 20,
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
        marginBottom: 4,
    },
    lastUpdated: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginBottom: 16,
    },
    disclaimerBox: {
        backgroundColor: '#eff6ff',
        borderColor: '#3b82f6',
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },
    disclaimerTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#1e40af',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    disclaimerText: {
        fontSize: 12.5,
        color: '#1e3a8a',
        lineHeight: 18,
        marginBottom: 8,
    },
    bold: {
        fontWeight: '700',
    },
    sourceBtn: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#93c5fd',
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    sourceBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1d4ed8',
    },
    sectionTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginTop: 14,
        marginBottom: 6,
    },
    paragraph: {
        fontSize: typography.size.md,
        color: adminColors.textSecondary,
        lineHeight: 22,
        marginBottom: 10,
    },
});
