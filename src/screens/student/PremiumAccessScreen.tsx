import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Button } from '../../components/common/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const PLANS = [
    {
        id: 'premium',
        name: 'Premium Access',
        duration: 'Lifetime / Yearly',
        features: ['Full access to all subjects', 'Unlimited quizzes', 'No ads', 'Downloadable Blueprints', 'Priority Support'],
    }
];

export function PremiumAccessScreen(): React.JSX.Element {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        Alert.alert('Premium Required', 'Please contact the administrator to activate your premium access.');
        setLoading(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Icon name="chevron-left" size={28} color={studentColors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upgrade to Premium</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.heroSection}>
                    <View style={styles.crownIcon}>
                        <Icon name="crown" size={50} color={studentColors.primary} />
                    </View>
                    <Text style={styles.heroTitle}>Choose Your Plan</Text>
                    <Text style={styles.heroSubtitle}>
                        Select a plan that works best for your learning goals.
                    </Text>
                </View>

                {PLANS.map((plan) => (
                    <View
                        key={plan.id}
                        style={[
                            styles.planCard,
                            styles.bestValueCard,
                        ]}
                    >
                        <View style={styles.planHeader}>
                            <View>
                                <Text style={styles.planName}>{plan.name}</Text>
                                <Text style={styles.planDuration}>{plan.duration}</Text>
                            </View>
                            <View style={styles.priceContainer}>
                                <Text style={styles.planPrice}>🔒 Locked</Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.featuresList}>
                            {plan.features.map((feature, idx) => (
                                <View key={idx} style={styles.featureItem}>
                                    <Icon
                                        name="check-circle"
                                        size={18}
                                        color={studentColors.secondary}
                                    />
                                    <Text style={styles.featureText}>{feature}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                ))}

                <View style={styles.securityNote}>
                    <Icon name="shield-lock" size={16} color={studentColors.textMuted} />
                    <Text style={styles.securityText}>Premium Content Locked</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <Button
                    title="Contact Admin to Unlock"
                    onPress={handlePayment}
                    loading={loading}
                    disabled={loading}
                    style={styles.payBtn}
                    textStyle={styles.payBtnText}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: studentColors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        height: 60,
        backgroundColor: '#FFFFFF',
        ...shadows.sm,
    },
    backBtn: {
        padding: spacing.xs,
    },
    headerTitle: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    crownIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    heroTitle: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    heroSubtitle: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
    },
    planCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xl,
        padding: spacing.xl,
        marginBottom: spacing.lg,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        position: 'relative',
        ...shadows.sm,
    },
    selectedPlanCard: {
        borderColor: studentColors.secondary,
        backgroundColor: '#F0F7FF',
        ...shadows.md,
    },
    bestValueCard: {
        borderColor: studentColors.primary,
        borderWidth: 2,
    },
    bestValueBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        backgroundColor: studentColors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
    },
    bestValueText: {
        color: '#3E2723',
        fontSize: 10,
        fontWeight: typography.weight.bold,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    planName: {
        fontSize: typography.size.xl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    planDuration: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    originalPrice: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
        textDecorationLine: 'line-through',
    },
    planPrice: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: '#E2E8F0',
        marginVertical: spacing.md,
    },
    featuresList: {
        gap: spacing.sm,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    featureText: {
        fontSize: typography.size.sm,
        color: studentColors.textSecondary,
    },
    selectedText: {
        color: studentColors.secondaryDark,
    },
    selectedMarker: {
        position: 'absolute',
        bottom: -1,
        right: -1,
        backgroundColor: studentColors.secondary,
        padding: 4,
        borderTopLeftRadius: borderRadius.lg,
        borderBottomRightRadius: borderRadius.xl,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.md,
    },
    securityText: {
        fontSize: typography.size.sm,
        color: studentColors.textMuted,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: '#E2E8F0',
    },
    payBtn: {
        backgroundColor: studentColors.primary,
        borderRadius: borderRadius.lg,
        height: 56,
        ...shadows.md,
    },
    payBtnText: {
        color: '#3E2723',
        fontWeight: typography.weight.bold,
    }
});
