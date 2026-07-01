import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
} from 'react-native';
import { studentColors, typography, spacing, borderRadius, shadows } from '../../theme';
import { Button } from '../common/Button';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface PremiumModalProps {
    visible: boolean;
    onClose: () => void;
    onUpgrade: () => void;
}

const { width } = Dimensions.get('window');

/**
 * A premium-looking modal that appears when a user tries to access locked content.
 */
export function PremiumModal({
    visible,
    onClose,
    onUpgrade,
}: PremiumModalProps): React.JSX.Element {
    const scaleAnim = React.useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        if (visible) {
            Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
                friction: 8,
            }).start();
        } else {
            scaleAnim.setValue(0);
        }
    }, [visible, scaleAnim]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={onClose}
                />
                <Animated.View
                    style={[
                        styles.content,
                        { transform: [{ scale: scaleAnim }] },
                    ]}
                >
                    {/* Premium Header */}
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Icon name="crown" size={48} color={studentColors.primary} />
                        </View>
                        <Text style={styles.title}>Premium Content</Text>
                        <Text style={styles.subtitle}>
                            This content is reserved for our Premium members. 
                            Unlock all subjects, quizzes, and features today!
                        </Text>
                    </View>

                    {/* Features List */}
                    <View style={styles.featureList}>
                        <FeatureItem icon="star-circle" text="Unlimited Quizzes" />
                        <FeatureItem icon="file-pdf-box" text="Download Blueprints & Papers" />
                        <FeatureItem icon="chart-timeline-variant" text="Advanced Progress Tracking" />
                        <FeatureItem icon="shield-check" text="Ad-free Experience" />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.footer}>
                        <Button
                            title="Upgrade to Premium"
                            onPress={onUpgrade}
                            style={styles.upgradeBtn}
                            textStyle={styles.upgradeBtnText}
                        />
                        <TouchableOpacity onPress={onClose} style={styles.maybeLater}>
                            <Text style={styles.maybeLaterText}>Maybe Later</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
    return (
        <View style={styles.featureItem}>
            <Icon name={icon} size={20} color={studentColors.secondary} />
            <Text style={styles.featureText}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    content: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.xxl,
        width: Math.min(width - 40, 400),
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: studentColors.primaryLight,
    },
    title: {
        fontSize: typography.size.xxl,
        fontWeight: typography.weight.bold,
        color: studentColors.textPrimary,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.size.md,
        color: studentColors.textSecondary,
        textAlign: 'center',
        lineHeight: typography.lineHeight.md,
        paddingHorizontal: spacing.sm,
    },
    featureList: {
        width: '100%',
        backgroundColor: studentColors.background,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.xl,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    featureText: {
        fontSize: typography.size.sm,
        color: studentColors.textPrimary,
        fontWeight: typography.weight.medium,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    upgradeBtn: {
        width: '100%',
        backgroundColor: studentColors.primary,
        borderRadius: borderRadius.lg,
        height: 56,
        ...shadows.md,
    },
    upgradeBtnText: {
        fontSize: typography.size.lg,
        fontWeight: typography.weight.bold,
        color: '#3E2723',
    },
    maybeLater: {
        marginTop: spacing.md,
        padding: spacing.sm,
    },
    maybeLaterText: {
        fontSize: typography.size.md,
        color: studentColors.textMuted,
        fontWeight: typography.weight.medium,
    },
});
