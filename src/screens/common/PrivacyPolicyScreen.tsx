import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Linking,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { adminColors, typography } from '../../theme';

export function PrivacyPolicyScreen(): React.JSX.Element {

    const handleEmailPress = () => {
        Linking.openURL('mailto:support@gyandeep.com');
    };

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
                                name="privacy-tip"
                                size={32}
                                color={adminColors.primary}
                            />
                        </View>

                        <Text style={styles.header}>Privacy Policy</Text>

                        <Text style={styles.lastUpdated}>
                            Last Updated: May 2026
                        </Text>
                    </View>

                    <Text style={styles.introText}>
                        Welcome to GyanDeep Learning App. Your privacy is
                        important to us. This Privacy Policy explains how we
                        collect, use, and protect your information while using
                        our educational platform.
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.sectionTitle}>
                        1. Information We Collect
                    </Text>

                    <Text style={styles.paragraph}>
                        We may collect limited educational and account-related
                        information:
                        {'\n\n'}• Full Name
                        {'\n'}• Email Address
                        {'\n'}• Selected Standard / Dhoran
                        {'\n'}• Quiz Scores & Learning Progress
                        {'\n'}• Bookmark Activity
                        {'\n'}• Notification Token (for app notifications)

                        {'\n\n'}We do not access your photos, videos, gallery,
                        or camera.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        2. How We Use Your Information
                    </Text>

                    <Text style={styles.paragraph}>
                        Your information is used to:
                        {'\n\n'}• Provide personalized learning content
                        {'\n'}• Save quiz progress and bookmarks
                        {'\n'}• Improve app experience
                        {'\n'}• Send important notifications
                        {'\n'}• Enable premium features
                        {'\n'}• Improve educational recommendations
                    </Text>

                    <Text style={styles.sectionTitle}>
                        3. Authentication & Login
                    </Text>

                    <Text style={styles.paragraph}>
                        We use secure Firebase Authentication services. Users may
                        login using:
                        {'\n\n'}• Email & Password
                        {'\n'}• Google Sign-In
                        {'\n'}• OTP Verification
                    </Text>

                    <Text style={styles.sectionTitle}>
                        4. Permissions We Use
                    </Text>

                    <Text style={styles.paragraph}>
                        Our application only requests limited permissions
                        required for educational functionality.

                        {'\n\n'}• Internet Access
                        {'\n'}• Network Status Access
                        {'\n'}• Notification Permission

                        {'\n\n'}These permissions help provide quizzes,
                        educational content, notifications, and app updates.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        5. Premium & Payment Security
                    </Text>

                    <Text style={styles.paragraph}>
                        Premium subscriptions are securely processed using
                        Razorpay payment gateway. We never store your banking,
                        card, or payment credentials on our servers.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        6. Children’s Privacy
                    </Text>

                    <Text style={styles.paragraph}>
                        This application is designed for students and educational
                        learning purposes. Parents, guardians, and schools are
                        encouraged to supervise student usage and learning
                        activity.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        7. Data Security
                    </Text>

                    <Text style={styles.paragraph}>
                        We use Firebase services and industry-standard security
                        practices to protect your personal data, learning
                        records, bookmarks, and quiz progress from unauthorized
                        access.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        Offline Usage
                    </Text>

                    <Text style={styles.paragraph}>
                        Some educational content may remain temporarily available
                        offline using secure local caching to improve learning
                        experience.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        8. Delete Account
                    </Text>

                    <Text style={styles.paragraph}>
                        Users can permanently delete their account from Profile
                        Settings. Once deleted, associated user data may be
                        removed from our systems.
                    </Text>

                    <Text style={styles.sectionTitle}>
                        9. Third-Party Services
                    </Text>

                    <Text style={styles.paragraph}>
                        Our application may use trusted third-party services:
                        {'\n\n'}• Firebase Authentication
                        {'\n'}• Firebase Firestore
                        {'\n'}• Firebase Cloud Messaging
                        {'\n'}• Google Sign-In
                        {'\n'}• Razorpay Payment Gateway
                    </Text>

                    <Text style={styles.sectionTitle}>
                        10. Contact Us
                    </Text>

                    <Text style={styles.paragraph}>
                        If you have any questions regarding this Privacy Policy,
                        data usage, or account privacy, please contact us.
                    </Text>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.emailButton}
                        onPress={handleEmailPress}
                    >
                        <MaterialIcons
                            name="email"
                            size={20}
                            color="#FFFFFF"
                        />

                        <Text style={styles.emailText}>
                            support@gyandeep.com
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.footerContainer}>
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

    emailButton: {
        marginTop: 12,
        backgroundColor: '#1976D2',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1976D2',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },

    emailText: {
        color: '#FFFFFF',
        fontSize: typography.size.md,
        fontWeight: typography.weight.medium,
        marginLeft: 10,
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