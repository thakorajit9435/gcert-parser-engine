import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import firestore from '@react-native-firebase/firestore';

export function PremiumAccessScreen(): React.JSX.Element {
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const { userProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    const plans = [
        { id: 'monthly', title: 'Monthly Plan', price: '₹49', period: 'Month', originalPrice: '₹99' },
        { id: 'yearly', title: 'Yearly Plan', price: '₹299', period: 'Year', originalPrice: '₹599', isPopular: true },
        { id: 'lifetime', title: 'Lifetime Plan', price: '₹499', period: 'Lifetime', originalPrice: '₹999' },
    ];

    const handlePurchase = async (planId: string) => {
        if (!userProfile?.uid) {
            Alert.alert(t('common.error'), 'User not found.');
            return;
        }

        setLoading(true);

        try {
            // Mock payment gateway flow with a short delay
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // Update Firebase User Document
            await firestore().collection('users').doc(userProfile.uid).update({
                isPremium: true,
                premium: true, // Ensuring old and new fields are aligned
                premiumPlan: planId,
                premiumActivatedAt: firestore.FieldValue.serverTimestamp(),
            });

            Alert.alert('Success!', 'Welcome to Premium Learning.', [
                {
                    text: 'Let\'s Go',
                    onPress: () => navigation.goBack()
                }
            ]);

        } catch (error) {
            console.error('Payment Error:', error);
            Alert.alert(t('common.error'), t('common.tryAgain'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>🚀</Text>
                    <Text style={styles.headerTitle}>{t('premium.unlock')}</Text>
                    <Text style={styles.headerSub}>{t('premium.description')}</Text>
                </View>

                {/* Features Section */}
                <View style={styles.featuresCard}>
                    <View style={styles.featureRow}>
                        <Text style={styles.featureText}>{t('premium.features.chapters')}</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Text style={styles.featureText}>{t('premium.features.mcq')}</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Text style={styles.featureText}>{t('premium.features.videos')}</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Text style={styles.featureText}>{t('premium.features.materials')}</Text>
                    </View>
                    <View style={styles.featureRow}>
                        <Text style={styles.featureText}>{t('premium.features.adFree')}</Text>
                    </View>
                </View>

                {/* Plans Section */}
                <Text style={styles.choosePlanTitle}>Choose your plan</Text>
                
                {plans.map((plan) => (
                    <TouchableOpacity 
                        key={plan.id}
                        style={[styles.planCard, plan.isPopular && styles.planCardPopular]}
                        activeOpacity={0.8}
                        disabled={loading}
                        onPress={() => handlePurchase(plan.id)}
                    >
                        {plan.isPopular && (
                            <View style={styles.popularBadge}>
                                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                            </View>
                        )}
                        <View style={styles.planInfo}>
                            <Text style={[styles.planTitle, plan.isPopular && styles.planTitlePopular]}>{plan.title}</Text>
                            <View style={styles.priceRow}>
                                <Text style={styles.originalPrice}>{plan.originalPrice}</Text>
                                <Text style={[styles.planPrice, plan.isPopular && styles.planPricePopular]}>{plan.price}</Text>
                                <Text style={styles.planPeriod}>/ {plan.period}</Text>
                            </View>
                        </View>
                        <View style={[styles.selectButton, plan.isPopular && styles.selectButtonPopular]}>
                            {loading ? (
                                <ActivityIndicator size="small" color={plan.isPopular ? studentColors.surface : studentColors.primary} />
                            ) : (
                                <Text style={[styles.selectButtonText, plan.isPopular && styles.selectButtonTextPopular]}>Select</Text>
                            )}
                        </View>
                    </TouchableOpacity>
                ))}

                <TouchableOpacity 
                    style={styles.maybeLaterButton}
                    onPress={() => navigation.goBack()}
                    disabled={loading}
                >
                    <Text style={styles.maybeLaterText}>{t('premium.later')}</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    scrollContent: {
        padding: spacing.xl,
        paddingBottom: spacing.huge,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
        marginTop: spacing.xl,
    },
    headerIcon: {
        fontSize: 64,
        marginBottom: spacing.md,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    headerSub: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: spacing.md,
    },
    featuresCard: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: studentColors.borderLight,
        ...shadows.md,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: studentColors.borderLight,
    },
    featureText: {
        fontSize: typography.size.lg,
        color: studentColors.textPrimary,
        fontWeight: typography.weight.medium,
        marginLeft: spacing.xxs,
    },
    choosePlanTitle: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    planCard: {
        backgroundColor: studentColors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        marginBottom: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: studentColors.border,
        ...shadows.sm,
    },
    planCardPopular: {
        borderColor: studentColors.primary,
        backgroundColor: studentColors.primaryLight + '33', // Slight yellow tint
        ...shadows.md,
    },
    popularBadge: {
        position: 'absolute',
        top: -12,
        right: 24,
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 4,
        borderRadius: borderRadius.full,
        ...shadows.sm,
    },
    popularBadgeText: {
        fontSize: typography.size.xs,
        fontWeight: typography.weight.bold,
        color: studentColors.textOnPrimary,
        letterSpacing: 0.5,
    },
    planInfo: {
        flex: 1,
    },
    planTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.semibold,
        color: studentColors.textPrimary,
        marginBottom: spacing.xs,
    },
    planTitlePopular: {
        color: studentColors.primaryDark,
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    originalPrice: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        textDecorationLine: 'line-through',
        marginRight: spacing.sm,
    },
    planPrice: {
        fontSize: 22,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    planPricePopular: {
        color: studentColors.textPrimary,
    },
    planPeriod: {
        fontSize: typography.size.xs,
        color: studentColors.textSecondary,
        marginLeft: spacing.xxs,
    },
    selectButton: {
        backgroundColor: studentColors.surfaceHover,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        minWidth: 90,
        alignItems: 'center',
    },
    selectButtonPopular: {
        backgroundColor: studentColors.primary,
    },
    selectButtonText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.bold,
        color: studentColors.secondary,
    },
    selectButtonTextPopular: {
        color: studentColors.textOnPrimary,
    },
    maybeLaterButton: {
        marginTop: spacing.md,
        padding: spacing.md,
        alignItems: 'center',
    },
    maybeLaterText: {
        fontSize: typography.size.md,
        fontWeight: typography.weight.semibold,
        color: studentColors.textMuted,
    },
});
