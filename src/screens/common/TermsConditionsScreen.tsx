import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity, Linking } from 'react-native';
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

                    {/* Government & Textbook Disclaimer */}
                    <View style={styles.disclaimerBox}>
                        <Text style={styles.disclaimerTitle}>⚠️ IMPORTANT GOVERNMENT & SOURCE DISCLAIMER</Text>
                        <Text style={styles.disclaimerText}>
                            1. <Text style={styles.bold}>Non-Affiliation:</Text> This application (GyanDeep) is an independent educational platform. It is <Text style={styles.bold}>NOT</Text> an official application of the Gujarat State School Textbook Board (GSSTB) or the Government of Gujarat, nor is it endorsed by, affiliated with, or associated with any government entity.
                        </Text>
                        <Text style={styles.disclaimerText}>
                            2. <Text style={styles.bold}>Source of Information:</Text> All school textbook materials and curriculum PDFs accessible in this app are sourced from the publicly accessible official portal of the Gujarat State School Textbook Board (GSSTB):
                        </Text>
                        <TouchableOpacity
                            style={styles.sourceBtn}
                            onPress={() => Linking.openURL('https://gsstb.gujarat.gov.in/')}
                        >
                            <Text style={styles.sourceBtnText}>👉 https://gsstb.gujarat.gov.in/</Text>
                        </TouchableOpacity>
                        <Text style={styles.disclaimerText}>
                            3. <Text style={styles.bold}>Free Access:</Text> All government textbooks are available for students to read 100% free of cost. We do not charge fees for accessing public domain government textbooks.
                        </Text>
                    </View>

                    <Text style={styles.sectionTitle}>1. Agreement to Terms</Text>
                    <Text style={styles.paragraph}>
                        By accessing or using our application, you agree to be bound by these Terms and Conditions and our Privacy Policy.
                        If you disagree with any part of the terms then you may not access the service.
                    </Text>

                    <Text style={styles.sectionTitle}>2. Intellectual Property Rights & Fair Use</Text>
                    <Text style={styles.paragraph}>
                        All intellectual property rights and copyrights for the textbooks belong to their respective publisher, the Gujarat State School Textbook Board (GSSTB). This application provides access solely for non-commercial educational and self-study purposes under educational fair use.
                    </Text>

                    <Text style={styles.sectionTitle}>3. User Content & Conduct</Text>
                    <Text style={styles.paragraph}>
                        Students are encouraged to use study aids, AI chat tutors, and practice quizzes for educational progress. Any misuse or attempts to reverse engineer the application are strictly prohibited.
                    </Text>

                    <Text style={styles.sectionTitle}>4. Limitation of Liability</Text>
                    <Text style={styles.paragraph}>
                        This Application is provided "as is," for educational guidance. While we strive for absolute accuracy, students and teachers should refer to official board publications for formal examination notices.
                    </Text>

                    <Text style={styles.sectionTitle}>5. Contact & Copyright Queries</Text>
                    <Text style={styles.paragraph}>
                        If you have any questions or copyright notices, please contact us and we will address your inquiry promptly.
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
        backgroundColor: '#fef3c7',
        borderColor: '#f59e0b',
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
    },
    disclaimerTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#92400e',
        marginBottom: 8,
        letterSpacing: 0.3,
    },
    disclaimerText: {
        fontSize: 12.5,
        color: '#78350f',
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
        borderColor: '#fcd34d',
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    sourceBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#b45309',
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
