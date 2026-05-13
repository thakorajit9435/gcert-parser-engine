import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import { adminColors, typography } from '../../theme';

export function TermsConditionsScreen(): React.JSX.Element {

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar
                barStyle="dark-content"
                backgroundColor={adminColors.background}
            />

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <View style={styles.headerContainer}>
                        <View style={styles.iconContainer}>
                            <MaterialIcons
                                name="description"
                                size={32}
                                color={adminColors.primary}
                            />
                        </View>

                        <Text style={styles.header}>
                            Terms & Conditions
                        </Text>

                        <Text style={styles.lastUpdated}>
                            Last Updated: May 2026
                        </Text>
                    </View>

                    <Text style={styles.introText}>
                        Welcome to GyanDeep Learning App. By using this
                        application, you agree to comply with and be bound by
                        the following Terms & Conditions. Please read them
                        carefully before using the app.
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>
                        1. Acceptance of Terms
                    </Text>

                    <Text style={styles.paragraph}>
                        By accessing or using this educational application, you
                        agree to these Terms & Conditions and our Privacy
                        Policy. If you do not agree, please discontinue use of
                        the application.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        2. Educational Purpose
                    </Text>

                    <Text style={styles.paragraph}>
                        This application is intended solely for educational and
                        learning purposes. Students, parents, and teachers may
                        use the platform to access educational content, quizzes,
                        videos, PDFs, and practice materials.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        3. User Account Responsibility
                    </Text>

                    <Text style={styles.paragraph}>
                        Users are responsible for maintaining the confidentiality
                        of their login credentials and account information.
                        Sharing account access with unauthorized users is
                        prohibited.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        4. Premium Content & Subscription
                    </Text>

                    <Text style={styles.paragraph}>
                        Some features and educational content may require a
                        premium subscription. Payments are securely processed
                        using Razorpay. Premium access is granted only after
                        successful payment verification.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        5. Intellectual Property Rights
                    </Text>

                    <Text style={styles.paragraph}>
                        All educational materials, PDFs, videos, quizzes,
                        graphics, and app content are owned by GyanDeep
                        Learning App or respective licensors. Users may not
                        reproduce, distribute, or commercially use any content
                        without permission.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        6. Restricted Activities
                    </Text>

                    <Text style={styles.paragraph}>
                        Users must not:
                        {'\n\n'}• Copy or redistribute app content
                        {'\n'}• Attempt unauthorized access
                        {'\n'}• Upload harmful or illegal content
                        {'\n'}• Misuse quizzes or learning resources
                        {'\n'}• Disrupt app functionality
                    </Text>

                    <Text style={styles.sectionTitle}>
                        7. Student Safety & Conduct
                    </Text>

                    <Text style={styles.paragraph}>
                        Students are expected to use the application responsibly
                        for educational purposes only. Parents and schools are
                        encouraged to supervise student activity where
                        appropriate.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        8. Account Deletion
                    </Text>

                    <Text style={styles.paragraph}>
                        Users may request permanent account deletion through the
                        Profile Settings section. Once deleted, associated data
                        may be permanently removed from our systems.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        9. Service Availability
                    </Text>

                    <Text style={styles.paragraph}>
                        We strive to keep the application available and secure at
                        all times. However, we do not guarantee uninterrupted
                        access and may temporarily suspend services for
                        maintenance or updates.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        10. Third-Party Services
                    </Text>

                    <Text style={styles.paragraph}>
                        Our app may use trusted third-party services including:
                        {'\n\n'}• Firebase
                        {'\n'}• Google Sign-In
                        {'\n'}• Razorpay
                        {'\n'}• Firebase Cloud Messaging
                    </Text>

                    <Text style={styles.sectionTitle}>
                        11. Limitation of Liability
                    </Text>

                    <Text style={styles.paragraph}>
                        GyanDeep Learning App shall not be held responsible for
                        any indirect, incidental, or technical issues arising
                        from app usage, internet failure, or third-party
                        services.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        12. Changes to Terms
                    </Text>

                    <Text style={styles.paragraph}>
                        We reserve the right to update or modify these Terms &
                        Conditions at any time. Continued use of the application
                        after changes means you accept the updated terms.
                    </Text>

                    <Text style={styles.sectionTitle}>13. Contact Us</Text>

                    <Text style={styles.paragraph}>
                        For questions regarding these Terms & Conditions,
                        contact us at:
                        {'\n\n'}support@gyandeep.com
                    </Text>

                    <View style={styles.footerContainer}>
                        {/* <Text style={styles.footerText}>
                            App Version {appVersion}
                        </Text> */}

                        <Text style={styles.footerText}>
                            © 2026 GyanDeep Learning App
                        </Text>
                    </View>
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
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 900,
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 4,
    },

    headerContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },

    iconContainer: {
        height: 64,
        width: 64,
        borderRadius: 32,
        backgroundColor: '#FFF8E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },

    header: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: adminColors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },

    lastUpdated: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        textAlign: 'center',
    },

    introText: {
        fontSize: typography.size.md,
        lineHeight: 26,
        color: adminColors.textSecondary,
        marginBottom: 12,
    },

    divider: {
        height: 1,
        backgroundColor: '#EAEAEA',
        marginVertical: 20,
    },

    sectionTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: adminColors.textPrimary,
        marginBottom: 10,
        marginTop: 12,
    },

    paragraph: {
        fontSize: typography.size.md,
        lineHeight: 26,
        color: adminColors.textSecondary,
        marginBottom: 14,
    },

    footerContainer: {
        marginTop: 32,
        alignItems: 'center',
    },

    footerText: {
        fontSize: typography.size.sm,
        color: adminColors.textMuted,
        marginBottom: 6,
        textAlign: 'center',
    },
});